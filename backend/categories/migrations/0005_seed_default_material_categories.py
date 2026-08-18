from django.db import migrations


def seed_default_material_categories(apps, schema_editor):
    Category = apps.get_model("categories", "category")

    defaults = [
        ("matiere_premiere", "Matiere premiere", "Categorie par defaut pour les matieres premieres."),
        ("matiere_consommable", "Matiere consommable", "Categorie par defaut pour les matieres consommables."),
        ("matiere_emballage", "Matiere emballage", "Categorie par defaut pour les matieres d'emballage."),
        ("matiere_chimique", "Matiere chimique", "Categorie par defaut pour les matieres chimiques."),
        ("matiere_dangereuse", "Matiere dangereuse", "Categorie par defaut pour les matieres dangereuses."),
        ("fourniture_bureau", "Fournitures bureau", "Categorie par defaut pour les fournitures de bureau."),
    ]

    for material_type, name, description in defaults:
        exists = Category.objects.filter(material_type=material_type).exists()
        if not exists:
            Category.objects.create(
                name=name,
                description=description,
                material_type=material_type,
                is_active=True,
            )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("categories", "0004_category_material_type"),
    ]

    operations = [
        migrations.RunPython(seed_default_material_categories, noop_reverse),
    ]
