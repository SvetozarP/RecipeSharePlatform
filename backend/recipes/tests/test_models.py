"""
Tests for recipe models.
"""

import pytest
from django.core.exceptions import ValidationError

from recipes.models import Recipe
from recipes.tests.factories import RecipeFactory

pytestmark = pytest.mark.django_db


class TestRecipeModel:
    """Test Recipe model."""

    def test_create_recipe(self):
        """Test creating a recipe."""
        recipe = RecipeFactory()
        assert recipe.id is not None
        assert recipe.title is not None
        assert recipe.description is not None
        assert recipe.prep_time > 0
        assert recipe.cook_time > 0
        assert recipe.servings > 0
        assert recipe.difficulty in recipe.DifficultyLevel.values
        assert recipe.cooking_method in recipe.CookingMethod.values
        assert isinstance(recipe.ingredients, list)
        assert len(recipe.ingredients) > 0
        assert isinstance(recipe.instructions, list)
        assert len(recipe.instructions) > 0
        assert isinstance(recipe.nutrition_info, dict)
        assert recipe.author is not None
        assert isinstance(recipe.tags, list)

    def test_recipe_str(self):
        """Test recipe string representation."""
        recipe = RecipeFactory(title="Test Recipe")
        assert str(recipe) == "Test Recipe"

    def test_total_time(self):
        """Test total time calculation."""
        recipe = RecipeFactory(prep_time=30, cook_time=60)
        assert recipe.total_time == 90

    def test_invalid_ingredients_format(self):
        """Test validation of ingredients format."""
        recipe = RecipeFactory()
        recipe.ingredients = "not a list"
        with pytest.raises(ValidationError):
            recipe.full_clean()

    def test_invalid_instructions_format(self):
        """Test validation of instructions format."""
        recipe = RecipeFactory()
        recipe.instructions = "not a list"
        with pytest.raises(ValidationError):
            recipe.full_clean()

    def test_invalid_nutrition_info_format(self):
        """Test validation of nutrition info format."""
        recipe = RecipeFactory()
        recipe.nutrition_info = "not a dict"
        with pytest.raises(ValidationError):
            recipe.full_clean()

    def test_invalid_tags_format(self):
        """Test validation of tags format."""
        recipe = RecipeFactory()
        recipe.tags = "not a list"
        with pytest.raises(ValidationError):
            recipe.full_clean()

    def test_recipe_versioning(self):
        """Test recipe versioning."""
        recipe = RecipeFactory()
        initial_version = recipe.version

        # Update content
        recipe.title = "Updated Title"
        recipe.save()
        assert recipe.version == initial_version + 1

        # Update non-content field
        recipe.is_published = True
        recipe.save()
        assert recipe.version == initial_version + 1  # Version shouldn't change 