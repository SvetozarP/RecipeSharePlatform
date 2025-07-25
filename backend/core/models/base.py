"""
Base models for the project.
"""

from django.db import models


class BaseModel(models.Model):
    """Base model with created and updated timestamps."""
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this record was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When this record was last updated"
    )

    class Meta:
        abstract = True 