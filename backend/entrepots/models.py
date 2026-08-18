from django.db import models


class Entrepot(models.Model):
    """Modèle pour représenter un entrepôt"""
    name = models.CharField(max_length=200, verbose_name="Nom")
    code = models.CharField(max_length=50, unique=True, verbose_name="Code")
    address = models.TextField(blank=True, verbose_name="Adresse")
    city = models.CharField(max_length=100, blank=True, verbose_name="Ville")
    country = models.CharField(max_length=100, default="France", verbose_name="Pays")
    capacity = models.IntegerField(default=0, verbose_name="Capacité (m²)")
    manager_name = models.CharField(max_length=200, blank=True, verbose_name="Responsable")
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
