from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EntrepotViewSet

router = DefaultRouter()
router.register(r'entrepots', EntrepotViewSet, basename='entrepot')

urlpatterns = [
    path('', include(router.urls)),
]
