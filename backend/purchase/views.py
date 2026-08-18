from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.http import FileResponse
import logging
from notifications.models import Notification
from .models import PurchaseOrder, PurchaseOrderItem
from .serializers import PurchaseOrderSerializer, PurchaseOrderCreateUpdateSerializer, PurchaseOrderItemSerializer
from .pdf_generator import PurchaseOrderPDFGenerator
from .permissions import IsSuperAdmin, CanApproveOrRejectPurchase

logger = logging.getLogger(__name__)


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    """
    API ViewSet pour gérer les Bons d'Achat (Purchase Orders)
    Endpoints:
    - GET /api/purchase-orders/          -> List all
    - POST /api/purchase-orders/          -> Create (status forcé à "pending")
    - GET /api/purchase-orders/{id}/      -> Detail
    - PUT /api/purchase-orders/{id}/      -> Update
    - DELETE /api/purchase-orders/{id}/   -> Delete
    - POST /api/purchase-orders/{id}/approve/ -> Approuver (super admin only)
    - POST /api/purchase-orders/{id}/reject/  -> Rejeter (super admin only)
    """
    
    queryset = PurchaseOrder.objects.all().select_related('supplier', 'created_by').prefetch_related('items')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PurchaseOrderCreateUpdateSerializer
        return PurchaseOrderSerializer
    
    def create(self, request, *args, **kwargs):
        """Override create pour logger les erreurs de serializer"""
        print(f"\n\n{'='*80}")
        print(f"🔵 PURCHASE ORDER CREATE REQUEST")
        print(f"{'='*80}")
        print(f"📥 Request data: {request.data}")
        print(f"{'='*80}\n")
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"\n❌ SERIALIZER VALIDATION FAILED")
            print(f"Errors: {serializer.errors}")
            logger.error(f"❌ Serializer errors: {serializer.errors}")
            logger.error(f"📥 Request data: {request.data}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            print(f"\n SERIALIZER VALID - CREATING PURCHASE ORDER")
            self.perform_create(serializer)
            print(f" PURCHASE ORDER CREATED SUCCESSFULLY with status: {serializer.instance.status}")
            
            # Retourner la réponse avec le serializer read-only
            instance = self.get_queryset().get(id=serializer.instance.id)
            response_serializer = PurchaseOrderSerializer(instance)
            headers = self.get_success_headers(response_serializer.data)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            print(f"\n❌ ERROR DURING CREATION: {type(e).__name__}")
            print(f"Error message: {str(e)}")
            import traceback
            print(f"Traceback:\n{traceback.format_exc()}")
            logger.error(f"❌ Error during creation: {str(e)}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def update(self, request, *args, **kwargs):
        """Override update pour logger les erreurs de serializer"""
        print(f"\n\n{'='*80}")
        print(f"PURCHASE ORDER UPDATE REQUEST")
        print(f"{'='*80}")
        print(f"Request data: {request.data}")
        print(f"{'='*80}\n")
        
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if not serializer.is_valid():
            print(f"\nSERIALIZER VALIDATION FAILED")
            print(f"Errors: {serializer.errors}")
            logger.error(f"Serializer errors: {serializer.errors}")
            logger.error(f"Request data: {request.data}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            print(f"\nSERIALIZER VALID - UPDATING PURCHASE ORDER")
            self.perform_update(serializer)
            print(f"PURCHASE ORDER UPDATED SUCCESSFULLY")
            
            # Retourner la réponse avec le serializer read-only
            updated_instance = self.get_queryset().get(id=instance.id)
            response_serializer = PurchaseOrderSerializer(updated_instance)
            return Response(response_serializer.data)
        except Exception as e:
            print(f"\nERROR DURING UPDATE: {type(e).__name__}")
            print(f"Error message: {str(e)}")
            import traceback
            print(f"Traceback:\n{traceback.format_exc()}")
            logger.error(f"Error during update: {str(e)}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_queryset(self):
        """Filtrer les commandes selon le rôle utilisateur"""
        user = self.request.user
        
        # Super admin et staff voient tout
        if user.is_superuser or user.is_staff:
            return self.queryset
        
        # Responsable appro voit les commandes qu'il a créées
        if user.role == 'responsable_appro':
            return self.queryset.filter(created_by=user)
        
        # Les autres utilisateurs ne voient rien
        return self.queryset.none()
    
    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """Récupérer les commandes par statut: /api/purchase-orders/by-status/?status=pending"""
        status_filter = request.query_params.get('status', None)
        
        if not status_filter:
            return Response({'error': 'Status parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = self.get_queryset().filter(status=status_filter)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Récupérer les statistiques des commandes: /api/purchase-orders/statistics/"""
        queryset = self.get_queryset()
        
        stats = {
            'total_orders': queryset.count(),
            'pending': queryset.filter(status='pending').count(),
            'approved': queryset.filter(status='approved').count(),
            'sent': queryset.filter(status='sent').count(),
            'delivered': queryset.filter(status='delivered').count(),
            'cancelled': queryset.filter(status='cancelled').count(),
            'total_amount': sum(po.total_amount for po in queryset),
        }
        return Response(stats)
    
    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def approve(self, request, pk=None):
        """Approuver un bon d'achat (super admin uniquement)"""
        try:
            purchase_order = self.get_object()
            if purchase_order.status != 'pending':
                return Response({"error": "Seuls les bons d'achat en attente peuvent être approuvés."}, status=status.HTTP_400_BAD_REQUEST)

            purchase_order.status = 'approved'
            purchase_order.save()

            # Envoyer une notification au créateur du bon d'achat (Admin appro)
            if purchase_order.created_by:
                try:
                    notification = Notification.objects.create(
                        user=purchase_order.created_by,
                        title=f"Bon d'achat #{purchase_order.id} approuvé",
                        message=f"Le bon d'achat #{purchase_order.id} pour le fournisseur {purchase_order.supplier.name} d'un montant de {purchase_order.total_amount} € a été approuvé par {request.user.username}.",
                        notification_type='system'
                    )
                    # Forcer le canal email
                    notification.channels = ['email', 'inapp']
                    notification.save()
                    
                    try:
                        notification.send_email_notification()
                    except Exception:
                        pass
                        
                    try:
                        notification.send_telegram_notification()
                    except Exception:
                        pass
                except Exception as e:
                    logger.error(f"Erreur lors de la notification d'approbation: {str(e)}")

            return Response({
                "message": "Bon d'achat approuvé avec succès.",
                "id": purchase_order.id,
                "status": purchase_order.status
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Erreur lors de l'approbation: {str(e)}", exc_info=True)
            return Response({"error": "Erreur lors de l'approbation du bon d'achat."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def reject(self, request, pk=None):
        """Rejeter une commande: POST /api/purchase-orders/{id}/reject/
         Seul le SUPER ADMIN peut rejeter
        """
        purchase_order = self.get_object()
        
        # 🔒 CORRECTION: Vérifier que le bon est bien en attente avant rejet
        if purchase_order.status != 'pending':
            return Response(
                {'error': f"Impossible de rejeter : le statut actuel est '{purchase_order.status}'"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        purchase_order.status = 'rejected'
        # Optionnel : enregistrer qui a rejeté et quand
        if hasattr(purchase_order, 'rejected_by'):
            purchase_order.rejected_by = request.user
        if hasattr(purchase_order, 'rejected_at'):
            purchase_order.rejected_at = timezone.now()
        purchase_order.save()
        
        # Envoyer une notification au créateur du bon d'achat (Admin appro)
        if purchase_order.created_by:
            try:
                notification = Notification.objects.create(
                    user=purchase_order.created_by,
                    title=f"Bon d'achat #{purchase_order.id} rejeté",
                    message=f"Le bon d'achat #{purchase_order.id} pour le fournisseur {purchase_order.supplier.name} a été rejeté par {request.user.username}.",
                    notification_type='system'
                )
                notification.channels = ['email', 'inapp']
                notification.save()
                
                try:
                    notification.send_email_notification()
                except Exception:
                    pass
                    
                try:
                    notification.send_telegram_notification()
                except Exception:
                    pass
            except Exception as e:
                logger.error(f"Erreur lors de la notification de rejet: {str(e)}")
        
        serializer = self.get_serializer(purchase_order)
        return Response({
            'message': 'Commande rejetée avec succès',
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Envoyer une commande: POST /api/purchase-orders/{id}/send/"""
        purchase_order = self.get_object()
        purchase_order.status = 'sent'
        purchase_order.save()
        serializer = self.get_serializer(purchase_order)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def deliver(self, request, pk=None):
        """Marquer comme livrée: POST /api/purchase-orders/{id}/deliver/"""
        purchase_order = self.get_object()
        purchase_order.status = 'delivered'
        purchase_order.save()
        serializer = self.get_serializer(purchase_order)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Annuler une commande: POST /api/purchase-orders/{id}/cancel/"""
        purchase_order = self.get_object()
        purchase_order.status = 'cancelled'
        purchase_order.save()
        serializer = self.get_serializer(purchase_order)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def export_pdf(self, request, pk=None):
        """Exporter une commande en PDF: GET /api/purchase-orders/{id}/export_pdf/"""
        try:
            purchase_order = self.get_object()
            is_super_admin = request.user.is_superuser
            is_appro_admin = getattr(request.user, 'role', '') == 'responsable_appro'

            if not (is_super_admin or is_appro_admin):
                return Response(
                    {'error': "Vous n'avez pas l'autorisation d'exporter ce bon d'achat."},
                    status=status.HTTP_403_FORBIDDEN
                )

            if purchase_order.status != 'approved':
                return Response(
                    {'error': "Le PDF n'est disponible qu'après approbation du bon d'achat."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Générer le PDF
            pdf_generator = PurchaseOrderPDFGenerator(purchase_order)
            pdf_buffer = pdf_generator.generate()
            
            # Retourner le fichier PDF
            filename = f"bon_achat_{purchase_order.id}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            response = FileResponse(pdf_buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération du PDF: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Erreur lors de la génération du PDF: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def fix_pending_status(self, request):
        """
        POST /api/purchase/purchase-orders/fix_pending_status/
        Corrige tous les bons d'achat en "approved" qui n'ont jamais été approuvés
        (Uniquement pour le super admin)
        """
        if not request.user.is_superuser:
            return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)
        
        from datetime import timedelta
        
        # Trouver les bons créés dans les dernières 24h qui sont "approved" (probablement une erreur)
        recent_orders = PurchaseOrder.objects.filter(
            status='approved',
            order_date__gte=timezone.now() - timedelta(hours=24)
        )
        
        count = recent_orders.count()
        recent_orders.update(status='pending')
        
        return Response({
            'message': f'{count} bon(s) d\'achat corrigé(s) de "approved" vers "pending"',
            'fixed_count': count
        })