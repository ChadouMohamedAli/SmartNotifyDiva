"""
Management command to run the Telegram bot in long-polling mode.

Usage:
    python manage.py run_telegram_bot

The bot handles:
  - /start auth_CODE  →  confirms a pending Telegram login session
  - /start            →  welcome message
"""
import time
import logging
import requests
from django.core.management.base import BaseCommand
from django.conf import settings

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Run the Telegram bot in polling mode (for Telegram login + alerts)'

    def __init__(self):
        super().__init__()
        self.pending_registrations = {}

    def handle(self, *args, **options):
        token = getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
        if not token:
            self.stderr.write(self.style.ERROR(
                'TELEGRAM_BOT_TOKEN is not configured in settings / .env'
            ))
            return

        self.stdout.write(self.style.SUCCESS('Telegram bot started (long-polling mode)...'))
        offset = None

        while True:
            try:
                params = {'timeout': 30, 'allowed_updates': ['message']}
                if offset is not None:
                    params['offset'] = offset

                resp = requests.get(
                    f'https://api.telegram.org/bot{token}/getUpdates',
                    params=params,
                    timeout=35,
                )
                data = resp.json()

                if not data.get('ok'):
                    self.stderr.write(f'Telegram API error: {data}')
                    time.sleep(5)
                    continue

                for update in data.get('result', []):
                    offset = update['update_id'] + 1
                    self._process_update(update, token)

            except requests.RequestException as exc:
                self.stderr.write(f'Network error: {exc}')
                time.sleep(5)
            except KeyboardInterrupt:
                self.stdout.write('Bot stopped.')
                break
            except Exception as exc:
                self.stderr.write(f'Unexpected error: {exc}')
                time.sleep(5)

    # ------------------------------------------------------------------
    def _process_update(self, update, token):
        message = update.get('message', {})
        if not message:
            return

        text = message.get('text', '') or ''
        from_user = message.get('from', {})
        chat_id = (message.get('chat') or {}).get('id')

        if not chat_id:
            return

        if text.startswith('/start auth_'):
            code = text[len('/start auth_'):].strip()
            self._handle_auth(code, from_user, chat_id, token)
        elif text.strip() == '/register':
            self.pending_registrations[str(chat_id)] = True
            self._send_message(
                token, chat_id,
                "Envoyez maintenant l'adresse email de votre compte SmartNotify pour lier Telegram."
            )
        elif text.strip() in ('/start', '/aide', '/help'):
            self._send_message(
                token, chat_id,
                'Bonjour\u00a0! Je suis le bot SmartNotify.\n\n'
                'Pour vous connecter, cliquez sur \u00ab\u202fContinuer avec Telegram\u202f\u00bb '
                'sur la page de connexion et confirmez ici.\n\n'
                'Pour lier votre compte et recevoir les OTP Telegram, envoyez /register puis votre email SmartNotify.'
            )
        elif self.pending_registrations.get(str(chat_id)):
            self._handle_registration(text, from_user, chat_id, token)

    # ------------------------------------------------------------------
    def _handle_registration(self, text, from_user, chat_id, token):
        from accounts.models import CustomUser

        email = (text or '').strip().lower()
        if not email or '@' not in email:
            self._send_message(
                token, chat_id,
                "Adresse email invalide. Réessayez avec l'email utilisé dans SmartNotify."
            )
            return

        user = CustomUser.objects.filter(email__iexact=email).first()
        if not user:
            self._send_message(
                token, chat_id,
                "Aucun compte SmartNotify trouvé avec cet email."
            )
            return

        telegram_id = str(from_user.get('id') or chat_id).strip()
        telegram_username = (from_user.get('username') or '').strip().lower()

        user.telegram_chat_id = str(chat_id)
        user.telegram_user_id = telegram_id
        if telegram_username:
            user.telegram_username = telegram_username
        user.save(update_fields=['telegram_chat_id', 'telegram_user_id', 'telegram_username'])

        self.pending_registrations.pop(str(chat_id), None)

        self._send_message(
            token, chat_id,
            f" Compte lié avec succès à {email}. Vous pouvez revenir dans SmartNotify et activer Telegram."
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Telegram linked: user={email}, chat_id={chat_id}, telegram_user_id={telegram_id}"
            )
        )

    # ------------------------------------------------------------------
    def _handle_auth(self, code, from_user, chat_id, token):
        from accounts.models import TelegramAuthSession
        from django.utils import timezone
        from datetime import timedelta
        import random

        try:
            session = TelegramAuthSession.objects.get(code=code)
        except TelegramAuthSession.DoesNotExist:
            self._send_message(
                token, chat_id,
                '\u274c Code invalide ou expir\u00e9. Recommencez depuis la page de connexion.'
            )
            return

        if timezone.now() - session.created_at > timedelta(minutes=10):
            session.delete()
            self._send_message(
                token, chat_id,
                '\u274c Ce lien a expir\u00e9 (10\u00a0min). Recommencez depuis la page de connexion.'
            )
            return

        # Generate 6-digit OTP and save along with Telegram user data
        otp = str(random.randint(100000, 999999))
        session.otp = otp
        session.telegram_data = {
            'id': from_user.get('id'),
            'username': from_user.get('username', ''),
            'first_name': from_user.get('first_name', ''),
            'last_name': from_user.get('last_name', ''),
        }
        session.save(update_fields=['otp', 'telegram_data'])

        first_name = from_user.get('first_name') or 'utilisateur'
        self._send_message(
            token, chat_id,
            f'\U0001f510 Bonjour {first_name}\u00a0!\n\n'
            f'Votre code de v\u00e9rification\u00a0:\n\n'
            f'<b>{otp}</b>\n\n'
            'Entrez ce code sur la page de connexion.\n'
            '<i>Valable 10 minutes.</i>',
            parse_mode='HTML',
        )
        self.stdout.write(
            self.style.SUCCESS(f'OTP sent: session={code}, tg_id={from_user.get("id")}')
        )

    # ------------------------------------------------------------------
    def _send_message(self, token, chat_id, text, parse_mode=None):
        try:
            payload = {'chat_id': chat_id, 'text': text}
            if parse_mode:
                payload['parse_mode'] = parse_mode
            requests.post(
                f'https://api.telegram.org/bot{token}/sendMessage',
                json=payload,
                timeout=10,
            )
        except Exception as exc:
            logger.error('Failed to send Telegram message: %s', exc)
