import logging
import time
import psutil
import threading
import functools
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.utils import timezone
from collections import defaultdict, deque

logger = logging.getLogger(__name__)


class PerformanceMetrics:
    """Collect and store performance metrics."""
    
    def __init__(self):
        self.metrics = defaultdict(deque)
        self.max_metrics = 1000  # Keep last 1000 data points
        self.lock = threading.Lock()
    
    def add_metric(self, metric_type: str, value: float, timestamp: datetime = None):
        """Add a performance metric."""
        if timestamp is None:
            timestamp = timezone.now()
        
        with self.lock:
            self.metrics[metric_type].append({
                'value': value,
                'timestamp': timestamp
            })
            
            # Keep only the last max_metrics entries
            if len(self.metrics[metric_type]) > self.max_metrics:
                self.metrics[metric_type].popleft()
    
    def get_metrics(self, metric_type: str, minutes: int = 60) -> List[Dict[str, Any]]:
        """Get metrics for the last N minutes."""
        if metric_type not in self.metrics:
            return []
        
        cutoff_time = timezone.now() - timedelta(minutes=minutes)
        
        with self.lock:
            return [
                metric for metric in self.metrics[metric_type]
                if metric['timestamp'] >= cutoff_time
            ]
    
    def get_average(self, metric_type: str, minutes: int = 60) -> Optional[float]:
        """Get average value for a metric type."""
        metrics = self.get_metrics(metric_type, minutes)
        if not metrics:
            return None
        
        return sum(m['value'] for m in metrics) / len(metrics)
    
    def get_summary(self) -> Dict[str, Any]:
        """Get summary of all metrics."""
        summary = {}
        
        for metric_type in self.metrics:
            recent_metrics = self.get_metrics(metric_type, 60)  # Last hour
            if recent_metrics:
                values = [m['value'] for m in recent_metrics]
                summary[metric_type] = {
                    'count': len(values),
                    'average': sum(values) / len(values),
                    'min': min(values),
                    'max': max(values),
                    'latest': values[-1] if values else None
                }
        
        return summary


class SystemMonitor:
    """Monitor system resources."""
    
    @staticmethod
    def get_system_stats() -> Dict[str, Any]:
        """Get current system statistics."""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                'cpu_percent': cpu_percent,
                'memory_percent': memory.percent,
                'memory_available': memory.available,
                'memory_total': memory.total,
                'disk_percent': disk.percent,
                'disk_free': disk.free,
                'disk_total': disk.total,
                'timestamp': timezone.now()
            }
        except Exception as e:
            logger.error(f"Error getting system stats: {e}")
            return {}
    
    @staticmethod
    def get_database_stats() -> Dict[str, Any]:
        """Get database connection statistics."""
        try:
            return {
                'connections': len(connection.queries),
                'queries_executed': len(connection.queries),
                'total_query_time': sum(
                    float(query.get('time', 0)) for query in connection.queries
                ),
                'timestamp': timezone.now()
            }
        except Exception as e:
            logger.error(f"Error getting database stats: {e}")
            return {}


class QueryProfiler:
    """Profile database queries."""
    
    def __init__(self):
        self.slow_query_threshold = 1.0  # seconds
        self.slow_queries = deque(maxlen=100)
    
    def log_query(self, sql: str, duration: float, params: Dict = None):
        """Log a database query."""
        if duration > self.slow_query_threshold:
            self.slow_queries.append({
                'sql': sql,
                'duration': duration,
                'params': params,
                'timestamp': timezone.now()
            })
            logger.warning(f"Slow query detected: {duration:.3f}s - {sql[:100]}...")
    
    def get_slow_queries(self, minutes: int = 60) -> List[Dict[str, Any]]:
        """Get slow queries from the last N minutes."""
        cutoff_time = timezone.now() - timedelta(minutes=minutes)
        return [
            query for query in self.slow_queries
            if query['timestamp'] >= cutoff_time
        ]


class CacheMonitor:
    """Monitor cache performance."""
    
    @staticmethod
    def get_cache_stats() -> Dict[str, Any]:
        """Get cache statistics."""
        try:
            # This would be more comprehensive with Redis INFO
            cache_hits = cache.get('cache_hits', 0)
            cache_misses = cache.get('cache_misses', 0)
            cache_evictions = cache.get('cache_evictions', 0)
            
            total_requests = cache_hits + cache_misses
            hit_rate = (cache_hits / total_requests * 100) if total_requests > 0 else 0
            
            return {
                'hits': cache_hits,
                'misses': cache_misses,
                'evictions': cache_evictions,
                'hit_rate': hit_rate,
                'total_requests': total_requests,
                'timestamp': timezone.now()
            }
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {}


