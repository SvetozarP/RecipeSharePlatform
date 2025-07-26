"""
URL configuration for the project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Import health check views
from core.views.health import APIHealthCheckView, SimpleHealthCheckView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', SimpleHealthCheckView.as_view(), name='simple_health_check'),
    path('api/health/', APIHealthCheckView.as_view(), name='api_health_check'),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/users/', include('user_management.urls')),
    path('api/v1/recipes/', include('recipes.urls', namespace='recipes')),
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