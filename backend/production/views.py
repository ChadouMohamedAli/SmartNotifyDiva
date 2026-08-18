from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from activity.models import ActivityLog
from notifications.models import Notification

from .models import ProductionAlert, ProductionOrder, RawMaterial, FinishedProduct
from .serializers import (
    ProductionAlertResolveSerializer,
    ProductionAlertSerializer,
    ProductionOrderSerializer,
    RawMaterialSerializer,
    FinishedProductSerializer,
)


class AdminWriteMixin:
    def _ensure_admin_for_write(self):
        user = self.request.user
        if not (user.is_staff or user.is_superuser):
            raise PermissionDenied("Seuls les administrateurs peuvent modifier ce module")


class RawMaterialViewSet(AdminWriteMixin, viewsets.ModelViewSet):
    queryset = RawMaterial.objects.all()
    serializer_class = RawMaterialSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        self._ensure_admin_for_write()
        serializer.save()

    def perform_update(self, serializer):
        self._ensure_admin_for_write()
        serializer.save()

    def perform_destroy(self, instance):
        self._ensure_admin_for_write()
        instance.delete()


class ProductionOrderViewSet(AdminWriteMixin, viewsets.ModelViewSet):
    queryset = ProductionOrder.objects.select_related("product", "created_by").prefetch_related(
        "materials__material", "alerts"
    )
    serializer_class = ProductionOrderSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        self._ensure_admin_for_write()
        order = serializer.save(created_by=self.request.user)

        ActivityLog.objects.create(
            actor=self.request.user,
            action_type=ActivityLog.ACTION_PRODUCTION_ORDER_CREATED,
            title=f"Nouvel ordre de production: {order.code}",
            description=f"Produit: {order.product.name} | Quantité prévue: {order.planned_quantity}",
        )

        self._sync_alerts(order)

    def perform_update(self, serializer):
        self._ensure_admin_for_write()
        order = serializer.save()

        ActivityLog.objects.create(
            actor=self.request.user,
            action_type=ActivityLog.ACTION_PRODUCTION_ORDER_UPDATED,
            title=f"Ordre de production mis à jour: {order.code}",
            description=f"Statut: {order.get_status_display()} | Produit: {order.product.name}",
        )

        if order.issue_description:
            ActivityLog.objects.create(
                actor=self.request.user,
                action_type=ActivityLog.ACTION_PRODUCTION_ISSUE_REPORTED,
                title=f"Problème signalé sur {order.code}",
                description=order.issue_description,
            )

        self._sync_alerts(order)

    def perform_destroy(self, instance):
        self._ensure_admin_for_write()
        ActivityLog.objects.create(
            actor=self.request.user,
            action_type=ActivityLog.ACTION_PRODUCTION_ORDER_DELETED,
            title=f"Ordre de production supprimé: {instance.code}",
            description=f"Produit: {instance.product.name}",
        )
        instance.delete()

    def _sync_alerts(self, order):
        user = self.request.user

        if order.status == ProductionOrder.STATUS_DELAYED:
            alert = ProductionAlert.objects.filter(
                order=order,
                alert_type=ProductionAlert.TYPE_DELAY,
                is_resolved=False,
            ).first()
            if not alert:
                alert = ProductionAlert.objects.create(
                    order=order,
                    alert_type=ProductionAlert.TYPE_DELAY,
                    severity=ProductionAlert.SEVERITY_HIGH,
                    message=f"Ordre {order.code} en retard (échéance: {order.due_date}).",
                )
                Notification.objects.create(
                    user=user,
                    title=f"Retard production: {order.code}",
                    message=alert.message,
                    notification_type="alert_triggered",
                )
        else:
            ProductionAlert.objects.filter(
                order=order,
                alert_type=ProductionAlert.TYPE_DELAY,
                is_resolved=False,
            ).update(is_resolved=True, resolved_at=timezone.now())

        if order.issue_description.strip():
            issue_alert = ProductionAlert.objects.filter(
                order=order,
                alert_type=ProductionAlert.TYPE_ISSUE,
                is_resolved=False,
                message__iexact=order.issue_description.strip(),
            ).first()
            if not issue_alert:
                issue_alert = ProductionAlert.objects.create(
                    order=order,
                    alert_type=ProductionAlert.TYPE_ISSUE,
                    severity=ProductionAlert.SEVERITY_MEDIUM,
                    message=order.issue_description.strip(),
                )
                Notification.objects.create(
                    user=user,
                    title=f"Problème production: {order.code}",
                    message=issue_alert.message,
                    notification_type="alert_triggered",
                )

        if order.status == ProductionOrder.STATUS_COMPLETED:
            ProductionAlert.objects.filter(order=order, is_resolved=False).update(
                is_resolved=True,
                resolved_at=timezone.now(),
            )

    @action(detail=False, methods=["get"])
    def dashboard(self, request):
        orders = ProductionOrder.objects.select_related("product").all()
        in_production = orders.filter(status__in=[ProductionOrder.STATUS_IN_PROGRESS, ProductionOrder.STATUS_DELAYED])

        products = []
        seen_product_ids = set()
        for order in in_production:
            if order.product_id in seen_product_ids:
                continue
            seen_product_ids.add(order.product_id)
            products.append(
                {
                    "id": order.product_id,
                    "name": order.product.name,
                    "sku": order.product.sku,
                }
            )

        order_status = {
            "en_cours": orders.filter(status=ProductionOrder.STATUS_IN_PROGRESS).count(),
            "termine": orders.filter(status=ProductionOrder.STATUS_COMPLETED).count(),
            "retard": orders.filter(status=ProductionOrder.STATUS_DELAYED).count(),
        }

        raw_materials = RawMaterial.objects.count()
        open_alerts = ProductionAlert.objects.filter(is_resolved=False).count()
        recent_alerts = ProductionAlertSerializer(
            ProductionAlert.objects.select_related("order", "order__product")[:10],
            many=True,
        ).data

        return Response(
            {
                "products_in_production": products,
                "order_status": order_status,
                "raw_materials_count": raw_materials,
                "open_alerts_count": open_alerts,
                "recent_alerts": recent_alerts,
            }
        )


class ProductionAlertViewSet(AdminWriteMixin, viewsets.ReadOnlyModelViewSet):
    queryset = ProductionAlert.objects.select_related("order", "order__product")
    serializer_class = ProductionAlertSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["patch"])
    def resolve(self, request, pk=None):
        self._ensure_admin_for_write()
        alert = self.get_object()
        serializer = ProductionAlertResolveSerializer(alert, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProductionAlertSerializer(alert).data)


class FinishedProductViewSet(AdminWriteMixin, viewsets.ModelViewSet):
    """ViewSet pour gérer les produits finis"""
    queryset = FinishedProduct.objects.select_related('product', 'production_order')
    serializer_class = FinishedProductSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'quality_check_passed', 'production_date']
    search_fields = ['product__name', 'product__sku', 'batch_number']
    ordering_fields = ['production_date', 'quantity_produced', 'created_at']
    ordering = ['-production_date']
    
    def perform_create(self, serializer):
        self._ensure_admin_for_write()
        finished_product = serializer.save()
        ActivityLog.objects.create(
            actor=self.request.user,
            action_type=ActivityLog.ACTION_PRODUCT_CREATED,
            title=f"Produit fini créé: {finished_product.product.name}",
            description=f"Batch: {finished_product.batch_number} | Quantité: {finished_product.quantity_produced}",
        )
    
    def perform_update(self, serializer):
        self._ensure_admin_for_write()
        finished_product = serializer.save()
        ActivityLog.objects.create(
            actor=self.request.user,
            action_type=ActivityLog.ACTION_PRODUCT_UPDATED,
            title=f"Produit fini mis à jour: {finished_product.product.name}",
            description=f"Batch: {finished_product.batch_number} | Statut: {finished_product.get_status_display()}",
        )
    
    def perform_destroy(self, instance):
        self._ensure_admin_for_write()
        ActivityLog.objects.create(
            actor=self.request.user,
            action_type=ActivityLog.ACTION_PRODUCT_DELETED,
            title=f"Produit fini supprimé: {instance.product.name}",
            description=f"Batch: {instance.batch_number}",
        )
        instance.delete()
    
    @action(detail=True, methods=['patch'])
    def pass_quality_check(self, request, pk=None):
        """Marquer un produit fini comme passant le contrôle qualité"""
        finished_product = self.get_object()
        finished_product.quality_check_passed = True
        finished_product.quality_notes = request.data.get('quality_notes', '')
        finished_product.save()
        
        ActivityLog.objects.create(
            actor=request.user,
            action_type=ActivityLog.ACTION_PRODUCT_UPDATED,
            title=f"Contrôle qualité réussi: {finished_product.product.name}",
            description=f"Batch: {finished_product.batch_number}",
        )
        
        return Response(FinishedProductSerializer(finished_product).data)
