from rest_framework import serializers
from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    type_display = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "action_type",
            "type",
            "type_display",
            "title",
            "description",
            "created_at",
            "actor_name",
            "user_name",
        ]

    def get_actor_name(self, obj):
        if not obj.actor:
            return "System"
        return obj.actor.get_full_name() or obj.actor.username or obj.actor.email

    def get_user_name(self, obj):
        return self.get_actor_name(obj)

    def get_type(self, obj):
        action_type = obj.action_type or ""
        if action_type.startswith("alert_"):
            return "alert"
        if action_type.startswith("production_order_"):
            return "movement"
        if action_type.startswith("product_") or action_type.startswith("category_"):
            return "stock"
        return "history"

    def get_type_display(self, obj):
        labels = {
            "stock": "Stock",
            "movement": "Mouvement",
            "alert": "Alerte",
            "history": "Historique",
        }
        return labels.get(self.get_type(obj), "Historique")
