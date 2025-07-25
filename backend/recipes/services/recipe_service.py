"""
Service layer for recipe management.
"""

from typing import List, Optional, Dict, Any
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from core.interfaces.service import BaseService
from core.events.bus import EventBus
from ..repositories.recipe_repository import RecipeRepository
from ..models import Recipe


class RecipeService(BaseService):
    """Business logic for recipe management."""

    def __init__(self):
        super().__init__(RecipeRepository())

    def create_recipe(self, recipe_data: Dict[str, Any], author_id: str) -> Recipe:
        """Create a new recipe."""
        # Validate required fields
        required_fields = ['title', 'description', 'prep_time', 'cook_time', 'servings', 'ingredients', 'instructions']
        for field in required_fields:
            if field not in recipe_data:
                raise ValidationError({field: [_('This field is required.')]})

        # Create recipe
        recipe = self.repository.create_recipe(recipe_data, author_id)

        # Publish event
        EventBus.publish('recipe.created', {
            'recipe_id': str(recipe.id),
            'author_id': str(author_id),
            'title': recipe.title
        })

        return recipe

    def get_recipe(self, recipe_id: str, user_id: Optional[str] = None) -> Optional[Recipe]:
        """
        Get recipe by ID.
        
        If user_id is provided, checks if the user can access the recipe.
        """
        recipe = self.repository.get_recipe_by_id(recipe_id)
        if not recipe:
            return None

        # Check access
        if not recipe.is_published and (not user_id or str(recipe.author_id) != user_id):
            return None

        return recipe

    def get_recipes(self, filters: Dict[str, Any] = None) -> List[Recipe]:
        """Get all recipes, optionally filtered."""
        return self.repository.get_recipes(filters)

    def update_recipe(self, recipe_id: str, recipe_data: Dict[str, Any], user_id: str) -> Optional[Recipe]:
        """Update recipe data."""
        recipe = self.repository.get_recipe_by_id(recipe_id)
        if not recipe:
            return None

        # Check ownership
        if str(recipe.author_id) != user_id:
            raise ValidationError(_('You do not have permission to edit this recipe.'))

        # Update recipe
        updated_recipe = self.repository.update_recipe(recipe_id, recipe_data)

        # Publish event
        if updated_recipe:
            EventBus.publish('recipe.updated', {
                'recipe_id': str(recipe_id),
                'author_id': user_id,
                'title': updated_recipe.title
            })

        return updated_recipe

    def delete_recipe(self, recipe_id: str, user_id: str) -> bool:
        """Delete a recipe."""
        recipe = self.repository.get_recipe_by_id(recipe_id)
        if not recipe:
            return False

        # Check ownership
        if str(recipe.author_id) != user_id:
            raise ValidationError(_('You do not have permission to delete this recipe.'))

        # Delete recipe
        success = self.repository.delete_recipe(recipe_id)

        # Publish event
        if success:
            EventBus.publish('recipe.deleted', {
                'recipe_id': str(recipe_id),
                'author_id': user_id
            })

        return success

    def get_user_recipes(self, user_id: str) -> List[Recipe]:
        """Get all recipes by a specific user."""
        return self.repository.get_user_recipes(user_id)

    def search_recipes(self, query: str, include_unpublished: bool = False) -> List[Recipe]:
        """Search recipes by title, description, or ingredients."""
        recipes = self.repository.search_recipes(query)
        if not include_unpublished:
            recipes = [r for r in recipes if r.is_published]
        return recipes

    def get_recipes_by_tags(self, tags: List[str], include_unpublished: bool = False) -> List[Recipe]:
        """Get recipes by tags."""
        recipes = self.repository.get_recipes_by_tags(tags)
        if not include_unpublished:
            recipes = [r for r in recipes if r.is_published]
        return recipes

    def get_recipes_by_difficulty(self, difficulty: str, include_unpublished: bool = False) -> List[Recipe]:
        """Get recipes by difficulty level."""
        recipes = self.repository.get_recipes_by_difficulty(difficulty)
        if not include_unpublished:
            recipes = [r for r in recipes if r.is_published]
        return recipes

    def get_recipes_by_cooking_method(self, method: str, include_unpublished: bool = False) -> List[Recipe]:
        """Get recipes by cooking method."""
        recipes = self.repository.get_recipes_by_cooking_method(method)
        if not include_unpublished:
            recipes = [r for r in recipes if r.is_published]
        return recipes

    def publish_recipe(self, recipe_id: str, user_id: str) -> Optional[Recipe]:
        """Publish a recipe."""
        recipe = self.repository.get_recipe_by_id(recipe_id)
        if not recipe:
            return None

        # Check ownership
        if str(recipe.author_id) != user_id:
            raise ValidationError(_('You do not have permission to publish this recipe.'))

        # Update recipe
        recipe = self.repository.update_recipe(recipe_id, {'is_published': True})

        # Publish event
        if recipe:
            EventBus.publish('recipe.published', {
                'recipe_id': str(recipe_id),
                'author_id': user_id,
                'title': recipe.title
            })

        return recipe

    def unpublish_recipe(self, recipe_id: str, user_id: str) -> Optional[Recipe]:
        """Unpublish a recipe."""
        recipe = self.repository.get_recipe_by_id(recipe_id)
        if not recipe:
            return None

        # Check ownership
        if str(recipe.author_id) != user_id:
            raise ValidationError(_('You do not have permission to unpublish this recipe.'))

        # Update recipe
        recipe = self.repository.update_recipe(recipe_id, {'is_published': False})

        # Publish event
        if recipe:
            EventBus.publish('recipe.unpublished', {
                'recipe_id': str(recipe_id),
                'author_id': user_id,
                'title': recipe.title
            })

        return recipe 