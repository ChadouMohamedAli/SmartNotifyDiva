from django.db import models
from django.conf import settings
from fournisseur.models import Supplier
from stock.models import Product

class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvée'),
        ('rejected', 'Rejetée'),
        ('sent', 'Envoyée'),
        ('delivered', 'Livrée'),
        ('cancelled', 'Annulée'),
    ]

    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchase_orders')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    order_date = models.DateTimeField(auto_now_add=True)
    expected_delivery_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)  # Accepte jusqu'à 999,999,999,999.99

    def __str__(self):
        return f"Commande #{self.id} - {self.supplier.name}"

class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)  # Accepte jusqu'à 999,999,999,999.99

    def __str__(self):
        return f"{self.quantity} x {self.product.name} @ {self.unit_price}"
