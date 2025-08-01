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


def validate_rating(value):
    """Validate that rating is between 1 and 5."""
    if not 1 <= value <= 5:
        raise ValidationError(_('Rating must be between 1 and 5'))


def validate_list(value):
    """Validate that value is a list."""
    if not isinstance(value, list):
        raise ValidationError(_('Value must be a list'))


def validate_dict(value):
    """Validate that value is a dictionary."""
    if not isinstance(value, dict):
        raise ValidationError(_('Value must be a dictionary'))


class Category(BaseModel):
    """Model for recipe categories with hierarchy support."""
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_("Unique identifier for this category")
    )
    name = models.CharField(
        max_length=100,
        help_text=_("Category name")
    )
    description = models.TextField(
        blank=True,
        help_text=_("Category description")
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        help_text=_("URL-friendly category identifier")
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        help_text=_("Icon class or identifier for the category")
    )
    color = models.CharField(
        max_length=7,
        blank=True,
        help_text=_("Hex color code for category (e.g., #FF5733)")
    )
    
    # Hierarchy support
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        help_text=_("Parent category for hierarchy")
    )
    
    # Ordering and visibility
    order = models.PositiveIntegerField(
        default=0,
        help_text=_("Display order within parent category")
    )
    is_active = models.BooleanField(
        default=True,
        help_text=_("Whether this category is active and visible")
    )
    
    class Meta:
        verbose_name = _('category')
        verbose_name_plural = _('categories')
        ordering = ['parent__name', 'order', 'name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['parent']),
            models.Index(fields=['is_active']),
            models.Index(fields=['order']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['slug'],
                condition=models.Q(parent__isnull=True),
                name='unique_root_category_slug'
            ),
            models.UniqueConstraint(
                fields=['parent', 'slug'],
                condition=models.Q(parent__isnull=False),
                name='unique_child_category_slug'
            ),
        ]

    def __str__(self):
        """Return string representation."""
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name

    @property
    def full_path(self):
        """Get the full category path."""
        path = [self.name]
        parent = self.parent
        while parent:
            path.insert(0, parent.name)
            parent = parent.parent
        return " > ".join(path)

    @property
    def level(self):
        """Get the hierarchy level (0 for root categories)."""
        level = 0
        parent = self.parent
        while parent:
            level += 1
            parent = parent.parent
        return level

    def get_ancestors(self):
        """Get all ancestor categories."""
        ancestors = []
        parent = self.parent
        while parent:
            ancestors.insert(0, parent)
            parent = parent.parent
        return ancestors

    def get_descendants(self):
        """Get all descendant categories."""
        descendants = []
        children = self.children.filter(is_active=True)
        for child in children:
            descendants.append(child)
            descendants.extend(child.get_descendants())
        return descendants

    def clean(self):
        """Validate the category."""
        super().clean()
        
        # Prevent circular references
        if self.parent:
            parent = self.parent
            while parent:
                if parent == self:
                    raise ValidationError(_("Category cannot be its own ancestor"))
                parent = parent.parent

        # Validate hierarchy depth (max 3 levels)
        if self.level >= 3:
            raise ValidationError(_("Category hierarchy cannot exceed 3 levels"))

    def save(self, *args, **kwargs):
        """Override save to validate before saving."""
        self.clean()
        super().save(*args, **kwargs)


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
    
    # Categories relationship
    categories = models.ManyToManyField(
        Category,
        blank=True,
        related_name='recipes',
        help_text=_("Categories this recipe belongs to")
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
    
    @property
    def category_names(self):
        """Get list of category names for this recipe."""
        return [category.name for category in self.categories.filter(is_active=True)]
    
    @property 
    def category_paths(self):
        """Get list of full category paths for this recipe."""
        return [category.full_path for category in self.categories.filter(is_active=True)]

    @property
    def average_rating(self):
        """Calculate average rating for this recipe."""
        from django.db.models import Avg
        result = self.ratings.aggregate(avg_rating=Avg('rating'))
        return round(result['avg_rating'], 2) if result['avg_rating'] else 0.0

    @property
    def rating_count(self):
        """Get total number of ratings for this recipe."""
        return self.ratings.count()

    @property
    def rating_distribution(self):
        """Get distribution of ratings (1-5 stars)."""
        from django.db.models import Count
        distribution = {i: 0 for i in range(1, 6)}
        ratings = self.ratings.values('rating').annotate(count=Count('rating'))
        for rating in ratings:
            distribution[rating['rating']] = rating['count']
        return distribution

    @property
    def star_display(self):
        """Return star display for average rating."""
        avg = self.average_rating
        full_stars = int(avg)
        half_star = avg - full_stars >= 0.5
        empty_stars = 5 - full_stars - (1 if half_star else 0)
        
        display = "★" * full_stars
        if half_star:
            display += "☆"
        display += "☆" * empty_stars
        return display

    def update_rating_stats(self):
        """Update cached rating statistics (can be extended for caching)."""
        # This method can be extended to update cached rating statistics
        # For now, it's a placeholder for future caching implementation
        pass

    def has_user_rated(self, user):
        """Check if a specific user has rated this recipe."""
        if not user.is_authenticated:
            return False
        return self.ratings.filter(user=user).exists()

    def get_user_rating(self, user):
        """Get the rating given by a specific user."""
        if not user.is_authenticated:
            return None
        try:
            return self.ratings.get(user=user)
        except self.ratings.model.DoesNotExist:
            return None

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


class Rating(BaseModel):
    """Model for recipe ratings and reviews."""

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_("Unique identifier for this rating")
    )
    
    # Relationships
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='ratings',
        help_text=_("Recipe being rated")
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='ratings',
        help_text=_("User who created this rating")
    )
    
    # Rating fields
    rating = models.PositiveIntegerField(
        validators=[validate_rating],
        help_text=_("Rating value from 1 to 5 stars")
    )
    review = models.CharField(
        blank=True,
        max_length=2000,
        help_text=_("Optional review text")
    )
    
    # Additional metadata
    is_verified_purchase = models.BooleanField(
        default=False,
        help_text=_("Whether this rating is from a verified user who made the recipe")
    )
    helpful_count = models.PositiveIntegerField(
        default=0,
        help_text=_("Number of users who found this review helpful")
    )

    class Meta:
        verbose_name = _('rating')
        verbose_name_plural = _('ratings')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipe']),
            models.Index(fields=['user']),
            models.Index(fields=['rating']),
            models.Index(fields=['created_at']),
            models.Index(fields=['helpful_count']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['recipe', 'user'],
                name='unique_recipe_user_rating'
            ),
        ]

    def __str__(self):
        """Return string representation."""
        return f"{self.user.email} rated {self.recipe.title} - {self.rating} stars"

    @property
    def star_display(self):
        """Return star display representation."""
        return "★" * self.rating + "☆" * (5 - self.rating)

    def save(self, *args, **kwargs):
        """Override save to update recipe rating statistics."""
        is_new = self.pk is None
        old_rating = None
        
        if not is_new:
            try:
                old_rating = Rating.objects.get(pk=self.pk).rating
            except Rating.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
        
        # Update recipe rating statistics
        self.recipe.update_rating_stats()

    def delete(self, *args, **kwargs):
        """Override delete to update recipe rating statistics."""
        recipe = self.recipe
        super().delete(*args, **kwargs)
        recipe.update_rating_stats()


