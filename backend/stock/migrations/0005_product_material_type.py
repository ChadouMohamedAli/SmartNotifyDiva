from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stock', '0004_alter_product_category_delete_category'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='material_type',
            field=models.CharField(
                choices=[
                    ('matiere_premiere', 'Matiere premiere'),
                    ('matiere_consommable', 'Matiere consommable'),
                    ('matiere_chimique', 'Matiere chimique'),
                    ('matiere_dangereuse', 'Matiere dangereuse'),
                    ('matiere_emballage', 'Matiere emballage'),
                    ('fourniture_bureau', 'Fournitures bureau'),
                ],
                default='matiere_premiere',
                max_length=40,
            ),
        ),
    ]
