from django.utils import timezone
from rest_framework import serializers

from .models import ProductionAlert, ProductionOrder, ProductionOrderMaterial, RawMaterial, FinishedProduct
from stock.models import Product


class RawMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawMaterial
        fields = [
            "id",
            "name",
            "unit",
            "available_stock",
            "reorder_level",
            "is_active",
            "created_at",
            "updated_at",
        ]


class ProductionOrderMaterialSerializer(serializers.ModelSerializer):
    material_id = serializers.PrimaryKeyRelatedField(
        source="material",
        queryset=RawMaterial.objects.all(),
        write_only=True,
    )
    material_name = serializers.CharField(source="material.name", read_only=True)
    material_unit = serializers.CharField(source="material.unit", read_only=True)

    class Meta:
        model = ProductionOrderMaterial
        fields = [
            "id",
            "material_id",
            "material_name",
            "material_unit",
            "planned_quantity",
            "consumed_quantity",
        ]


class ProductionAlertSerializer(serializers.ModelSerializer):
    order_code = serializers.CharField(source="order.code", read_only=True)
    product_name = serializers.CharField(source="order.product.name", read_only=True)

    class Meta:
        model = ProductionAlert
        fields = [
            "id",
            "order",
            "order_code",
            "product_name",
            "alert_type",
            "severity",
            "message",
            "is_resolved",
            "resolved_at",
            "created_at",
        ]
        read_only_fields = ["resolved_at", "created_at"]


class ProductionOrderSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(
        source="product",
        queryset=Product.objects.all(),
        write_only=True,
    )
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    materials = ProductionOrderMaterialSerializer(many=True, required=False)
    alerts = ProductionAlertSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ProductionOrder
        fields = [
            "id",
            "code",
            "product_id",
            "product_name",
            "product_sku",
            "planned_quantity",
            "produced_quantity",
            "status",
            "start_date",
            "due_date",
            "completed_at",
            "issue_description",
            "materials",
            "alerts",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["code", "completed_at", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        if not obj.created_by:
            return ""
        return obj.created_by.get_full_name() or obj.created_by.username

    def validate(self, attrs):
        start_date = attrs.get("start_date")
        due_date = attrs.get("due_date")

        if self.instance:
            start_date = start_date or self.instance.start_date
            due_date = due_date or self.instance.due_date

        if start_date and due_date and due_date < start_date:
            raise serializers.ValidationError("La date d'échéance doit être après la date de début")

        return attrs

    def create(self, validated_data):
        materials_data = validated_data.pop("materials", [])
        order = ProductionOrder.objects.create(**validated_data)
        self._sync_materials(order, materials_data)
        return order

    def update(self, instance, validated_data):
        materials_data = validated_data.pop("materials", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()

        if materials_data is not None:
            self._sync_materials(instance, materials_data)

        return instance

    def _sync_materials(self, order, materials_data):
        existing_by_id = {material.id: material for material in order.materials.all()}
        sent_ids = set()

        for item in materials_data:
            material_obj = item["material"]
            payload = {
                "planned_quantity": item.get("planned_quantity", 0),
                "consumed_quantity": item.get("consumed_quantity", 0),
            }
            obj, _ = ProductionOrderMaterial.objects.update_or_create(
                order=order,
                material=material_obj,
                defaults=payload,
            )
            sent_ids.add(obj.id)

        for obj_id, obj in existing_by_id.items():
            if obj_id not in sent_ids:
                obj.delete()


class ProductionAlertResolveSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionAlert
        fields = ["id", "is_resolved"]

    def update(self, instance, validated_data):
        instance.is_resolved = validated_data.get("is_resolved", instance.is_resolved)
        if instance.is_resolved:
            instance.resolved_at = timezone.now()
        else:
            instance.resolved_at = None
        instance.save(update_fields=["is_resolved", "resolved_at"])
        return instance


class FinishedProductSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les produits finis"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    production_order_code = serializers.CharField(source='production_order.code', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = FinishedProduct
        fields = [
            'id',
            'product',
            'product_name',
            'product_sku',
            'production_order',
            'production_order_code',
            'batch_number',
            'quantity_produced',
            'quantity_available',
            'status',
            'status_display',
            'production_date',
            'quality_check_passed',
            'quality_notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'production_date', 'created_at', 'updated_at']
