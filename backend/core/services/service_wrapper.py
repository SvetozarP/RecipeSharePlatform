"""
Service wrapper for performance monitoring services.
Provides graceful fallbacks when services are not available.
"""

import logging
from typing import Any, Optional, Dict, List
from django.conf import settings

logger = logging.getLogger(__name__)


class ServiceWrapper:
    """Wrapper for performance monitoring services with graceful fallbacks."""
    
    def __init__(self):
        self.enabled = getattr(settings, 'PERFORMANCE_MONITORING_ENABLED', False)
        self._services = {}
    
    def _get_service(self, service_name: str):
        """Get a service with error handling."""
        # Always allow storage service, regardless of performance monitoring
        if service_name == 'storage_service':
            if service_name not in self._services:
                try:
                    from .storage_service import get_storage_service
                    self._services[service_name] = get_storage_service()
                except ImportError as e:
                    logger.warning(f"Failed to import {service_name}: {e}")
                    return None
                except Exception as e:
                    logger.error(f"Error initializing {service_name}: {e}")
                    return None
            return self._services[service_name]
        
        # For other services, check if performance monitoring is enabled
        if not self.enabled:
            return None
            
        if service_name not in self._services:
            try:
                if service_name == 'cache_manager':
                    from .cache_manager import cache_manager
                    self._services[service_name] = cache_manager
                elif service_name == 'query_optimizer':
                    from .cache_manager import query_optimizer
                    self._services[service_name] = query_optimizer
                elif service_name == 'performance_monitor':
                    from .performance_monitor import PerformanceMonitor
                    self._services[service_name] = PerformanceMonitor()
                else:
                    logger.warning(f"Unknown service: {service_name}")
                    return None
            except ImportError as e:
                logger.warning(f"Failed to import {service_name}: {e}")
                return None
            except Exception as e:
                logger.error(f"Error initializing {service_name}: {e}")
                return None
        
        return self._services[service_name]
    
    def cache_get(self, key: str) -> Optional[Any]:
        """Get value from cache with fallback."""
        cache_manager = self._get_service('cache_manager')
        if cache_manager:
            try:
                return cache_manager.get(key)
            except Exception as e:
                logger.debug(f"Cache get failed: {e}")
        return None
    
    def cache_set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set value in cache with fallback."""
        cache_manager = self._get_service('cache_manager')
        if cache_manager:
            try:
                cache_manager.set(key, value, ttl)
                return True
            except Exception as e:
                logger.debug(f"Cache set failed: {e}")
        return False
    
    def optimize_queryset(self, queryset) -> Any:
        """Optimize queryset with fallback."""
        query_optimizer = self._get_service('query_optimizer')
        if query_optimizer:
            try:
                return query_optimizer.optimize_recipe_queryset(queryset)
            except Exception as e:
                logger.debug(f"Query optimization failed: {e}")
        return queryset
    
    def monitor_performance(self, func):
        """Performance monitoring decorator with fallback."""
        if not self.enabled:
            return func
        
        performance_monitor = self._get_service('performance_monitor')
        if performance_monitor:
            try:
                from .performance_monitor import monitor_performance
                return monitor_performance(func)
            except Exception as e:
                logger.debug(f"Performance monitoring failed: {e}")
        return func
    
    def monitor_database_queries(self, func):
        """Database query monitoring decorator with fallback."""
        if not self.enabled:
            return func
        
        performance_monitor = self._get_service('performance_monitor')
        if performance_monitor:
            try:
                from .performance_monitor import monitor_database_queries
                return monitor_database_queries(func)
            except Exception as e:
                logger.debug(f"Database monitoring failed: {e}")
        return func
    
    def save_image(self, image_file, recipe_id: str) -> Optional[Dict[str, str]]:
        """Save image with fallback."""
        storage_service = self._get_service('storage_service')
        if storage_service:
            try:
                logger.info(f"Attempting to save image for recipe {recipe_id}")
                result = storage_service.save_image_with_thumbnails(image_file, recipe_id)
                if result:
                    logger.info(f"Successfully saved image for recipe {recipe_id}: {list(result.keys())}")
                else:
                    logger.warning(f"Storage service returned None for recipe {recipe_id}")
                return result
            except Exception as e:
                logger.error(f"Image save failed for recipe {recipe_id}: {e}")
                # Re-raise the exception to be handled by the serializer
                raise
        else:
            logger.error("Storage service not available")
            raise Exception("Storage service not available")
    
    def delete_images(self, images: Dict[str, str]) -> bool:
        """Delete images with fallback."""
        storage_service = self._get_service('storage_service')
        if storage_service:
            try:
                logger.info(f"Attempting to delete images: {list(images.keys())}")
                storage_service.delete_recipe_images(images)
                logger.info("Successfully deleted images")
                return True
            except Exception as e:
                logger.error(f"Image deletion failed: {e}")
                return False
        else:
            logger.warning("Storage service not available for image deletion")
            return False


# Global service wrapper instance
service_wrapper = ServiceWrapper() 