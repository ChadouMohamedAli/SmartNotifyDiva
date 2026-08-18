from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail, EmailMessage
from django.conf import settings
import logging
import requests
from .models import Alert
from .serializers import AlertSerializer
from .services import evaluate_alert_against_current_stock, evaluate_alert_against_current_invoices

try:
    from activity.models import ActivityLog
except ImportError:
    ActivityLog = None

try:
    from notifications.models import Notification
    from notifications.serializers import CreateNotificationSerializer
except ImportError:
    Notification = None
    CreateNotificationSerializer = None

from webpush import send_user_notification

logger = logging.getLogger(__name__)

def normalize_channels(channels):
    if not channels:
        return []
    if isinstance(channels, list):
        return [str(c).strip().lower() for c in channels if str(c).strip()]
    return [str(channels).strip().lower()]

def send_pro_email(user, subject, title, alert_details, footer_text):
    """Fonction générique pour envoyer des emails propres et pros"""
    try:
        email_body = f"""
Bonjour {user.username},

{title}

Détails de l'alerte :
--------------------------------------------------
• Nom de l'alerte    : {alert_details.get('name')}
• Module associé     : {alert_details.get('module').capitalize()}
• Niveau de sévérité : {alert_details.get('severity_display')}
• État actuel        : {alert_details.get('status')}
--------------------------------------------------

{footer_text}

Cordialement,
L'équipe SmartNotify
"""
        send_mail(subject, email_body, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
        return True
    except Exception as e:
        logger.error(f"Erreur Email Pro: {e}")
        return False

class AlertViewSet(viewsets.ModelViewSet):
    serializer_class = AlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Alert.objects.all()
        return Alert.objects.filter(user=user)

    def perform_create(self, serializer):
        alert = serializer.save(user=self.request.user)
        
        # Log
        if ActivityLog:
            try:
                ActivityLog.objects.create(actor=self.request.user, action_type="ALERT_CREATED", title=f"Alerte créée: {alert.name}")
            except: pass

        # Notification via le système centralisé
        if CreateNotificationSerializer:
            try:
                notification_data = {
                    'user': self.request.user.id,
                    'alert': alert.id,
                    'title': f"Alerte configurée : {alert.name}",
                    'message': f"Votre nouvelle alerte '{alert.name}' a été configurée avec succès et est maintenant active.",
                    'notification_type': 'alert_updated',
                    'priority': alert.severity,
                    'channels': alert.notification_channels,
                    'email_subject': alert.custom_subject,
                    'email_body': alert.custom_body
                }
                notification_serializer = CreateNotificationSerializer(data=notification_data)
                if notification_serializer.is_valid(raise_exception=True):
                    notification_serializer.save()
                    notification_serializer.instance._skip_signal = True  # Éviter double envoi

            except Exception as e:
                logger.error(f"Erreur lors de la création de la notification de configuration d'alerte: {e}")

    def perform_update(self, serializer):
        alert = serializer.instance
        # Vérifier que c'est le propriétaire de l'alerte ou un super_admin
        if alert.user != self.request.user and not self.request.user.is_superuser:
            raise PermissionError("You do not have permission to modify this alert.")
        
        alert = serializer.save()
        
        # Log
        if ActivityLog:
            try:
                ActivityLog.objects.create(actor=self.request.user, action_type="ALERT_UPDATED", title=f"Alerte modifiée: {alert.name}")
            except: pass

        # Notification via le système centralisé pour la modification
        if CreateNotificationSerializer:
            try:
                notification_data = {
                    'user': self.request.user.id,
                    'alert': alert.id,
                    'title': f" Alerte modifiée : {alert.name}",
                    'message': f"Votre alerte '{alert.name}' a été mise à jour avec succès.",
                    'notification_type': 'alert_updated',
                    'priority': alert.severity,
                    'channels': alert.notification_channels,
                    'email_subject': alert.custom_subject,
                    'email_body': alert.custom_body
                }
                notification_serializer = CreateNotificationSerializer(data=notification_data)
                if notification_serializer.is_valid(raise_exception=True):
                    notification_serializer.save()
            except Exception as e:
                logger.error(f"Erreur lors de la création de la notification de modification d'alerte: {e}")

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        alert = self.get_object()
        # Vérifier que c'est le propriétaire de l'alerte ou un super_admin
        if alert.user != request.user and not request.user.is_superuser:
            return Response({"detail": "You do not have permission to modify this alert."}, status=status.HTTP_403_FORBIDDEN)
        
        alert.is_active = not alert.is_active
        alert.save()

        # Notification via le système centralisé pour le basculement
        status_text = "activée 🟢" if alert.is_active else "désactivée 🔴"
        if CreateNotificationSerializer:
            try:
                notification_data = {
                    'user': request.user.id,
                    'alert': alert.id,
                    'title': f" État de l'alerte : {alert.name}",
                    'message': f"Votre alerte '{alert.name}' a été {status_text}.",
                    'notification_type': 'alert_toggled',
                    'priority': alert.severity,
                    'channels': alert.notification_channels
                }
                notification_serializer = CreateNotificationSerializer(data=notification_data)
                if notification_serializer.is_valid(raise_exception=True):
                    notification_serializer.save()
            except Exception as e:
                logger.error(f"Erreur lors de la création de la notification de basculement d'alerte: {e}")

        return Response({'message': f'Alerte {status_text}', 'is_active': alert.is_active})

    def perform_destroy(self, instance):
        if instance.user != self.request.user and not self.request.user.is_superuser:
            return Response(status=status.HTTP_403_FORBIDDEN)
        instance.delete()

    @action(detail=True, methods=['post'])
    def send_alert(self, request, pk=None):
        alert = self.get_object()
        # Envoi manuel pour test
        return Response({'status': 'sent'})

    @action(detail=False, methods=['get'])
    def my_alerts(self, request):
        alerts = Alert.objects.filter(user=request.user)
        serializer = self.get_serializer(alerts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def employee_alerts(self, request):
        if not request.user.is_superuser:
            return Response({"detail": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
        
        alerts = Alert.objects.exclude(user=request.user)
        serializer = self.get_serializer(alerts, many=True)
        return Response(serializer.data)