from django.db import models
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils.html import escape
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.conf import settings
from alerts.models import Alert
from smartalerte_project.telegram_utils import send_telegram_to_user

User = get_user_model()


class Notification(models.Model):
    """Modèle pour les notifications reçues par les utilisateurs"""
    
    NOTIFICATION_TYPES = [
        ('alert_triggered', 'Alerte déclenchée'),
        ('alert_updated', 'Alerte mise à jour'),
        ('system', 'Notification système'),
    ]
    
    PRIORITY_CHOICES = [
        ('critical', 'Critique'),
        ('high', 'Haute'),
        ('medium', 'Moyenne'),
        ('low', 'Basse'),
    ]
    
    # Relations
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    alert = models.ForeignKey(Alert, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    
    # Contenu
    title = models.CharField(max_length=255, blank=True, null=True)
    message = models.TextField(blank=True, null=True)
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default='alert_triggered')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    # Nouveau champ pour stocker les canaux de notification choisis pour CETTE notification
    channels = models.JSONField(default=list, blank=True, help_text="Liste des canaux choisis, ex: ['email', 'inapp']")

    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"
    
    def mark_as_read(self):
        """Marquer la notification comme lue"""
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
            return True
        return False
    
    def mark_as_unread(self):
        """Marquer la notification comme non lue"""
        if self.is_read:
            self.is_read = False
            self.read_at = None
            self.save()
            return True
        return False

    def send_email_notification(self, subject_override=None, body_override=None, recipient_list=None):
        """Envoyer la notification par email à l'utilisateur"""
        from django.utils.html import strip_tags
        recipients = set(recipient_list) if recipient_list else set()

        if not recipient_list:
            if self.user and self.user.email:
                recipients.add(self.user.email)

            extra_emails = NotificationEmailRecipient.objects.filter(user=self.user).values_list('email', flat=True)
            for email in extra_emails:
                recipients.add(email)

        if not recipients:
            return False, "Aucun destinataire email"
        
        try:
            # Récupérer les données de base
            subject_raw = getattr(self, '_email_subject', None) or subject_override
            body_content = getattr(self, '_email_body', None) or body_override
            
            # Fallback sur les valeurs par défaut du modèle si pas d'override
            if not subject_raw:
                subject_raw = f"SmartNotify - {self.title}"
            if not body_content:
                body_content = self.message

            subject = subject_raw.strip()

            # Formatage du corps de texte (Plain Text PRO)
            severity_label = dict(self.PRIORITY_CHOICES).get(self.priority, self.priority).capitalize()
            module_label = self.alert.module.capitalize() if self.alert and self.alert.module else "Système"
            alert_name = self.alert.name if self.alert else (self.title or "Automatique")
            
            # Plus de détails pour le récapitulatif
            alert_desc = self.alert.description if self.alert and self.alert.description else "Aucune description fournie"
            condition_type = dict(self.alert.CONDITION_TYPES).get(self.alert.condition_type, self.alert.condition_type) if self.alert else "N/A"
            schedule = dict(self.alert.SCHEDULE_CHOICES).get(self.alert.schedule, self.alert.schedule) if self.alert else "N/A"
            channels_list = ", ".join([c.capitalize() for c in (self.alert.notification_channels or [])]) if self.alert else "In-App"

            # Détermination de l'état avec Emoji basé sur la priorité
            priority_indicators = {
                'critical': '🔴 Critique',
                'high': '🟠 Haute',
                'medium': '🔵 Moyenne',
                'low': '🟢 Basse',
            }
            status_indicator = priority_indicators.get(self.priority, f"Actif 🟢")

            # Couleurs pour le HTML
            priority_colors = {
                'critical': '#ef4444', # Rouge
                'high': '#f97316',     # Orange
                'medium': '#3b82f6',   # Bleu
                'low': '#10b981',      # Vert
            }
            msg_color = priority_colors.get(self.priority, '#10b981')

            # Si le corps est personnalisé, on l'utilise tel quel en premier
            plain_message = f"""Bonjour {self.user.username},

{body_content}

Détails & Configuration :
--------------------------------------------------
• Nom de l'alerte    : {alert_name}
• Module associé     : {module_label}
• Niveau de sévérité : {severity_label}
• État actuel        : {status_indicator}
• Description        : {alert_desc}
• Type de condition  : {condition_type}
• Fréquence          : {schedule}
• Canaux d'envoi     : {channels_list}
--------------------------------------------------

Le système SmartNotify surveille désormais vos données. Vous pouvez gérer vos alertes ici :
{settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:3000'}/alerts

Cordialement,
L'équipe SmartNotify
"""

            html_message = f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: {msg_color}; border-bottom: 2px solid {msg_color}; padding-bottom: 10px;">SmartNotify - {self.title or "Alerte"}</h2>
                <p>Bonjour <strong>{self.user.username}</strong>,</p>
                <p style="font-size: 16px; line-height: 1.5; color: #333;">{body_content}</p>
                
                <div style="background-color: #f9fafb; border-left: 5px solid {msg_color}; padding: 15px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #111827; font-size: 14px; text-transform: uppercase;">Détails & Configuration</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr>
                            <td style="padding: 5px 0; color: #6b7280; width: 40%;">Nom de l'alerte :</td>
                            <td style="padding: 5px 0; font-weight: bold; color: #111827;">{alert_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; color: #6b7280;">Module associé :</td>
                            <td style="padding: 5px 0; font-weight: bold; color: #111827;">{module_label}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; color: #6b7280;">Niveau de sévérité :</td>
                            <td style="padding: 5px 0; font-weight: bold; color: {msg_color};">{severity_label}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; color: #6b7280;">État actuel :</td>
                            <td style="padding: 5px 0;"><span style="background-color: {msg_color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">{status_indicator}</span></td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0 5px 0; color: #6b7280; border-top: 1px solid #e5e7eb;">Description :</td>
                            <td style="padding: 10px 0 5px 0; color: #4b5563; border-top: 1px solid #e5e7eb;">{alert_desc}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; color: #6b7280;">Canaux d'envoi :</td>
                            <td style="padding: 5px 0; color: #4b5563;">{channels_list}</td>
                        </tr>
                    </table>
                </div>

                <p style="margin-top: 30px;">
                    <a href="{settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:3000'}/alerts" 
                       style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Gérer mes alertes
                    </a>
                </p>
                
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #9ca3af; font-size: 12px;">Le système SmartNotify surveille désormais vos données.<br>Cordialement, L'équipe SmartNotify</p>
            </div>
            """
            
            sent_count = send_mail(
                subject=subject,
                message=plain_message,
                html_message=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=list(recipients),
                fail_silently=False,
            )
            
            if sent_count == 0:
                return False, "Email non envoyé (SMTP)"
            return True, None
        except Exception as e:
            print(f"Erreur lors de l'envoi du mail: {e}")
            return False, str(e)

    def send_telegram_notification(self, body_override=None):
        """Envoyer la notification par Telegram a l'utilisateur si chat_id existe."""
        if not self.user:
            return False, "Aucun utilisateur"

        body_content = body_override if body_override else self.message
        
        # Récupérer le titre (sujet) personnalisé s'il existe
        title_content = self.title
        if hasattr(self, '_email_subject') and self._email_subject:
            title_content = self._email_subject

        # Plus de détails pour le récapitulatif
        alert_desc = self.alert.description if self.alert and self.alert.description else "N/A"
        condition_type = dict(self.alert.CONDITION_TYPES).get(self.alert.condition_type, self.alert.condition_type) if self.alert else "N/A"
        schedule = dict(self.alert.SCHEDULE_CHOICES).get(self.alert.schedule, self.alert.schedule) if self.alert else "N/A"

        # Formatage PRO pour Telegram (Markdown)
        severity_label = dict(self.PRIORITY_CHOICES).get(self.priority, self.priority).capitalize()
        module_label = self.alert.module.capitalize() if self.alert and self.alert.module else "Système"
        alert_name = self.alert.name if self.alert else (self.title or "Automatique")

        # Détermination de l'état avec Emoji basé sur la priorité
        priority_indicators = {
            'critical': '🔴 Critique',
            'high': '🟠 Haute',
            'medium': '🔵 Moyenne',
            'low': '🟢 Basse',
        }
        status_indicator = priority_indicators.get(self.priority, f"Actif 🟢")

        text = (
            f" {title_content}\n\n"
            f"{body_content}\n\n"
            f"Détails & Configuration :\n"
            f"━━━━━━━━━━━━━━━\n"
            f"• Nom : {alert_name}\n"
            f"• Module : {module_label}\n"
            f"• Sévérité : {severity_label}\n"
            f"• État : {status_indicator}\n"
            f"• Description : {alert_desc}\n"
            f"• Type : {condition_type}\n"
            f"• Fréquence : {schedule}\n"
            f"━━━━━━━━━━━━━━━\n\n"
            f"🌐 [Gérer mes alertes]({settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:3000'}/alerts)"
        )

        ok = send_telegram_to_user(self.user, text)
        if not ok:
            return False, "Telegram non envoye"
        return True, None

class NotificationEmailRecipient(models.Model):
    """Adresse email additionnelle pour les notifications d'un utilisateur"""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notification_recipients')
    email = models.EmailField(max_length=254)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['email']
        verbose_name = 'Notification Email Recipient'
        verbose_name_plural = 'Notification Email Recipients'
        unique_together = ['user', 'email']

    def __str__(self):
        return f"{self.user.username} -> {self.email}"

    def clean(self):
        try:
            validate_email(self.email)
        except ValidationError as exc:
            raise ValidationError({'email': exc.messages})


class NotificationChannelPreference(models.Model):
    """Preferences des canaux de notification par utilisateur."""

    SCHEDULE_CHOICES = [
        ('realtime', 'Temps reel'),
        ('hourly', 'Toutes les heures'),
        ('daily', 'Quotidien'),
        ('weekly', 'Hebdomadaire'),
        ('monthly', 'Mensuel'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='notification_channel_preferences',
    )
    email_enabled = models.BooleanField(default=True)
    in_app_enabled = models.BooleanField(default=True)
    telegram_enabled = models.BooleanField(default=True)
    schedule = models.CharField(max_length=20, choices=SCHEDULE_CHOICES, default='realtime')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Notification Channel Preference'
        verbose_name_plural = 'Notification Channel Preferences'

    def __str__(self):
        return f"{self.user.username} preferences"