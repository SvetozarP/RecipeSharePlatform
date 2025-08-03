"""
URL configuration for the project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Import health check views
from core.views.health import APIHealthCheckView, SimpleHealthCheckView
# Import performance monitoring views
from core.views.performance import (
    performance_metrics, system_stats, slow_queries, 
    cache_stats, clear_cache, export_metrics, health_check
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', SimpleHealthCheckView.as_view(), name='simple_health_check'),
    path('api/health/', APIHealthCheckView.as_view(), name='api_health_check'),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/users/', include('user_management.urls')),
    path('api/v1/recipes/', include('recipes.urls', namespace='recipes')),
    path('api/v1/admin/', include('admin_api.urls')),
    
    # Performance monitoring endpoints
    path('api/v1/performance/metrics/', performance_metrics, name='performance_metrics'),
    path('api/v1/performance/system/', system_stats, name='system_stats'),
    path('api/v1/performance/slow-queries/', slow_queries, name='slow_queries'),
    path('api/v1/performance/cache/', cache_stats, name='cache_stats'),
    path('api/v1/performance/cache/clear/', clear_cache, name='clear_cache'),
    path('api/v1/performance/export/', export_metrics, name='export_metrics'),
    path('api/v1/performance/health/', health_check, name='performance_health_check'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
    # Add debug toolbar URLs for development
    if 'debug_toolbar' in settings.INSTALLED_APPS:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns 