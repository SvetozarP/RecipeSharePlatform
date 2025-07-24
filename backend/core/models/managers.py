"""
Model managers for handling soft deletion and other common functionality.
"""

from django.db import models
from django.db.models.query import QuerySet


class SoftDeletionQuerySet(QuerySet):
    """QuerySet that handles soft deletion."""

    def delete(self):
        """Soft delete all objects in the queryset."""
        return self.update(is_active=False)

    def hard_delete(self):
        """Permanently delete all objects in the queryset."""
        return super().delete()

    def active(self):
        """Filter to only active (not soft-deleted) objects."""
        return self.filter(is_active=True)

    def inactive(self):
        """Filter to only inactive (soft-deleted) objects."""
        return self.filter(is_active=False)

    def restore(self):
        """Restore all soft-deleted objects in the queryset."""
        return self.update(is_active=True)


class BaseManager(models.Manager):
    """
    Base manager that handles soft deletion.
    
    By default, only returns active (not soft-deleted) objects.
    """

    def get_queryset(self):
        """Return a new QuerySet object with soft deletion support."""
        return SoftDeletionQuerySet(self.model, using=self._db)

    def active(self):
        """Get only active (not soft-deleted) objects."""
        return self.get_queryset().active()

    def inactive(self):
        """Get only inactive (soft-deleted) objects."""
        return self.get_queryset().inactive()

    def all_with_deleted(self):
        """Get all objects, including soft-deleted ones."""
        return self.get_queryset().all()


class ActiveManager(BaseManager):
    """
    Manager that automatically filters to only active objects.
    
    This should be the default manager for most models.
    """

    def get_queryset(self):
        """Return a new QuerySet object with only active objects."""
        return super().get_queryset().active() 