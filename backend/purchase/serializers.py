from rest_framework import serializers
from .models import PurchaseOrder, PurchaseOrderItem
from fournisseur.models import Supplier
from stock.models import Product


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.code', read_only=True)
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    
    class Meta:
        model = PurchaseOrderItem
        fields = ['id', 'product', 'product_name', 'product_code', 'quantity', 'unit_price']


class PurchaseOrderItemReadSerializer(serializers.ModelSerializer):
    """Sérializer pour lire les items - en read-only"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.code', read_only=True)
    product = serializers.IntegerField(source='product.id', read_only=True)
    
    class Meta:
        model = PurchaseOrderItem
        fields = ['id', 'product', 'product_name', 'product_code', 'quantity', 'unit_price']


class PurchaseOrderItemWriteSerializer(serializers.Serializer):
    """Serializer pour créer/mettre à jour les items - validation personnalisée"""
    product = serializers.IntegerField()
    quantity = serializers.IntegerField()
    unit_price = serializers.DecimalField(max_digits=15, decimal_places=2)
    
    def validate_product(self, value):
        """Vérifier que le produit existe"""
        try:
            Product.objects.get(id=value)
        except Product.DoesNotExist:
            raise serializers.ValidationError(f"Produit avec l'ID {value} n'existe pas")
        return value
    
    def validate_quantity(self, value):
        """Vérifier que la quantité est positive"""
        if value <= 0:
            raise serializers.ValidationError("La quantité doit être positive")
        if value > 2147483647:
            raise serializers.ValidationError("La quantité est trop grande (maximum: 2147483647)")
        return value
    
    def validate_unit_price(self, value):
        """Vérifier que le prix unitaire est positif et dans les limites"""
        if value <= 0:
            raise serializers.ValidationError("Le prix unitaire doit être positif")
        if value > 999999999999.99:
            raise serializers.ValidationError("Le prix unitaire dépasse le maximum (999,999,999,999.99). Veuillez utiliser une valeur inférieure.")
        return value


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    supplier_email = serializers.CharField(source='supplier.email', read_only=True)
    supplier_phone = serializers.CharField(source='supplier.phone', read_only=True)
    supplier_contact = serializers.CharField(source='supplier.contact_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.first_name', read_only=True)
    items = PurchaseOrderItemReadSerializer(many=True, read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'supplier', 'supplier_name', 'supplier_email', 'supplier_phone',
            'supplier_contact', 'created_by', 'created_by_name', 'order_date',
            'expected_delivery_date', 'status', 'total_amount', 'items'
        ]
        # 🔒 CRITIQUE: status en lecture seule - ne peut pas être modifié via l'API normalement
        read_only_fields = ['id', 'created_by', 'order_date', 'total_amount', 'status']


class PurchaseOrderCreateUpdateSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemWriteSerializer(many=True, required=False)
    
    class Meta:
        model = PurchaseOrder
        # 🔒 CRITIQUE: status N'EST PAS dans les champs modifiables
        fields = ['id', 'supplier', 'expected_delivery_date', 'items']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        print(f"\n[SERIALIZER CREATE] validated_data keys: {validated_data.keys()}")
        print(f"[SERIALIZER CREATE] validated_data: {validated_data}")
        
        items_data = validated_data.pop('items', [])
        print(f"[SERIALIZER CREATE] items_data: {items_data}")
        
        try:
            # 🔒 CORRECTION CRITIQUE: Forcer le statut à 'pending' à la création
            validated_data['status'] = 'pending'
            validated_data['created_by'] = self.context.get('request').user
            
            # Créer la commande
            print(f"[SERIALIZER CREATE] Creating PurchaseOrder with: {validated_data}")
            purchase_order = PurchaseOrder.objects.create(**validated_data)
            print(f"[SERIALIZER CREATE] PurchaseOrder created: {purchase_order.id} with status: {purchase_order.status}")
            
            # Créer les articles
            total = 0
            for idx, item_data in enumerate(items_data):
                print(f"[SERIALIZER CREATE] Processing item {idx}: {item_data}")
                try:
                    product = Product.objects.get(id=item_data['product'])
                    print(f"[SERIALIZER CREATE] Product found: {product.id}")
                    
                    item = PurchaseOrderItem.objects.create(
                        purchase_order=purchase_order,
                        product=product,
                        quantity=item_data['quantity'],
                        unit_price=item_data['unit_price']
                    )
                    print(f"[SERIALIZER CREATE] Item created: {item.id}")
                    total += item.quantity * float(item.unit_price)
                except Product.DoesNotExist:
                    print(f"[SERIALIZER CREATE] Product NOT found: {item_data['product']}")
                    purchase_order.delete()
                    raise serializers.ValidationError(f"Produit avec l'ID {item_data['product']} n'existe pas")
            
            purchase_order.total_amount = total
            purchase_order.save()
            print(f"[SERIALIZER CREATE] PurchaseOrder saved with total: {total} and status: {purchase_order.status}")
            
            return purchase_order
        except Exception as e:
            print(f"[SERIALIZER CREATE] ERROR: {type(e).__name__}: {str(e)}")
            import traceback
            print(f"[SERIALIZER CREATE] Traceback:\n{traceback.format_exc()}")
            raise
    
    def update(self, instance, validated_data):
        request = self.context.get('request')
        
        # 🔒 Empêcher les non-superadmins de modifier le statut
        if not request.user.is_superuser:
            validated_data.pop('status', None)

        print(f"\n[SERIALIZER UPDATE] validated_data keys: {validated_data.keys()}")
        print(f"[SERIALIZER UPDATE] validated_data: {validated_data}")
        
        items_data = validated_data.pop('items', None)
        print(f"[SERIALIZER UPDATE] items_data: {items_data}")
        
        try:
            instance.supplier = validated_data.get('supplier', instance.supplier)
            instance.expected_delivery_date = validated_data.get('expected_delivery_date', instance.expected_delivery_date)
            
            # 🔒 Ne mettre à jour le statut QUE si superadmin ET champ présent
            if request.user.is_superuser and 'status' in validated_data:
                instance.status = validated_data['status']
            
            if items_data is not None:
                print(f"[SERIALIZER UPDATE] Deleting existing items")
                instance.items.all().delete()
                total = 0
                for idx, item_data in enumerate(items_data):
                    print(f"[SERIALIZER UPDATE] Processing item {idx}: {item_data}")
                    try:
                        product = Product.objects.get(id=item_data['product'])
                        print(f"[SERIALIZER UPDATE] Product found: {product.id}")
                        item = PurchaseOrderItem.objects.create(
                            purchase_order=instance,
                            product=product,
                            quantity=item_data['quantity'],
                            unit_price=item_data['unit_price']
                        )
                        print(f"[SERIALIZER UPDATE] Item created: {item.id}")
                        total += item.quantity * float(item.unit_price)
                    except Product.DoesNotExist:
                        print(f"[SERIALIZER UPDATE] Product NOT found: {item_data['product']}")
                        raise serializers.ValidationError(f"Produit avec l'ID {item_data['product']} n'existe pas")
                instance.total_amount = total
                print(f"[SERIALIZER UPDATE] Total amount set to: {total}")
            
            instance.save()
            print(f"[SERIALIZER UPDATE] Instance saved successfully with status: {instance.status}")
            return instance
        except Exception as e:
            print(f"[SERIALIZER UPDATE] ERROR: {type(e).__name__}: {str(e)}")
            import traceback
            print(f"[SERIALIZER UPDATE] Traceback:\n{traceback.format_exc()}")
            raise