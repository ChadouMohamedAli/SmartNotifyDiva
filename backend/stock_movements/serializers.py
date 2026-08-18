from rest_framework import serializers
from .models import StockMovement, StockEntry, StockExit
from stock.models import Product, Warehouse, Supplier
from django.contrib.auth import get_user_model

User = get_user_model()


class ProductSimpleSerializer(serializers.ModelSerializer):
    """Sérialiseur simple pour le produit dans les mouvements"""
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'category']


class UserSimpleSerializer(serializers.ModelSerializer):
    """Sérialiseur simple pour l'utilisateur"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name', 'email']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class WarehouseSimpleSerializer(serializers.ModelSerializer):
    """Sérialiseur simple pour l'entrepôt"""
    class Meta:
        model = Warehouse
        fields = ['id', 'name', 'code']


class SupplierSimpleSerializer(serializers.ModelSerializer):
    """Sérialiseur simple pour le fournisseur"""
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_name', 'phone']


# ============ STOCK ENTRY SERIALIZERS ============
class StockEntrySerializer(serializers.ModelSerializer):
    """Sérialiseur pour les entrées de stock"""
    product = ProductSimpleSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        write_only=True,
        source='product'
    )
    supplier = SupplierSimpleSerializer(read_only=True)
    supplier_id = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
        source='supplier'
    )
    warehouse = WarehouseSimpleSerializer(read_only=True)
    warehouse_id = serializers.PrimaryKeyRelatedField(
        queryset=Warehouse.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
        source='warehouse'
    )
    received_by = UserSimpleSerializer(read_only=True)
    receipt_type_display = serializers.CharField(source='get_receipt_type_display', read_only=True)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    
    class Meta:
        model = StockEntry
        fields = [
            'id', 'reference', 'receipt_type', 'receipt_type_display',
            'product', 'product_id', 'quantity',
            'supplier', 'supplier_id', 'warehouse', 'warehouse_id',
            'reason', 'reason_display',
            'received_by', 'notes',
            'entry_date', 'updated_at',
        ]
        read_only_fields = ['id', 'entry_date', 'updated_at', 'receipt_type_display', 'reason_display']
    
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("La quantité doit être supérieure à 0")
        return value


# ============ STOCK EXIT SERIALIZERS ============
class StockExitSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les sorties de stock"""
    product = ProductSimpleSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        write_only=True,
        source='product'
    )
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    warehouse = WarehouseSimpleSerializer(read_only=True)
    warehouse_id = serializers.PrimaryKeyRelatedField(
        queryset=Warehouse.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
        source='warehouse'
    )
    prepared_by = UserSimpleSerializer(read_only=True)
    exit_type_display = serializers.CharField(source='get_exit_type_display', read_only=True)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    
    class Meta:
        model = StockExit
        fields = [
            'id', 'reference', 'exit_type', 'exit_type_display',
            'product', 'product_id', 'quantity', 'order_id',
            'warehouse', 'warehouse_id',
            'reason', 'reason_display',
            'prepared_by', 'notes',
            'exit_date', 'updated_at',
        ]
        read_only_fields = ['id', 'exit_date', 'updated_at', 'exit_type_display', 'reason_display', 'order_id']
    
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("La quantité doit être supérieure à 0")
        return value
    
    def validate(self, data):
        """Vérifie que le stock est suffisant"""
        product = data.get('product')
        quantity = data.get('quantity')
        
        if product and quantity:
            if quantity > product.quantity:
                raise serializers.ValidationError({
                    'quantity': f"Stock insuffisant. Disponible: {product.quantity}, Demandé: {quantity}"
                })
        return data


# ============ STOCK MOVEMENT SERIALIZERS ============
class StockMovementSerializer(serializers.ModelSerializer):
    """Sérialiseur complet pour les mouvements de stock"""
    
    product = ProductSimpleSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        write_only=True,
        source='product'
    )
    
    warehouse_from = WarehouseSimpleSerializer(read_only=True)
    warehouse_from_id = serializers.PrimaryKeyRelatedField(
        queryset=Warehouse.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
        source='warehouse_from'
    )
    
    warehouse_to = WarehouseSimpleSerializer(read_only=True)
    warehouse_to_id = serializers.PrimaryKeyRelatedField(
        queryset=Warehouse.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
        source='warehouse_to'
    )
    
    responsible = UserSimpleSerializer(read_only=True)
    responsible_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
        source='responsible'
    )
    
    movement_type_display = serializers.CharField(
        source='get_movement_type_display',
        read_only=True
    )
    
    class Meta:
        model = StockMovement
        fields = [
            'id',
            'movement_type',
            'movement_type_display',
            'product',
            'product_id',
            'quantity',
            'warehouse_from',
            'warehouse_from_id',
            'warehouse_to',
            'warehouse_to_id',
            'responsible',
            'responsible_id',
            'recipient_name',
            'reference',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("La quantité doit être supérieure à 0")
        return value
    
    def validate(self, data):
        movement_type = data.get('movement_type')
        product = data.get('product')
        quantity = data.get('quantity')
        
        if movement_type == 'exit' and product and quantity:
            if quantity > product.quantity:
                raise serializers.ValidationError({
                    'quantity': f"Stock insuffisant. Disponible: {product.quantity}, Demandé: {quantity}"
                })
        
        if movement_type == 'transfer':
            if not data.get('warehouse_from') or not data.get('warehouse_to'):
                raise serializers.ValidationError(
                    "Les entrepôts source et destination sont requis pour un transfert"
                )
        
        return data


class StockMovementListSerializer(serializers.ModelSerializer):
    """Sérialiseur allégé pour les listes de mouvements"""
    
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    responsible_name = serializers.SerializerMethodField()
    movement_type_display = serializers.CharField(
        source='get_movement_type_display',
        read_only=True
    )
    reason = serializers.SerializerMethodField()
    
    class Meta:
        model = StockMovement
        fields = [
            'id',
            'movement_type',
            'movement_type_display',
            'product_id',
            'product_name',
            'product_sku',
            'quantity',
            'reason',
            'warehouse_from',
            'warehouse_to',
            'responsible_name',
            'recipient_name',
            'reference',
            'created_at',
        ]
    
    def get_responsible_name(self, obj):
        if obj.responsible:
            return f"{obj.responsible.first_name} {obj.responsible.last_name}".strip() or obj.responsible.username
        return "N/A"
    
    def get_reason(self, obj):
        if obj.movement_type == 'entry':
            return 'Entrée de stock'
        if obj.movement_type == 'exit':
            return 'Sortie de stock'
        if obj.movement_type == 'transfer':
            return 'Transfert entre entrepôts'
        return 'Non spécifié'