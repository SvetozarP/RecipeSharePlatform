"""
URL configuration for the project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from core.views.health import SimpleHealthCheckView, APIHealthCheckView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('accounts.urls', namespace='accounts')),
    path('api/v1/', include('user_management.urls', namespace='user_management')),
    path('api/v1/', include('recipes.urls', namespace='recipes')),
    
    # Health checks
    path('health/', SimpleHealthCheckView.as_view(), name='simple_health_check'),
    path('api/health/', APIHealthCheckView.as_view(), name='api_health_check'),
]

# Add debug toolbar URLs only in development
if settings.DEBUG and 'debug_toolbar' in settings.INSTALLED_APPS:
    urlpatterns += [
        path('__debug__/', include('debug_toolbar.urls')),
    ] 