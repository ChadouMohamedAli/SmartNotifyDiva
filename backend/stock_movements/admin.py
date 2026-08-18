from django.contrib import admin
from .models import StockEntry, StockExit, StockMovement


@admin.register(StockEntry)
class StockEntryAdmin(admin.ModelAdmin):
    list_display = (
        'reference',
        'product',
        'quantity',
        'supplier',
        'warehouse',
        'reason',
        'received_by',
        'entry_date',
    )
    list_filter = (
        'receipt_type',
        'reason',
        'entry_date',
        'supplier',
        'warehouse',
    )
    search_fields = (
        'reference',
        'product__name',
        'product__sku',
        'supplier__name',
        'notes',
    )
    readonly_fields = (
        'entry_date',
        'updated_at',
    )
    fieldsets = (
        ('Référence', {
            'fields': ('reference', 'receipt_type')
        }),
        ('Produit et Quantité', {
            'fields': ('product', 'quantity')
        }),
        ('Contexte', {
            'fields': ('supplier', 'warehouse', 'reason')
        }),
        ('Responsabilité', {
            'fields': ('received_by',)
        }),
        ('Détails', {
            'fields': ('notes',)
        }),
        ('Audit', {
            'fields': ('entry_date', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(StockExit)
class StockExitAdmin(admin.ModelAdmin):
    list_display = (
        'reference',
        'product',
        'quantity',
        'warehouse',
        'reason',
        'prepared_by',
        'exit_date',
    )
    list_filter = (
        'exit_type',
        'reason',
        'exit_date',
        'warehouse',
    )
    search_fields = (
        'reference',
        'product__name',
        'product__sku',
        'notes',
    )
    readonly_fields = (
        'exit_date',
        'updated_at',
    )
    fieldsets = (
        ('Référence', {
            'fields': ('reference', 'exit_type')
        }),
        ('Produit et Quantité', {
            'fields': ('product', 'quantity')
        }),
        ('Contexte', {
            'fields': ('warehouse', 'reason')
        }),
        ('Responsabilité', {
            'fields': ('prepared_by',)
        }),
        ('Détails', {
            'fields': ('notes',)
        }),
        ('Audit', {
            'fields': ('exit_date', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'movement_type',
        'product',
        'quantity',
        'warehouse_from',
        'warehouse_to',
        'responsible',
        'created_at',
    )
    list_filter = (
        'movement_type',
        'created_at',
        'responsible',
    )
    search_fields = (
        'product__name',
        'product__sku',
        'reference',
        'notes',
        'responsible__username',
    )
    readonly_fields = (
        'created_at',
        'updated_at',
    )
    fieldsets = (
        ('Informations du Mouvement', {
            'fields': (
                'movement_type',
                'product',
                'quantity',
                'reference',
            )
        }),
        ('Entrepôts', {
            'fields': (
                'warehouse_from',
                'warehouse_to',
            ),
        }),
        ('Responsabilité', {
            'fields': (
                'responsible',
            )
        }),
        ('Détails', {
            'fields': (
                'notes',
            )
        }),
        ('Audit', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',)
        }),
    )
