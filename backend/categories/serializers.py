from rest_framework import serializers
from .models import category
from fournisseur.serializers import SupplierSerializer


class CategorySerializer(serializers.ModelSerializer):
	supplier = SupplierSerializer(read_only=True)
	supplier_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
	material_type_display = serializers.CharField(source='get_material_type_display', read_only=True)
	
	class Meta:
		model = category
		fields = ['id', 'name', 'description', 'material_type', 'material_type_display', 'is_active', 'supplier_id', 'supplier', 'created_at', 'updated_at']
		read_only_fields = ['created_at', 'updated_at'] 