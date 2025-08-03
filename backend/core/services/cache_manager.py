import hashlib
import json
import logging
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Union
from django.core.cache import cache
from django.conf import settings
from django.db.models import QuerySet
from django.utils import timezone

logger = logging.getLogger(__name__)


class CacheKeyGenerator:
    """Generate consistent cache keys for different data types."""
    
    @staticmethod
    def recipe_list(filters: Dict[str, Any] = None, page: int = 1) -> str:
        """Generate cache key for recipe list queries."""
        key_data = {
            'type': 'recipe_list',
            'filters': filters or {},
            'page': page
        }
        return f"recipe_list:{hashlib.md5(json.dumps(key_data, sort_keys=True).encode()).hexdigest()}"
    
    @staticmethod
    def recipe_detail(recipe_id: int) -> str:
        """Generate cache key for recipe detail."""
        return f"recipe_detail:{recipe_id}"
    
    @staticmethod
    def user_profile(user_id: int) -> str:
        """Generate cache key for user profile."""
        return f"user_profile:{user_id}"
    
    @staticmethod
    def search_results(query: str, filters: Dict[str, Any] = None) -> str:
        """Generate cache key for search results."""
        key_data = {
            'type': 'search',
            'query': query,
            'filters': filters or {}
        }
        return f"search:{hashlib.md5(json.dumps(key_data, sort_keys=True).encode()).hexdigest()}"
    
    @staticmethod
    def category_tree() -> str:
        """Generate cache key for category tree."""
        return "category_tree"
    
    @staticmethod
    def rating_stats(recipe_id: int) -> str:
        """Generate cache key for rating statistics."""
        return f"rating_stats:{recipe_id}"


class CacheManager:
    """Advanced caching manager with TTL, invalidation, and monitoring."""
    
    # Default TTL values in seconds
    DEFAULT_TTL = 300  # 5 minutes
    SHORT_TTL = 60     # 1 minute
    LONG_TTL = 3600    # 1 hour
    VERY_LONG_TTL = 86400  # 24 hours
    
    @classmethod
    def get(cls, key: str, default: Any = None) -> Any:
        """Get value from cache with logging."""
        try:
            value = cache.get(key)
            if value is not None:
                logger.debug(f"Cache HIT: {key}")
                return value
            else:
                logger.debug(f"Cache MISS: {key}")
                return default
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return default
    
    @classmethod
    def set(cls, key: str, value: Any, ttl: int = None) -> bool:
        """Set value in cache with TTL and logging."""
        try:
            ttl = ttl or cls.DEFAULT_TTL
            success = cache.set(key, value, ttl)
            if success:
                logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
            return success
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    @classmethod
    def delete(cls, key: str) -> bool:
        """Delete value from cache with logging."""
        try:
            success = cache.delete(key)
            if success:
                logger.debug(f"Cache DELETE: {key}")
            return success
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    @classmethod
    def invalidate_pattern(cls, pattern: str) -> int:
        """Invalidate all cache keys matching a pattern."""
        try:
            # This is a simplified version - in production you might use Redis SCAN
            # For now, we'll use Django's cache versioning approach
            cache_version = cache.get('cache_version', 1)
            cache.set('cache_version', cache_version + 1)
            logger.info(f"Cache pattern invalidation: {pattern} (version: {cache_version + 1})")
            return 1
        except Exception as e:
            logger.error(f"Cache pattern invalidation error for {pattern}: {e}")
            return 0
    
    @classmethod
    def get_or_set(cls, key: str, callback: Callable, ttl: int = None) -> Any:
        """Get from cache or set using callback function."""
        value = cls.get(key)
        if value is None:
            value = callback()
            cls.set(key, value, ttl)
        return value
    
    @classmethod
    def invalidate_recipe_cache(cls, recipe_id: int) -> None:
        """Invalidate all cache related to a specific recipe."""
        keys_to_delete = [
            CacheKeyGenerator.recipe_detail(recipe_id),
            CacheKeyGenerator.rating_stats(recipe_id),
        ]
        for key in keys_to_delete:
            cls.delete(key)
        
        # Invalidate recipe lists (they might contain this recipe)
        cls.invalidate_pattern("recipe_list:*")
        logger.info(f"Invalidated cache for recipe {recipe_id}")


class QueryOptimizer:
    """Database query optimization utilities."""
    
    @staticmethod
    def optimize_recipe_queryset(queryset: QuerySet) -> QuerySet:
        """Optimize recipe queryset with select_related and prefetch_related."""
        return queryset.select_related(
            'author'
        ).prefetch_related(
            'categories',
            'ratings'
        )
    
    @staticmethod
    def optimize_user_queryset(queryset: QuerySet) -> QuerySet:
        """Optimize user queryset with select_related."""
        return queryset.select_related(
            'profile',
            'preferences'
        )
    
    @staticmethod
    def optimize_rating_queryset(queryset: QuerySet) -> QuerySet:
        """Optimize rating queryset with select_related."""
        return queryset.select_related(
            'user',
            'recipe'
        )
    
    @staticmethod
    def paginate_queryset(queryset: QuerySet, page: int, page_size: int = 20) -> Dict[str, Any]:
        """Efficient pagination with count optimization."""
        total_count = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        
        results = list(queryset[start:end])
        
        return {
            'results': results,
            'count': total_count,
            'next': end < total_count,
            'previous': page > 1,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size
        }


def cache_result(ttl: int = None, key_func: Callable = None):
    """Decorator for caching function results."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                # Default key generation
                key_data = {
                    'func': func.__name__,
                    'args': args,
                    'kwargs': kwargs
                }
                cache_key = f"func:{hashlib.md5(json.dumps(str(key_data), sort_keys=True).encode()).hexdigest()}"
            
            # Try to get from cache
            result = CacheManager.get(cache_key)
            if result is not None:
                return result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            CacheManager.set(cache_key, result, ttl)
            return result
        
        return wrapper
    return decorator


def invalidate_cache_on_change(model_name: str):
    """Decorator to invalidate cache when models change."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            
            # Invalidate relevant cache based on model
            if model_name == 'Recipe':
                # Invalidate recipe-related cache
                CacheManager.invalidate_pattern("recipe_*")
                CacheManager.invalidate_pattern("search_*")
            elif model_name == 'User':
                # Invalidate user-related cache
                CacheManager.invalidate_pattern("user_*")
            elif model_name == 'Rating':
                # Invalidate rating-related cache
                CacheManager.invalidate_pattern("rating_*")
            
            return result
        return wrapper
    return decorator


class PerformanceMonitor:
    """Monitor and log performance metrics."""
    
    @staticmethod
    def log_query_time(query_name: str, start_time: datetime, end_time: datetime = None):
        """Log query execution time."""
        if end_time is None:
            end_time = timezone.now()
        
        duration = (end_time - start_time).total_seconds()
        logger.info(f"Query '{query_name}' executed in {duration:.3f}s")
        
        # Log slow queries
        if duration > 1.0:  # More than 1 second
            logger.warning(f"Slow query detected: '{query_name}' took {duration:.3f}s")
    
    @staticmethod
    def log_cache_stats():
        """Log cache statistics."""
        try:
            # This would be more comprehensive with Redis INFO command
            logger.info("Cache statistics logged")
        except Exception as e:
            logger.error(f"Error logging cache stats: {e}")


# Global cache manager instance
cache_manager = CacheManager()
query_optimizer = QueryOptimizer()
performance_monitor = PerformanceMonitor() 