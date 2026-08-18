# Generated migration for adding supplier field to category

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('categories', '0002_category_is_active'),
        ('fournisseur', '0001_initial'),  # Dépendance sur le modèle Supplier
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='supplier',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='categories', to='fournisseur.supplier'),
        ),
    ]
