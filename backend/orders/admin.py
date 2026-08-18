from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    """Inline pour afficher les articles dans l'admin commande"""
    model = OrderItem
    extra = 1
    fields = ('product', 'quantity', 'unit_price', 'subtotal', 'notes')
    readonly_fields = ('subtotal',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'customer_name',
        'status',
        'total_amount',
        'item_count',
        'created_at',
    )
    list_filter = (
        'status',
        'created_at',
        'confirmed_at',
        'shipped_at',
        'delivered_at',
    )
    search_fields = (
        'customer__username',
        'customer__email',
        'id',
    )
    readonly_fields = (
        'total_amount',
        'created_at',
        'updated_at',
        'confirmed_at',
        'shipped_at',
        'delivered_at',
    )
    
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Informations Client', {
            'fields': ('customer',)
        }),
        ('Statut', {
            'fields': ('status',)
        }),
        ('Montant', {
            'fields': ('total_amount',)
        }),
        ('Livraison', {
            'fields': (
                'shipping_address',
                'shipping_method',
            )
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Audit', {
            'fields': (
                'created_at',
                'updated_at',
                'confirmed_at',
                'shipped_at',
                'delivered_at',
            ),
            'classes': ('collapse',)
        }),
    )
    
    def customer_name(self, obj):
        return obj.customer.get_full_name() or obj.customer.username
    customer_name.short_description = 'Client'
    
    def item_count(self, obj):
        return obj.items.count()
    item_count.short_description = 'Articles'


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'product_name',
        'order_id',
        'quantity',
        'unit_price',
        'subtotal',
        'created_at',
    )
    list_filter = (
        'created_at',
        'order__status',
    )
    search_fields = (
        'product__name',
        'product__sku',
        'order__id',
    )
    readonly_fields = (
        'subtotal',
        'created_at',
    )
    
    def product_name(self, obj):
        return obj.product.name
    product_name.short_description = 'Produit'
