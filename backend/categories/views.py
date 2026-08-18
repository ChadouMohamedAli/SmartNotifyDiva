from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from .models import category
from .serializers import CategorySerializer
from activity.models import ActivityLog


class CategoryViewSet(viewsets.ModelViewSet):
	queryset = category.objects.all()
	serializer_class = CategorySerializer
	permission_classes = [IsAuthenticated]

	def get_permissions(self):
		"""Allow anyone to list categories"""
		if self.action == 'list':
			return [AllowAny()]
		return super().get_permissions()

	def get_queryset(self):
		"""Return all categories"""
		return category.objects.all()

	def perform_create(self, serializer):
		"""Créer une catégorie et logger l'activité"""
		category_obj = serializer.save()
		# Logger l'activité
		ActivityLog.objects.create(
			actor=self.request.user,
			action_type=ActivityLog.ACTION_CATEGORY_CREATED,
			title=f"Nouvelle catégorie: {category_obj.name}",
			description=f"Catégorie créée avec succès",
		)

	@action(detail=False, methods=['get'])
	def list_names(self, request):
		"""Return a list of category names only"""
		categories = self.get_queryset()
		return Response([cat.name for cat in categories])
