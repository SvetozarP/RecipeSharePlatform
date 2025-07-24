"""
Utility decorators for common functionality.
Provides reusable decorators for service methods and views.
"""

import functools
import time
from typing import Any, Callable, Type

from django.core.cache import cache
from django.db import transaction
from rest_framework.exceptions import ValidationError

def transactional(func: Callable) -> Callable:
    """
    Decorator to make a function run in a database transaction.
    Ensures atomic operations and rollback on error.
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        with transaction.atomic():
            return func(*args, **kwargs)
    return wrapper

def cached(timeout: int = 300) -> Callable:
    """
    Decorator to cache function results.
    
    Args:
        timeout: Cache timeout in seconds (default: 5 minutes)
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Create a cache key from function name and arguments
            key_parts = [func.__name__]
            key_parts.extend(str(arg) for arg in args)
            key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
            cache_key = ":".join(key_parts)

            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                return result

            # Call function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, timeout)
            return result
        return wrapper
    return decorator

def validate_args(**validators: Type) -> Callable:
    """
    Decorator to validate function arguments.
    
    Args:
        **validators: Mapping of argument names to their expected types
    
    Raises:
        ValidationError: If arguments don't match expected types
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Get function argument names
            func_args = func.__code__.co_varnames[:func.__code__.co_argcount]
            
            # Create a dict of all arguments and their values
            all_args = dict(zip(func_args, args))
            all_args.update(kwargs)
            
            # Validate each argument
            for arg_name, expected_type in validators.items():
                if arg_name in all_args:
                    value = all_args[arg_name]
                    if not isinstance(value, expected_type):
                        raise ValidationError(
                            f"Argument '{arg_name}' must be of type {expected_type.__name__}, "
                            f"got {type(value).__name__}"
                        )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

def log_execution_time(logger):
    """
    Decorator to log function execution time.
    
    Args:
        logger: Logger instance to use for logging
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                logger.debug(
                    f"{func.__name__} executed in {duration:.3f}s",
                    extra={
                        'function': func.__name__,
                        'duration': duration,
                        'success': True
                    }
                )
                return result
            except Exception as e:
                duration = time.time() - start_time
                logger.error(
                    f"{func.__name__} failed after {duration:.3f}s: {str(e)}",
                    extra={
                        'function': func.__name__,
                        'duration': duration,
                        'success': False,
                        'error': str(e)
                    },
                    exc_info=True
                )
                raise
        return wrapper
    return decorator

def require_permissions(*permissions: str) -> Callable:
    """
    Decorator to check if user has required permissions.
    
    Args:
        *permissions: Permission codenames to check
    
    Raises:
        PermissionDenied: If user doesn't have required permissions
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(self, *args, **kwargs):
            # Get user from self (assuming this is a method on a class with request.user)
            user = getattr(self, 'request', None)
            if user is not None:
                user = user.user
            
            if user and user.has_perms(permissions):
                return func(self, *args, **kwargs)
            
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                f"User doesn't have required permissions: {', '.join(permissions)}"
            )
        return wrapper
    return decorator 