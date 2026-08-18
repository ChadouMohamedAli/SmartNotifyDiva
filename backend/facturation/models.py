from django.db import models
from django.conf import settings
from stock.models import Product
from fournisseur.models import Supplier
from categories.models import category


class Invoice(models.Model):
    """Model for invoices/bills"""
    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('sent', 'Envoyée'),
        ('paid', 'Payée'),
        ('overdue', 'En retard'),
        ('cancelled', 'Annulée'),
    ]
    
    TYPE_CHOICES = [
        ('sales', 'Vente'),
        ('purchase', 'Achat'),
    ]

    invoice_number = models.CharField(max_length=50, unique=True, verbose_name="Numéro de facture")
    purchase_order_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="Numéro commande achat")
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices', verbose_name="Commande liée")
    invoice_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='sales', verbose_name="Type")
    customer_name = models.CharField(max_length=200, verbose_name="Nom du client")
    customer_email = models.EmailField(blank=True, null=True, verbose_name="Email du client")
    customer_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone du client")
    customer_address = models.TextField(blank=True, null=True, verbose_name="Adresse du client")
    
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices', verbose_name="Fournisseur")
    category = models.ForeignKey(category, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices', verbose_name="Catégorie")
    currency = models.CharField(max_length=10, default='EUR', verbose_name="Devise")
    supplier_departure_date = models.DateField(blank=True, null=True, verbose_name="Départ fournisseur")
    
    invoice_date = models.DateField(verbose_name="Date de facturation")
    due_date = models.DateField(verbose_name="Date d'échéance")
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Sous-total")
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name="Taux de TVA (%)")
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Montant TVA")
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Remise")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Montant total")
    
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Montant payé")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name="Statut")
    
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    terms = models.TextField(blank=True, null=True, verbose_name="Conditions")
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='invoices_created', verbose_name="Créé par")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices_updated', verbose_name="Modifié par")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")

    class Meta:
        ordering = ['-invoice_date', '-created_at']
        verbose_name = 'Facture'
        verbose_name_plural = 'Factures'

    def __str__(self):
        return f"{self.invoice_number} - {self.customer_name}"

    @property
    def balance_due(self):
        """Calculate remaining balance"""
        return self.total_amount - self.amount_paid

    @property
    def is_overdue(self):
        """Check if invoice is overdue"""
        from django.utils import timezone
        if self.status in ['paid', 'cancelled']:
            return False
        return self.due_date < timezone.now().date() and self.balance_due > 0

    def save(self, *args, **kwargs):
        # Calculate totals
        self.tax_amount = (self.subtotal * self.tax_rate) / 100
        self.total_amount = self.subtotal + self.tax_amount - self.discount
        
        # Update status based on payment
        if self.amount_paid >= self.total_amount and self.status != 'cancelled':
            self.status = 'paid'
        elif self.is_overdue and self.status not in ['paid', 'cancelled']:
            self.status = 'overdue'
            
        super().save(*args, **kwargs)


class InvoiceItem(models.Model):
    """Model for invoice line items"""
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items', verbose_name="Facture")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Produit")
    description = models.CharField(max_length=255, verbose_name="Description")
    quantity = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Quantité")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Prix unitaire")
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Prix total")

    class Meta:
        verbose_name = 'Article de facture'
        verbose_name_plural = 'Articles de facture'

    def __str__(self):
        return f"{self.description} - {self.invoice.invoice_number}"

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)


class Payment(models.Model):
    """Model for invoice payments"""
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Espèces'),
        ('check', 'Chèque'),
        ('bank_transfer', 'Virement bancaire'),
        ('credit_card', 'Carte de crédit'),
        ('other', 'Autre'),
    ]

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments', verbose_name="Facture")
    payment_date = models.DateField(verbose_name="Date de paiement")
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Montant")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, verbose_name="Méthode de paiement")
    reference = models.CharField(max_length=100, blank=True, null=True, verbose_name="Référence")
    notes = models.TextField(blank=True, null=True, verbose_name="Notes")
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="Créé par")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")

    class Meta:
        ordering = ['-payment_date']
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'

    def __str__(self):
        return f"{self.invoice.invoice_number} - {self.amount} ({self.payment_date})"
