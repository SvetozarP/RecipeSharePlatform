"""
Tests for rating views.
"""

import pytest
from django.urls import reverse
from rest_framework import status

from recipes.models import Rating
from recipes.tests.factories import RatingFactory, RecipeFactory
from accounts.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestRatingViewSet:
    """Test RatingViewSet."""

    def test_list_ratings(self, api_client):
        """Test listing ratings."""
        # Create some ratings
        ratings = [RatingFactory() for _ in range(3)]
        
        url = reverse('recipes:rating-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3

    def test_list_ratings_by_recipe(self, api_client):
        """Test listing ratings filtered by recipe."""
        recipe1 = RecipeFactory()
        recipe2 = RecipeFactory()
        
        # Create ratings for different recipes
        ratings1 = [RatingFactory(recipe=recipe1) for _ in range(2)]
        ratings2 = [RatingFactory(recipe=recipe2) for _ in range(3)]
        
        url = reverse('recipes:rating-list')
        response = api_client.get(url, {'recipe_id': str(recipe1.id)})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2
        
        response = api_client.get(url, {'recipe_id': str(recipe2.id)})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3

    def test_retrieve_rating(self, api_client):
        """Test retrieving a specific rating."""
        rating = RatingFactory()
        url = reverse('recipes:rating-detail', args=[rating.id])
        
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == str(rating.id)
        assert response.data['rating'] == rating.rating
        assert response.data['review'] == rating.review

    def test_create_rating_anonymous(self, api_client):
        """Test creating a rating as anonymous user."""
        recipe = RecipeFactory()
        url = reverse('recipes:rating-list')
        data = {
            'recipe': str(recipe.id),
            'rating': 4,
            'review': 'Great recipe!'
        }
        
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_rating_authenticated(self, api_client):
        """Test creating a rating as authenticated user."""
        user = UserFactory()
        recipe = RecipeFactory()
        api_client.force_authenticate(user=user)
        
        url = reverse('recipes:rating-list')
        data = {
            'recipe': str(recipe.id),
            'rating': 4,
            'review': 'Great recipe!'
        }
        
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['rating'] == 4
        assert response.data['review'] == 'Great recipe!'
        
        # Verify rating was created in database
        rating = Rating.objects.get(id=response.data['id'])
        assert rating.user == user
        assert rating.recipe == recipe

    def test_create_rating_own_recipe(self, api_client):
        """Test that users cannot rate their own recipes."""
        user = UserFactory()
        recipe = RecipeFactory(author=user)
        api_client.force_authenticate(user=user)
        
        url = reverse('recipes:rating-list')
        data = {
            'recipe': str(recipe.id),
            'rating': 4,
            'review': 'My own recipe!'
        }
        
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'cannot rate your own recipe' in str(response.data).lower()

    def test_create_duplicate_rating(self, api_client):
        """Test that users cannot rate the same recipe twice."""
        user = UserFactory()
        recipe = RecipeFactory()
        api_client.force_authenticate(user=user)
        
        # Create first rating
        RatingFactory(user=user, recipe=recipe)
        
        url = reverse('recipes:rating-list')
        data = {
            'recipe': str(recipe.id),
            'rating': 4,
            'review': 'Second rating!'
        }
        
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already rated' in str(response.data).lower()

    def test_create_rating_invalid_rating_value(self, api_client):
        """Test creating rating with invalid rating value."""
        user = UserFactory()
        recipe = RecipeFactory()
        api_client.force_authenticate(user=user)
        
        url = reverse('recipes:rating-list')
        
        # Test invalid rating values
        for invalid_rating in [0, 6, -1, 'invalid']:
            data = {
                'recipe': str(recipe.id),
                'rating': invalid_rating,
                'review': 'Test review'
            }
            response = api_client.post(url, data, format='json')
            assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_update_rating_owner(self, api_client):
        """Test updating own rating."""
        user = UserFactory()
        rating = RatingFactory(user=user, rating=3, review='Original review')
        api_client.force_authenticate(user=user)
        
        url = reverse('recipes:rating-detail', args=[rating.id])
        data = {
            'rating': 5,
            'review': 'Updated review'
        }
        
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        rating.refresh_from_db()
        assert rating.rating == 5
        assert rating.review == 'Updated review'

    def test_update_rating_non_owner(self, api_client):
        """Test updating someone else's rating."""
        user1 = UserFactory()
        user2 = UserFactory()
        rating = RatingFactory(user=user1)
        api_client.force_authenticate(user=user2)
        
        url = reverse('recipes:rating-detail', args=[rating.id])
        data = {'rating': 5}
        
        response = api_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_rating_owner(self, api_client):
        """Test deleting own rating."""
        user = UserFactory()
        rating = RatingFactory(user=user)
        api_client.force_authenticate(user=user)
        
        url = reverse('recipes:rating-detail', args=[rating.id])
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        assert not Rating.objects.filter(id=rating.id).exists()

    def test_delete_rating_non_owner(self, api_client):
        """Test deleting someone else's rating."""
        user1 = UserFactory()
        user2 = UserFactory()
        rating = RatingFactory(user=user1)
        api_client.force_authenticate(user=user2)
        
        url = reverse('recipes:rating-detail', args=[rating.id])
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        assert Rating.objects.filter(id=rating.id).exists()

    def test_mark_helpful_action(self, api_client):
        """Test marking a rating as helpful."""
        user1 = UserFactory()
        user2 = UserFactory()
        rating = RatingFactory(user=user1, helpful_count=5)
        api_client.force_authenticate(user=user2)
        
        url = reverse('recipes:rating-mark-helpful', args=[rating.id])
        response = api_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['helpful_count'] == 6
        
        rating.refresh_from_db()
        assert rating.helpful_count == 6

    def test_mark_helpful_own_rating(self, api_client):
        """Test that users cannot mark their own rating as helpful."""
        user = UserFactory()
        rating = RatingFactory(user=user)
        api_client.force_authenticate(user=user)
        
        url = reverse('recipes:rating-mark-helpful', args=[rating.id])
        response = api_client.post(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'cannot mark your own rating' in str(response.data).lower()

    def test_mark_helpful_anonymous(self, api_client):
        """Test marking rating as helpful without authentication."""
        rating = RatingFactory()
        url = reverse('recipes:rating-mark-helpful', args=[rating.id])
        
        response = api_client.post(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_my_ratings_action(self, api_client):
        """Test getting current user's ratings."""
        user1 = UserFactory()
        user2 = UserFactory()
        
        # Create ratings for different users
        ratings1 = [RatingFactory(user=user1) for _ in range(2)]
        ratings2 = [RatingFactory(user=user2) for _ in range(3)]
        
        api_client.force_authenticate(user=user1)
        url = reverse('recipes:rating-my-ratings')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2

    def test_my_ratings_anonymous(self, api_client):
        """Test getting ratings without authentication."""
        url = reverse('recipes:rating-my-ratings')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_recipe_stats_action(self, api_client):
        """Test getting recipe rating statistics."""
        recipe = RecipeFactory()
        
        # Create some ratings
        RatingFactory(recipe=recipe, rating=5)
        RatingFactory(recipe=recipe, rating=4)
        RatingFactory(recipe=recipe, rating=3)
        
        url = reverse('recipes:rating-recipe-stats')
        response = api_client.get(url, {'recipe_id': str(recipe.id)})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['rating_count'] == 3
        assert response.data['average_rating'] == 4.0
        assert 'rating_distribution' in response.data
        assert 'star_display' in response.data

    def test_recipe_stats_missing_recipe_id(self, api_client):
        """Test recipe stats without recipe_id parameter."""
        url = reverse('recipes:rating-recipe-stats')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'recipe_id parameter is required' in str(response.data)

    def test_recipe_stats_invalid_recipe_id(self, api_client):
        """Test recipe stats with invalid recipe_id."""
        url = reverse('recipes:rating-recipe-stats')
        response = api_client.get(url, {'recipe_id': 'invalid-uuid'})
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_filter_by_rating_value(self, api_client):
        """Test filtering ratings by rating value."""
        # Create ratings with different values
        ratings_5 = [RatingFactory(rating=5) for _ in range(2)]
        ratings_4 = [RatingFactory(rating=4) for _ in range(3)]
        ratings_3 = [RatingFactory(rating=3) for _ in range(1)]
        
        url = reverse('recipes:rating-list')
        response = api_client.get(url, {'rating': '5'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2
        
        response = api_client.get(url, {'rating': '4'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3

    def test_filter_by_verified_purchase(self, api_client):
        """Test filtering ratings by verified purchase status."""
        verified_ratings = [RatingFactory(is_verified_purchase=True) for _ in range(2)]
        unverified_ratings = [RatingFactory(is_verified_purchase=False) for _ in range(3)]
        
        url = reverse('recipes:rating-list')
        response = api_client.get(url, {'is_verified_purchase': 'true'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2
        
        response = api_client.get(url, {'is_verified_purchase': 'false'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3

    def test_search_in_reviews(self, api_client):
        """Test searching within review text."""
        RatingFactory(review='This is an amazing recipe!')
        RatingFactory(review='Good but not great')
        RatingFactory(review='Amazing taste and texture')
        
        url = reverse('recipes:rating-list')
        response = api_client.get(url, {'search': 'amazing'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2

    def test_ordering_by_rating(self, api_client):
        """Test ordering ratings by rating value."""
        rating1 = RatingFactory(rating=5)
        rating2 = RatingFactory(rating=2)
        rating3 = RatingFactory(rating=4)
        
        url = reverse('recipes:rating-list')
        response = api_client.get(url, {'ordering': '-rating'})
        assert response.status_code == status.HTTP_200_OK
        
        results = response.data['results']
        assert results[0]['rating'] == 5
        assert results[1]['rating'] == 4
        assert results[2]['rating'] == 2

    def test_ordering_by_helpful_count(self, api_client):
        """Test ordering ratings by helpful count."""
        rating1 = RatingFactory(helpful_count=10)
        rating2 = RatingFactory(helpful_count=5)
        rating3 = RatingFactory(helpful_count=15)
        
        url = reverse('recipes:rating-list')
        response = api_client.get(url, {'ordering': '-helpful_count'})
        assert response.status_code == status.HTTP_200_OK
        
        results = response.data['results']
        assert results[0]['helpful_count'] == 15
        assert results[1]['helpful_count'] == 10
        assert results[2]['helpful_count'] == 5 