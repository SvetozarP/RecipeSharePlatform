"""
Health check views.
Provides endpoints for monitoring system health.
"""

from django.db import connection
from django.core.cache import cache
from rest_framework.permissions import AllowAny

from .base import BaseAPIView


class HealthCheckView(BaseAPIView):
    """
    View for checking system health.
    Checks database and cache connectivity.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        """
        Check system health.
        
        Returns:
            200 OK if all systems are healthy
            503 Service Unavailable if any system is unhealthy
        """
        health_status = {
            'status': 'healthy',
            'database': self._check_database(),
            'cache': self._check_cache(),
        }

        # Overall status is healthy only if all checks pass
        if not all(health_status.values()):
            health_status['status'] = 'unhealthy'
            return self.get_error_response(
                message='System is unhealthy',
                code='system_unhealthy',
                status_code=503,
                details=health_status
            )

        return self.get_success_response(
            data=health_status,
            message='System is healthy'
        )

    def _check_database(self) -> bool:
        """Check database connectivity."""
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
                cursor.fetchone()
            return True
        except Exception:
            return False

    def _check_cache(self) -> bool:
        """Check cache connectivity."""
        try:
            cache.set('health_check', 'ok', 1)
            return cache.get('health_check') == 'ok'
        except Exception:
            return False 