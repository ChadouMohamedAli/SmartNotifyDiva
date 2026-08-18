from rest_framework import serializers
from .models import Alert

class AlertSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = Alert
        fields = [
            'id', 'user', 'user_name', 'user_email',
            'name', 'description', 'module', 'severity',
            'check_condition',
            'condition_type', 'threshold_value', 'comparison_operator',
            'condition_field', 'compare_to', 'categories',
            'product', 'product_name',
            'notification_channels', 'recipients', 'recipient_role',
            'notif_type', 'recurrence', 'snooze_hours',
            'custom_subject', 'custom_body',
            'schedule', 'custom_schedule', 'repeat_until_resolved',
            'is_active', 'is_paused', 'tags',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'user_name', 'user_email', 'created_at', 'updated_at']

    def validate_categories(self, value):
        """Accept category ids as int/str and normalize to a list of ints."""
        if value in (None, ""):
            return []
        
        # If it's a single value (int or string), wrap it in a list
        if isinstance(value, (int, str)) and not isinstance(value, list):
            try:
                return [int(value)]
            except (TypeError, ValueError):
                 raise serializers.ValidationError(f"Catégorie invalide: {value}. Utilisez des IDs numériques.")

        if not isinstance(value, list):
            raise serializers.ValidationError("Le champ catégories doit être une liste.")

        normalized = []
        for item in value:
            try:
                normalized.append(int(item))
            except (TypeError, ValueError):
                raise serializers.ValidationError(
                    f"Catégorie invalide: {item}. Utilisez des IDs numériques."
                )
        return normalized

    def validate_recipients(self, value):
        """Accept string or list of strings for recipients."""
        if value in (None, ""):
            return []
        if isinstance(value, str):
            # Split by comma and clean
            return [r.strip() for r in value.split(',') if r.strip()]
        if not isinstance(value, list):
            raise serializers.ValidationError("Le champ recipients doit être une liste ou une chaîne séparée par des virgules.")
        return value

    def validate_notification_channels(self, value):
        """Ensure notification_channels is a list."""
        if value in (None, ""):
            return []
        if isinstance(value, str):
            return [v.strip() for v in value.split(',') if v.strip()]
        if not isinstance(value, list):
            raise serializers.ValidationError("Le champ notification_channels doit être une liste.")
        return value

    def validate_check_condition(self, value):
        """Handle JSON string or dict/list for check_condition."""
        import json
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError("check_condition doit être un JSON valide.")
        return value
