from django.contrib import admin
from .models import category

@admin.register(category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'material_type', 'created_at', 'updated_at')
    search_fields = ('name',)
    list_filter = ('material_type', 'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Informations', {
            'fields': ('name', 'description', 'material_type')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

