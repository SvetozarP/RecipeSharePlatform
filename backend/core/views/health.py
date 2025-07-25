"""
Health check views for monitoring system status.
"""

from datetime import datetime
from django.db import connection, DatabaseError
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


class BaseHealthCheckView(APIView):
    """Base class for health check views."""
    authentication_classes = []  # No authentication required
    permission_classes = []  # No permissions required

    def _check_database(self):
        """Check database connectivity."""
        try:
            # For SQLite, just checking if the connection is usable
            if connection.vendor == 'sqlite':
                return "connected" if connection.is_usable() else "disconnected"

            # For other databases, try a simple query
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            return "connected"
        except DatabaseError:
            return "disconnected"

    def _check_cache(self):
        """Check cache connectivity."""
        try:
            from django.core.cache import cache
            cache.get('health_check_test')
            return "connected"
        except Exception:
            return "disconnected"


class SimpleHealthCheckView(BaseHealthCheckView):
    """Simple health check that returns basic status."""

    def get(self, request):
        """Return basic health status."""
        return Response({"status": "healthy"}, status=status.HTTP_200_OK)


class APIHealthCheckView(BaseHealthCheckView):
    """Detailed health check that verifies system components."""

    def get(self, request):
        """Return detailed system health status."""
        # Test database connection
        db_status = self._check_database()

        # Get cache status
        cache_status = self._check_cache()

        # Determine overall status
        is_healthy = db_status == "connected"
        response_status = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

        response_data = {
            "status": "healthy" if is_healthy else "unhealthy",
            "timestamp": timezone.now().isoformat(),
            "services": {
                "database": db_status,
                "cache": cache_status
            }
        }

        return Response(response_data, status=response_status) 