from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, WarehouseViewSet, SupplierViewSet

router = DefaultRouter()
router.register(r"warehouses", WarehouseViewSet, basename="warehouse")
router.register(r"suppliers", SupplierViewSet, basename="supplier")
router.register(r"products", ProductViewSet, basename="product")

urlpatterns = [
    path("", include(router.urls)),
]
