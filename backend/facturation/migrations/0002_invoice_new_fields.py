from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('categories', '0001_initial'),
        ('facturation', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='invoice',
            name='category',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='invoices', to='categories.category', verbose_name='Catégorie'),
        ),
        migrations.AddField(
            model_name='invoice',
            name='currency',
            field=models.CharField(default='EUR', max_length=10, verbose_name='Devise'),
        ),
        migrations.AddField(
            model_name='invoice',
            name='purchase_order_number',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='Numéro commande achat'),
        ),
        migrations.AddField(
            model_name='invoice',
            name='supplier_departure_date',
            field=models.DateField(blank=True, null=True, verbose_name='Départ fournisseur'),
        ),
        migrations.AddField(
            model_name='invoice',
            name='updated_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='invoices_updated', to=settings.AUTH_USER_MODEL, verbose_name='Modifié par'),
        ),
    ]
