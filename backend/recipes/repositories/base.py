"""
Base repository interface for recipe management.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any

from ..models import Recipe


class RecipeRepositoryInterface(ABC):
    """Interface for recipe data access."""

    @abstractmethod
    def create_recipe(self, recipe_data: Dict[str, Any], author_id: str) -> Recipe:
        """Create a new recipe."""
        pass

    @abstractmethod
    def get_recipe_by_id(self, recipe_id: str) -> Optional[Recipe]:
        """Get recipe by ID."""
        pass

    @abstractmethod
    def get_recipes(self, filters: Dict[str, Any] = None) -> List[Recipe]:
        """Get all recipes, optionally filtered."""
        pass

    @abstractmethod
    def update_recipe(self, recipe_id: str, recipe_data: Dict[str, Any]) -> Optional[Recipe]:
        """Update recipe data."""
        pass

    @abstractmethod
    def delete_recipe(self, recipe_id: str) -> bool:
        """Delete a recipe."""
        pass

    @abstractmethod
    def get_user_recipes(self, user_id: str) -> List[Recipe]:
        """Get all recipes by a specific user."""
        pass

    @abstractmethod
    def search_recipes(self, query: str) -> List[Recipe]:
        """Search recipes by title, description, or ingredients."""
        pass

    @abstractmethod
    def get_recipes_by_tags(self, tags: List[str]) -> List[Recipe]:
        """Get recipes by tags."""
        pass

    @abstractmethod
    def get_recipes_by_difficulty(self, difficulty: str) -> List[Recipe]:
        """Get recipes by difficulty level."""
        pass

    @abstractmethod
    def get_recipes_by_cooking_method(self, method: str) -> List[Recipe]:
        """Get recipes by cooking method."""
        pass 