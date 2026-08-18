from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum
from django.utils import timezone
from datetime import timedelta

from .models import StockMovement, StockEntry, StockExit
from .serializers import (
    StockMovementSerializer,
    StockMovementListSerializer,
    StockEntrySerializer,
    StockExitSerializer,
)
from stock.models import Product


# ============ STOCK ENTRY VIEWSET ============
class StockEntryViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les entrées de stock"""
    
    queryset = StockEntry.objects.all()
    serializer_class = StockEntrySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['reference', 'product__name', 'product__sku', 'supplier__name', 'notes']
    ordering_fields = ['entry_date', 'quantity', 'reason']
    ordering = ['-entry_date']
    
    def perform_create(self, serializer):
        """Enregistre l'utilisateur responsable automatiquement"""
        serializer.save(received_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Crée une entrée avec gestion d'erreurs"""
        try:
            return super().create(request, *args, **kwargs)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# ============ STOCK EXIT VIEWSET ============
class StockExitViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les sorties de stock"""
    
    queryset = StockExit.objects.all()
    serializer_class = StockExitSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['reference', 'product__name', 'product__sku', 'notes']
    ordering_fields = ['exit_date', 'quantity', 'reason']
    ordering = ['-exit_date']
    
    def perform_create(self, serializer):
        """Enregistre l'utilisateur responsable automatiquement"""
        serializer.save(prepared_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Crée une sortie avec gestion d'erreurs"""
        try:
            return super().create(request, *args, **kwargs)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# ============ STOCK MOVEMENT VIEWSET ============
class StockMovementViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les mouvements de stock généraux"""
    
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product__name', 'product__sku', 'reference', 'notes']
    ordering_fields = ['created_at', 'movement_type', 'quantity']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Retourne les mouvements disponibles pour l'utilisateur"""
        return StockMovement.objects.select_related(
            'product', 'responsible'
        ).all()
    
    def get_serializer_class(self):
        """Utilise un sérialiseur allégé pour les listes"""
        if self.action == 'list':
            return StockMovementListSerializer
        return StockMovementSerializer
    
    def perform_create(self, serializer):
        """Enregistre l'utilisateur responsable automatiquement"""
        serializer.save(responsible=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Crée un nouveau mouvement de stock avec gestion d'erreurs"""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Filtrer les mouvements par type"""
        movement_type = request.query_params.get('type')
        
        if not movement_type:
            return Response(
                {'error': 'Le paramètre "type" est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if movement_type not in ['entry', 'exit', 'transfer']:
            return Response(
                {'error': 'Type invalide. Utilisez: entry, exit ou transfer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(movement_type=movement_type)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_product(self, request):
        """Filtrer par produit spécifique"""
        product_id = request.query_params.get('product_id')
        
        if not product_id:
            return Response(
                {'error': 'Le paramètre "product_id" est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Produit non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        queryset = self.get_queryset().filter(product=product)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Retourne les mouvements récents (dernier 7 jours)"""
        days = int(request.query_params.get('days', 7))
        start_date = timezone.now() - timedelta(days=days)
        
        queryset = self.get_queryset().filter(created_at__gte=start_date)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Retourne les statistiques des mouvements"""
        queryset = self.get_queryset()
        
        stats = {
            'total_movements': queryset.count(),
            'total_entries': queryset.filter(movement_type='entry').count(),
            'total_exits': queryset.filter(movement_type='exit').count(),
            'total_transfers': queryset.filter(movement_type='transfer').count(),
            'total_quantity_entered': queryset.filter(movement_type='entry').aggregate(total=Sum('quantity'))['total'] or 0,
            'total_quantity_exited': queryset.filter(movement_type='exit').aggregate(total=Sum('quantity'))['total'] or 0,
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def by_responsible(self, request):
        """Filtrer par responsable"""
        responsible_id = request.query_params.get('user_id')
        
        if not responsible_id:
            return Response(
                {'error': 'Le paramètre "user_id" est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(responsible_id=responsible_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Crée plusieurs mouvements à la fois"""
        movements_data = request.data
        
        if not isinstance(movements_data, list):
            return Response(
                {'error': 'Les données doivent être une liste'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_movements = []
        errors = []
        
        for idx, movement_data in enumerate(movements_data):
            serializer = self.get_serializer(data=movement_data)
            if serializer.is_valid():
                try:
                    self.perform_create(serializer)
                    created_movements.append(serializer.data)
                except ValueError as e:
                    errors.append({
                        'index': idx,
                        'error': str(e)
                    })
            else:
                errors.append({
                    'index': idx,
                    'errors': serializer.errors
                })
        
        return Response({
            'created': len(created_movements),
            'failed': len(errors),
            'movements': created_movements,
            'errors': errors,
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def date_range(self, request):
        """Filtrer les mouvements par plage de dates"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {'error': 'Les paramètres "start_date" et "end_date" sont requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.utils.dateparse import parse_datetime
            start = parse_datetime(start_date)
            end = parse_datetime(end_date)
            
            if not start or not end:
                raise ValueError()
        except (ValueError, TypeError):
            return Response(
                {'error': 'Format de date invalide. Utilisez ISO format (2024-03-05T10:30:00)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(
            created_at__gte=start,
            created_at__lte=end
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)