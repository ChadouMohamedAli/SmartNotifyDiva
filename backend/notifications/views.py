from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.utils import timezone
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from .models import Notification, NotificationEmailRecipient, NotificationChannelPreference
from .serializers import NotificationSerializer, CreateNotificationSerializer
import random
import string
from datetime import timedelta


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Notification.objects.all()
        return Notification.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateNotificationSerializer
        return NotificationSerializer
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_unread(self, request, pk=None):
        notification = self.get_object()
        notification.mark_as_unread()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        notifications = self.get_queryset().filter(is_read=False)
        count = 0
        for notification in notifications:
            if notification.mark_as_read():
                count += 1
        return Response({
            'message': f'{count} notification(s) marquée(s) comme lue(s)',
            'count': count
        })
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})
    
    @action(detail=False, methods=['post'])
    def delete_old(self, request):
        threshold_date = timezone.now() - timedelta(days=30)
        deleted_count, _ = self.get_queryset().filter(
            is_read=True,
            read_at__lt=threshold_date
        ).delete()
        return Response({
            'message': f'{deleted_count} notification(s) supprimée(s)',
            'count': deleted_count
        })

    @action(detail=False, methods=['get', 'put'])
    def email_recipients(self, request):
        user = request.user
        if request.method == 'GET':
            emails = list(NotificationEmailRecipient.objects.filter(user=user).values_list('email', flat=True))
            return Response({'emails': emails})
        emails = request.data.get('emails', [])
        if not isinstance(emails, list):
            return Response({'detail': 'Le champ emails doit être une liste.'}, status=status.HTTP_400_BAD_REQUEST)
        cleaned = []
        for raw in emails:
            if not isinstance(raw, str):
                continue
            email = raw.strip()
            if not email:
                continue
            try:
                validate_email(email)
            except ValidationError:
                return Response({'detail': f'Adresse email invalide: {email}'}, status=status.HTTP_400_BAD_REQUEST)
            cleaned.append(email)
        NotificationEmailRecipient.objects.filter(user=user).delete()
        NotificationEmailRecipient.objects.bulk_create([
            NotificationEmailRecipient(user=user, email=email) for email in sorted(set(cleaned))
        ])
        return Response({'emails': cleaned})

    @action(detail=False, methods=['get', 'put'])
    def channel_preferences(self, request):
        user = request.user
        prefs, _ = NotificationChannelPreference.objects.get_or_create(user=user)
        if request.method == 'GET':
            return Response({
                'email_enabled': prefs.email_enabled,
                'in_app_enabled': prefs.in_app_enabled,
                'telegram_enabled': prefs.telegram_enabled,
                'schedule': prefs.schedule,
            })
        email_enabled = request.data.get('email_enabled', prefs.email_enabled)
        in_app_enabled = request.data.get('in_app_enabled', prefs.in_app_enabled)
        telegram_enabled = request.data.get('telegram_enabled', prefs.telegram_enabled)
        schedule = request.data.get('schedule', prefs.schedule)
        
        valid_schedules = {choice[0] for choice in NotificationChannelPreference.SCHEDULE_CHOICES}
        if schedule not in valid_schedules:
            return Response({'detail': f'Frequence invalide. Valeurs attendues: {", ".join(valid_schedules)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        prefs.email_enabled = bool(email_enabled)
        prefs.in_app_enabled = bool(in_app_enabled)
        prefs.telegram_enabled = bool(telegram_enabled)
        prefs.schedule = schedule
        prefs.save()
        return Response({
            'email_enabled': prefs.email_enabled,
            'in_app_enabled': prefs.in_app_enabled,
            'telegram_enabled': prefs.telegram_enabled,
            'schedule': prefs.schedule,
        })


class RegisterTelegramChatView(APIView):
    """View pour enregistrer le chat_id Telegram d'un utilisateur"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        chat_id = request.data.get('chat_id')
        telegram_username = request.data.get('telegram_username')
        
        if not chat_id:
            return Response({'error': 'chat_id requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        user.telegram_chat_id = chat_id
        if telegram_username:
            user.telegram_username = telegram_username.lstrip('@').lower()
        user.save()
        
        print(f" Telegram linked for {user.email}: chat_id={chat_id}, username={user.telegram_username}")
        
        return Response({
            'message': 'Compte Telegram lié avec succès',
            'chat_id': user.telegram_chat_id,
            'username': user.telegram_username
        }, status=status.HTTP_200_OK)


class SendOTPEmailView(APIView):
    """Envoyer un code OTP par email"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        otp_code = ''.join(random.choices(string.digits, k=6))
        
        request.session[f'otp_email_{email}'] = {
            'code': otp_code,
            'created_at': timezone.now().isoformat(),
            'channel': 'email'
        }
        request.session.modified = True
        
        print(f"\n{'='*50}")
        print(f"📧 CODE OTP EMAIL pour {email}: {otp_code}")
        print(f"{'='*50}\n")
        
        try:
            subject = 'Code de vérification - Activation Email SmartNotify'
            message = f"""
Bonjour,
Votre code de vérification pour activer les notifications par email est : {otp_code}
Ce code est valable 5 minutes.
Cordialement, L'équipe SmartNotify
"""
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            return Response({'message': 'Code OTP envoyé par email'}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"❌ Erreur envoi email: {e}")
            return Response({
                'message': 'Code OTP généré (mode développement)',
                'dev_code': otp_code
            }, status=status.HTTP_200_OK)


class SendOTPTelegramView(APIView):
    """Envoyer un code OTP par Telegram"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Rafraîchir l'user depuis la base pour avoir le chat_id à jour
        request.user.refresh_from_db()
        
        telegram_username = request.data.get('telegram_username')
        if not telegram_username:
            return Response({'error': 'Nom d\'utilisateur Telegram requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        telegram_username = telegram_username.lstrip('@').lower()
        
        print(f"\n{'='*60}")
        print(f"📱 ACTIVATION TELEGRAM - DEMANDE OTP")
        print(f"   Utilisateur ID: {request.user.id}")
        print(f"   Email: {request.user.email}")
        print(f"   Username: {request.user.username}")
        print(f"   Telegram Username demandé: @{telegram_username}")
        print(f"   Telegram Chat ID en base: {request.user.telegram_chat_id}")
        print(f"   Telegram User ID en base: {request.user.telegram_user_id}")
        print(f"   Telegram Username en base: {request.user.telegram_username}")
        print(f"{'='*60}\n")
        
        # Vérifier si le chat_id existe
        if not request.user.telegram_chat_id:
            return Response({
                'error': 'Votre compte Telegram n\'est pas encore lié.',
                'message': 'Veuillez d\'abord lier votre compte Telegram en utilisant le bot @SmartNotifyBot',
                'steps': [
                    '1. Ouvrez Telegram et recherchez @SmartNotifyBot',
                    '2. Envoyez /start au bot',
                    '3. Envoyez /register pour lancer la liaison',
                    '4. Envoyez votre email SmartNotify: ' + request.user.email,
                    '5. Revenez ici pour activer les notifications'
                ],
                'telegram_chat_id': request.user.telegram_chat_id
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Générer le code OTP
        otp_code = ''.join(random.choices(string.digits, k=6))
        
        # Stocker dans la session
        session_key = f'otp_telegram_{request.user.id}'
        request.session[session_key] = {
            'code': otp_code,
            'created_at': timezone.now().isoformat(),
            'channel': 'telegram',
            'username': telegram_username
        }
        request.session.modified = True
        
        print(f"🔑 CODE OTP TELEGRAM GÉNÉRÉ: {otp_code}")
        print(f"📝 Clé session: {session_key}")
        
        try:
            from smartalerte_project.telegram_utils import send_telegram_to_user
            
            message = f"""🔐 *SmartNotify - Activation Telegram*

Bonjour {request.user.first_name or request.user.username},

Votre code de vérification pour activer les notifications Telegram est :

`{otp_code}`

⏱️ *Ce code est valable 5 minutes*

Pour activer vos notifications, entrez ce code dans l'application.

Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.

---
*SmartNotify* - Votre système de notification intelligent"""
            
            success = send_telegram_to_user(request.user, message)
            
            if success:
                print(f" OTP envoyé avec succès à {request.user.email}")
                return Response({
                    'message': 'Code OTP envoyé par Telegram',
                    'channel': 'telegram',
                    'status': 'success'
                }, status=status.HTTP_200_OK)
            else:
                print(f"❌ Échec envoi OTP à {request.user.email}")
                return Response({
                    'message': '⚠️ Impossible d\'envoyer le message Telegram. Vérifiez que vous avez bien lié votre compte avec le bot.',
                    'dev_code': otp_code,  # Pour développement uniquement
                    'status': 'error'
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            print(f"❌ Exception lors de l'envoi Telegram: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'message': '⚠️ Erreur technique lors de l\'envoi du message',
                'dev_code': otp_code,  # Pour développement uniquement
                'error': str(e),
                'status': 'error'
            }, status=status.HTTP_200_OK)


class VerifyOTPEmailView(APIView):
    """Vérifier le code OTP pour activer les notifications email"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        otp_code = request.data.get('otp_code')
        if not otp_code:
            return Response({'error': 'Code OTP requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        user_email = request.user.email
        session_key = f'otp_email_{user_email}'
        otp_data = request.session.get(session_key)
        
        if not otp_data:
            return Response({'error': 'Aucun code OTP en attente'}, status=status.HTTP_400_BAD_REQUEST)
        
        created_at = timezone.datetime.fromisoformat(otp_data['created_at'])
        if timezone.now() - created_at > timedelta(minutes=5):
            del request.session[session_key]
            return Response({'error': 'Code OTP expiré'}, status=status.HTTP_400_BAD_REQUEST)
        
        if otp_data['code'] != otp_code:
            return Response({'error': 'Code OTP invalide'}, status=status.HTTP_400_BAD_REQUEST)
        
        del request.session[session_key]
        
        prefs, _ = NotificationChannelPreference.objects.get_or_create(user=request.user)
        prefs.email_enabled = True
        prefs.save()
        
        return Response({'verified': True, 'message': 'Email activé avec succès'}, status=status.HTTP_200_OK)


class VerifyOTPTelegramView(APIView):
    """Vérifier le code OTP pour activer les notifications Telegram"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        otp_code = request.data.get('otp_code')
        if not otp_code:
            return Response({'error': 'Code OTP requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        session_key = f'otp_telegram_{request.user.id}'
        otp_data = request.session.get(session_key)
        
        if not otp_data:
            print(f"❌ Session non trouvée pour clé: {session_key}")
            print(f"   Clés disponibles: {list(request.session.keys())}")
            return Response({'error': 'Aucun code OTP en attente'}, status=status.HTTP_400_BAD_REQUEST)
        
        created_at = timezone.datetime.fromisoformat(otp_data['created_at'])
        if timezone.now() - created_at > timedelta(minutes=5):
            del request.session[session_key]
            return Response({'error': 'Code OTP expiré'}, status=status.HTTP_400_BAD_REQUEST)
        
        if otp_data['code'] != otp_code:
            return Response({'error': 'Code OTP invalide'}, status=status.HTTP_400_BAD_REQUEST)
        
        del request.session[session_key]
        
        prefs, _ = NotificationChannelPreference.objects.get_or_create(user=request.user)
        prefs.telegram_enabled = True
        prefs.save()
        
        return Response({'verified': True, 'message': 'Telegram activé avec succès'}, status=status.HTTP_200_OK)


class SendOTPLoginView(APIView):
    """Envoyer un code OTP lors du login pour vérification de sécurité"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        prefs, _ = NotificationChannelPreference.objects.get_or_create(user=user)
        
        otp_channel = None
        otp_destination = None
        
        if not prefs.email_enabled and prefs.telegram_enabled:
            otp_channel = 'telegram'
            otp_destination = user.telegram_username
            if not user.telegram_chat_id:
                return Response({
                    'error': 'Telegram non configuré. Activez d\'abord les notifications Telegram.'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        elif not prefs.telegram_enabled and prefs.email_enabled:
            otp_channel = 'email'
            otp_destination = user.email
            if not otp_destination:
                return Response({
                    'error': 'Email non configuré.'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        elif prefs.email_enabled and prefs.telegram_enabled:
            otp_channel = 'email'
            otp_destination = user.email
        
        else:
            return Response({
                'error': 'Au moins un canal de notification doit être activé (Email ou Telegram).'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        otp_code = ''.join(random.choices(string.digits, k=6))
        
        session_key = f'otp_login_{user.id}'
        request.session[session_key] = {
            'code': otp_code,
            'created_at': timezone.now().isoformat(),
            'channel': otp_channel,
            'destination': otp_destination
        }
        request.session.modified = True
        
        print(f"\n{'='*60}")
        print(f" OTP LOGIN - Utilisateur: {user.username}")
        print(f"   Canal: {otp_channel}")
        print(f"   Destination: {otp_destination}")
        print(f"   Code: {otp_code}")
        print(f"{'='*60}\n")
        
        try:
            if otp_channel == 'email':
                subject = 'Code de vérification - Connexion SmartNotify'
                message = f"""
Bonjour {user.first_name},

Votre code de vérification pour la connexion est : {otp_code}

Ce code est valable 5 minutes.

Cordialement,
L'équipe SmartNotify
"""
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[otp_destination],
                    fail_silently=False,
                )
            else:
                from smartalerte_project.telegram_utils import send_telegram_to_user
                message = f"""🔐 *SmartNotify - Vérification de Connexion*

Votre code de vérification pour la connexion est :

`{otp_code}`

⏱️ Ce code est valable 5 minutes.

Si vous n'êtes pas à l'origine de cette connexion, ignorez ce message."""
                send_telegram_to_user(user, message)
            
            return Response({
                'message': f'Code OTP envoyé par {otp_channel}',
                'channel': otp_channel,
                'destination': otp_destination
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Erreur envoi OTP login: {e}")
            return Response({
                'message': 'Erreur lors de l\'envoi du code OTP',
                'dev_code': otp_code
            }, status=status.HTTP_200_OK)


class VerifyOTPLoginView(APIView):
    """Vérifier le code OTP lors du login"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        otp_code = request.data.get('otp_code')
        if not otp_code:
            return Response({'error': 'Code OTP requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        session_key = f'otp_login_{request.user.id}'
        otp_data = request.session.get(session_key)
        
        if not otp_data:
            return Response({'error': 'Aucun code OTP en attente'}, status=status.HTTP_400_BAD_REQUEST)
        
        created_at = timezone.datetime.fromisoformat(otp_data['created_at'])
        if timezone.now() - created_at > timedelta(minutes=5):
            del request.session[session_key]
            return Response({'error': 'Code OTP expiré'}, status=status.HTTP_400_BAD_REQUEST)
        
        if otp_data['code'] != otp_code:
            return Response({'error': 'Code OTP invalide'}, status=status.HTTP_400_BAD_REQUEST)
        
        del request.session[session_key]
        
        request.session['login_verified'] = True
        request.session.modified = True
        
        return Response({
            'verified': True,
            'message': 'Connexion vérifiée avec succès'
        }, status=status.HTTP_200_OK)
