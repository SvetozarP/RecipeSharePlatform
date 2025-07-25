"""
URL configuration for recipe sharing platform project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response

from core.views.health import HealthCheckView

@api_view(['GET'])
@authentication_classes([])  # No authentication required
@permission_classes([])  # No permissions required
def simple_health_check(request):
    """Simple health check endpoint."""
    return Response({"status": "healthy"})

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),

    # Health checks
    path('health/', simple_health_check, name='simple_health_check'),
    path('api/health/', HealthCheckView.as_view(), name='api_health_check'),

    # API endpoints
    path('api/v1/', include([
        path('auth/', include('accounts.urls')),
    ])),
]

# Debug toolbar - only in development
if settings.DEBUG and 'debug_toolbar' in settings.INSTALLED_APPS:
    urlpatterns += [
        path('__debug__/', include('debug_toolbar.urls')),
    ] 