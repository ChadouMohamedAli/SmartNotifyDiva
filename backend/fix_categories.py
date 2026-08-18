import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smartalerte_project.settings')
django.setup()

from categories.models import category as Category
from stock.models import Product

def fix_data():
    # 1. Update Category objects based on their name
    mapping = {
        "Matière première": Category.MATERIAL_TYPE_PREMIERE,
        "Matiere premiere": Category.MATERIAL_TYPE_PREMIERE,
        "Matière consommable": Category.MATERIAL_TYPE_CONSOMMABLE,
        "Matiere consommable": Category.MATERIAL_TYPE_CONSOMMABLE,
        "Matière emballage": Category.MATERIAL_TYPE_EMBALLAGE,
        "Matiere emballage": Category.MATERIAL_TYPE_EMBALLAGE,
        "Matière chimique": Category.MATERIAL_TYPE_CHIMIQUE,
        "Matiere chimique": Category.MATERIAL_TYPE_CHIMIQUE,
        "Matière dangereuse": Category.MATERIAL_TYPE_DANGEREUSE,
        "Matiere dangereuse": Category.MATERIAL_TYPE_DANGEREUSE,
        "Fournitures bureau": Category.MATERIAL_TYPE_BUREAU,
    }

    print("Updating Categories...")
    for cat in Category.objects.all():
        old_type = cat.material_type
        if cat.name in mapping:
            cat.material_type = mapping[cat.name]
            cat.save()
            print(f"Updated Category '{cat.name}': {old_type} -> {cat.material_type}")
        else:
            # Fallback for names that might be slightly different
            for name_key, m_type in mapping.items():
                if name_key.lower() in cat.name.lower():
                    cat.material_type = m_type
                    cat.save()
                    print(f"Matched Category '{cat.name}' to '{m_type}' based on substring")
                    break

    # 2. Update Product objects: set category based on material_type
    print("\nUpdating Products...")
    products = Product.objects.all()
    count = 0
    for prod in products:
        # Find a category that matches the product's material_type
        matched_cat = Category.objects.filter(material_type=prod.material_type).first()
        if matched_cat:
            prod.category = matched_cat
            prod.save()
            count += 1
            print(f"Updated Product '{prod.name}': material_type={prod.material_type} -> category='{matched_cat.name}'")
        else:
            print(f"Could not find category for Product '{prod.name}' with material_type='{prod.material_type}'")
    
    print(f"\nDone! Updated {count} products.")

if __name__ == "__main__":
    fix_data()
