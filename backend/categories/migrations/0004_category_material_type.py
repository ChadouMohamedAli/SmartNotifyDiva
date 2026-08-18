from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('categories', '0003_category_supplier'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='material_type',
            field=models.CharField(
                choices=[
                    ('matiere_premiere', 'Matiere premiere'),
                    ('matiere_consommable', 'Matiere consommable'),
                    ('matiere_emballage', 'Matiere emballage'),
                    ('matiere_chimique', 'Matiere chimique'),
                    ('matiere_dangereuse', 'Matiere dangereuse'),
                    ('fourniture_bureau', 'Fournitures bureau'),
                ],
                default='matiere_premiere',
                max_length=40,
            ),
        ),
    ]
