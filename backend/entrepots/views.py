from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Entrepot
from .serializers import EntrepotSerializer
from activity.models import ActivityLog


class EntrepotViewSet(viewsets.ModelViewSet):
    """
    API ViewSet pour gérer les entrepôts
    """
    queryset = Entrepot.objects.all()
    serializer_class = EntrepotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        """Créer un entrepôt et logger l'activité"""
        entrepot = serializer.save()
        # Logger l'activité
        ActivityLog.objects.create(
            actor=self.request.user,
            action_type=ActivityLog.ACTION_PRODUCT_CREATED,
            title=f"Nouvel entrepôt: {entrepot.name}",
            description=f"Entrepôt {entrepot.code} créé avec succès",
        )

    def get_queryset(self):
        """Filtrer les entrepôts selon les paramètres"""
        queryset = Entrepot.objects.all()
        
        # Filtrer par statut
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filtrer par ville
        city = self.request.query_params.get('city', None)
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        # Filtrer par pays
        country = self.request.query_params.get('country', None)
        if country:
            queryset = queryset.filter(country__icontains=country)
        
        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Retourner les statistiques des entrepôts"""
        total = Entrepot.objects.count()
        active = Entrepot.objects.filter(is_active=True).count()
        inactive = Entrepot.objects.filter(is_active=False).count()
        total_capacity = sum(e.capacity for e in Entrepot.objects.all())
        
        return Response({
            'total': total,
            'active': active,
            'inactive': inactive,
            'total_capacity': total_capacity,
        })
