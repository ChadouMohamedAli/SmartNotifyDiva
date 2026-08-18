from rest_framework import serializers
from .models import Entrepot


class EntrepotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entrepot
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def validate_code(self, value):
        """Valider que le code est unique"""
        instance = self.instance
        if instance:
            # En mode édition, vérifier que le code n'est pas utilisé par un autre entrepôt
            if Entrepot.objects.exclude(pk=instance.pk).filter(code=value).exists():
                raise serializers.ValidationError("Un entrepôt avec ce code existe déjà.")
        else:
            # En mode création
            if Entrepot.objects.filter(code=value).exists():
                raise serializers.ValidationError("Un entrepôt avec ce code existe déjà.")
        return value
