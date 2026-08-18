from rest_framework import serializers
from .models import Product, Warehouse, Supplier
from categories.models import category as Category
from categories.serializers import CategorySerializer


# ============ WAREHOUSE SERIALIZERS ============
class WarehouseSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    
    class Meta:
        model = Warehouse
        fields = [
            "id",
            "name",
            "code",
            "address",
            "city",
            "country",
            "capacity",
            "manager",
            "manager_name",
            "phone",
            "email",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "manager_name"]


# ============ SUPPLIER SERIALIZERS ============
class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            "id",
            "name",
            "contact_name",
            "email",
            "phone",
            "address",
            "city",
            "country",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# ============ PRODUCT SERIALIZERS ============
class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    material_type_display = serializers.CharField(source='get_material_type_display', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "category",
            "category_name",
            "material_type",
            "material_type_display",
            "status",
            "quantity",
            "min_quantity",
            "max_quantity",
            "price",
            "supplier",
            "supplier_name",
            "warehouse",
            "warehouse_name",
            "last_restocked",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "category_name", "material_type_display", "supplier_name", "warehouse_name"]


class ProductDetailSerializer(serializers.ModelSerializer):
    category_details = CategorySerializer(source='category', read_only=True)
    material_type_display = serializers.CharField(source='get_material_type_display', read_only=True)
    supplier_details = SupplierSerializer(source='supplier', read_only=True)
    warehouse_details = WarehouseSerializer(source='warehouse', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "category",
            "category_details",
            "material_type",
            "material_type_display",
            "status",
            "quantity",
            "min_quantity",
            "max_quantity",
            "price",
            "supplier",
            "supplier_details",
            "warehouse",
            "warehouse_details",
            "last_restocked",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "category_details", "material_type_display", "supplier_details", "warehouse_details"]


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "category",
            "material_type",
            "status",
            "quantity",
            "min_quantity",
            "max_quantity",
            "price",
            "supplier",
            "warehouse",
            "last_restocked",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
