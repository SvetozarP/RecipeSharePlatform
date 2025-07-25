"""
Tests for recipe services.
"""

import pytest
from django.core.exceptions import ValidationError

from recipes.services.recipe_service import RecipeService
from recipes.tests.factories import RecipeFactory
from accounts.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestRecipeService:
    """Test RecipeService."""

    def test_create_recipe(self):
        """Test recipe creation."""
        service = RecipeService()
        user = UserFactory()
        recipe_data = {
            'title': 'Test Recipe',
            'description': 'Test Description',
            'prep_time': 30,
            'cook_time': 60,
            'servings': 4,
            'ingredients': [{'name': 'Test Ingredient', 'amount': 1, 'unit': 'cup'}],
            'instructions': ['Step 1', 'Step 2']
        }

        recipe = service.create_recipe(recipe_data, str(user.id))
        assert recipe.title == recipe_data['title']
        assert recipe.author == user
        assert recipe.version == 1

    def test_create_recipe_missing_required_fields(self):
        """Test recipe creation with missing fields."""
        service = RecipeService()
        user = UserFactory()
        recipe_data = {'title': 'Test Recipe'}  # Missing required fields

        with pytest.raises(ValidationError):
            service.create_recipe(recipe_data, str(user.id))

    def test_get_recipe(self):
        """Test recipe retrieval."""
        service = RecipeService()
        recipe = RecipeFactory(is_published=True)

        # Public recipe
        retrieved = service.get_recipe(str(recipe.id))
        assert retrieved == recipe

        # Private recipe
        recipe.is_published = False
        recipe.save()
        retrieved = service.get_recipe(str(recipe.id))
        assert retrieved is None

        # Private recipe with author
        retrieved = service.get_recipe(str(recipe.id), str(recipe.author.id))
        assert retrieved == recipe

    def test_update_recipe(self):
        """Test recipe update."""
        service = RecipeService()
        recipe = RecipeFactory()
        update_data = {'title': 'Updated Title'}

        # Update by author
        updated = service.update_recipe(str(recipe.id), update_data, str(recipe.author.id))
        assert updated.title == 'Updated Title'

        # Update by non-author
        other_user = UserFactory()
        with pytest.raises(ValidationError):
            service.update_recipe(str(recipe.id), update_data, str(other_user.id))

    def test_delete_recipe(self):
        """Test recipe deletion."""
        service = RecipeService()
        recipe = RecipeFactory()

        # Test delete by non-author first (should raise ValidationError)
        other_user = UserFactory()
        with pytest.raises(ValidationError):
            service.delete_recipe(str(recipe.id), str(other_user.id))

        # Delete by author
        assert service.delete_recipe(str(recipe.id), str(recipe.author.id)) is True

    def test_get_user_recipes(self):
        """Test getting user's recipes."""
        service = RecipeService()
        user = UserFactory()
        recipes = [RecipeFactory(author=user) for _ in range(3)]
        other_recipe = RecipeFactory()  # Another user's recipe

        user_recipes = service.get_user_recipes(str(user.id))
        assert len(user_recipes) == 3
        assert all(r in recipes for r in user_recipes)
        assert other_recipe not in user_recipes

    def test_search_recipes(self):
        """Test recipe search."""
        service = RecipeService()
        recipe1 = RecipeFactory(title='Chocolate Cake', is_published=True)
        recipe2 = RecipeFactory(description='Contains chocolate', is_published=True)
        recipe3 = RecipeFactory(title='Vanilla Cake', is_published=True)
        RecipeFactory(title='Chocolate Cookie', is_published=False)  # Unpublished

        results = service.search_recipes('chocolate')
        assert len(results) == 2
        assert recipe1 in results
        assert recipe2 in results
        assert recipe3 not in results

    def test_get_recipes_by_tags(self):
        """Test getting recipes by tags."""
        service = RecipeService()
        recipe1 = RecipeFactory(tags=['dessert', 'chocolate'], is_published=True)
        recipe2 = RecipeFactory(tags=['dessert'], is_published=True)
        recipe3 = RecipeFactory(tags=['main'], is_published=True)

        results = service.get_recipes_by_tags(['dessert'])
        assert len(results) == 2
        assert recipe1 in results
        assert recipe2 in results
        assert recipe3 not in results

    def test_get_recipes_by_difficulty(self):
        """Test getting recipes by difficulty."""
        service = RecipeService()
        recipe1 = RecipeFactory(difficulty='easy', is_published=True)
        recipe2 = RecipeFactory(difficulty='medium', is_published=True)

        results = service.get_recipes_by_difficulty('easy')
        assert len(results) == 1
        assert recipe1 in results
        assert recipe2 not in results

    def test_get_recipes_by_cooking_method(self):
        """Test getting recipes by cooking method."""
        service = RecipeService()
        recipe1 = RecipeFactory(cooking_method='baking', is_published=True)
        recipe2 = RecipeFactory(cooking_method='frying', is_published=True)

        results = service.get_recipes_by_cooking_method('baking')
        assert len(results) == 1
        assert recipe1 in results
        assert recipe2 not in results

    def test_publish_unpublish_recipe(self):
        """Test publishing and unpublishing recipes."""
        service = RecipeService()
        recipe = RecipeFactory(is_published=False)

        # Publish
        published = service.publish_recipe(str(recipe.id), str(recipe.author.id))
        assert published.is_published is True

        # Unpublish
        unpublished = service.unpublish_recipe(str(recipe.id), str(recipe.author.id))
        assert unpublished.is_published is False

        # Try to publish/unpublish as non-author
        other_user = UserFactory()
        with pytest.raises(ValidationError):
            service.publish_recipe(str(recipe.id), str(other_user.id))
        with pytest.raises(ValidationError):
            service.unpublish_recipe(str(recipe.id), str(other_user.id)) 