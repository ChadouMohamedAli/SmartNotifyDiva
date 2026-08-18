from decimal import Decimal, InvalidOperation
import json
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
import requests
from webpush import send_user_notification

from alerts.models import Alert
from notifications.models import Notification, NotificationChannelPreference
from stock.models import Product
from facturation.models import Invoice

User = get_user_model()


RESOLUTION_MARKER = "[RESOLVED]"

_OP_LABELS = {
    "eq": "=",
    "neq": "≠",
    "gt": ">",
    "gte": "≥",
    "lt": "<",
    "lte": "≤",
    "contains": "contient",
    # fallback: keep original operator
}


def _safe_display(v):
    if v is None:
        return ""
    if isinstance(v, (str, int, float, bool)):
        return str(v)
    try:
        return json.dumps(v, ensure_ascii=False)
    except Exception:
        return str(v)


def _format_single_condition(cond):
    if not isinstance(cond, dict):
        return _safe_display(cond) or "—"
    field = cond.get("field") or "Champ"
    op = cond.get("operator") or "="
    value = cond.get("value")
    op_label = _OP_LABELS.get(str(op), str(op))
    value_txt = "0" if value == 0 else (_safe_display(value) or "—")
    return f"{field} {op_label} {value_txt}"


def format_alert_check_condition(check_condition):
    """
    Retourne une condition lisible (str) depuis Alert.check_condition.
    Supporte: {logic, conditions}, [conditions], {field, operator, value}, ou string JSON.
    """
    if not check_condition:
        return "—"

    parsed = check_condition
    if isinstance(check_condition, str):
        try:
            parsed = json.loads(check_condition)
        except Exception:
            return check_condition

    logic = "AND"
    conditions = []

    if isinstance(parsed, dict) and isinstance(parsed.get("conditions"), list):
        logic = "OR" if parsed.get("logic") == "OR" else "AND"
        conditions = parsed.get("conditions") or []
    elif isinstance(parsed, list):
        conditions = parsed
    elif isinstance(parsed, dict) and "field" in parsed:
        conditions = [parsed]
    else:
        return _safe_display(parsed) or "—"

    if not conditions:
        return "—"
    if len(conditions) == 1:
        return _format_single_condition(conditions[0])

    joiner = " OU " if logic == "OR" else " ET "
    return joiner.join(_format_single_condition(c) for c in conditions)


def _get_product_token(product):
    return f"[PRODUCT:{product.id}]"


def _get_invoice_token(invoice):
    return f"[INVOICE:{invoice.id}]"


def _to_decimal(value):
    if value is None or value == "":
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None


def _compare_values(left, right, operator):
    if operator == "greater_than":
        return left > right
    if operator == "less_than":
        return left < right
    if operator == "equal_to":
        return left == right
    if operator == "not_equal":
        return left != right
    if operator == "greater_equal":
        return left >= right
    if operator == "less_equal":
        return left <= right
    return False


def _is_empty_check_condition(check_condition):
    if not check_condition:
        return True
    if isinstance(check_condition, dict) and len(check_condition.keys()) == 0:
        return True
    if isinstance(check_condition, str) and not check_condition.strip():
        return True
    return False


def _parse_check_condition(check_condition):
    """
    Normalise check_condition en tuple (logic, conditions_list).
    Supporte: {logic, conditions}, [conditions], {field, operator, value}, string JSON.
    """
    if _is_empty_check_condition(check_condition):
        return "AND", []

    parsed = check_condition
    if isinstance(check_condition, str):
        try:
            parsed = json.loads(check_condition)
        except Exception:
            return "AND", []

    if isinstance(parsed, dict) and isinstance(parsed.get("conditions"), list):
        logic = "OR" if parsed.get("logic") == "OR" else "AND"
        return logic, list(parsed.get("conditions") or [])
    if isinstance(parsed, list):
        return "AND", list(parsed)
    if isinstance(parsed, dict) and "field" in parsed:
        return "AND", [parsed]

    return "AND", []


def _get_product_field_value(product, field_key):
    """
    Mappe les clés utilisées par le front vers des attributs Product ou des valeurs calculées.
    """
    raw = (field_key or "").strip()
    if not raw:
        return None

    mapping = {
        "quantity": "quantity",
        "min_stock": "min_quantity",
        "threshold": "min_quantity",
        "min_quantity": "min_quantity",
        "max_quantity": "max_quantity",
        "price": "price",
        "status": "status",
        # valeur de stock (calcul)
        "stock_value": "__calc_stock_value__",
    }
    key = mapping.get(raw, raw)

    if key == "__calc_stock_value__":
        q = _to_decimal(getattr(product, "quantity", None))
        p = _to_decimal(getattr(product, "price", None))
        if q is None or p is None:
            return None
        return q * p

    if not hasattr(product, key):
        return None
    val = getattr(product, key)
    # numériques si possible
    dec = _to_decimal(val)
    return dec if dec is not None else val


