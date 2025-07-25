"""
Signal handlers for recipe management.
"""

from django.db.models.signals import pre_save
from django.dispatch import receiver

from .models import Recipe


@receiver(pre_save, sender=Recipe)
def handle_recipe_version(sender, instance, **kwargs):
    """
    Handle recipe versioning.
    
    If the recipe content is modified, increment the version number.
    """
    if instance.pk:  # Only for existing recipes
        try:
            old_recipe = Recipe.objects.get(pk=instance.pk)
            content_fields = ['title', 'description', 'ingredients', 'instructions', 'prep_time', 'cook_time']
            
            # Check if any content field has changed
            for field in content_fields:
                if getattr(old_recipe, field) != getattr(instance, field):
                    instance.version += 1
                    break
        except Recipe.DoesNotExist:
            pass  # New recipe, use default version=1 