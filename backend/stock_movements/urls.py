from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StockMovementViewSet, StockEntryViewSet, StockExitViewSet

router = DefaultRouter()
router.register(r'entries', StockEntryViewSet, basename='stock-entry')
router.register(r'exits', StockExitViewSet, basename='stock-exit')
router.register(r'movements', StockMovementViewSet, basename='stock-movement')

urlpatterns = [
    path('', include(router.urls)),
]