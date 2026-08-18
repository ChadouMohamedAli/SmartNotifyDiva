from django.conf import settings
from django.db import models
from django.utils import timezone

from stock.models import Product


class RawMaterial(models.Model):
    UNIT_KG = "kg"
    UNIT_L = "l"
    UNIT_PIECE = "piece"

    UNIT_CHOICES = [
        (UNIT_KG, "Kg"),
        (UNIT_L, "Litre"),
        (UNIT_PIECE, "Pièce"),
    ]

    name = models.CharField(max_length=150, unique=True)
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default=UNIT_KG)
    available_stock = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reorder_level = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class ProductionOrder(models.Model):
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_COMPLETED = "completed"
    STATUS_DELAYED = "delayed"

    STATUS_CHOICES = [
        (STATUS_IN_PROGRESS, "En cours"),
        (STATUS_COMPLETED, "Terminé"),
        (STATUS_DELAYED, "Retard"),
    ]

    code = models.CharField(max_length=30, unique=True)
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="production_orders")
    planned_quantity = models.PositiveIntegerField(default=1)
    produced_quantity = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_IN_PROGRESS)
    start_date = models.DateField()
    due_date = models.DateField()
    completed_at = models.DateTimeField(null=True, blank=True)
    issue_description = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_production_orders",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.code

    def save(self, *args, **kwargs):
        if not self.code:
            today = timezone.now().strftime("%Y%m%d")
            prefix = f"PO-{today}-"
            latest = ProductionOrder.objects.filter(code__startswith=prefix).order_by("-id").first()
            if latest and latest.code.startswith(prefix):
                try:
                    next_number = int(latest.code.split("-")[-1]) + 1
                except ValueError:
                    next_number = 1
            else:
                next_number = 1
            self.code = f"{prefix}{next_number:03d}"

        if self.status == self.STATUS_COMPLETED and not self.completed_at:
            self.completed_at = timezone.now()
        elif self.status != self.STATUS_COMPLETED:
            self.completed_at = None

        super().save(*args, **kwargs)


class ProductionOrderMaterial(models.Model):
    order = models.ForeignKey(ProductionOrder, on_delete=models.CASCADE, related_name="materials")
    material = models.ForeignKey(RawMaterial, on_delete=models.PROTECT, related_name="order_usages")
    planned_quantity = models.DecimalField(max_digits=12, decimal_places=2)
    consumed_quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        unique_together = ("order", "material")
        ordering = ["id"]

    def __str__(self):
        return f"{self.order.code} - {self.material.name}"


class ProductionAlert(models.Model):
    TYPE_DELAY = "delay"
    TYPE_ISSUE = "issue"

    TYPE_CHOICES = [
        (TYPE_DELAY, "Retard"),
        (TYPE_ISSUE, "Problème"),
    ]

    SEVERITY_HIGH = "high"
    SEVERITY_MEDIUM = "medium"
    SEVERITY_LOW = "low"

    SEVERITY_CHOICES = [
        (SEVERITY_HIGH, "Haute"),
        (SEVERITY_MEDIUM, "Moyenne"),
        (SEVERITY_LOW, "Basse"),
    ]

    order = models.ForeignKey(ProductionOrder, on_delete=models.CASCADE, related_name="alerts")
    alert_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default=SEVERITY_MEDIUM)
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_alert_type_display()} - {self.order.code}"


class FinishedProduct(models.Model):
    """Modèle pour les produits finis issus de la production"""
    STATUS_IN_STOCK = "in_stock"
    STATUS_SHIPPED = "shipped"
    STATUS_RESERVED = "reserved"
    
    STATUS_CHOICES = [
        (STATUS_IN_STOCK, "En stock"),
        (STATUS_SHIPPED, "Expédié"),
        (STATUS_RESERVED, "Réservé"),
    ]
    
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='finished_product_info')
    production_order = models.ForeignKey(ProductionOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name='finished_products')
    batch_number = models.CharField(max_length=100, unique=True)
    quantity_produced = models.PositiveIntegerField()
    quantity_available = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_IN_STOCK)
    production_date = models.DateField(auto_now_add=True)
    quality_check_passed = models.BooleanField(default=False)
    quality_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Produit fini"
        verbose_name_plural = "Produits finis"
    
    def __str__(self):
        return f"{self.product.name} - Batch {self.batch_number}"
