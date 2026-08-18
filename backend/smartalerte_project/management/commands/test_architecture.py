"""
Management command pour tester la nouvelle architecture
Usage: python manage.py test_architecture
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from stock.models import Product, Supplier, Category, Warehouse
from stock_movements.models import StockEntry, StockExit, StockMovement
from production.models import ProductionOrder, RawMaterial, FinishedProduct
from rest_framework.authtoken.models import Token


class Command(BaseCommand):
    help = '🧪 Teste la nouvelle architecture SmartAlerte'

    def handle(self, *args, **options):
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("🧪 TEST ARCHITECTURE - SmartAlerte"))
        self.stdout.write("="*60)

        # ============ 1. VÉRIFIER LES MODÈLES ============
        self.stdout.write("\n📦 1. VÉRIFIER LES MODÈLES")
        self.stdout.write("-" * 60)

        models = [
            ("Warehouses", Warehouse),
            ("Suppliers", Supplier),
            ("Categories", Category),
            ("Products", Product),
            ("Stock Entries", StockEntry),
            ("Stock Exits", StockExit),
            ("Stock Movements", StockMovement),
            ("Raw Materials", RawMaterial),
            ("Production Orders", ProductionOrder),
            ("Finished Products", FinishedProduct),
        ]

        for name, model in models:
            count = model.objects.count()
            self.stdout.write(f" {name}: {count} records")

        # ============ 2. CRÉER DES DONNÉES DE TEST ============
        self.stdout.write("\n🔨 2. CRÉER DES DONNÉES DE TEST")
        self.stdout.write("-" * 60)

        # Utilisateur
        user, _ = User.objects.get_or_create(
            username='test_user',
            defaults={'first_name': 'Test', 'last_name': 'User', 'email': 'test@test.com'}
        )
        self.stdout.write(f" Utilisateur: {user.get_full_name()}")

        # Entrepôt
        warehouse, _ = Warehouse.objects.get_or_create(
            code='WH001',
            defaults={
                'name': 'Entrepôt Principal',
                'city': 'Paris',
                'country': 'France',
                'capacity': 5000,
                'manager': user
            }
        )
        self.stdout.write(f" Entrepôt: {warehouse.name}")

        # Fournisseur
        supplier, _ = Supplier.objects.get_or_create(
            name='Fournisseur Test',
            defaults={
                'contact_name': 'Jean Dupont',
                'email': 'contact@fournisseur.com',
                'phone': '+33123456789',
                'city': 'Lyon'
            }
        )
        self.stdout.write(f" Fournisseur: {supplier.name}")

        # Catégorie
        category, _ = Category.objects.get_or_create(
            name='Électronique',
            defaults={'description': 'Produits électroniques', 'supplier': supplier}
        )
        self.stdout.write(f" Catégorie: {category.name}")

        # Produit
        product, _ = Product.objects.get_or_create(
            sku='PROD001',
            defaults={
                'name': 'Laptop Test',
                'category': category,
                'supplier': supplier,
                'warehouse': warehouse,
                'quantity': 50,
                'min_quantity': 10,
                'max_quantity': 200,
                'price': 1299.99
            }
        )
        self.stdout.write(f" Produit: {product.name} (SKU: {product.sku})")

        # Entrée de stock
        entry, _ = StockEntry.objects.get_or_create(
            reference='ENT001',
            defaults={
                'product': product,
                'quantity': 50,
                'supplier': supplier,
                'warehouse': warehouse,
                'reason': 'purchase',
                'receipt_type': 'supplier_receipt',
                'received_by': user
            }
        )
        self.stdout.write(f" Entrée de stock: {entry.reference}")

        # Sortie de stock
        exit_rec, _ = StockExit.objects.get_or_create(
            reference='EXIT001',
            defaults={
                'product': product,
                'quantity': 5,
                'warehouse': warehouse,
                'reason': 'sale',
                'exit_type': 'delivery_note',
                'prepared_by': user
            }
        )
        self.stdout.write(f" Sortie de stock: {exit_rec.reference}")

        # Matière première
        raw_material, _ = RawMaterial.objects.get_or_create(
            name='Plastique ABS',
            defaults={'unit': 'kg', 'available_stock': 100, 'reorder_level': 20}
        )
        self.stdout.write(f" Matière première: {raw_material.name}")

        # Ordre de production
        order, _ = ProductionOrder.objects.get_or_create(
            code='PO-20260308-001',
            defaults={
                'product': product,
                'planned_quantity': 20,
                'produced_quantity': 0,
                'status': 'in_progress',
                'start_date': '2026-03-08',
                'due_date': '2026-03-15',
                'created_by': user
            }
        )
        self.stdout.write(f" Ordre production: {order.code}")

        # Produit fini
        finished, _ = FinishedProduct.objects.get_or_create(
            batch_number='BATCH001',
            defaults={
                'product': product,
                'production_order': order,
                'quantity_produced': 20,
                'quantity_available': 20,
                'status': 'in_stock',
                'quality_check_passed': True,
                'quality_notes': 'Contrôle réussi'
            }
        )
        self.stdout.write(f" Produit fini: {finished.batch_number}")

        # ============ 3. SUMMARY ============
        self.stdout.write("\n📊 3. RÉSUMÉ DES DONNÉES")
        self.stdout.write("-" * 60)
        for name, model in models:
            count = model.objects.count()
            self.stdout.write(f"   {name}: {count} records")

        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS(" TEST RÉUSSI!"))
        self.stdout.write("="*60)
        self.stdout.write("\n💡 PROCHAINES ÉTAPES:")
        self.stdout.write("   1. Démarrer le serveur: python manage.py runserver")
        self.stdout.write("   2. Aller à: http://127.0.0.1:8000/admin/")
        self.stdout.write("   3. Tester les endpoints API avec Postman ou curl")
        self.stdout.write("="*60 + "\n")
