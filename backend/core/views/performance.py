"""
Performance monitoring API endpoints.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

from core.services.performance_monitor import performance_monitor
from core.services.cache_manager import cache_manager


@api_view(['GET'])
@permission_classes([IsAdminUser])
def performance_metrics(request):
    """
    Get comprehensive performance metrics.
    
    Returns system, database, cache, and request performance data.
    """
    try:
        # Get time range from query parameters
        minutes = int(request.query_params.get('minutes', 60))
        
        # Get performance report
        report = performance_monitor.get_performance_report()
        
        # Add cache statistics
        cache_stats = cache_manager.get_cache_stats()
        report['cache']['detailed'] = cache_stats
        
        # Add timestamp
        report['generated_at'] = timezone.now()
        report['time_range_minutes'] = minutes
        
        return Response(report)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get performance metrics: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def system_stats(request):
    """
    Get current system statistics.
    
    Returns CPU, memory, disk, and database usage.
    """
    try:
        from core.services.performance_monitor import SystemMonitor
        
        system_stats = SystemMonitor.get_system_stats()
        db_stats = SystemMonitor.get_database_stats()
        
        return Response({
            'system': system_stats,
            'database': db_stats,
            'timestamp': timezone.now()
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get system stats: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def slow_queries(request):
    """
    Get slow database queries.
    
    Returns queries that took longer than the threshold.
    """
    try:
        minutes = int(request.query_params.get('minutes', 60))
        slow_queries = performance_monitor.query_profiler.get_slow_queries(minutes)
        
        return Response({
            'slow_queries': slow_queries,
            'count': len(slow_queries),
            'time_range_minutes': minutes,
            'timestamp': timezone.now()
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get slow queries: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def cache_stats(request):
    """
    Get cache performance statistics.
    
    Returns hit rates, misses, and cache efficiency metrics.
    """
    try:
        from core.services.performance_monitor import CacheMonitor
        
        cache_stats = CacheMonitor.get_cache_stats()
        
        # Get cache manager stats
        cache_manager_stats = {
            'total_keys': len(cache_manager.metrics.metrics),
            'cache_hits': cache_manager.metrics.get_average('cache_hits', 60) or 0,
            'cache_misses': cache_manager.metrics.get_average('cache_misses', 60) or 0,
        }
        
        return Response({
            'cache': cache_stats,
            'cache_manager': cache_manager_stats,
            'timestamp': timezone.now()
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get cache stats: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def clear_cache(request):
    """
    Clear application cache.
    
    Clears all cached data and resets cache statistics.
    """
    try:
        # Clear cache manager
        cache_manager.clear_cache()
        
        # Clear Django cache
        from django.core.cache import cache
        cache.clear()
        
        return Response({
            'message': 'Cache cleared successfully',
            'timestamp': timezone.now()
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to clear cache: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def export_metrics(request):
    """
    Export performance metrics in various formats.
    
    Supports JSON and CSV formats.
    """
    try:
        format_type = request.query_params.get('format', 'json')
        
        if format_type not in ['json', 'csv']:
            return Response(
                {'error': 'Unsupported format. Use "json" or "csv"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Export metrics
        exported_data = performance_monitor.export_metrics(format_type)
        
        # Set appropriate content type
        content_type = 'application/json' if format_type == 'json' else 'text/csv'
        
        return Response(
            exported_data,
            content_type=content_type,
            headers={
                'Content-Disposition': f'attachment; filename="performance_metrics_{timezone.now().strftime("%Y%m%d_%H%M%S")}.{format_type}"'
            }
        )
        
    except Exception as e:
        return Response(
            {'error': f'Failed to export metrics: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def health_check(request):
    """
    Comprehensive health check endpoint.
    
    Returns system health status including performance indicators.
    """
    try:
        from core.services.performance_monitor import SystemMonitor
        
        # Get system stats
        system_stats = SystemMonitor.get_system_stats()
        db_stats = SystemMonitor.get_database_stats()
        
        # Determine health status
        health_status = 'healthy'
        warnings = []
        
        # Check CPU usage
        if system_stats.get('cpu_percent', 0) > 80:
            health_status = 'warning'
            warnings.append('High CPU usage')
        
        # Check memory usage
        if system_stats.get('memory_percent', 0) > 85:
            health_status = 'warning'
            warnings.append('High memory usage')
        
        # Check disk usage
        if system_stats.get('disk_percent', 0) > 90:
            health_status = 'critical'
            warnings.append('High disk usage')
        
        # Check database queries
        if db_stats.get('queries_executed', 0) > 1000:
            health_status = 'warning'
            warnings.append('High database query count')
        
        return Response({
            'status': health_status,
            'timestamp': timezone.now(),
            'system': system_stats,
            'database': db_stats,
            'warnings': warnings,
            'uptime': performance_monitor.get_uptime() if hasattr(performance_monitor, 'get_uptime') else None
        })
        
    except Exception as e:
        return Response(
            {
                'status': 'error',
                'error': f'Health check failed: {str(e)}',
                'timestamp': timezone.now()
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 