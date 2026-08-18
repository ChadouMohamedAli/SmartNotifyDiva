#!/usr/bin/env python
"""
Test complet: Passer une commande -> Stock diminue -> Alerte se déclenche -> Email reçu
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smartalerte_project.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.contrib.auth import get_user_model
from alerts.models import Alert
from notifications.models import Notification, NotificationChannelPreference
from stock.models import Product
from orders.models import Order, OrderItem
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

print("\n" + "="*80)
print("🧪 TEST COMPLET: Commande → Stock ↓ → Alerte → Notification")
print("="*80 + "\n")

# 1. Vérifier l'alerte "repture"
print("1️⃣  VÉRIFICATION DE L'ALERTE 'REPTURE'")
print("-" * 80)

alert = Alert.objects.filter(name__icontains='repture').first()
if not alert:
    print("  ❌ Alerte 'repture' non trouvée!")
    sys.exit(1)

print(f"   Alerte trouvée: {alert.name}")
print(f"     - Destinataire: {alert.user.username}")
print(f"     - Produit: {alert.product.name if alert.product else 'TOUS'}")
print(f"     - Condition: {alert.condition_field} {alert.comparison_operator} {alert.compare_to}")
print(f"     - Canaux: {alert.notification_channels}")
print(f"     - Email destinataire: {alert.user.email}")

# Vérifier les prefs de notification
prefs = NotificationChannelPreference.objects.filter(user=alert.user).first()
if prefs:
    print(f"     - Notifications email activées: {prefs.email_enabled}")
else:
    print(f"     - ⚠️  Pas de prefs de notification trouvées")

print()

# 2. Préparer les données de test
print("2️⃣  PRÉPARATION DU TEST")
print("-" * 80)

# Utiliser le produit de l'alerte
product = alert.product
if not product:
    product = Product.objects.first()
    
if not product:
    print("  ❌ Aucun produit trouvé!")
    sys.exit(1)

print(f"  📦 Produit: {product.name}")
print(f"     - Stock actuel: {product.quantity}")
print(f"     - Stock minimum: {product.min_quantity}")
print(f"     - Seuil d'alerte: {alert.compare_to}")

# Obtenir un utilisateur test
customer = User.objects.filter(username='admin').first() or User.objects.first()
print(f"  👤 Client test: {customer.username}")

print()

# 3. Créer une commande et mesurer la réponse
print("3️⃣  CRÉATION DE LA COMMANDE")
print("-" * 80)

qty_before = product.quantity
quantity_to_order = 3

print(f"  📝 Commande:")
print(f"     - Client: {customer.username}")
print(f"     - Produit: {product.name} x{quantity_to_order}")
print(f"     - Stock avant: {qty_before}")

# Créer la commande
order = Order.objects.create(
    customer=customer,
    status='pending',
    total_amount=Decimal('100.00')
)

# Créer l'article (ce qui déclenche le signal)
order_item = OrderItem.objects.create(
    order=order,
    product=product,
    quantity=quantity_to_order,
    unit_price=Decimal('20.00')
)

# Rafraîchir le produit
product.refresh_from_db()
qty_after = product.quantity

print(f"     - Stock après: {qty_after}")
print(f"     - Différence: {qty_before - qty_after}")

print()

# 4. Vérifier les notifications générées
print("4️⃣  VÉRIFICATION DES NOTIFICATIONS")
print("-" * 80)

notifs = Notification.objects.filter(
    alert=alert
).order_by('-created_at')[:5]

if notifs.exists():
    print(f"   {notifs.count()} notification(s) créée(s):")
    for i, notif in enumerate(notifs, 1):
        print(f"\n     {i}. {notif.title}")
        print(f"        Type: {notif.notification_type}")
        print(f"        Canaux: {notif.channels}")
        print(f"        Message (premiers 80 chars): {notif.message[:80]}...")
        print(f"        Créée: {notif.created_at}")
else:
    print(f"  ❌ Aucune notification créée pour cette alerte!")

print()

# 5. Vérifier les emails en attente (depuis le log du serveur)
print("5️⃣  STATUT FINAL")
print("-" * 80)

if qty_after < float(alert.compare_to or alert.product.min_quantity):
    print(f"   CONDITION REMPLIE: {qty_after} < {alert.compare_to}")
    print(f"   Les notifications devraient être envoyées!")
    if notifs.exists() and 'email' in alert.notification_channels:
        print(f"   Email devrait être reçu par: {alert.user.email}")
else:
    print(f"  ⚠️  Condition NON remplie: {qty_after} >= {alert.compare_to}")

print("\n" + "="*80)
print(" Test terminé")
print("="*80 + "\n")