class PerformanceMonitor:
    """Main performance monitoring class."""
    
    def __init__(self):
        self.metrics = PerformanceMetrics()
        self.system_monitor = SystemMonitor()
        self.query_profiler = QueryProfiler()
        self.cache_monitor = CacheMonitor()
        self.monitoring_enabled = getattr(settings, 'PERFORMANCE_MONITORING_ENABLED', True)
    
    def start_monitoring(self):
        """Start performance monitoring."""
        if not self.monitoring_enabled:
            return
        
        logger.info("Performance monitoring started")
        
        # Start background monitoring thread
        self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()
    
    def _monitor_loop(self):
        """Background monitoring loop."""
        while True:
            try:
                # Collect system metrics
                system_stats = self.system_monitor.get_system_stats()
                if system_stats:
                    self.metrics.add_metric('cpu_percent', system_stats['cpu_percent'])
                    self.metrics.add_metric('memory_percent', system_stats['memory_percent'])
                    self.metrics.add_metric('disk_percent', system_stats['disk_percent'])
                
                # Collect database metrics
                db_stats = self.system_monitor.get_database_stats()
                if db_stats:
                    self.metrics.add_metric('db_queries', db_stats['queries_executed'])
                    self.metrics.add_metric('db_query_time', db_stats['total_query_time'])
                
                # Collect cache metrics
                cache_stats = self.cache_monitor.get_cache_stats()
                if cache_stats:
                    self.metrics.add_metric('cache_hit_rate', cache_stats['hit_rate'])
                
                # Sleep for monitoring interval
                time.sleep(60)  # Monitor every minute
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                time.sleep(60)
    
    def log_request_time(self, view_name: str, duration: float):
        """Log request processing time."""
        if not self.monitoring_enabled:
            return
        
        self.metrics.add_metric(f'request_time_{view_name}', duration)
        
        if duration > 2.0:  # More than 2 seconds
            logger.warning(f"Slow request detected: {view_name} took {duration:.3f}s")
    
    def log_database_query(self, sql: str, duration: float, params: Dict = None):
        """Log database query performance."""
        if not self.monitoring_enabled:
            return
        
        self.metrics.add_metric('db_query_duration', duration)
        self.query_profiler.log_query(sql, duration, params)
    
    def log_cache_operation(self, operation: str, duration: float, success: bool):
        """Log cache operation performance."""
        if not self.monitoring_enabled:
            return
        
        self.metrics.add_metric(f'cache_{operation}_time', duration)
        self.metrics.add_metric(f'cache_{operation}_success', 1 if success else 0)
    
    def get_performance_report(self) -> Dict[str, Any]:
        """Get comprehensive performance report."""
        return {
            'system': {
                'cpu_average': self.metrics.get_average('cpu_percent', 60),
                'memory_average': self.metrics.get_average('memory_percent', 60),
                'disk_average': self.metrics.get_average('disk_percent', 60),
                'current': self.system_monitor.get_system_stats()
            },
            'database': {
                'queries_per_minute': self.metrics.get_average('db_queries', 1),
                'average_query_time': self.metrics.get_average('db_query_duration', 60),
                'slow_queries': len(self.query_profiler.get_slow_queries(60)),
                'current': self.system_monitor.get_database_stats()
            },
            'cache': {
                'hit_rate': self.metrics.get_average('cache_hit_rate', 60),
                'current': self.cache_monitor.get_cache_stats()
            },
            'requests': {
                'average_response_time': self.metrics.get_average('request_time', 60),
                'slow_requests': len([
                    m for m in self.metrics.get_metrics('request_time', 60)
                    if m['value'] > 2.0
                ])
            },
            'summary': self.metrics.get_summary(),
            'timestamp': timezone.now()
        }
    
    def export_metrics(self, format: str = 'json') -> str:
        """Export metrics in specified format."""
        report = self.get_performance_report()
        
        if format == 'json':
            import json
            return json.dumps(report, default=str, indent=2)
        elif format == 'csv':
            # Simple CSV export of key metrics
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            writer.writerow(['Metric', 'Value', 'Timestamp'])
            for metric_type, data in report['summary'].items():
                if data['latest'] is not None:
                    writer.writerow([metric_type, data['latest'], report['timestamp']])
            
            return output.getvalue()
        else:
            raise ValueError(f"Unsupported format: {format}")


# Global performance monitor instance
performance_monitor = PerformanceMonitor()


def monitor_performance(func):
    """Decorator to monitor function performance."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        if not performance_monitor.monitoring_enabled:
            return func(*args, **kwargs)
        
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            
            # Log function execution time
            performance_monitor.metrics.add_metric(
                f'function_time_{func.__name__}', 
                duration
            )
            
            return result
        except Exception as e:
            duration = time.time() - start_time
            performance_monitor.metrics.add_metric(
                f'function_error_{func.__name__}', 
                duration
            )
            raise
    
    return wrapper


def monitor_database_queries(func):
    """Decorator to monitor database query performance."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        if not performance_monitor.monitoring_enabled:
            return func(*args, **kwargs)
        
        initial_queries = len(connection.queries)
        initial_time = sum(float(q.get('time', 0)) for q in connection.queries)
        
        result = func(*args, **kwargs)
        
        final_queries = len(connection.queries)
        final_time = sum(float(q.get('time', 0)) for q in connection.queries)
        
        queries_executed = final_queries - initial_queries
        time_spent = final_time - initial_time
        
        if queries_executed > 0:
            performance_monitor.metrics.add_metric('db_queries_per_request', queries_executed)
            performance_monitor.metrics.add_metric('db_time_per_request', time_spent)
        
        return result
    
    return wrapper 