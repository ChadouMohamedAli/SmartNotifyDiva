from django.contrib import admin
from .models import Entrepot


@admin.register(Entrepot)
class EntrepotAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'city', 'country', 'capacity', 'manager_name', 'is_active', 'created_at')
    list_filter = ('is_active', 'country', 'city')
    search_fields = ('name', 'code', 'city', 'manager_name', 'email')
    ordering = ('-created_at',)
