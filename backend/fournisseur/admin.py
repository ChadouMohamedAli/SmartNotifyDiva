from django.contrib import admin
from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
	list_display = ("name", "contact_name", "email", "phone", "is_active")
	search_fields = ("name", "contact_name", "email", "phone")
	list_filter = ("is_active", "city", "country")
