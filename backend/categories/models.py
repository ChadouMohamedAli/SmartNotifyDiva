from django.db import models
from fournisseur.models import Supplier

class category(models.Model):
    MATERIAL_TYPE_PREMIERE = "matiere_premiere"
    MATERIAL_TYPE_CONSOMMABLE = "matiere_consommable"
    MATERIAL_TYPE_EMBALLAGE = "matiere_emballage"
    MATERIAL_TYPE_CHIMIQUE = "matiere_chimique"
    MATERIAL_TYPE_DANGEREUSE = "matiere_dangereuse"
    MATERIAL_TYPE_BUREAU = "fourniture_bureau"

    MATERIAL_TYPE_CHOICES = [
        (MATERIAL_TYPE_PREMIERE, "Matiere premiere"),
        (MATERIAL_TYPE_CONSOMMABLE, "Matiere consommable"),
        (MATERIAL_TYPE_EMBALLAGE, "Matiere emballage"),
        (MATERIAL_TYPE_CHIMIQUE, "Matiere chimique"),
        (MATERIAL_TYPE_DANGEREUSE, "Matiere dangereuse"),
        (MATERIAL_TYPE_BUREAU, "Fournitures bureau"),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    material_type = models.CharField(max_length=40, choices=MATERIAL_TYPE_CHOICES, default=MATERIAL_TYPE_PREMIERE)
    is_active = models.BooleanField(default=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='categories')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.name