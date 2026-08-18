# alerts/signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from stock.models import Product
from facturation.models import Invoice
from alerts.models import Alert
from alerts.services import evaluate_stock_alerts_for_product, evaluate_facturation_alerts_for_invoice
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Product)
def check_product_stock_alert(sender, instance, created, **kwargs):
    """
    Déclenché après la création ou modification d'un produit
    Vérifie si le produit remplit les conditions d'alerte
    """
    logger.info(f"Vérification des alertes pour le produit {instance.name} (ID: {instance.id})")
    
    # Évaluer toutes les alertes actives pour ce produit
    result = evaluate_stock_alerts_for_product(instance)
    
    if result['triggered'] > 0:
        logger.info(f" {result['triggered']} alerte(s) déclenchée(s) pour le produit {instance.name}")
    else:
        logger.info(f"ℹ Aucune alerte déclenchée pour le produit {instance.name}")

@receiver(pre_save, sender=Product)
def check_quantity_change(sender, instance, **kwargs):
    """
    Vérifie spécifiquement si la quantité a changé et est passée sous le seuil
    """
    if not instance.pk:  # Nouveau produit
        return
        
    try:
        old_product = Product.objects.get(pk=instance.pk)
        old_quantity = old_product.quantity
        new_quantity = instance.quantity
        
        # Si la quantité a diminué et passe sous le min_quantity
        if new_quantity < old_quantity and new_quantity < instance.min_quantity:
            logger.info(f" Quantité critique détectée pour {instance.name}: {new_quantity} < {instance.min_quantity}")
            
            # Trouver les alertes concernant ce type de produit
            alerts = Alert.objects.filter(
                module='stock',
                is_active=True,
                condition_type='threshold',
                condition_field='quantity',
                comparison_operator='less_than'
            )
            
            # Filtrer par catégorie si nécessaire
            for alert in alerts:
                if not alert.categories or instance.category in alert.categories:
                    # Déclencher immédiatement l'alerte
                    from alerts.services import evaluate_stock_alert_for_product, create_trigger_notification
                    is_triggered, message = evaluate_stock_alert_for_product(alert, instance)
                    if is_triggered:
                        create_trigger_notification(alert, instance, message)
                        
    except Product.DoesNotExist:
        pass


@receiver(post_save, sender=Invoice)
def check_invoice_amount_alert(sender, instance, created, **kwargs):
    """
    Déclenché après création/modification d'une facture.
    Vérifie si le montant respecte les règles d'alerte facturation.
    """
    logger.info(
        "Vérification des alertes facturation pour la facture %s (ID: %s)",
        instance.invoice_number,
        instance.id,
    )

    result = evaluate_facturation_alerts_for_invoice(instance)
    if result["triggered"] > 0:
        logger.info(
            "%s alerte(s) facturation déclenchée(s) pour la facture %s",
            result["triggered"],
            instance.invoice_number,
        )