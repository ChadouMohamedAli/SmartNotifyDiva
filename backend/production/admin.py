from django.contrib import admin

from .models import ProductionOrder, ProductionOrderMaterial, RawMaterial, ProductionAlert, FinishedProduct


@admin.register(RawMaterial)
class RawMaterialAdmin(admin.ModelAdmin):
    list_display = ("name", "unit", "available_stock", "reorder_level", "is_active", "updated_at")
    search_fields = ("name",)
    list_filter = ("is_active", "unit")
    fieldsets = (
        ('Information générale', {
            'fields': ('name', 'unit')
        }),
        ('Stock', {
            'fields': ('available_stock', 'reorder_level')
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


class ProductionOrderMaterialInline(admin.TabularInline):
    model = ProductionOrderMaterial
    extra = 0


@admin.register(ProductionOrder)
class ProductionOrderAdmin(admin.ModelAdmin):
    list_display = ("code", "product", "status", "planned_quantity", "produced_quantity", "start_date", "due_date")
    search_fields = ("code", "product__name", "product__sku")
    list_filter = ("status", "start_date", "due_date")
    inlines = [ProductionOrderMaterialInline]
    fieldsets = (
        ('Référence', {
            'fields': ('code', 'product')
        }),
        ('Quantités', {
            'fields': ('planned_quantity', 'produced_quantity')
        }),
        ('Dates', {
            'fields': ('start_date', 'due_date', 'completed_at')
        }),
        ('Statut', {
            'fields': ('status',)
        }),
        ('Détails', {
            'fields': ('issue_description', 'created_by')
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('code', 'completed_at', 'created_at', 'updated_at')


@admin.register(FinishedProduct)
class FinishedProductAdmin(admin.ModelAdmin):
    list_display = ("product", "batch_number", "quantity_produced", "quantity_available", "status", "quality_check_passed", "production_date")
    search_fields = ("product__name", "batch_number")
    list_filter = ("status", "quality_check_passed", "production_date")
    fieldsets = (
        ('Produit', {
            'fields': ('product', 'production_order')
        }),
        ('Batch et Quantités', {
            'fields': ('batch_number', 'quantity_produced', 'quantity_available')
        }),
        ('Statut', {
            'fields': ('status', 'quality_check_passed')
        }),
        ('Contrôle qualité', {
            'fields': ('quality_notes',)
        }),
        ('Audit', {
            'fields': ('production_date', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('production_date', 'created_at', 'updated_at')


@admin.register(ProductionAlert)
class ProductionAlertAdmin(admin.ModelAdmin):
    list_display = ("order", "alert_type", "severity", "is_resolved", "created_at")
    search_fields = ("order__code", "message")
    list_filter = ("alert_type", "severity", "is_resolved")
    fieldsets = (
        ('Alert', {
            'fields': ('order', 'alert_type', 'severity')
        }),
        ('Message', {
            'fields': ('message',)
        }),
        ('Résolution', {
            'fields': ('is_resolved', 'resolved_at')
        }),
        ('Audit', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at',)
