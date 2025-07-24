"""
Base model class with common fields and functionality.
All application models should inherit from this class.
"""

import uuid
from django.db import models
from django.utils import timezone

from .managers import BaseManager, ActiveManager


class BaseModel(models.Model):
    """
    Abstract base model providing common fields and functionality.
    
    Common fields:
    - id: UUID primary key
    - created_at: Creation timestamp
    - updated_at: Last update timestamp
    - is_active: Soft deletion flag
    
    Managers:
    - objects: Returns all objects (BaseManager)
    - active_objects: Returns only active objects (ActiveManager)
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for this record"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this record was created"
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When this record was last updated"
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Whether this record is active (False = soft deleted)"
    )

    # Managers
    objects = BaseManager()
    active_objects = ActiveManager()

    class Meta:
        abstract = True
        ordering = ['-created_at']

    def soft_delete(self):
        """Soft delete the record by setting is_active to False."""
        self.is_active = False
        self.save(update_fields=['is_active', 'updated_at'])

    def restore(self):
        """Restore a soft-deleted record by setting is_active to True."""
        self.is_active = True
        self.save(update_fields=['is_active', 'updated_at'])

    def update(self, **kwargs):
        """Update the record with the given fields."""
        for field, value in kwargs.items():
            setattr(self, field, value)
        self.save(update_fields=list(kwargs.keys()) + ['updated_at'])

    def save(self, *args, **kwargs):
        """Override save to ensure updated_at is always updated."""
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        """Return a string representation of the model."""
        return f"{self.__class__.__name__}({self.id})" 