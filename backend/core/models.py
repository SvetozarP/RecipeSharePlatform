"""
Core models.
"""

from django.db import models


class TimestampedModel(models.Model):
    """Base model with created and updated timestamps."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True 