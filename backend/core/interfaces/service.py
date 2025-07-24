"""
Service interface for business logic abstraction.
Provides a standard interface for business operations across the application.
"""

from abc import ABC, abstractmethod
from typing import Any, Generic, List, Optional, Type, TypeVar

from django.db.models import Model
from .repository import Repository

T = TypeVar('T', bound=Model)

class Service(Generic[T], ABC):
    """
    Abstract base class for services.
    Provides a standard interface for business operations.
    """

    def __init__(self, repository: Repository[T]):
        """
        Initialize the service with a repository.
        
        Args:
            repository: The repository this service uses for data access
        """
        self.repository = repository

    @abstractmethod
    def create(self, **kwargs) -> T:
        """Create a new instance."""
        pass

    @abstractmethod
    def update(self, id: Any, **kwargs) -> Optional[T]:
        """Update an existing instance."""
        pass

    @abstractmethod
    def delete(self, id: Any) -> bool:
        """Delete an instance."""
        pass

    @abstractmethod
    def get_by_id(self, id: Any) -> Optional[T]:
        """Get an instance by its ID."""
        pass

    @abstractmethod
    def get_all(self) -> List[T]:
        """Get all instances."""
        pass


class BaseService(Service[T]):
    """
    Base implementation of the service pattern.
    Provides concrete implementations of common service operations.
    """

    def create(self, **kwargs) -> T:
        """
        Create a new instance.
        
        Args:
            **kwargs: Fields to set on the new instance
            
        Returns:
            The created instance
            
        Raises:
            ValidationError: If the instance is invalid
        """
        return self.repository.create(**kwargs)

    def update(self, id: Any, **kwargs) -> Optional[T]:
        """
        Update an existing instance.
        
        Args:
            id: The ID of the instance to update
            **kwargs: Fields to update
            
        Returns:
            The updated instance or None if not found
            
        Raises:
            ValidationError: If the updated instance is invalid
        """
        instance = self.repository.get_by_id(id)
        if instance:
            return self.repository.update(instance, **kwargs)
        return None

    def delete(self, id: Any) -> bool:
        """
        Delete an instance.
        
        Args:
            id: The ID of the instance to delete
            
        Returns:
            True if deleted, False if not found
        """
        instance = self.repository.get_by_id(id)
        if instance:
            self.repository.delete(instance)
            return True
        return False

    def get_by_id(self, id: Any) -> Optional[T]:
        """
        Get an instance by its ID.
        
        Args:
            id: The ID of the instance to get
            
        Returns:
            The instance or None if not found
        """
        return self.repository.get_by_id(id)

    def get_all(self) -> List[T]:
        """
        Get all instances.
        
        Returns:
            List of all instances
        """
        return list(self.repository.get_all()) 