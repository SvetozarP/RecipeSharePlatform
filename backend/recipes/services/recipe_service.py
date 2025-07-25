"""
Service layer for recipe management.
"""
from django.core.exceptions import ValidationError
from django.db import transaction
from django.contrib.auth import get_user_model

from ..models import Recipe
from ..repositories.recipe_repository import RecipeRepository

User = get_user_model()


class RecipeService:
    """Service for managing recipe operations."""

    def __init__(self):
        self.repository = RecipeRepository()

    def create_recipe(self, recipe_data, author_id):
        """
        Create a new recipe.
        
        Args:
            recipe_data: Recipe data dictionary
            author_id: ID of the user creating the recipe
            
        Returns:
            Recipe: Created recipe instance
            
        Raises:
            ValidationError: If data is invalid
        """
        try:
            with transaction.atomic():
                # Get author
                author = User.objects.get(id=author_id)
                recipe_data['author'] = author
                
                # Create recipe
                recipe = self.repository.create(recipe_data)
                return recipe
                
        except User.DoesNotExist:
            raise ValidationError("Author not found")
        except Exception as e:
            raise ValidationError(f"Failed to create recipe: {str(e)}")

    def get_recipe_by_id(self, recipe_id):
        """
        Get a recipe by ID.
        
        Args:
            recipe_id: Recipe UUID
            
        Returns:
            Recipe: Recipe instance
            
        Raises:
            Recipe.DoesNotExist: If recipe not found
        """
        return self.repository.get_by_id(recipe_id)

    def update_recipe(self, recipe_id, recipe_data, user_id):
        """
        Update a recipe.
        
        Args:
            recipe_id: Recipe UUID
            recipe_data: Updated recipe data
            user_id: ID of the user making the update
            
        Returns:
            Recipe: Updated recipe instance
            
        Raises:
            ValidationError: If user doesn't have permission or data is invalid
        """
        try:
            recipe = self.repository.get_by_id(recipe_id)
            
            # Check permissions
            if str(recipe.author.id) != user_id:
                raise ValidationError("Permission denied")
            
            # Update recipe
            updated_recipe = self.repository.update(recipe_id, recipe_data)
            return updated_recipe
            
        except Recipe.DoesNotExist:
            raise ValidationError("Recipe not found")

    def delete_recipe(self, recipe_id):
        """
        Delete a recipe.
        
        Args:
            recipe_id: Recipe UUID
            
        Returns:
            bool: True if deleted successfully
        """
        try:
            return self.repository.delete(recipe_id)
        except Recipe.DoesNotExist:
            raise ValidationError("Recipe not found")

    def get_recipes(self, filters=None):
        """
        Get recipes with optional filters.
        
        Args:
            filters: Dictionary of filters
            
        Returns:
            QuerySet: Filtered recipes
        """
        return self.repository.get_filtered(filters or {})

    def search_recipes(self, query, include_unpublished=False):
        """
        Search recipes by query.
        
        Args:
            query: Search query string
            include_unpublished: Whether to include unpublished recipes
            
        Returns:
            QuerySet: Matching recipes
        """
        return self.repository.search(query, include_unpublished)


# Service instance
recipe_service = RecipeService() 