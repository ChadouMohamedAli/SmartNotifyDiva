from django.db import models
from django.contrib.auth import get_user_model
from stock.models import Product, Warehouse, Supplier

User = get_user_model()


# ============ STOCK ENTRY ============
class StockEntry(models.Model):
    """Modèle pour les entrées de stock"""
    
    REASON_CHOICES = [
        ('purchase', 'Achat fournisseur'),
        ('return', 'Retour client'),
        ('adjustment', 'Ajustement'),
        ('other', 'Autre'),
    ]
    
    RECEIPT_TYPE_CHOICES = [
        ('supplier_receipt', 'Réception fournisseur'),
        ('entry_note', 'Bon d\'entrée'),
    ]
    
    # Identifiant
    reference = models.CharField(max_length=100, unique=True, help_text="Numéro de bon d'entrée")
    receipt_type = models.CharField(max_length=20, choices=RECEIPT_TYPE_CHOICES, default='entry_note')
    
    # Produit et quantité
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_entries')
    quantity = models.PositiveIntegerField()
    
    # Contexte de l'entrée
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_entries')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_entries')
    reason = models.CharField(max_length=20, choices=REASON_CHOICES, default='purchase')
    
    # Responsabilité
    received_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_entries_received')
    
    # Détails
    notes = models.TextField(blank=True)
    entry_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-entry_date']
        verbose_name = "Entrée de stock"
        verbose_name_plural = "Entrées de stock"

    def __str__(self):
        return f"Entrée {self.reference} - {self.product.name} ({self.quantity})"
    
    def save(self, *args, **kwargs):
        """Met à jour la quantité du produit lors d'une entrée"""
        is_new = self.pk is None
        old_quantity = 0
        
        if not is_new:
            try:
                old_entry = StockEntry.objects.get(pk=self.pk)
                old_quantity = old_entry.quantity
            except StockEntry.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
        
        # Mettre à jour le produit
        product = self.product
        if is_new:
            product.quantity += self.quantity
        else:
            product.quantity = product.quantity - old_quantity + self.quantity
        
        self._update_product_status(product)
        product.save()
    
    def delete(self, *args, **kwargs):
        """Retire la quantité du produit lors de la suppression d'une entrée"""
        product = self.product
        product.quantity -= self.quantity
        self._update_product_status(product)
        product.save()
        super().delete(*args, **kwargs)
    
    def _update_product_status(self, product):
        """Met à jour le statut du produit selon la quantité"""
        if product.quantity <= 0:
            product.status = 'out_of_stock'
            product.quantity = 0
        elif product.quantity <= product.min_quantity:
            product.status = 'low'
        else:
            product.status = 'optimal'


