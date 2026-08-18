from rest_framework import serializers
from .models import Notification, NotificationEmailRecipient, NotificationChannelPreference
from accounts.serializers import UserSerializer
from alerts.serializers import AlertSerializer


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer pour les notifications"""
    user = UserSerializer(read_only=True)
    alert = AlertSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'user',
            'alert',
            'title',
            'message',
            'notification_type',
            'priority',
            'is_read',
            'read_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'read_at']


# notifications/serializers.py
class CreateNotificationSerializer(serializers.ModelSerializer):
    """Serializer pour créer une notification"""
    
    email_subject = serializers.CharField(required=False, allow_blank=True, write_only=True)
    email_body = serializers.CharField(required=False, allow_blank=True, write_only=True)
    channels = serializers.ListField(child=serializers.CharField(), write_only=True, required=False, default=list)
    
    class Meta:
        model = Notification
        fields = [
            'user',
            'alert',
            'title',
            'message',
            'notification_type',
            'priority',
            'channels',
            'email_subject',
            'email_body',
        ]
        extra_kwargs = {
            'user': {'required': False, 'allow_null': True},
            'alert': {'required': False, 'allow_null': True},
            'title': {'required': False, 'allow_blank': True, 'allow_null': True},
            'message': {'required': False, 'allow_blank': True, 'allow_null': True},
            'priority': {'required': False},
        }
    
    def create(self, validated_data):
        # Extraire les champs spéciaux
        email_subject = validated_data.pop('email_subject', None)
        email_body = validated_data.pop('email_body', None)
        channels = validated_data.get('channels', [])
        
        # Si l'utilisateur n'est pas fourni, l'extraire de l'alerte
        if not validated_data.get('user') and validated_data.get('alert'):
            validated_data['user'] = validated_data['alert'].user
        
        # S'assurer qu'un utilisateur est présent
        if not validated_data.get('user'):
            raise serializers.ValidationError("Impossible de déterminer le destinataire de la notification.")
        
        # Si aucun canal n'est fourni, on utilise les préférences de l'utilisateur
        if not channels:
            try:
                prefs, _ = NotificationChannelPreference.objects.get_or_create(user=validated_data['user'])
                if prefs.email_enabled: channels.append('email')
                if prefs.in_app_enabled: channels.append('inapp')
                if prefs.telegram_enabled: channels.append('telegram')
                validated_data['channels'] = channels
            except:
                validated_data['channels'] = ['inapp'] # Fallback
        
        # Créer la notification
        notification = Notification.objects.create(**validated_data)
        
        # Stocker l'email_subject et email_body dans une variable d'instance
        # pour les utiliser dans le signal (si besoin)
        notification._email_subject = email_subject
        notification._email_body = email_body
        
        return notification

class NotificationEmailRecipientSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationEmailRecipient
        fields = ['id', 'email']
        read_only_fields = ['id']
