"""
Repository interface for data access abstraction.
Provides a standard interface for data operations across the application.
"""

from abc import ABC, abstractmethod
from typing import Any, Generic, List, Optional, Type, TypeVar

from django.db.models import Model, QuerySet

T = TypeVar('T', bound=Model)

class Repository(Generic[T], ABC):
    """
    Abstract base class for repositories.
    Provides a standard interface for data access operations.
    """

    def __init__(self, model_class: Type[T]):
        """
        Initialize the repository with a model class.
        
        Args:
            model_class: The Django model class this repository handles
        """
        self.model_class = model_class

    @abstractmethod
    def create(self, **kwargs) -> T:
        """Create a new instance of the model."""
        pass

    @abstractmethod
    def update(self, instance: T, **kwargs) -> T:
        """Update an existing instance."""
        pass

    @abstractmethod
    def delete(self, instance: T) -> None:
        """Delete an instance."""
        pass

    @abstractmethod
    def get_by_id(self, id: Any) -> Optional[T]:
        """Get an instance by its ID."""
        pass

    @abstractmethod
    def get_all(self) -> QuerySet[T]:
        """Get all instances."""
        pass

    @abstractmethod
    def filter(self, **kwargs) -> QuerySet[T]:
        """Filter instances by given criteria."""
        pass


class DjangoRepository(Repository[T]):
    """
    Django implementation of the repository pattern.
    Provides concrete implementations of repository operations using Django's ORM.
    """

    def create(self, **kwargs) -> T:
        """Create a new instance of the model."""
        instance = self.model_class(**kwargs)
        instance.full_clean()  # Validate the instance
        instance.save()
        return instance

    def update(self, instance: T, **kwargs) -> T:
        """Update an existing instance."""
        for key, value in kwargs.items():
            setattr(instance, key, value)
        instance.full_clean()  # Validate the instance
        instance.save()
        return instance

    def delete(self, instance: T) -> None:
        """Delete an instance."""
        instance.delete()

    def get_by_id(self, id: Any) -> Optional[T]:
        """Get an instance by its ID."""
        try:
            return self.model_class.objects.get(pk=id)
        except self.model_class.DoesNotExist:
            return None

    def get_all(self) -> QuerySet[T]:
        """Get all instances."""
        return self.model_class.objects.all()

    def filter(self, **kwargs) -> QuerySet[T]:
        """Filter instances by given criteria."""
        return self.model_class.objects.filter(**kwargs)

    def exists(self, **kwargs) -> bool:
        """Check if any instance matches the given criteria."""
        return self.model_class.objects.filter(**kwargs).exists()

    def count(self, **kwargs) -> int:
        """Count instances matching the given criteria."""
        return self.model_class.objects.filter(**kwargs).count()

    def get_or_create(self, defaults=None, **kwargs) -> tuple[T, bool]:
        """Get an instance or create it if it doesn't exist."""
        return self.model_class.objects.get_or_create(defaults=defaults, **kwargs) 