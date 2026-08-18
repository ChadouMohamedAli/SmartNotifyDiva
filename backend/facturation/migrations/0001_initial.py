# Generated migration file for facturation app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('stock', '__first__'),
        ('fournisseur', '__first__'),
    ]

    operations = [
        migrations.CreateModel(
            name='Invoice',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('invoice_number', models.CharField(max_length=50, unique=True, verbose_name='Numéro de facture')),
                ('invoice_type', models.CharField(choices=[('sales', 'Vente'), ('purchase', 'Achat')], default='sales', max_length=20, verbose_name='Type')),
                ('customer_name', models.CharField(max_length=200, verbose_name='Nom du client')),
                ('customer_email', models.EmailField(blank=True, max_length=254, null=True, verbose_name='Email du client')),
                ('customer_phone', models.CharField(blank=True, max_length=20, null=True, verbose_name='Téléphone du client')),
                ('customer_address', models.TextField(blank=True, null=True, verbose_name='Adresse du client')),
                ('invoice_date', models.DateField(verbose_name='Date de facturation')),
                ('due_date', models.DateField(verbose_name="Date d'échéance")),
                ('subtotal', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='Sous-total')),
                ('tax_rate', models.DecimalField(decimal_places=2, default=0, max_digits=5, verbose_name='Taux de TVA (%)')),
                ('tax_amount', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='Montant TVA')),
                ('discount', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='Remise')),
                ('total_amount', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='Montant total')),
                ('amount_paid', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='Montant payé')),
                ('status', models.CharField(choices=[('draft', 'Brouillon'), ('sent', 'Envoyée'), ('paid', 'Payée'), ('overdue', 'En retard'), ('cancelled', 'Annulée')], default='draft', max_length=20, verbose_name='Statut')),
                ('notes', models.TextField(blank=True, null=True, verbose_name='Notes')),
                ('terms', models.TextField(blank=True, null=True, verbose_name='Conditions')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Créé le')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Modifié le')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='invoices_created', to=settings.AUTH_USER_MODEL, verbose_name='Créé par')),
                ('supplier', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='invoices', to='fournisseur.supplier', verbose_name='Fournisseur')),
            ],
            options={
                'verbose_name': 'Facture',
                'verbose_name_plural': 'Factures',
                'ordering': ['-invoice_date', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('payment_date', models.DateField(verbose_name='Date de paiement')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Montant')),
                ('payment_method', models.CharField(choices=[('cash', 'Espèces'), ('check', 'Chèque'), ('bank_transfer', 'Virement bancaire'), ('credit_card', 'Carte de crédit'), ('other', 'Autre')], max_length=20, verbose_name='Méthode de paiement')),
                ('reference', models.CharField(blank=True, max_length=100, null=True, verbose_name='Référence')),
                ('notes', models.TextField(blank=True, null=True, verbose_name='Notes')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Créé le')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL, verbose_name='Créé par')),
                ('invoice', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to='facturation.invoice', verbose_name='Facture')),
            ],
            options={
                'verbose_name': 'Paiement',
                'verbose_name_plural': 'Paiements',
                'ordering': ['-payment_date'],
            },
        ),
        migrations.CreateModel(
            name='InvoiceItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('description', models.CharField(max_length=255, verbose_name='Description')),
                ('quantity', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Quantité')),
                ('unit_price', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Prix unitaire')),
                ('total_price', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Prix total')),
                ('invoice', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='facturation.invoice', verbose_name='Facture')),
                ('product', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='stock.product', verbose_name='Produit')),
            ],
            options={
                'verbose_name': 'Article de facture',
                'verbose_name_plural': 'Articles de facture',
            },
        ),
    ]
