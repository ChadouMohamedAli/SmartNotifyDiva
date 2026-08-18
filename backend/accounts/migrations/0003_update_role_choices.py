# Generated migration to update role choices

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_add_role'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='role',
            field=models.CharField(
                choices=[
                    ('responsable_stock', 'Responsable Stock'),
                    ('commercial', 'Commercial'),
                    ('achats', 'Achats'),
                    ('employe', 'Employé'),
                    ('client', 'Client'),
                    ('fournisseur', 'Fournisseur'),
                ], 
                default='employe',
                max_length=20,
                verbose_name='role'
            ),
        ),
    ]
