"""
Tests for rating models.
"""

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from recipes.models import Rating
from recipes.tests.factories import RatingFactory, RecipeFactory
from accounts.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestRatingModel:
    """Test Rating model."""

    def test_create_rating(self):
        """Test creating a rating."""
        rating = RatingFactory()
        assert rating.id is not None
        assert rating.recipe is not None
        assert rating.user is not None
        assert 1 <= rating.rating <= 5
        assert rating.review is not None
        assert isinstance(rating.is_verified_purchase, bool)
        assert rating.helpful_count >= 0

    def test_rating_str(self):
        """Test rating string representation."""
        rating = RatingFactory()
        expected = f"{rating.user.email} rated {rating.recipe.title} - {rating.rating} stars"
        assert str(rating) == expected

    def test_star_display(self):
        """Test star display property."""
        rating = RatingFactory(rating=3)
        assert rating.star_display == "★★★☆☆"
        
        rating.rating = 5
        assert rating.star_display == "★★★★★"
        
        rating.rating = 1
        assert rating.star_display == "★☆☆☆☆"

    def test_rating_validation(self):
        """Test rating value validation."""
        rating = RatingFactory()
        
        # Valid ratings
        for valid_rating in [1, 2, 3, 4, 5]:
            rating.rating = valid_rating
            rating.full_clean()  # Should not raise
        
        # Invalid ratings
        for invalid_rating in [0, 6, -1, 10]:
            rating.rating = invalid_rating
            with pytest.raises(ValidationError):
                rating.full_clean()

    def test_unique_constraint(self):
        """Test unique constraint for user-recipe combination."""
        user = UserFactory()
        recipe = RecipeFactory()
        
        # Create first rating
        RatingFactory(user=user, recipe=recipe)
        
        # Try to create second rating for same user-recipe combination
        with pytest.raises(IntegrityError):
            RatingFactory(user=user, recipe=recipe)

    def test_recipe_rating_stats_update(self):
        """Test that recipe rating stats are updated when ratings change."""
        recipe = RecipeFactory()
        user1 = UserFactory()
        user2 = UserFactory()
        
        # Initially no ratings
        assert recipe.average_rating == 0.0
        assert recipe.rating_count == 0
        
        # Add first rating
        rating1 = RatingFactory(recipe=recipe, user=user1, rating=4)
        recipe.refresh_from_db()
        assert recipe.average_rating == 4.0
        assert recipe.rating_count == 1
        
        # Add second rating
        rating2 = RatingFactory(recipe=recipe, user=user2, rating=2)
        recipe.refresh_from_db()
        assert recipe.average_rating == 3.0
        assert recipe.rating_count == 2
        
        # Update rating
        rating1.rating = 5
        rating1.save()
        recipe.refresh_from_db()
        assert recipe.average_rating == 3.5
        assert recipe.rating_count == 2
        
        # Delete rating
        rating1.delete()
        recipe.refresh_from_db()
        assert recipe.average_rating == 2.0
        assert recipe.rating_count == 1

    def test_recipe_rating_distribution(self):
        """Test recipe rating distribution calculation."""
        recipe = RecipeFactory()
        
        # Create ratings with different values
        RatingFactory(recipe=recipe, rating=5)
        RatingFactory(recipe=recipe, rating=5)
        RatingFactory(recipe=recipe, rating=4)
        RatingFactory(recipe=recipe, rating=3)
        RatingFactory(recipe=recipe, rating=1)
        
        distribution = recipe.rating_distribution
        assert distribution[5] == 2
        assert distribution[4] == 1
        assert distribution[3] == 1
        assert distribution[2] == 0
        assert distribution[1] == 1

    def test_recipe_star_display(self):
        """Test recipe star display property."""
        recipe = RecipeFactory()
        
        # No ratings
        assert recipe.star_display == "☆☆☆☆☆"
        
        # Add some ratings
        RatingFactory(recipe=recipe, rating=5)
        RatingFactory(recipe=recipe, rating=3)
        # Average: 4.0
        
        # Should show 4 full stars and 1 empty
        assert recipe.star_display == "★★★★☆"

    def test_recipe_has_user_rated(self):
        """Test checking if user has rated a recipe."""
        recipe = RecipeFactory()
        user1 = UserFactory()
        user2 = UserFactory()
        
        # No ratings yet
        assert not recipe.has_user_rated(user1)
        assert not recipe.has_user_rated(user2)
        
        # User1 rates the recipe
        RatingFactory(recipe=recipe, user=user1)
        assert recipe.has_user_rated(user1)
        assert not recipe.has_user_rated(user2)

    def test_recipe_get_user_rating(self):
        """Test getting user's rating for a recipe."""
        recipe = RecipeFactory()
        user1 = UserFactory()
        user2 = UserFactory()
        
        # No ratings yet
        assert recipe.get_user_rating(user1) is None
        assert recipe.get_user_rating(user2) is None
        
        # User1 rates the recipe
        rating = RatingFactory(recipe=recipe, user=user1, rating=4)
        assert recipe.get_user_rating(user1) == rating
        assert recipe.get_user_rating(user2) is None

    def test_review_max_length(self):
        """Test review maximum length constraint."""
        rating = RatingFactory()
        rating.review = "x" * 2001  # Exceeds max_length of 2000
        
        with pytest.raises(ValidationError):
            rating.full_clean()

    def test_helpful_count_default(self):
        """Test helpful count default value."""
        # Create rating without specifying helpful_count to test default
        user = UserFactory()
        recipe = RecipeFactory()
        rating = Rating.objects.create(
            recipe=recipe,
            user=user,
            rating=4,
            review="Test review"
            # helpful_count should default to 0
        )
        assert rating.helpful_count == 0

    def test_verified_purchase_default(self):
        """Test verified purchase default value."""
        # Create rating without specifying is_verified_purchase to test default
        user = UserFactory()
        recipe = RecipeFactory()
        rating = Rating.objects.create(
            recipe=recipe,
            user=user,
            rating=4,
            review="Test review"
            # is_verified_purchase should default to False
        )
        assert rating.is_verified_purchase is False

    def test_rating_cascade_deletion(self):
        """Test that ratings are deleted when recipe or user is deleted."""
        rating = RatingFactory()
        recipe = rating.recipe
        user = rating.user
        rating_id = rating.id
        
        # Delete recipe - should cascade delete rating
        recipe.delete()
        assert not Rating.objects.filter(id=rating_id).exists()
        
        # Create new rating and delete user
        rating2 = RatingFactory()
        user2 = rating2.user
        rating2_id = rating2.id
        
        user2.delete()
        assert not Rating.objects.filter(id=rating2_id).exists() 