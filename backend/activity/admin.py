from django.contrib import admin
from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ("id", "action_type", "title", "actor", "created_at")
    list_filter = ("action_type", "created_at")
    search_fields = ("title", "description", "actor__email", "actor__username")
