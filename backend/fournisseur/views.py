from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Supplier
from .serializers import SupplierSerializer
from activity.models import ActivityLog


class SupplierViewSet(viewsets.ModelViewSet):
	queryset = Supplier.objects.all()
	serializer_class = SupplierSerializer
	permission_classes = [IsAuthenticated]

	def perform_create(self, serializer):
		"""Créer un fournisseur et logger l'activité"""
		supplier = serializer.save()
		ActivityLog.objects.create(
			actor=self.request.user,
			action_type="creation",
			title=f"Nouveau fournisseur: {supplier.name}",
			description=f"Fournisseur créé avec succès",
		)

	def perform_update(self, serializer):
		"""Modifier un fournisseur et logger l'activité"""
		supplier = serializer.save()
		ActivityLog.objects.create(
			actor=self.request.user,
			action_type="modification",
			title=f"Modification du fournisseur: {supplier.name}",
			description=f"Fournisseur modifié avec succès",
		)

	def perform_destroy(self, instance):
		"""Supprimer un fournisseur et logger l'activité"""
		ActivityLog.objects.create(
			actor=self.request.user,
			action_type="suppression",
			title=f"Suppression du fournisseur: {instance.name}",
			description=f"Fournisseur supprimé avec succès",
		)
		instance.delete()
