#!/usr/bin/env python
"""
Script de debug pour tester les alertes de commande
"""
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smartalerte_project.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.contrib.auth import get_user_model
from alerts.models import Alert
from notifications.models import NotificationChannelPreference
from stock.models import Product
from orders.models import Order, OrderItem
from decimal import Decimal

User = get_user_model()

print("\n" + "="*80)
print("🔍 DEBUG: Vérification du système d'alertes pour les commandes")
print("="*80 + "\n")

# 1. Vérifier les utilisateurs
print("1️⃣  UTILISATEURS EN BASE")
print("-" * 40)
users = User.objects.all()
for user in users:
    prefs = NotificationChannelPreference.objects.filter(user=user).first()
    email_enabled = prefs.email_enabled if prefs else False
    print(f"  • {user.username} (email: {user.email}) - Email notifications: {email_enabled}")

if not users.exists():
    print("  ⚠️  AUCUN UTILISATEUR EN BASE!")

print()

# 2. Vérifier les alertes actives
print("2️⃣  ALERTES ACTIVES")
print("-" * 40)
alerts = Alert.objects.filter(module='stock', is_active=True)
for alert in alerts:
    channels = alert.notification_channels or []
    print(f"  • {alert.name}")
    print(f"    - Destinataire: {alert.user.username if alert.user else 'N/A'}")
    print(f"    - Canaux: {channels}")
    print(f"    - Type: {alert.condition_type}")
    if alert.product:
        print(f"    - Produit spécifique: {alert.product.name}")
    else:
        print(f"    - Produit: TOUS")
    print()

if not alerts.exists():
    print("  ⚠️  AUCUNE ALERTE STOCK ACTIVE!")

print()

# 3. Vérifier les produits
print("3️⃣  PRODUITS EN BASE")
print("-" * 40)
products = Product.objects.all()[:5]
for product in products:
    print(f"  • {product.name}: {product.quantity} unités (min: {product.min_quantity})")

print()

# 4. Test manuel: créer une commande test et vérifier l'alerte
print("4️⃣  TEST MANUEL: Création d'une commande test")
print("-" * 40)

# Récupérer un utilisateur (créer s'il n'existe pas)
admin_user = User.objects.filter(is_staff=True).first()
if not admin_user:
    admin_user = User.objects.first()

if not admin_user:
    print("  ❌ Aucun utilisateur disponible pour le test!")
else:
    # Récupérer un produit
    test_product = Product.objects.first()
    
    if not test_product:
        print("  ❌ Aucun produit disponible pour le test!")
    else:
        print(f"  📝 Création d'une commande de test...")
        print(f"    - Utilisateur: {admin_user.username}")
        print(f"    - Produit: {test_product.name}")
        print(f"    - Stock avant: {test_product.quantity}")
        
        # Créer une commande
        order = Order.objects.create(
            customer=admin_user,
            status='pending',
            total_amount=Decimal('100.00')
        )
        
        old_qty = test_product.quantity
        
        # Créer un article de commande (qui devrait déclencher le signal)
        try:
            order_item = OrderItem.objects.create(
                order=order,
                product=test_product,
                quantity=5,
                unit_price=Decimal('20.00')
            )
            
            # Rafraîchir le produit pour voir la quantité mise à jour
            test_product.refresh_from_db()
            
            print(f"    - Stock après: {test_product.quantity}")
            print(f"     OrderItem créé avec succès!")
            
            # Vérifier les notifications créées
            from notifications.models import Notification
            notifs = Notification.objects.filter(alert__isnull=False).order_by('-created_at')[:5]
            
            print(f"\n    📬 Notifications créées récemment:")
            for notif in notifs:
                print(f"      - {notif.title}: {notif.message[:50]}...")
                
        except Exception as e:
            print(f"    ❌ Erreur lors de la création: {e}")

print("\n" + "="*80)
print(" Diagnostic terminé")
print("="*80 + "\n")
