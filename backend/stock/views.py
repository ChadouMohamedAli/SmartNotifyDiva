from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import action
from rest_framework.response import Response
from activity.models import ActivityLog
from alerts.services import evaluate_stock_alerts_for_product, ensure_auto_stock_alert
from notifications.models import Notification
from django.core.mail import send_mail
from django.conf import settings
from smartalerte_project.telegram_utils import send_telegram_to_user
from django.db.models import F
from .models import Product, Warehouse, Supplier
from categories.models import category as Category
from .serializers import ProductSerializer, ProductListSerializer, ProductDetailSerializer, WarehouseSerializer, SupplierSerializer


# ============ WAREHOUSE VIEWSET ============
class WarehouseViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les entrepôts
    """
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active', 'country']
    search_fields = ['name', 'code', 'city']
    ordering_fields = ['name', 'created_at']


# ============ SUPPLIER VIEWSET ============
class SupplierViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les fournisseurs
    """
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['is_active', 'country']
    search_fields = ['name', 'contact_name', 'email', 'city']
    ordering_fields = ['name', 'created_at']


# ============ PRODUCT VIEWSET ============
class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les produits
    """
    queryset = Product.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['category', 'material_type', 'supplier', 'warehouse', 'status']
    search_fields = ['name', 'sku', 'supplier__name', 'category__name', 'material_type']
    ordering_fields = ['name', 'sku', 'quantity', 'created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        elif self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

    def _resolve_status(self, quantity, min_quantity):
        """Détermine le statut automatiquement selon les règles métier."""
        if quantity <= 0:
            return Product.STATUS_RUPTURE
        if quantity < min_quantity:
            return Product.STATUS_LOW
        return Product.STATUS_OPTIMAL

    def perform_create(self, serializer):
        # Seul l'admin peut créer des produits
        can_create = (
            self.request.user.is_staff
            or self.request.user.is_superuser
            or getattr(self.request.user, "role", None) == "responsable_stock"
        )
        if not can_create:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seuls les administrateurs et responsables stock peuvent créer des produits")

        quantity = int(serializer.validated_data.get("quantity", 0) or 0)
        min_quantity = int(serializer.validated_data.get("min_quantity", 0) or 0)
        auto_status = self._resolve_status(quantity, min_quantity)

        product = serializer.save(status=auto_status)

        ActivityLog.objects.create(
            actor=self.request.user,
            action_type=ActivityLog.ACTION_PRODUCT_CREATED,
            title=f"Nouveau produit: {product.name}",
            description=f"SKU: {product.sku} | Quantite: {product.quantity}",
        )

        ensure_auto_stock_alert()
        evaluate_stock_alerts_for_product(product)

    def perform_update(self, serializer):
        quantity = int(serializer.validated_data.get("quantity", serializer.instance.quantity) or 0)
        min_quantity = int(serializer.validated_data.get("min_quantity", serializer.instance.min_quantity) or 0)
        auto_status = self._resolve_status(quantity, min_quantity)

        product = serializer.save(status=auto_status)
        user = self.request.user

        ActivityLog.objects.create(
            actor=user,
            action_type=ActivityLog.ACTION_PRODUCT_UPDATED,
            title=f"Produit mis à jour: {product.name}",
            description=f"SKU: {product.sku} | Quantite: {product.quantity}",
        )
        
        message = None
        subject = None
        title = None

        if product.quantity <= 0:
            title = f"Rupture de stock - {product.name}"
            subject = f"Rupture de stock - {product.name}"
            message = (
                f"Bonjour,\n\n"
                f"ALERTE RUPTURE DE STOCK\n\n"
                f"Produit : {product.name} ({product.sku})\n"
                f"Quantité actuelle : 0\n"
                f"Quantité minimum requise : {product.min_quantity}\n\n"
                f"Actions recommandées :\n"
                f"• Réapprovisionner immédiatement le produit {product.name}\n"
                f"• Contacter le fournisseur en urgence\n"
                f"• Vérifier les commandes impactées\n\n"
                f"Cordialement,\nSmartNotify"
            )
        elif product.quantity < product.min_quantity:
            title = f"Stock faible - {product.name}"
            subject = f"Alerte Stock Faible - {product.name}"
            message = (
                f"Bonjour,\n\n"
                f"ALERTE STOCK FAIBLE\n\n"
                f"Produit : {product.name} ({product.sku})\n"
                f"Quantité actuelle : {product.quantity}\n"
                f"Quantité minimum requise : {product.min_quantity}\n\n"
                f"Actions recommandées :\n"
                f"• Remplir le stock du produit {product.name}\n"
                f"• Contactez votre fournisseur pour une commande d'urgence\n"
                f"• Vérifiez les niveaux de stock régulièrement\n\n"
                f"Cordialement,\nSmartNotify"
            )

        if message:
            Notification.objects.create(
                user=user,
                alert=None,
                title=title,
                message=message,
                notification_type="alert_triggered",
            )

            if user.email:
                try:
                    send_mail(
                        subject=subject,
                        message=message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        fail_silently=True,
                    )
                except Exception as e:
                    import logging
                    logging.error(f"Erreur envoi email à {user.email}: {e}")

            try:
                send_telegram_to_user(user, message)
            except Exception:
                pass
        
        ensure_auto_stock_alert()
        evaluate_stock_alerts_for_product(product)

    def perform_destroy(self, instance):
        # Seul l'admin peut supprimer des produits
        if not self.request.user.is_staff and not self.request.user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seuls les administrateurs peuvent supprimer des produits")

        ActivityLog.objects.create(
            actor=self.request.user,
            action_type=ActivityLog.ACTION_PRODUCT_DELETED,
            title=f"Produit supprimé: {instance.name}",
            description=f"SKU: {instance.sku} | Quantite: {instance.quantity}",
        )

        instance.delete()

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """
        Retourne les produits avec stock faible (quantité < min_quantity)
        """
        products = self.get_queryset().filter(quantity__gt=0, quantity__lt=F("min_quantity"))
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """
        Retourne les produits groupés par catégorie
        """
        category_id = request.query_params.get('category_id')
        if category_id:
            products = self.get_queryset().filter(category_id=category_id)
        else:
            products = self.get_queryset()
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_warehouse(self, request):
        """
        Retourne les produits groupés par entrepôt
        """
        warehouse_id = request.query_params.get('warehouse_id')
        if warehouse_id:
            products = self.get_queryset().filter(warehouse_id=warehouse_id)
        else:
            products = self.get_queryset()
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)
