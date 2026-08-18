from django.contrib import admin
from .models import Product, Supplier, Warehouse


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "city", "country", "manager", "is_active", "created_at")
    search_fields = ("name", "code", "city")
    list_filter = ("is_active", "country")
    fieldsets = (
        ('Information générale', {
            'fields': ('name', 'code', 'address', 'city', 'country')
        }),
        ('Gestion', {
            'fields': ('manager', 'capacity', 'is_active')
        }),
        ('Contact', {
            'fields': ('phone', 'email')
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("name", "contact_name", "email", "phone", "city", "is_active")
    search_fields = ("name", "contact_name", "email", "phone", "city")
    list_filter = ("is_active", "country")
    fieldsets = (
        ('Information générale', {
            'fields': ('name', 'contact_name')
        }),
        ('Contact', {
            'fields': ('email', 'phone', 'address', 'city', 'country')
        }),
        ('Statut', {
            'fields': ('is_active',)
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "category", "material_type", "status", "quantity", "price", "supplier", "warehouse")
    search_fields = ("name", "sku", "supplier__name")
    list_filter = ("category", "material_type", "status", "warehouse")
    fieldsets = (
        ('Information générale', {
            'fields': ('name', 'sku', 'category', 'material_type', 'supplier')
        }),
        ('Stock', {
            'fields': ('warehouse', 'quantity', 'min_quantity', 'max_quantity', 'status')
        }),
        ('Prix', {
            'fields': ('price', 'last_restocked')
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')
