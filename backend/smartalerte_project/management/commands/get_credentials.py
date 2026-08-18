"""
Management command pour afficher les credentials
Usage: python manage.py get_credentials
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()


class Command(BaseCommand):
    help = 'Affiche les identifiants de connexion'

    def handle(self, *args, **options):
        user = User.objects.get(username='admin')
        token, created = Token.objects.get_or_create(user=user)

        output = f"""
{'='*70}
🔐 IDENTIFIANTS D'ACCÈS - SmartNotify
{'='*70}

📧 EMAIL/IDENTIFIANT:
   {user.email}

👤 NOM D'UTILISATEUR:
   {user.username}

🔑 MOT DE PASSE:
   Admin@123456

🎫 TOKEN API (pour tests):
   {token.key}

{'='*70}
 ACCÈS ADMIN DJANGO
{'='*70}

URL:       http://127.0.0.1:8000/admin/
User:      {user.username}
Password:  Admin@123456

{'='*70}
 ACCÈS API REST
{'='*70}

Authorization Header:
   Authorization: Token {token.key}

Exemple curl:
   curl -H "Authorization: Token {token.key}" \\
        http://127.0.0.1:8000/api/stock/products/

{'='*70}
📚 ENDPOINTS DISPONIBLES
{'='*70}

STOCK:
   GET /api/stock/warehouses/
   GET /api/stock/suppliers/
   GET /api/stock/categories/
   GET /api/stock/products/

STOCK_MOVEMENTS:
   GET /api/stock_movements/entries/
   GET /api/stock_movements/exits/
   GET /api/stock_movements/movements/

PRODUCTION:
   GET /api/production/raw-materials/
   GET /api/production/orders/
   GET /api/production/finished-products/
   GET /api/production/alerts/

{'='*70}
"""
        self.stdout.write(output)
