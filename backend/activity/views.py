from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import ActivityLog
from .serializers import ActivityLogSerializer


class ActivityHistoryPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


def _assert_admin(user):
    if not (user.is_superuser or user.is_staff or getattr(user, "is_primary_admin", False)):
        raise PermissionDenied("Acces reserve aux administrateurs")


def _module_prefixes(module_name):
    return {
        "stock": ("product_", "category_"),
        "alerts": ("alert_",),
        "orders": ("production_order_",),
    }.get(module_name, ())


class RecentActivityListView(generics.ListAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        _assert_admin(user)

        # Filtrer les activités de l'utilisateur connecté uniquement
        queryset = ActivityLog.objects.filter(actor=user).select_related("actor").order_by("-created_at")
        
        limit_param = self.request.query_params.get("limit")
        try:
            limit = int(limit_param) if limit_param else 6
        except (TypeError, ValueError):
            limit = 6

        if limit > 0:
            return queryset[:limit]
        return queryset


class ActivityHistoryListView(generics.ListAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ActivityHistoryPagination

    def get_queryset(self):
        user = self.request.user
        _assert_admin(user)

        queryset = ActivityLog.objects.select_related("actor").order_by("-created_at")

        module_name = self.request.query_params.get("module")
        prefixes = _module_prefixes(module_name) if module_name else ()
        if prefixes:
            queryset = queryset.filter(action_type__startswith=prefixes[0]) if len(prefixes) == 1 else queryset
            if len(prefixes) > 1:
                from django.db.models import Q

                query = Q(action_type__startswith=prefixes[0])
                for prefix in prefixes[1:]:
                    query |= Q(action_type__startswith=prefix)
                queryset = queryset.filter(query)

        type_name = self.request.query_params.get("type")
        if type_name == "stock":
            queryset = queryset.filter(action_type__regex=r"^(product_|category_)")
        elif type_name == "movement":
            queryset = queryset.filter(action_type__startswith="production_order_")
        elif type_name == "alert":
            queryset = queryset.filter(action_type__startswith="alert_")

        return queryset
