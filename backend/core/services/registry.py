"""
Service registry for dependency management.
Provides a central location for registering and retrieving services.
"""

from typing import Any, Dict, Optional, Type

from django.core.exceptions import ImproperlyConfigured

class ServiceRegistry:
    """
    Central registry for application services.
    Manages service dependencies and lifecycle.
    """

    _services: Dict[str, Any] = {}
    _implementations: Dict[str, Type] = {}

    @classmethod
    def register_implementation(cls, service_name: str, implementation: Type) -> None:
        """
        Register a service implementation class.
        
        Args:
            service_name: Name to register the service under
            implementation: The service class to register
        """
        cls._implementations[service_name] = implementation

    @classmethod
    def register(cls, service_name: str, instance: Any) -> None:
        """
        Register a service instance.
        
        Args:
            service_name: Name to register the service under
            instance: The service instance to register
        """
        cls._services[service_name] = instance

    @classmethod
    def get(cls, service_name: str) -> Optional[Any]:
        """
        Get a registered service instance.
        
        Args:
            service_name: Name of the service to retrieve
            
        Returns:
            The service instance or None if not found
        """
        # If service is already instantiated, return it
        if service_name in cls._services:
            return cls._services[service_name]
        
        # If we have an implementation registered, instantiate it
        if service_name in cls._implementations:
            instance = cls._implementations[service_name]()
            cls._services[service_name] = instance
            return instance
        
        return None

    @classmethod
    def get_or_raise(cls, service_name: str) -> Any:
        """
        Get a registered service instance or raise an exception.
        
        Args:
            service_name: Name of the service to retrieve
            
        Returns:
            The service instance
            
        Raises:
            ImproperlyConfigured: If the service is not registered
        """
        service = cls.get(service_name)
        if service is None:
            raise ImproperlyConfigured(
                f"Service '{service_name}' is not registered. "
                "Make sure to register it before use."
            )
        return service

    @classmethod
    def clear(cls) -> None:
        """Clear all registered services and implementations."""
        cls._services.clear()
        cls._implementations.clear()

    @classmethod
    def is_registered(cls, service_name: str) -> bool:
        """
        Check if a service is registered.
        
        Args:
            service_name: Name of the service to check
            
        Returns:
            True if the service is registered, False otherwise
        """
        return service_name in cls._services or service_name in cls._implementations 