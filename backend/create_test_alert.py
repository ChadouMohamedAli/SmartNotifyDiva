#!/usr/bin/env python
"""
Créer une alerte correctement configurée pour tester
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smartalerte_project.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.contrib.auth import get_user_model
from alerts.models import Alert
from stock.models import Product
from notifications.models import NotificationChannelPreference
import json

User = get_user_model()

print("\n" + "="*80)
print("🔧 CRÉATION D'UNE ALERTE DE TEST CORRECTEMENT CONFIGURÉE")
print("="*80 + "\n")

# 1. Créer/récupérer l'utilisateur pour l'alerte
user = User.objects.filter(username='responsable_appro').first()
if not user:
    user = User.objects.filter(is_superuser=True).first()

print(f"1️⃣  Utilisateur destinataire: {user.username} ({user.email})")

# Vérifier les prefs
prefs, _ = NotificationChannelPreference.objects.get_or_create(user=user)
print(f"    Email notifications: {prefs.email_enabled}")

# 2. Choisir un produit
product = Product.objects.filter(name__icontains='dal').first() or Product.objects.first()
print(f"\n2️⃣  Produit: {product.name} (stock: {product.quantity}, min: {product.min_quantity})")

# 3. Créer ou mettre à jour l'alerte
alert_name = "TEST - Alerte Stock < 10"
alert, created = Alert.objects.update_or_create(
    name=alert_name,
    defaults={
        'module': 'stock',
        'user': user,
        'product': product,
        'is_active': True,
        'condition_type': 'threshold',
        'condition_field': 'quantity',  #  Le champ à vérifier
        'comparison_operator': 'less_than',  #  Opérateur
        'compare_to': 'min_quantity',  #  Compare à min_quantity
        'threshold_value': None,
        'notification_channels': ['email', 'inapp'],  #  Canaux actifs
        'severity': 'high',
        'schedule': 'immediate',
    }
)

print(f"\n3️⃣  Alerte créée/mise à jour:")
print(f"    Nom: {alert.name}")
print(f"    Produit: {alert.product.name if alert.product else 'TOUS'}")
print(f"    Condition: {alert.condition_field} {alert.comparison_operator} {alert.compare_to}")
print(f"    Canaux: {alert.notification_channels}")
print(f"    Destinataire: {alert.user.username}")
print(f"    Email: {alert.user.email}")
print(f"    Active: {alert.is_active}")

print(f"\n Alerte prête au test!")
print(f"   Passe une commande du produit '{product.name}'")
print(f"   Stock deviendra < {product.min_quantity}")
print(f"   Tu recevras une notification sur {alert.user.email}")

print("\n" + "="*80 + "\n")
