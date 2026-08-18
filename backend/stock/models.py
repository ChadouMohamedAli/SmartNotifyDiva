from django.db import models
from django.contrib.auth import get_user_model
from categories.models import category as Category

User = get_user_model()


# ============ WAREHOUSE ============
class Warehouse(models.Model):
    """Modèle pour représenter un entrepôt"""
    name = models.CharField(max_length=200, verbose_name="Nom")
    code = models.CharField(max_length=50, unique=True, verbose_name="Code")
    address = models.TextField(blank=True, verbose_name="Adresse")
    city = models.CharField(max_length=100, blank=True, verbose_name="Ville")
    country = models.CharField(max_length=100, default="France", verbose_name="Pays")
    capacity = models.IntegerField(default=0, verbose_name="Capacité (m²)")
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_warehouses')
    phone = models.CharField(max_length=20, blank=True, verbose_name="Téléphone")
    email = models.EmailField(blank=True, verbose_name="Email")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Date de mise à jour")

    class Meta:
        verbose_name = "Entrepôt"
        verbose_name_plural = "Entrepôts"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.code})"


# ============ SUPPLIER ============
class Supplier(models.Model):
    """Fournisseur de produits"""
    name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=120, blank=True)
    country = models.CharField(max_length=120, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.name


# ============ PRODUCT ============
class Product(models.Model):
    STATUS_OPTIMAL = "optimal"
    STATUS_LOW = "low"
    STATUS_OUT_OF_STOCK = "out_of_stock"
    STATUS_RUPTURE = "rupture"

    STATUS_CHOICES = [
        (STATUS_OPTIMAL, "Optimal"),
        (STATUS_LOW, "Low"),
        (STATUS_OUT_OF_STOCK, "Out of stock"),
        (STATUS_RUPTURE, "Rupture"),
    ]

    MATERIAL_TYPE_PREMIERE = "matiere_premiere"
    MATERIAL_TYPE_CONSOMMABLE = "matiere_consommable"
    MATERIAL_TYPE_CHIMIQUE = "matiere_chimique"
    MATERIAL_TYPE_DANGEREUSE = "matiere_dangereuse"
    MATERIAL_TYPE_EMBALLAGE = "matiere_emballage"
    MATERIAL_TYPE_BUREAU = "fourniture_bureau"

    MATERIAL_TYPE_CHOICES = [
        (MATERIAL_TYPE_PREMIERE, "Matiere premiere"),
        (MATERIAL_TYPE_CONSOMMABLE, "Matiere consommable"),
        (MATERIAL_TYPE_CHIMIQUE, "Matiere chimique"),
        (MATERIAL_TYPE_DANGEREUSE, "Matiere dangereuse"),
        (MATERIAL_TYPE_EMBALLAGE, "Matiere emballage"),
        (MATERIAL_TYPE_BUREAU, "Fournitures bureau"),
    ]

    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    material_type = models.CharField(max_length=40, choices=MATERIAL_TYPE_CHOICES, default=MATERIAL_TYPE_PREMIERE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPTIMAL)
    quantity = models.IntegerField(default=0)
    min_quantity = models.IntegerField(default=0)
    max_quantity = models.IntegerField(default=0)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    last_restocked = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.name} ({self.sku})"
