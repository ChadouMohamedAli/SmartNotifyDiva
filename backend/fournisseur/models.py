from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Supplier(models.Model):
    name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=120, blank=True)
    country = models.CharField(max_length=120, blank=True)
    
    # Informations générales (new)
    registre_commerce = models.CharField(max_length=100, blank=True)
    identifiant_fiscal = models.CharField(max_length=100, blank=True)
    FAMILLE_CHOICES = [
        ('matiere_premiere', 'Matière Première'),
        ('matiere_consommable', 'Matière Consommable'),
        ('matiere_emballage', 'Matière Emballage'),
        ('matiere_chimique', 'Matière Chimique'),
        ('matiere_dangereuse', 'Matière Dangereuse'),
        ('fourniture_bureau', 'Fournitures Bureau'),
    ]
    famille = models.CharField(max_length=50, choices=FAMILLE_CHOICES, blank=True)
    secteur = models.CharField(max_length=50, blank=True)
    anciennete = models.CharField(max_length=100, blank=True)
    
    # Offre commerciale (new)
    prix_unitaire = models.CharField(max_length=100, blank=True)
    conditions_paiement = models.CharField(max_length=100, blank=True)
    remise = models.DecimalField(max_digits=5, decimal_places=2, default=0, blank=True, null=True)
    zone_couverture = models.CharField(max_length=200, blank=True)
    minimum_commande = models.CharField(max_length=100, blank=True)
    delai_livraison = models.CharField(max_length=100, blank=True)
    certifications = models.TextField(blank=True)
    garantie_sav = models.CharField(max_length=200, blank=True)
    references_clients = models.TextField(blank=True)
    capacite_production = models.TextField(blank=True)
    
    # Existing commercial fields
    delivery_time = models.IntegerField(default=0)
    vat = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=100, blank=True)
    
    is_active = models.BooleanField(default=True)
    note_globale = models.PositiveSmallIntegerField(default=3, validators=[MinValueValidator(1), MaxValueValidator(5)])
    commentaires = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.name
