"""
URL configuration for the project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Import health check view
from core.views.health import APIHealthCheckView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', APIHealthCheckView.as_view(), name='health_check'),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/users/', include('user_management.urls')),
    path('api/v1/recipes/', include('recipes.urls', namespace='recipes')),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 