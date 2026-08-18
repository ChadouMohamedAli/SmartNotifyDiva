import requests
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

def send_telegram_to_user(user, message):
    """Send a Telegram message to a user using their chat_id"""
    try:
        # Vérifier si l'utilisateur a un chat_id
        if not user.telegram_chat_id:
            print(f"⚠️ User {user.email} has no telegram_chat_id")
            return False
        
        # Récupérer le token du bot depuis les settings
        bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
        if not bot_token:
            print("⚠️ TELEGRAM_BOT_TOKEN not configured in settings")
            return False
        
        # Construire l'URL de l'API Telegram
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        
        # Préparer le payload
        payload = {
            'chat_id': user.telegram_chat_id,
            'text': message,
        }
        
        # Envoyer la requête
        response = requests.post(url, json=payload, timeout=10)
        
        # Vérifier la réponse
        if response.status_code == 200:
            result = response.json()
            if result.get('ok'):
                print(f" Telegram message sent successfully to {user.email} (chat_id: {user.telegram_chat_id})")
                return True
            else:
                print(f"❌ Telegram API error: {result}")
                return False
        else:
            print(f"❌ Telegram HTTP error: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"❌ Timeout sending Telegram message to {user.email}")
        return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection error sending Telegram message to {user.email}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error sending Telegram message: {e}")
        return False

def test_telegram_connection():
    """Test function to verify Telegram bot connection"""
    bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
    if not bot_token:
        return False, "TELEGRAM_BOT_TOKEN not configured"
    
    try:
        url = f"https://api.telegram.org/bot{bot_token}/getMe"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('ok'):
                bot_info = result.get('result', {})
                return True, f"Bot connected: @{bot_info.get('username')}"
            else:
                return False, f"API error: {result}"
        else:
            return False, f"HTTP error: {response.status_code}"
            
    except Exception as e:
        return False, f"Connection error: {e}"