# ============ STOCK EXIT ============
class StockExit(models.Model):
    """Modèle pour les sorties de stock"""
    
    REASON_CHOICES = [
        ('sale', 'Vente'),
        ('production', 'Production'),
        ('loss', 'Perte'),
        ('damage', 'Dommage'),
        ('adjustment', 'Ajustement'),
        ('transfer', 'Transfert'),
        ('other', 'Autre'),
    ]
    
    EXIT_TYPE_CHOICES = [
        ('delivery_note', 'Bon de sortie'),
        ('customer_delivery', 'Livraison client'),
    ]
    
    # Identifiant
    reference = models.CharField(max_length=100, unique=True, help_text="Numéro de bon de sortie")
    exit_type = models.CharField(max_length=20, choices=EXIT_TYPE_CHOICES, default='delivery_note')
    
    # Produit et quantité
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_exits')
    quantity = models.PositiveIntegerField()
    
    # Contexte de la sortie
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_exits')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_exits')
    reason = models.CharField(max_length=20, choices=REASON_CHOICES, default='sale')
    
    # Responsabilité
    prepared_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_exits_prepared')
    
    # Détails
    notes = models.TextField(blank=True)
    exit_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-exit_date']
        verbose_name = "Sortie de stock"
        verbose_name_plural = "Sorties de stock"

    def __str__(self):
        return f"Sortie {self.reference} - {self.product.name} ({self.quantity})"
    
    def save(self, *args, **kwargs):
        """Met à jour la quantité du produit lors d'une sortie"""
        is_new = self.pk is None
        old_quantity = 0
        
        if not is_new:
            try:
                old_exit = StockExit.objects.get(pk=self.pk)
                old_quantity = old_exit.quantity
            except StockExit.DoesNotExist:
                pass
        
        # Vérifier le stock suffisant pour une nouvelle sortie
        if is_new and self.quantity > self.product.quantity:
            raise ValueError(
                f"Stock insuffisant pour {self.product.name}. "
                f"Disponible: {self.product.quantity}, Demandé: {self.quantity}"
            )
        
        super().save(*args, **kwargs)
        
        # Mettre à jour le produit
        product = self.product
        if is_new:
            product.quantity -= self.quantity
        else:
            product.quantity = product.quantity + old_quantity - self.quantity
        
        self._update_product_status(product)
        product.save()
    
    def delete(self, *args, **kwargs):
        """Rétablit la quantité du produit lors de la suppression d'une sortie"""
        product = self.product
        product.quantity += self.quantity
        self._update_product_status(product)
        product.save()
        super().delete(*args, **kwargs)
    
    def _update_product_status(self, product):
        """Met à jour le statut du produit selon la quantité"""
        if product.quantity <= 0:
            product.status = 'out_of_stock'
            product.quantity = 0
        elif product.quantity <= product.min_quantity:
            product.status = 'low'
        else:
            product.status = 'optimal'


# ============ STOCK MOVEMENT (Legacy/general tracking) ============
class StockMovement(models.Model):
    """Modèle générale pour tracker tous les mouvements de stock"""
    
    MOVEMENT_TYPE_CHOICES = [
        ('entry', 'Entrée'),
        ('exit', 'Sortie'),
        ('transfer', 'Transfert'),
    ]
    
    # Champs principaux
    movement_type = models.CharField(
        max_length=10,
        choices=MOVEMENT_TYPE_CHOICES,
        help_text="Type de mouvement: Entrée, Sortie ou Transfert"
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    quantity = models.PositiveIntegerField()
    
    # Entrepôts
    warehouse_from = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True, blank=True, related_name='outgoing_movements')
    warehouse_to = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True, blank=True, related_name='incoming_movements')
    
    # Responsabilité
    responsible = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_movements')
    
    # Détails
    recipient_name = models.CharField(max_length=200, blank=True)
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_quantity = 0
        old_type = None

        if not is_new:
            try:
                old_movement = StockMovement.objects.get(pk=self.pk)
                old_quantity = old_movement.quantity
                old_type = old_movement.movement_type
            except StockMovement.DoesNotExist:
                pass

        super().save(*args, **kwargs)

        product = self.product
        
        # Annuler l'ancien mouvement si modification
        if not is_new and old_type:
            if old_type == 'entry':
                product.quantity -= old_quantity
            elif old_type == 'exit':
                product.quantity += old_quantity

        # Appliquer le nouveau mouvement
        if self.movement_type == 'entry':
            product.quantity += self.quantity
        elif self.movement_type == 'exit':
            product.quantity -= self.quantity
        
        # update status based on quantity
        if product.quantity <= 0:
            product.status = 'out_of_stock'
            product.quantity = 0
        elif product.quantity <= product.min_quantity:
            product.status = 'low'
        else:
            product.status = 'optimal'
            
        product.save()

    def delete(self, *args, **kwargs):
        product = self.product
        if self.movement_type == 'entry':
            product.quantity -= self.quantity
        elif self.movement_type == 'exit':
            product.quantity += self.quantity
            
        # update status based on quantity
        if product.quantity <= 0:
            product.status = 'out_of_stock'
            product.quantity = 0
        elif product.quantity <= product.min_quantity:
            product.status = 'low'
        else:
            product.status = 'optimal'
            
        product.save()
        super().delete(*args, **kwargs)