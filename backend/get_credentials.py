#!/usr/bin/env python
"""
Script pour générer les identifiants d'accès
Usage: python get_credentials.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smartalerte_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()
user = User.objects.get(username='admin')
token, created = Token.objects.get_or_create(user=user)

print('\n' + '='*70)
print('🔐 IDENTIFIANTS D\'ACCÈS - SmartAlerte')
print('='*70)

print('\n📧 EMAIL/IDENTIFIANT:')
print(f'   {user.email}')

print('\n👤 NOM D\'UTILISATEUR:')
print(f'   {user.username}')

print('\n🔑 MOT DE PASSE:')
print(f'   Admin@123456')

print('\n🎫 TOKEN API (pour tests):')
print(f'   {token.key}')

print('\n' + '='*70)
print(' ACCÈS ADMIN DJANGO')
print('='*70)
print(f'\nURL:       http://127.0.0.1:8000/admin/')
print(f'User:      {user.username}')
print(f'Password:  Admin@123456')

print('\n' + '='*70)
print(' ACCÈS API REST')
print('='*70)
print(f'\nAuthorization Header:')
print(f'   Authorization: Token {token.key}')

print(f'\nExemple curl:')
print(f'   curl -H "Authorization: Token {token.key}" \\')
print(f'        http://127.0.0.1:8000/api/stock/products/')

print('\n' + '='*70)
print('📚 ENDPOINTS DISPONIBLES')
print('='*70)

endpoints = [
    ('STOCK', [
        'GET /api/stock/warehouses/',
        'GET /api/stock/suppliers/',
        'GET /api/stock/categories/',
        'GET /api/stock/products/',
    ]),
    ('STOCK_MOVEMENTS', [
        'GET /api/stock_movements/entries/',
        'GET /api/stock_movements/exits/',
        'GET /api/stock_movements/movements/',
    ]),
    ('PRODUCTION', [
        'GET /api/production/raw-materials/',
        'GET /api/production/orders/',
        'GET /api/production/finished-products/',
        'GET /api/production/alerts/',
    ]),
]

for module, urls in endpoints:
    print(f'\n{module}:')
    for url in urls:
        print(f'   {url}')

print('\n' + '='*70 + '\n')