def _eval_condition_operator(left, operator, right):
    """
    Opérateurs check_condition (eq/neq/gt/gte/lt/lte/contains) + fallback backend.
    """
    op = (operator or "").strip()
    # numeric comparisons
    if op in {"gt", "gte", "lt", "lte"}:
        l = _to_decimal(left)
        r = _to_decimal(right)
        if l is None or r is None:
            return False
        return {
            "gt": l > r,
            "gte": l >= r,
            "lt": l < r,
            "lte": l <= r,
        }[op]

    if op in {"eq", "neq"}:
        # tente numérique sinon string
        l_dec = _to_decimal(left)
        r_dec = _to_decimal(right)
        if l_dec is not None and r_dec is not None:
            ok = l_dec == r_dec
        else:
            ok = str(left) == str(right)
        return ok if op == "eq" else (not ok)

    if op == "contains":
        return str(right) in str(left)

    # opérateurs "threshold" backend si jamais ils arrivent ici
    l = _to_decimal(left)
    r = _to_decimal(right)
    if l is not None and r is not None:
        return _compare_values(l, r, op)
    return False


def _eval_product_check_conditions(alert, product):
    logic, conditions = _parse_check_condition(getattr(alert, "check_condition", None))
    if not conditions:
        return None  # signifie: pas de règles check_condition à appliquer

    results = []
    for cond in conditions:
        if not isinstance(cond, dict):
            results.append(False)
            continue
        field = cond.get("field")
        operator = cond.get("operator")
        target = cond.get("value")
        current = _get_product_field_value(product, field)
        results.append(_eval_condition_operator(current, operator, target))

    if logic == "OR":
        return any(results)
    return all(results)


def _build_trigger_message_from_check_conditions(alert, product):
    condition_txt = format_alert_check_condition(getattr(alert, "check_condition", None))
    q = getattr(product, "quantity", None)
    p = getattr(product, "price", None)
    stock_value = None
    qd = _to_decimal(q)
    pd = _to_decimal(p)
    if qd is not None and pd is not None:
        stock_value = qd * pd
    return (
        f"Bonjour,\n\n"
        f"🚨 ALERTE STOCK\n\n"
        f"Produit : {product.name} ({product.sku})\n"
        f"Quantité : {q}\n"
        f"Prix : {p}\n"
        f"Valeur stock : {stock_value if stock_value is not None else '—'}\n"
        f"Condition: {condition_txt}\n\n"
        f"Cordialement,\nSmartNotify"
    )


def _get_invoice_field_value_for_conditions(invoice, field_key):
    """
    Accès champs invoice pour check_condition.
    """
    raw = (field_key or "").strip().lower()
    if not raw:
        return None

    mapping = {
        "amount": "total_amount",
        "montant": "total_amount",
        "total_amount": "total_amount",
        "currency": "currency",
        "status": "status",
        "invoice_status": "status",
        "due_date": "due_date",
        "invoice_date": "invoice_date",
        "invoice_type": "invoice_type",
        "customer": "customer_name",
        "customer_name": "customer_name",
        "invoice_number": "invoice_number",
    }
    key = mapping.get(raw, raw)
    if not hasattr(invoice, key):
        return None

    val = getattr(invoice, key)
    dec = _to_decimal(val)
    return dec if dec is not None else val


def _parse_date_value(v):
    """
    Supporte date/datetime ou string ISO (YYYY-MM-DD ou ISO datetime).
    """
    if v is None or v == "":
        return None
    if hasattr(v, "date") and hasattr(v, "year"):
        # date ou datetime
        try:
            return v.date() if hasattr(v, "hour") else v
        except Exception:
            return v
    if isinstance(v, str):
        s = v.strip()
        if not s:
            return None
        # YYYY-MM-DD
        try:
            from datetime import date
            if len(s) == 10 and s[4] == "-" and s[7] == "-":
                y, m, d = s.split("-")
                return date(int(y), int(m), int(d))
        except Exception:
            pass
        # ISO datetime
        try:
            from datetime import datetime
            return datetime.fromisoformat(s.replace("Z", "+00:00")).date()
        except Exception:
            return None
    return None


