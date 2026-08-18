from django.contrib import admin
from .models import Invoice, InvoiceItem, Payment


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1
    fields = ['product', 'description', 'quantity', 'unit_price', 'total_price']
    readonly_fields = ['total_price']


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    fields = ['payment_date', 'amount', 'payment_method', 'reference']
    readonly_fields = ['created_at']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = [
        'invoice_number', 'purchase_order_number', 'customer_name', 'invoice_type', 'invoice_date',
        'due_date', 'total_amount', 'amount_paid', 'status', 'created_at'
    ]
    list_filter = ['status', 'invoice_type', 'invoice_date', 'created_at', 'currency']
    search_fields = ['invoice_number', 'purchase_order_number', 'customer_name', 'customer_email']
    readonly_fields = ['tax_amount', 'total_amount', 'balance_due', 'is_overdue', 'created_at', 'updated_at']
    inlines = [InvoiceItemInline, PaymentInline]
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('invoice_number', 'purchase_order_number', 'invoice_type', 'status')
        }),
        ('Client', {
            'fields': ('customer_name', 'customer_email', 'customer_phone', 'customer_address', 'supplier')
        }),
        ('Catégorie et devise', {
            'fields': ('category', 'currency')
        }),
        ('Dates', {
            'fields': ('invoice_date', 'due_date', 'supplier_departure_date')
        }),
        ('Montants', {
            'fields': ('subtotal', 'tax_rate', 'tax_amount', 'discount', 'total_amount', 'amount_paid', 'balance_due')
        }),
        ('Informations additionnelles', {
            'fields': ('notes', 'terms', 'is_overdue')
        }),
        ('Métadonnées', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(InvoiceItem)
class InvoiceItemAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'description', 'quantity', 'unit_price', 'total_price']
    list_filter = ['invoice']
    search_fields = ['description', 'invoice__invoice_number']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'payment_date', 'amount', 'payment_method', 'reference', 'created_at']
    list_filter = ['payment_method', 'payment_date']
    search_fields = ['invoice__invoice_number', 'reference']
    readonly_fields = ['created_at']
