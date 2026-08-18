from django.db import models
from django.contrib.auth import get_user_model
from stock.models import Product

User = get_user_model()


class Order(models.Model):
    """Modèle pour les commandes de produits"""
    
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('confirmed', 'Confirmée'),
        ('preparing', 'En préparation'),
        ('shipped', 'Expédiée'),
        ('delivered', 'Livrée'),
        ('returned', 'Retournée'),
        ('cancelled', 'Annulée'),
    ]
    
    # Informations client
    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='orders',
        help_text="Utilisateur qui a passé la commande"
    )
    
    # Statut commande
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Statut de la commande"
    )
    
    # Détails financiers
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Montant total de la commande"
    )
    
    # Détails de livraison
    shipping_address = models.TextField(
        blank=True,
        help_text="Adresse de livraison"
    )
    
    shipping_method = models.CharField(
        max_length=100,
        blank=True,
        help_text="Méthode de livraison (Standard, Express, etc.)"
    )
    
    # Notes
    notes = models.TextField(
        blank=True,
        help_text="Notes supplémentaires"
    )
    
    # Traçabilité
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date de confirmation"
    )
    shipped_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date d'expédition"
    )
    delivered_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date de livraison"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Commande"
        verbose_name_plural = "Commandes"
    
    def __str__(self):
        return f"Commande #{self.id} - {self.customer.username} ({self.get_status_display()})"
    
    def calculate_total(self):
        """Calcule le montant total de la commande"""
        return sum(
            item.quantity * item.unit_price
            for item in self.items.all()
        )
    
    def update_total(self):
        """Met à jour le montant total"""
        self.total_amount = self.calculate_total()
        self.save(update_fields=['total_amount'])


class OrderItem(models.Model):
    """Modèle pour les articles d'une commande"""
    
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        help_text="Commande"
    )
    
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='order_items',
        help_text="Produit commandé"
    )
    
    quantity = models.PositiveIntegerField(
        default=1,
        help_text="Quantité commandée"
    )
    
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Prix unitaire au moment de la commande"
    )
    
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Sous-total (quantité × prix)"
    )
    
    notes = models.TextField(
        blank=True,
        help_text="Notes sur cet article"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = "Élément de commande"
        verbose_name_plural = "Éléments de commande"
    
    def __str__(self):
        return f"{self.product.name} x{self.quantity} (Commande #{self.order.id})"
    
    def save(self, *args, **kwargs):
        """Met à jour le sous-total avant de sauvegarder"""
        self.subtotal = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        # Mettre à jour le total de la commande
        self.order.update_total()