def _eval_invoice_check_conditions(alert, invoice):
    logic, conditions = _parse_check_condition(getattr(alert, "check_condition", None))
    if not conditions:
        return None

    results = []
    for cond in conditions:
        if not isinstance(cond, dict):
            results.append(False)
            continue
        field = cond.get("field")
        operator = cond.get("operator")
        target = cond.get("value")
        current = _get_invoice_field_value_for_conditions(invoice, field)

        # Comparaisons de dates si applicable
        if str(field or "").strip().lower() in {"due_date", "invoice_date"}:
            cur_d = _parse_date_value(current)
            tgt_d = _parse_date_value(target)
            if cur_d is None or tgt_d is None:
                results.append(False)
            else:
                results.append(_eval_condition_operator(cur_d, operator, tgt_d))
        else:
            results.append(_eval_condition_operator(current, operator, target))

    if logic == "OR":
        return any(results)
    return all(results)


def _build_facturation_trigger_message_from_check_conditions(alert, invoice):
    condition_txt = format_alert_check_condition(getattr(alert, "check_condition", None))
    return (
        f"Bonjour,\n\n"
        f"🚨 ALERTE FACTURATION\n\n"
        f"Facture : {getattr(invoice, 'invoice_number', invoice.id)}\n"
        f"Client : {getattr(invoice, 'customer_name', '—')}\n"
        f"Condition: {condition_txt}\n\n"
        f"Cordialement,\nSmartNotify"
    )


def _matches_categories(alert, product):
    if not alert.categories:
        return True

    product_category = (product.category.name if product.category else "").strip().lower()
    allowed_categories = {str(category).strip().lower() for category in alert.categories if str(category).strip()}
    return product_category in allowed_categories


def _build_trigger_message(alert, product, current_value):
    compare_to_raw = (alert.compare_to or "value").strip().lower()
    compare_to_field = {
        "min_stock": "min_quantity",
    }.get(compare_to_raw, compare_to_raw)

    if compare_to_field in {"value", ""}:
        compare_target = alert.threshold_value if alert.threshold_value is not None else "N/A"
    else:
        compare_target = getattr(product, compare_to_field, "N/A")

    return (
        f"Bonjour,\n\n"
        f" ️ ALERTE STOCK FAIBLE\n\n"
        f"Produit : {product.name} ({product.sku})\n"
        f"Quantité actuelle : {current_value}\n"
        f"Quantité minimum requise : {compare_target}\n\n"
        f"Actions recommandées :\n"
        f"• Remplir le stock du produit {product.name}\n"
        f"• Contactez votre fournisseur pour une commande d'urgence\n"
        f"• Vérifiez les niveaux de stock régulièrement\n\n"
        f"Cordialement,\nSmartNotify"
    )


def _build_resolved_message(alert, product):
    return (
        f"{RESOLUTION_MARKER} {_get_product_token(product)} "
        f"Condition résolue pour le produit {product.name} ({product.sku}) "
        f"sur l'alerte {alert.name}."
    )


def _build_facturation_trigger_message(alert, invoice, current_value):
    return (
        f"Bonjour,\n\n"
        f" ️ ALERTE FACTURATION\n\n"
        f"Facture : {invoice.invoice_number}\n"
        f"Client : {invoice.customer_name}\n"
        f"Montant actuel : {current_value} {invoice.currency or 'EUR'}\n"
        f"Seuil configuré : {alert.threshold_value if alert.threshold_value is not None else 'N/A'} {invoice.currency or 'EUR'}\n"
        f"Type : {invoice.get_invoice_type_display()}\n"
        f"Date facture : {invoice.invoice_date}\n\n"
        f"Cordialement,\nSmartNotify"
    )


def _build_facturation_resolved_message(alert, invoice):
    return (
        f"{RESOLUTION_MARKER} {_get_invoice_token(invoice)} "
        f"Condition résolue pour la facture {invoice.invoice_number} "
        f"sur l'alerte {alert.name}."
    )


def _get_compare_target_value(alert, product):
    compare_to_raw = (alert.compare_to or "value").strip().lower()
    compare_to_field = {
        "min_stock": "min_quantity",
    }.get(compare_to_raw, compare_to_raw)

    if compare_to_field in {"", "value"}:
        return _to_decimal(alert.threshold_value)

    if hasattr(product, compare_to_field):
        return _to_decimal(getattr(product, compare_to_field))

    return _to_decimal(alert.threshold_value)


