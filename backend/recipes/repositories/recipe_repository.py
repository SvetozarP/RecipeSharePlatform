"""
Concrete implementation of recipe repository.
"""

from django.db.models import Q
from typing import List, Optional, Dict, Any
import json

from .base import RecipeRepositoryInterface
from ..models import Recipe


class RecipeRepository(RecipeRepositoryInterface):
    """Concrete implementation of recipe data access."""

    def create_recipe(self, recipe_data: Dict[str, Any], author_id: str) -> Recipe:
        """Create a new recipe."""
        recipe = Recipe.objects.create(
            author_id=author_id,
            **recipe_data
        )
        return recipe

    def get_recipe_by_id(self, recipe_id: str) -> Optional[Recipe]:
        """Get recipe by ID."""
        try:
            return Recipe.objects.get(id=recipe_id)
        except Recipe.DoesNotExist:
            return None

    def get_recipes(self, filters: Dict[str, Any] = None) -> List[Recipe]:
        """Get all recipes, optionally filtered."""
        queryset = Recipe.objects.all()
        
        if filters:
            if 'author_id' in filters:
                # When filtering by author, show all their recipes
                queryset = queryset.filter(author_id=filters['author_id'])
            elif 'is_published' in filters:
                # When not filtering by author, respect is_published flag
                queryset = queryset.filter(Q(is_published=filters['is_published']) | Q(author_id=filters.get('user_id')))

            if 'difficulty' in filters:
                queryset = queryset.filter(difficulty=filters['difficulty'])
            if 'cooking_method' in filters:
                queryset = queryset.filter(cooking_method=filters['cooking_method'])
            if 'tags' in filters:
                # Filter recipes that have all the specified tags
                # For SQLite compatibility, we need to filter in Python
                recipes = list(queryset)
                for tag in filters['tags']:
                    recipes = [r for r in recipes if tag in r.tags]
                return recipes

        return list(queryset)

    def update_recipe(self, recipe_id: str, recipe_data: Dict[str, Any]) -> Optional[Recipe]:
        """Update recipe data."""
        try:
            recipe = Recipe.objects.get(id=recipe_id)
            for key, value in recipe_data.items():
                setattr(recipe, key, value)
            recipe.save()
            return recipe
        except Recipe.DoesNotExist:
            return None

    def delete_recipe(self, recipe_id: str) -> bool:
        """Delete a recipe."""
        try:
            recipe = Recipe.objects.get(id=recipe_id)
            recipe.delete()
            return True
        except Recipe.DoesNotExist:
            return False

    def get_user_recipes(self, user_id: str) -> List[Recipe]:
        """Get all recipes by a specific user."""
        return list(Recipe.objects.filter(author_id=user_id))

    def search_recipes(self, query: str) -> List[Recipe]:
        """Search recipes by title, description, or ingredients."""
        # For SQLite compatibility, we need to filter ingredients in Python
        recipes = list(Recipe.objects.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query)
        ))
        # Filter ingredients manually
        recipes.extend([
            r for r in Recipe.objects.all()
            if any(query.lower() in str(ingredient).lower() for ingredient in r.ingredients)
            and r not in recipes
        ])
        return recipes

    def get_recipes_by_tags(self, tags: List[str]) -> List[Recipe]:
        """Get recipes by tags."""
        # For SQLite compatibility, we need to filter in Python
        recipes = list(Recipe.objects.all())
        for tag in tags:
            recipes = [r for r in recipes if tag in r.tags]
        return recipes

    def get_recipes_by_difficulty(self, difficulty: str) -> List[Recipe]:
        """Get recipes by difficulty level."""
        return list(Recipe.objects.filter(difficulty=difficulty))

    def get_recipes_by_cooking_method(self, method: str) -> List[Recipe]:
        """Get recipes by cooking method."""
        return list(Recipe.objects.filter(cooking_method=method)) 