class UserFavorite(BaseModel):
    """Model for tracking user favorite recipes."""
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_("Unique identifier for this favorite")
    )
    
    # Relationships
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='favorites',
        help_text=_("User who favorited the recipe")
    )
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='favorited_by',
        help_text=_("Recipe that was favorited")
    )
    
    class Meta:
        verbose_name = _('user favorite')
        verbose_name_plural = _('user favorites')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['recipe']),
            models.Index(fields=['created_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'recipe'],
                name='unique_user_recipe_favorite'
            ),
        ]

    def __str__(self):
        """Return string representation."""
        return f"{self.user.email} favorited {self.recipe.title}"


class RecipeView(BaseModel):
    """Model for tracking recipe views by users."""
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_("Unique identifier for this view")
    )
    
    # Relationships
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='recipe_views',
        null=True,
        blank=True,
        help_text=_("User who viewed the recipe (null for anonymous views)")
    )
    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='views',
        help_text=_("Recipe that was viewed")
    )
    
    # View tracking fields
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text=_("IP address of the viewer")
    )
    user_agent = models.TextField(
        blank=True,
        help_text=_("User agent string of the viewer")
    )
    session_key = models.CharField(
        max_length=40,
        blank=True,
        help_text=_("Session key for anonymous users")
    )
    
    # Duration tracking
    view_duration_seconds = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text=_("How long the user spent viewing the recipe (in seconds)")
    )
    
    class Meta:
        verbose_name = _('recipe view')
        verbose_name_plural = _('recipe views')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['recipe']),
            models.Index(fields=['created_at']),
            models.Index(fields=['ip_address']),
            models.Index(fields=['session_key']),
        ]

    def __str__(self):
        """Return string representation."""
        viewer = self.user.email if self.user else f"Anonymous ({self.ip_address})"
        return f"{viewer} viewed {self.recipe.title}"
