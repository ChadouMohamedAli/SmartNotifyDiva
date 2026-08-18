from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', RedirectView.as_view(url='/api/', permanent=False)),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/admin/', include('accounts.urls')),
    path('api/alerts/', include('alerts.urls')),
    path('api/stock/', include('stock.urls')),
    path('api/stock/', include('stock_movements.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/fournisseurs/', include('fournisseur.urls')),
    path('api/categories/', include('categories.urls')),
    path('api/entrepots/', include('entrepots.urls')),
    path('api/facturation/', include('facturation.urls')),
    path('api/production/', include('production.urls')),
    path('api/purchase/', include('purchase.urls')),
    path('api/activity/', include('activity.urls')),
    path('api/notifications/', include('notifications.urls')),
]

# Servir les fichiers media en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)