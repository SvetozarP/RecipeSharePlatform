"""
URL configuration for recipe sharing platform project.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

from core.views.health import HealthCheckView

# Health check endpoint
def simple_health_check(request):
    """Simple health check endpoint."""
    return JsonResponse({"status": "healthy"})

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),

    # Health checks
    path('health/', simple_health_check, name='simple_health_check'),
    path('api/health/', HealthCheckView.as_view(), name='api_health_check'),

    # API endpoints
    path('api/v1/', include([
        # Add API endpoints here
    ])),
] 