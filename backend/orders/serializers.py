from rest_framework import serializers
from django.db import transaction
from .models import Order, OrderItem
from stock.models import Product
from stock_movements.models import StockExit
from django.contrib.auth import get_user_model
from collections import defaultdict
from uuid import uuid4

User = get_user_model()


class ProductSimpleSerializer(serializers.ModelSerializer):
    """Sérialiseur simple pour les produits"""
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'category', 'price']


class UserSimpleSerializer(serializers.ModelSerializer):
    """Sérialiseur simple pour l'utilisateur"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name', 'email']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class OrderItemSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les articles de commande"""
    product = ProductSimpleSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        write_only=True,
        source='product'
    )
    
    class Meta:
        model = OrderItem
        fields = [
            'id',
            'order',
            'product',
            'product_id',
            'quantity',
            'unit_price',
            'subtotal',
            'notes',
            'created_at',
        ]
        read_only_fields = ['id', 'subtotal', 'created_at', 'order']


class OrderItemCreateSerializer(serializers.Serializer):
    """Sérialiseur pour créer les articles d'une commande"""
    product_id = serializers.IntegerField(required=True)
    quantity = serializers.IntegerField(required=True, min_value=1)
    unit_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True
    )
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_product_id(self, value):
        """Valide que le produit existe"""
        if not Product.objects.filter(id=value).exists():
            raise serializers.ValidationError("Le produit spécifié n'existe pas.")
        return value


class OrderDetailSerializer(serializers.ModelSerializer):
    """Sérialiseur détaillé pour les commandes"""
    customer = UserSimpleSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id',
            'customer',
            'status',
            'status_display',
            'total_amount',
            'shipping_address',
            'shipping_method',
            'notes',
            'items',
            'item_count',
            'created_at',
            'updated_at',
            'confirmed_at',
            'shipped_at',
            'delivered_at',
        ]
        read_only_fields = [
            'id',
            'customer',
            'total_amount',
            'created_at',
            'updated_at',
            'confirmed_at',
            'shipped_at',
            'delivered_at',
        ]
    
    def get_item_count(self, obj):
        return obj.items.count()


class OrderListSerializer(serializers.ModelSerializer):
    """Sérialiseur allégé pour les listes de commandes"""
    customer_name = serializers.CharField(
        source='customer.get_full_name',
        read_only=True
    )
    customer_email = serializers.CharField(
        source='customer.email',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id',
            'customer_name',
            'customer_email',
            'status',
            'status_display',
            'total_amount',
            'item_count',
            'created_at',
            'confirmed_at',
            'delivered_at',
        ]
    
    def get_item_count(self, obj):
        return obj.items.count()


class OrderCreateSerializer(serializers.Serializer):
    """Sérialiseur pour créer une commande avec articles"""
    shipping_address = serializers.CharField(required=True)
    shipping_method = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    items = OrderItemCreateSerializer(many=True, write_only=True)
    
    def validate_items(self, value):
        """Valide les articles"""
        if not value:
            raise serializers.ValidationError(
                "Une commande doit contenir au moins un article."
            )

        requested_by_product = defaultdict(int)

        for item in value:
            if not item.get('product_id') or not item.get('quantity'):
                raise serializers.ValidationError(
                    "Chaque article doit avoir un produit et une quantité."
                )

            if item.get('quantity', 0) <= 0:
                raise serializers.ValidationError(
                    "La quantité doit être positive."
                )

            requested_by_product[int(item['product_id'])] += int(item['quantity'])

        products = {
            product.id: product
            for product in Product.objects.filter(id__in=requested_by_product.keys())
        }

        for product_id, total_requested in requested_by_product.items():
            product = products.get(product_id)
            if not product:
                raise serializers.ValidationError(
                    f"Le produit avec l'identifiant {product_id} n'existe pas."
                )

            if total_requested > product.quantity:
                raise serializers.ValidationError(
                    f"Stock insuffisant pour '{product.name}': restant {product.quantity}, demandé {total_requested}."
                )

        return value
    
    def create(self, validated_data):
        """Crée une ordre avec ses articles"""
        items_data = validated_data.pop('items')

        request = self.context.get('request')

        # Transaction atomique: création de commande + décrémentation de stock.
        with transaction.atomic():
            order = Order.objects.create(
                customer=request.user,
                shipping_address=validated_data.get('shipping_address'),
                shipping_method=validated_data.get('shipping_method', ''),
                notes=validated_data.get('notes', ''),
            )

            for item_data in items_data:
                product = Product.objects.select_for_update().get(id=item_data['product_id'])
                requested_quantity = int(item_data['quantity'])

                if requested_quantity > product.quantity:
                    raise serializers.ValidationError(
                        f"Stock insuffisant pour '{product.name}': disponible {product.quantity}, demandé {requested_quantity}."
                    )

                unit_price = item_data.get('unit_price') or product.price

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=requested_quantity,
                    unit_price=unit_price,
                    notes=item_data.get('notes', ''),
                )

                # Enregistrer la sortie de stock liée à la commande.
                StockExit.objects.create(
                    reference=f"ORD-{order.id}-{uuid4().hex[:8].upper()}",
                    exit_type='customer_delivery',
                    product=product,
                    quantity=requested_quantity,
                    order=order,
                    reason='sale',
                    prepared_by=request.user,
                    notes=f"Sortie automatique liée à la commande #{order.id}",
                )

            return order
