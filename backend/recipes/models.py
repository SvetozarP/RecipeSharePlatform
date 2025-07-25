"""
Recipe models for the recipe management system.
"""
import uuid
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models.base import BaseModel


User = get_user_model()


def validate_list(value):
    """Validate that value is a list."""
    if not isinstance(value, list):
        raise ValidationError(_('Value must be a list'))


def validate_dict(value):
    """Validate that value is a dictionary."""
    if not isinstance(value, dict):
        raise ValidationError(_('Value must be a dictionary'))


class Recipe(BaseModel):
    """Model for storing recipe information."""

    class DifficultyLevel(models.TextChoices):
        EASY = 'easy', _('Easy')
        MEDIUM = 'medium', _('Medium')
        HARD = 'hard', _('Hard')

    class CookingMethod(models.TextChoices):
        BAKING = 'baking', _('Baking')
        FRYING = 'frying', _('Frying')
        BOILING = 'boiling', _('Boiling')
        GRILLING = 'grilling', _('Grilling')
        STEAMING = 'steaming', _('Steaming')
        OTHER = 'other', _('Other')

    # Basic fields
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_("Unique identifier for this recipe")
    )
    title = models.CharField(
        max_length=200,
        help_text=_("Title of the recipe")
    )
    description = models.TextField(
        help_text=_("Description of the recipe")
    )
    
    # Recipe details
    prep_time = models.PositiveIntegerField(
        help_text=_("Preparation time in minutes")
    )
    cook_time = models.PositiveIntegerField(
        help_text=_("Cooking time in minutes")
    )
    servings = models.PositiveIntegerField(
        help_text=_("Number of servings")
    )
    difficulty = models.CharField(
        max_length=10,
        choices=DifficultyLevel.choices,
        default=DifficultyLevel.MEDIUM,
        help_text=_("Difficulty level of the recipe")
    )
    cooking_method = models.CharField(
        max_length=10,
        choices=CookingMethod.choices,
        default=CookingMethod.OTHER,
        help_text=_("Primary cooking method")
    )

    # Recipe content
    ingredients = models.JSONField(
        help_text=_("List of ingredients with quantities"),
        validators=[validate_list]
    )
    instructions = models.JSONField(
        help_text=_("Step by step cooking instructions"),
        validators=[validate_list]
    )
    nutrition_info = models.JSONField(
        null=True,
        blank=True,
        help_text=_("Nutritional information"),
        validators=[validate_dict]
    )

    # Media - Updated to use JSONField for storing multiple image URLs
    images = models.JSONField(
        default=dict,
        blank=True,
        help_text=_("Dictionary containing original and thumbnail image URLs")
    )

    # Metadata
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='recipes',
        help_text=_("User who created this recipe")
    )
    is_published = models.BooleanField(
        default=False,
        help_text=_("Whether this recipe is publicly visible")
    )
    tags = models.JSONField(
        default=list,
        help_text=_("List of tags for this recipe"),
        validators=[validate_list]
    )
    version = models.PositiveIntegerField(
        default=1,
        help_text=_("Recipe version number")
    )

    class Meta:
        verbose_name = _('recipe')
        verbose_name_plural = _('recipes')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['title']),
            models.Index(fields=['author']),
            models.Index(fields=['is_published']),
            models.Index(fields=['difficulty']),
            models.Index(fields=['cooking_method']),
        ]

    def __str__(self):
        """Return string representation."""
        return self.title

    @property
    def total_time(self):
        """Calculate total time in minutes."""
        return self.prep_time + self.cook_time

    @property
    def main_image_url(self):
        """Get the main image URL (original size)."""
        return self.images.get('original') if self.images else None
        
    @property
    def thumbnail_url(self):
        """Get the medium thumbnail URL."""
        return self.images.get('medium') if self.images else None

    def has_images(self):
        """Check if recipe has any images."""
        return bool(self.images and self.images.get('original'))

    def save(self, *args, **kwargs):
        """Override save to handle version increments."""
        if self.pk:
            # Only check for changes if this is an update (not a new recipe)
            try:
                old_recipe = Recipe.objects.get(pk=self.pk)
                if self._has_content_changed(old_recipe):
                    self.version += 1
            except Recipe.DoesNotExist:
                # If we can't find the old recipe, don't increment version
                pass
        super().save(*args, **kwargs)

    def _has_content_changed(self, old_recipe):
        """Check if recipe content has changed."""
        content_fields = [
            'title', 'description', 'ingredients', 'instructions',
            'prep_time', 'cook_time', 'servings', 'difficulty',
            'cooking_method', 'nutrition_info'
        ]
        for field in content_fields:
            if getattr(self, field) != getattr(old_recipe, field):
                return True
        return False
