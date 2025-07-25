"""
Tests for recipe views.
"""

import pytest
from django.urls import reverse
from rest_framework import status

from recipes.tests.factories import RecipeFactory
from accounts.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestRecipeViewSet:
    """Test RecipeViewSet."""

    def test_list_recipes(self, api_client):
        """Test listing recipes."""
        # Create some recipes
        published = [RecipeFactory(is_published=True) for _ in range(3)]
        unpublished = [RecipeFactory(is_published=False) for _ in range(2)]

        # Test public access
        url = reverse('recipes:recipe-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3
        assert all(r['id'] in [str(p.id) for p in published] for r in response.data)
        assert all(r['id'] not in [str(p.id) for p in unpublished] for r in response.data)

    def test_list_recipes_authenticated(self, api_client):
        """Test listing recipes as authenticated user."""
        user = UserFactory()
        api_client.force_authenticate(user=user)

        # Create recipes
        own_recipes = [RecipeFactory(author=user) for _ in range(2)]
        other_published = [RecipeFactory(is_published=True) for _ in range(2)]
        other_unpublished = [RecipeFactory(is_published=False) for _ in range(2)]

        # Test my recipes filter
        url = reverse('recipes:recipe-list') + '?my_recipes=true'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        assert all(r['id'] in [str(p.id) for p in own_recipes] for r in response.data)

        # Test all recipes (should see published only)
        url = reverse('recipes:recipe-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        visible_recipes = own_recipes + other_published
        assert len(response.data) == len(visible_recipes)
        assert all(r['id'] not in [str(p.id) for p in other_unpublished] for r in response.data)

    def test_create_recipe(self, api_client):
        """Test creating a recipe."""
        user = UserFactory()
        api_client.force_authenticate(user=user)

        url = reverse('recipes:recipe-list')
        data = {
            'title': 'Test Recipe',
            'description': 'Test Description',
            'prep_time': 30,
            'cook_time': 60,
            'servings': 4,
            'difficulty': 'medium',
            'cooking_method': 'baking',
            'ingredients': [{'name': 'Test Ingredient', 'amount': 1, 'unit': 'cup'}],
            'instructions': ['Step 1', 'Step 2']
        }

        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == data['title']
        assert response.data['author'] == str(user.id)

    def test_retrieve_recipe(self, api_client):
        """Test retrieving a recipe."""
        recipe = RecipeFactory(is_published=True)
        url = reverse('recipes:recipe-detail', args=[recipe.id])

        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == str(recipe.id)

    def test_retrieve_private_recipe(self, api_client):
        """Test retrieving a private recipe."""
        recipe = RecipeFactory(is_published=False)
        url = reverse('recipes:recipe-detail', args=[recipe.id])

        # Anonymous user
        response = api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

        # Author
        api_client.force_authenticate(user=recipe.author)
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK

        # Other user
        other_user = UserFactory()
        api_client.force_authenticate(user=other_user)
        response = api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_recipe(self, api_client):
        """Test updating a recipe."""
        recipe = RecipeFactory()
        url = reverse('recipes:recipe-detail', args=[recipe.id])
        data = {'title': 'Updated Title'}

        # Anonymous user
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        # Other user
        other_user = UserFactory()
        api_client.force_authenticate(user=other_user)
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # Author
        api_client.force_authenticate(user=recipe.author)
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Updated Title'

    def test_delete_recipe(self, api_client):
        """Test deleting a recipe."""
        recipe = RecipeFactory()
        url = reverse('recipes:recipe-detail', args=[recipe.id])

        # Anonymous user
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        # Other user
        other_user = UserFactory()
        api_client.force_authenticate(user=other_user)
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # Author
        api_client.force_authenticate(user=recipe.author)
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_search_recipes(self, api_client):
        """Test searching recipes."""
        recipe1 = RecipeFactory(title='Chocolate Cake', is_published=True)
        recipe2 = RecipeFactory(description='Contains chocolate', is_published=True)
        RecipeFactory(title='Vanilla Cake', is_published=True)

        url = reverse('recipes:recipe-search') + '?q=chocolate'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        assert any(r['id'] == str(recipe1.id) for r in response.data)
        assert any(r['id'] == str(recipe2.id) for r in response.data)

    def test_filter_by_tags(self, api_client):
        """Test filtering recipes by tags."""
        recipe1 = RecipeFactory(tags=['dessert', 'chocolate'], is_published=True)
        recipe2 = RecipeFactory(tags=['dessert'], is_published=True)
        RecipeFactory(tags=['main'], is_published=True)

        url = reverse('recipes:recipe-by-tags') + '?tags=dessert'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        assert any(r['id'] == str(recipe1.id) for r in response.data)
        assert any(r['id'] == str(recipe2.id) for r in response.data)

    def test_filter_by_difficulty(self, api_client):
        """Test filtering recipes by difficulty."""
        recipe = RecipeFactory(difficulty='easy', is_published=True)
        RecipeFactory(difficulty='medium', is_published=True)

        url = reverse('recipes:recipe-by-difficulty') + '?difficulty=easy'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['id'] == str(recipe.id)

    def test_filter_by_cooking_method(self, api_client):
        """Test filtering recipes by cooking method."""
        recipe = RecipeFactory(cooking_method='baking', is_published=True)
        RecipeFactory(cooking_method='frying', is_published=True)

        url = reverse('recipes:recipe-by-cooking-method') + '?method=baking'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['id'] == str(recipe.id)

    def test_publish_unpublish_recipe(self, api_client):
        """Test publishing and unpublishing a recipe."""
        recipe = RecipeFactory(is_published=False)
        publish_url = reverse('recipes:recipe-publish', args=[recipe.id])
        unpublish_url = reverse('recipes:recipe-unpublish', args=[recipe.id])

        # Anonymous user
        response = api_client.post(publish_url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        # Other user
        other_user = UserFactory()
        api_client.force_authenticate(user=other_user)
        response = api_client.post(publish_url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # Author
        api_client.force_authenticate(user=recipe.author)
        
        # Publish
        response = api_client.post(publish_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_published'] is True

        # Unpublish
        response = api_client.post(unpublish_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_published'] is False 