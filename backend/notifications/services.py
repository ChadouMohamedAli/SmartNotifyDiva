# notifications/services.py
import logging
from django.core.mail import send_mail
from django.conf import settings
from webpush import send_user_notification
from smartalerte_project.telegram_utils import send_telegram_to_user  # Changé ici

logger = logging.getLogger(__name__)

def send_notification(notification):
    """
    Envoie une notification via les canaux spécifiés.
    """
    user = notification.user
    channels = notification.channels if isinstance(notification.channels, list) else []

    logger.info(f"Début de l'envoi de la notification ID {notification.id} pour {user.username} via les canaux: {channels}")

    # 1. Canal "Email"
    if 'email' in channels and user.email:
        logger.info(f"Tentative d'envoi d'email à {user.email}")
        try:
            # Récupérer les overrides de l'instance si disponibles
            subject = getattr(notification, '_email_subject', None)
            body = getattr(notification, '_email_body', None)
            
            # Utiliser la méthode send_email_notification du modèle avec les overrides
            success, error = notification.send_email_notification(
                subject_override=subject, 
                body_override=body
            )
            if success:
                logger.info(f"Email envoyé avec succès à {user.email}")
            else:
                logger.error(f"Échec email: {error}")
        except Exception as e:
            logger.error(f"Exception lors de l'envoi email: {e}")

    # 2. Canal "In-App" (Push Web)
    if 'inapp' in channels or 'in-app' in channels:
        logger.info(f"Tentative d'envoi de notification Push Web à {user.username}")
        try:
            # Utiliser le body personnalisé pour le push in-app aussi si disponible
            msg_body = getattr(notification, '_email_body', None) or notification.message
            
            payload = {
                'head': getattr(notification, '_email_subject', None) or notification.title,
                'body': msg_body,
                'icon': 'https://example.com/icon.png',
                'url': '/notifications'
            }
            send_user_notification(user=user, payload=payload, ttl=1000)
            logger.info(f"Notification Push Web envoyée avec succès")
        except Exception as e:
            logger.warning(f"Échec de la notification Push Web: {e}")

    # 3. Canal "Telegram"
    if 'telegram' in channels and user.telegram_chat_id:
        logger.info(f"Tentative d'envoi de message Telegram")
        try:
            # Utiliser le body personnalisé pour Telegram aussi si disponible
            body = getattr(notification, '_email_body', None)

            success, error = notification.send_telegram_notification(body_override=body)
            if success:
                logger.info(f"Message Telegram envoyé avec succès")
            else:
                logger.error(f"Échec Telegram: {error}")
        except Exception as e:
            logger.error(f"Exception lors de l'envoi Telegram: {e}")

    logger.info(f"Fin du traitement de la notification ID {notification.id}")