def ensure_auto_stock_alert():
    """Crée automatiquement une alerte 'Stock faible' générique si elle n'existe pas"""
    try:
        admin_user = User.objects.filter(is_staff=True, is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.filter(is_staff=True).first()
        if not admin_user:
            return None
        
        admin_email = admin_user.email or ""
        
        alert, created = Alert.objects.get_or_create(
            name="Stock faible ",
            user=admin_user,
            module="stock",
            defaults={
                "description": "Alerte automatique déclenchée quand un produit a une quantité inférieure au minimum",
                "severity": "high",
                "condition_type": "threshold",
                "condition_field": "quantity",
                "compare_to": "min_stock",
                "comparison_operator": "less_than",
                "threshold_value": None,
                "categories": [],
                "product_id": None,
                "notification_channels": ["email"],
                "recipients": [admin_email] if admin_email else [],
                "is_active": True,
                "repeat_until_resolved": False,
                "schedule": "immediate",
            }
        )
        
        return alert
    except Exception as e:
        import logging
        logging.error(f"Erreur lors de la création de l'alerte automatique: {e}")
        return None


def evaluate_stock_alert_for_product(alert, product):
    """
    Évalue une alerte individuelle pour un produit donné.
    Retourne (is_triggered, message).
    """
    if not alert.is_active or alert.module != "stock":
        return False, ""

    if alert.product_id and alert.product_id != product.id:
        return False, ""

    if not _matches_categories(alert, product):
        return False, ""

    # Si une règle logique (check_condition) est définie, on l'évalue en priorité
    check_eval = _eval_product_check_conditions(alert, product)
    if check_eval is True:
        return True, _build_trigger_message_from_check_conditions(alert, product)
    if check_eval is False:
        return False, ""

    condition_field = (alert.condition_field or "quantity").strip()
    if not hasattr(product, condition_field):
        return False, ""

    current_value_raw = getattr(product, condition_field)
    current_value = _to_decimal(current_value_raw)

    if alert.condition_type == "threshold":
        compare_target = _get_compare_target_value(alert, product)
        if current_value is None or compare_target is None:
            return False, ""

        is_triggered = _compare_values(current_value, compare_target, alert.comparison_operator)
        if not is_triggered:
            return False, ""

        return True, _build_trigger_message(alert, product, current_value)

    if alert.condition_type == "absence":
        # Interprétation simple pour le stock: absence = quantité nulle
        if current_value is not None and current_value <= 0:
            return True, _build_trigger_message(alert, product, current_value)

    return False, ""


def _get_last_trigger_notification_by_token(alert, token):
    return Notification.objects.filter(
        alert=alert,
        notification_type="alert_triggered",
        message__contains=token,
    ).order_by("-created_at").first()


def _get_last_resolved_notification_by_token(alert, token):
    return (
        Notification.objects.filter(
            alert=alert,
            notification_type="system",
            message__contains=RESOLUTION_MARKER,
        )
        .filter(message__contains=token)
        .order_by("-created_at")
        .first()
    )


def _condition_is_currently_unresolved(alert, token):
    last_trigger = _get_last_trigger_notification_by_token(alert, token)
    if not last_trigger:
        return False

    last_resolved = _get_last_resolved_notification_by_token(alert, token)
    if not last_resolved:
        return True

    return last_trigger.created_at > last_resolved.created_at


def _schedule_interval_seconds(schedule):
    mapping = {
        "immediate": 0,
        "hourly": 3600,
        "daily": 86400,
        "weekly": 604800,
        "monthly": 2592000,
    }
    return mapping.get((schedule or "immediate").lower(), 0)


def _can_repeat_now(alert, last_trigger):
    seconds = _schedule_interval_seconds(alert.schedule)
    if seconds <= 0:
        return True
    next_allowed_at = last_trigger.created_at + timezone.timedelta(seconds=seconds)
    return timezone.now() >= next_allowed_at


def _should_create_trigger(alert, token):
    last_trigger = _get_last_trigger_notification_by_token(alert, token)
    if not last_trigger:
        return True

    if not _condition_is_currently_unresolved(alert, token):
        return True

    if not alert.repeat_until_resolved:
        return False

    return _can_repeat_now(alert, last_trigger)


def _send_alert_email_to_recipients(alert, message):
    from notifications.models import Notification
    
    recipients = [str(email).strip() for email in (alert.recipients or []) if "@" in str(email)]
    if alert.user and alert.user.email:
        recipients.append(alert.user.email)

    recipients = sorted(set(recipients))
    if not recipients:
        return

    # Utiliser le modèle Notification pour bénéficier du formatage HTML/Emojis
    title = getattr(alert, "custom_subject", None) or f"Alerte déclenchée: {alert.name}"
    
    # Création d'une instance temporaire (non sauvegardée en DB)
    temp_notif = Notification(
        user=alert.user,
        alert=alert,
        title=title,
        message=message,
        notification_type="alert_triggered",
        priority=getattr(alert, "severity", "medium") or "medium",
    )
    
    temp_notif.send_email_notification(recipient_list=recipients)


def _create_in_app_notifications_for_emails(*, emails, alert, title, message, notification_type, priority):
    """
    Crée des notifications "in-app" pour les utilisateurs dont l'email correspond aux destinataires.
    Objectif: si un user reçoit un email, il le voit aussi dans la liste des notifications front.
    """
    clean = []
    for e in (emails or []):
        if not e:
            continue
        s = str(e).strip()
        if "@" in s:
            clean.append(s)
    if not clean:
        return 0

    # Recherche case-insensitive sur tous les emails
    from django.db.models import Q

    q = Q()
    for e in sorted(set(clean)):
        q |= Q(email__iexact=e)
    users = list(User.objects.filter(q))
    if not users:
        return 0

    # Éviter doublon pour le propriétaire (déjà notifié)
    owner_id = getattr(getattr(alert, "user", None), "id", None)
    targets = [u for u in users if u.id and u.id != owner_id]
    if not targets:
        return 0

    Notification.objects.bulk_create(
        [
            Notification(
                user=u,
                alert=alert,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
            )
            for u in targets
        ],
        ignore_conflicts=False,
    )
    return len(targets)


def _extract_telegram_chat_ids(alert):
    chat_ids = []

    if alert.user and alert.user.telegram_chat_id:
        chat_ids.append(str(alert.user.telegram_chat_id).strip())

    for recipient in (alert.recipients or []):
        recipient_str = str(recipient).strip()
        if recipient_str.lower().startswith('tg:'):
            chat_id = recipient_str[3:].strip()
            if chat_id:
                chat_ids.append(chat_id)

    return sorted(set([cid for cid in chat_ids if cid]))


def _send_alert_telegram_to_recipients(alert, message):
    from notifications.models import Notification
    
    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
    if not bot_token:
        return

    chat_ids = _extract_telegram_chat_ids(alert)
    if not chat_ids:
        return

    # Utiliser le modèle Notification pour bénéficier du formatage Markdown/Emojis
    title = getattr(alert, "custom_subject", None) or f"Alerte déclenchée: {alert.name}"
    
    # Détermination des labels et indicateurs
    severity_label = dict(Notification.PRIORITY_CHOICES).get(alert.severity, alert.severity).capitalize()
    module_label = alert.module.capitalize() if alert.module else "Système"
    condition_type = dict(alert.CONDITION_TYPES).get(alert.condition_type, alert.condition_type)
    schedule = dict(alert.SCHEDULE_CHOICES).get(alert.schedule, alert.schedule)
    
    priority_indicators = {
        'critical': '🔴 Critique',
        'high': '🟠 Haute',
        'medium': '🔵 Moyenne',
        'low': '🟢 Basse',
    }
    status_indicator = priority_indicators.get(alert.severity, f"Actif 🟢")

    text = (
        f"🚨 {title}\n\n"
        f"{message}\n\n"
        f"Détails & Configuration :\n"
        f"━━━━━━━━━━━━━━━\n"
        f"• Nom : {alert.name}\n"
        f"• Module : {module_label}\n"
        f"• Sévérité : {severity_label}\n"
        f"• État : {status_indicator}\n"
        f"• Type : {condition_type}\n"
        f"• Fréquence : {schedule}\n"
        f"━━━━━━━━━━━━━━━\n\n"
        f"🌐 [Gérer mes alertes]({settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:3000'}/alerts)"
    )

    send_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    for chat_id in chat_ids:
        try:
            requests.post(
                send_url,
                json={
                    'chat_id': chat_id,
                    'text': text,
                    'parse_mode': 'Markdown',
                },
                timeout=8,
            )
        except Exception:
            continue


def create_trigger_notification(alert, product, message):
    token = _get_product_token(product)
    if token not in message:
        message = f"{token} {message}"

    if getattr(alert, "custom_body", None):
        custom_msg = alert.custom_body
        custom_msg = custom_msg.replace("{{alert}}", alert.name)
        custom_msg = custom_msg.replace("{{module}}", alert.module)
        if product:
            custom_msg = custom_msg.replace("{{product_name}}", product.name if hasattr(product, 'name') else str(product))
        if alert.user:
            custom_msg = custom_msg.replace("{{user}}", alert.user.username)
            if alert.user.email:
                custom_msg = custom_msg.replace("{{email}}", alert.user.email)
        from django.utils import timezone
        custom_msg = custom_msg.replace("{{date}}", timezone.now().strftime("%d/%m/%Y"))
        message = custom_msg

    if not _should_create_trigger(alert, token):
        return False
    
    condition_txt = format_alert_check_condition(getattr(alert, "check_condition", None))
    if condition_txt and condition_txt != "—":
        message = f"{message}\n\nCondition: {condition_txt}"

    if getattr(alert, "custom_subject", None):
        title = getattr(alert, "custom_subject")
    else:
        title = f"Alerte déclenchée: {alert.name}"
    
    # ── Récupérer les préférences de l'utilisateur pour filtrer les canaux ──
    prefs, _ = NotificationChannelPreference.objects.get_or_create(user=alert.user)
    
    # Canaux activés au niveau alerte
    alert_channels = [str(c).strip().lower() for c in (alert.notification_channels or [])]
    
    final_channels = []
    # Toujours ajouter 'inapp' SI activé dans les prefs (même s'il n'est pas dans alert_channels)
    if prefs.in_app_enabled:
        final_channels.append("inapp")
    
    # Pour les autres, il faut qu'ils soient dans l'alerte ET dans les prefs
    if "email" in alert_channels and prefs.email_enabled:
        final_channels.append("email")
    
    if "telegram" in alert_channels and prefs.telegram_enabled:
        final_channels.append("telegram")
        
    if "webpush" in alert_channels:
        final_channels.append("webpush")

    # Si 'inapp' n'est plus dans final_channels parce que désactivé globalement,
    # on n'envoie RIEN in-app (donc pas de Notification.objects.create pour cet utilisateur)

    if "inapp" in final_channels:
        notification = Notification(
            user=alert.user,
            alert=alert,
            title=title,
            message=message,
            notification_type="alert_triggered",
            priority=getattr(alert, "severity", "medium") or "medium",
            channels=final_channels
        )
        notification._skip_signal = True  # Le service d'alerte a déjà envoyé email/telegram
        notification.save()

    if "email" in final_channels:
        emails = []
        if alert.user and getattr(alert.user, "email", None):
            emails.append(alert.user.email)
        for r in (alert.recipients or []):
            rs = str(r).strip()
            if "@" in rs:
                emails.append(rs)

        _create_in_app_notifications_for_emails(
            emails=emails,
            alert=alert,
            title=title,
            message=message,
            notification_type="alert_triggered",
            priority=getattr(alert, "severity", "medium") or "medium",
        )
        
        # Rétablir l'envoi manuel puisque la notification a `_skip_signal = True`
        _send_alert_email_to_recipients(alert, message)

        
    if "telegram" in final_channels:
        _send_alert_telegram_to_recipients(alert, message)
        
    if "webpush" in final_channels:
        payload = {
            "head": title,
            "body": message,
            "icon": "/logo192.png" 
        }
        send_user_notification(user=alert.user, payload=payload, ttl=1000)

    return True


def create_trigger_notification_for_invoice(alert, invoice, message):
    token = _get_invoice_token(invoice)
    if token not in message:
        message = f"{token} {message}"

    if getattr(alert, "custom_body", None):
        custom_msg = alert.custom_body
        custom_msg = custom_msg.replace("{{alert}}", alert.name)
        custom_msg = custom_msg.replace("{{module}}", alert.module)
        if invoice:
            custom_msg = custom_msg.replace("{{invoice_number}}", invoice.invoice_number if hasattr(invoice, 'invoice_number') else str(invoice.id))
        if alert.user:
            custom_msg = custom_msg.replace("{{user}}", alert.user.username)
            if alert.user.email:
                custom_msg = custom_msg.replace("{{email}}", alert.user.email)
        from django.utils import timezone
        custom_msg = custom_msg.replace("{{date}}", timezone.now().strftime("%d/%m/%Y"))
        message = custom_msg

    if not _should_create_trigger(alert, token):
        return False
    
    condition_txt = format_alert_check_condition(getattr(alert, "check_condition", None))
    if condition_txt and condition_txt != "—":
        message = f"{message}\n\nCondition: {condition_txt}"

    if getattr(alert, "custom_subject", None):
        title = getattr(alert, "custom_subject")
    else:
        title = f"Alerte déclenchée: {alert.name}"
    
    # ── Récupérer les préférences de l'utilisateur ──
    prefs, _ = NotificationChannelPreference.objects.get_or_create(user=alert.user)
    alert_channels = [str(c).strip().lower() for c in (alert.notification_channels or [])]
    
    final_channels = []
    # 1. In-App : seulement si activé globalement ET (optionnel: si l'alerte ne l'exclut pas)
    if prefs.in_app_enabled:
        final_channels.append("inapp")
    
    # 2. Email : Alerte ET Globale
    if "email" in alert_channels and prefs.email_enabled:
        final_channels.append("email")
    
    # 3. Telegram : Alerte ET Globale
    if ("telegram" in alert_channels or "tg" in alert_channels) and prefs.telegram_enabled:
        final_channels.append("telegram")
        
    if "webpush" in alert_channels:
        final_channels.append("webpush")

    # Important: On crée l'objet Notification seulement si 'inapp' est dans les canaux finaux
    if "inapp" in final_channels:
        notification = Notification(
            user=alert.user,
            alert=alert,
            title=title,
            message=message,
            notification_type="alert_triggered",
            priority=getattr(alert, "severity", "medium") or "medium",
            channels=final_channels
        )
        notification._skip_signal = True  # Le service d'alerte a déjà envoyé email/telegram
        notification.save()

    # L'envoi de l'email et des notifications aux destinataires
    if "email" in final_channels:
        _send_alert_email_to_recipients(alert, message)
        
        # Création de notifications in-app pour les destinataires additionnels s'ils sont utilisateurs
        if alert.recipients:
            _create_in_app_notifications_for_emails(
                emails=alert.recipients,
                alert=alert,
                title=title,
                message=message,
                notification_type="alert_triggered",
                priority=getattr(alert, "severity", "medium")
            )

    if "telegram" in final_channels:
        _send_alert_telegram_to_recipients(alert, message)
    
    if "webpush" in final_channels:
        payload = {
            "head": title,
            "body": message,
            "icon": "/logo192.png"
        }
        send_user_notification(user=alert.user, payload=payload, ttl=1000)

    return True


def create_resolved_notification(alert, product):
    token = _get_product_token(product)
    if not _condition_is_currently_unresolved(alert, token):
        return False

    Notification.objects.create(
        user=alert.user,
        alert=alert,
        title=f"Alerte résolue: {alert.name} (Produit #{product.id})",
        message=_build_resolved_message(alert, product),
        notification_type="system",
    )
    return True


def create_resolved_notification_for_invoice(alert, invoice):
    token = _get_invoice_token(invoice)
    if not _condition_is_currently_unresolved(alert, token):
        return False

    Notification.objects.create(
        user=alert.user,
        alert=alert,
        title=f"Alerte résolue: {alert.name} (Facture #{invoice.id})",
        message=_build_facturation_resolved_message(alert, invoice),
        notification_type="system",
    )
    return True


def _get_invoice_field_value(invoice, condition_field):
    raw_field = (condition_field or "").strip().lower()
    field_mapping = {
        "": "total_amount",
        "quantity": "total_amount",
        "amount": "total_amount",
        "montant": "total_amount",
    }
    mapped_field = field_mapping.get(raw_field, raw_field)

    if not hasattr(invoice, mapped_field):
        return None

    return _to_decimal(getattr(invoice, mapped_field))


def _is_due_date_upcoming(invoice, days_threshold):
    """
    Vérifie si la date d'échéance est dans les N prochains jours.
    
    Args:
        invoice: Instance de facture
        days_threshold: Nombre de jours (ex: 3 = dans les 3 prochains jours)
    
    Returns:
        bool: True si due_date < today + N jours
    """
    if not invoice.due_date:
        return False
    
    try:
        days_int = int(days_threshold)
    except (ValueError, TypeError):
        return False
    
    from django.utils import timezone
    today = timezone.now().date()
    cutoff_date = today + timezone.timedelta(days=days_int)
    
    return invoice.due_date < cutoff_date


def _build_upcoming_due_message(alert, invoice, days_threshold):
    return (
        f"Bonjour,\n\n"
        f" ️ ALERTE FACTURATION - ÉCHÉANCE IMMINENTE\n\n"
        f"Facture : {invoice.invoice_number}\n"
        f"Client : {invoice.customer_name}\n"
        f"Date d'échéance : {invoice.due_date}\n"
        f"Jours restants : < {days_threshold}\n"
        f"Montant total : {invoice.total_amount} {invoice.currency or 'EUR'}\n"
        f"Statut : {invoice.get_status_display()}\n\n"
        f"Cordialement,\nSmartNotify"
    )


def evaluate_facturation_alert_for_invoice(alert, invoice):
    if not alert.is_active or alert.module != "facturation":
        return False, ""

    # Si une règle logique (check_condition) est définie, on l'évalue en priorité
    check_eval = _eval_invoice_check_conditions(alert, invoice)
    if check_eval is True:
        return True, _build_facturation_trigger_message_from_check_conditions(alert, invoice)
    if check_eval is False:
        return False, ""

    condition_field = (alert.condition_field or "").strip().lower()
    
    # Gestion des conditions de date d'échéance
    if condition_field in ("due_date", "échéance", "date_echéance"):
        days_threshold = alert.threshold_value
        if _is_due_date_upcoming(invoice, days_threshold):
            return True, _build_upcoming_due_message(alert, invoice, days_threshold)
        return False, ""
    
    # Gestion des conditions de montant (seuil)
    current_value = _get_invoice_field_value(invoice, alert.condition_field)
    compare_target = _to_decimal(alert.threshold_value)

    if current_value is None or compare_target is None:
        return False, ""

    is_triggered = _compare_values(current_value, compare_target, alert.comparison_operator)
    if not is_triggered:
        return False, ""

    return True, _build_facturation_trigger_message(alert, invoice, current_value)


def evaluate_alert_against_current_stock(alert):
    """Évalue une alerte stock contre les produits existants."""
    if alert.module != "stock" or not alert.is_active:
        return {"evaluated": 0, "triggered": 0}

    products = Product.objects.all()

    if alert.product_id:
        products = products.filter(id=alert.product_id)

    if alert.categories:
        category_ids = []
        for item in alert.categories:
            try:
                category_ids.append(int(item))
            except (TypeError, ValueError):
                continue
        if category_ids:
            products = products.filter(category_id__in=category_ids)

    evaluated = 0
    triggered = 0

    for product in products:
        evaluated += 1
        is_triggered, message = evaluate_stock_alert_for_product(alert, product)
        if is_triggered:
            if create_trigger_notification(alert, product, message):
                triggered += 1
        else:
            create_resolved_notification(alert, product)

    return {"evaluated": evaluated, "triggered": triggered}


def evaluate_stock_alerts_for_product(product):
    """Évalue toutes les alertes stock actives pour un produit mis à jour."""
    alerts = Alert.objects.filter(module="stock", is_active=True)

    evaluated = 0
    triggered = 0

    def is_auto_stock_alert(a: Alert) -> bool:
        # Heuristique: alerte auto "stock faible" (créée par ensure_auto_stock_alert)
        name = (getattr(a, "name", "") or "").strip().lower()
        if "auto" in name:
            return True
        # pattern du projet: compare_to=min_stock, condition_field=quantity, threshold_value=None
        return (
            (getattr(a, "condition_type", None) == "threshold")
            and (getattr(a, "condition_field", None) in {"quantity", "Quantity"})
            and (getattr(a, "compare_to", None) in {"min_stock", "min_stock "})
            and (getattr(a, "threshold_value", None) in {None, ""})
            and (getattr(a, "comparison_operator", None) == "less_than")
        )

    # 1) Évaluer toutes les alertes et collecter celles déclenchées
    evaluated_items = []
    triggered_items = []

    for alert in alerts:
        evaluated += 1
        is_triggered, message = evaluate_stock_alert_for_product(alert, product)
        evaluated_items.append((alert, is_triggered, message))
        if is_triggered:
            triggered_items.append((alert, message))

    # 2) Si au moins une alerte "non-auto" est déclenchée, on ignore l'auto
    has_non_auto = any(not is_auto_stock_alert(a) for a, _m in triggered_items)

    for alert, is_triggered, message in evaluated_items:
        if is_triggered:
            if has_non_auto and is_auto_stock_alert(alert):
                # On garde l'auto (elle reste active), mais on évite qu'elle prenne la priorité
                # dans l'objet email / notifs quand une règle personnalisée s'est déclenchée.
                continue
            if create_trigger_notification(alert, product, message):
                triggered += 1
        else:
            create_resolved_notification(alert, product)

    return {"evaluated": evaluated, "triggered": triggered}


def evaluate_facturation_alerts_for_invoice(invoice):
    """Évalue toutes les alertes facturation actives pour une facture créée/mise à jour."""
    alerts = Alert.objects.filter(module="facturation", is_active=True)

    evaluated = 0
    triggered = 0

    for alert in alerts:
        evaluated += 1
        is_triggered, message = evaluate_facturation_alert_for_invoice(alert, invoice)
        if is_triggered:
            if create_trigger_notification_for_invoice(alert, invoice, message):
                triggered += 1
        else:
            create_resolved_notification_for_invoice(alert, invoice)

    return {"evaluated": evaluated, "triggered": triggered}


def evaluate_alert_against_current_invoices(alert):
    """Évalue une alerte facturation contre les factures existantes."""
    if alert.module != "facturation" or not alert.is_active:
        return {"evaluated": 0, "triggered": 0}

    invoices = Invoice.objects.all()

    evaluated = 0
    triggered = 0

    for invoice in invoices:
        evaluated += 1
        is_triggered, message = evaluate_facturation_alert_for_invoice(alert, invoice)
        if is_triggered:
            if create_trigger_notification_for_invoice(alert, invoice, message):
                triggered += 1
        else:
            create_resolved_notification_for_invoice(alert, invoice)

    return {"evaluated": evaluated, "triggered": triggered}