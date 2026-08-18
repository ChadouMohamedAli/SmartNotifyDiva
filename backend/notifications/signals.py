# notifications/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification
from .services import send_notification
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Notification)
def send_notification_on_create(sender, instance, created, **kwargs):
    if created:
        print(f" Notification détectée: {instance.title}")
        print(f" Canaux (modèle): {instance.channels}")

        # SÉCURITÉ : Si la notification vient du service d'alerte auto,
        # l'email/Telegram a DÉJÀ été envoyé par alerts/services.py.
        # On ne doit RIEN faire ici sinon ça double les envois.
        if getattr(instance, '_skip_signal', False):
            print(" Envoi externe déjà géré par Alert Service. Skip signals.")
            return

        # Déclencher l'envoi pour toutes les autres notifications
        # (alert_updated, alert_toggled, system, etc.)
        send_notification(instance)
