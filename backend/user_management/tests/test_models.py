"""
Tests for user management models.
"""

import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from user_management.models import UserProfile, UserPreferences

User = get_user_model()
pytestmark = pytest.mark.django_db


class TestUserProfile:
    """Test UserProfile model."""

    def test_profile_creation(self, user):
        """Test profile is created successfully."""
        profile = user.profile
        assert isinstance(profile, UserProfile)
        assert profile.user == user
        assert profile.first_name == 'Test'
        assert profile.last_name == 'User'
        assert profile.is_public_profile is True

    def test_profile_str_representation(self, user):
        """Test profile string representation."""
        profile = user.profile
        assert str(profile) == f"{user.username}'s profile"

    def test_profile_unique_constraint(self, user):
        """Test one profile per user constraint."""
        with pytest.raises(IntegrityError):
            UserProfile.objects.create(user=user)

    def test_profile_fields_validation(self, user):
        """Test profile fields validation."""
        profile = user.profile
        
        # Test max lengths
        profile.first_name = 'a' * 151
        profile.last_name = 'a' * 151
        profile.bio = 'a' * 501
        profile.location = 'a' * 101
        profile.phone = 'a' * 21
        
        with pytest.raises(ValidationError):
            profile.full_clean()


class TestUserPreferences:
    """Test UserPreferences model."""

    def test_preferences_creation(self, user):
        """Test preferences are created successfully."""
        prefs = user.preferences
        assert isinstance(prefs, UserPreferences)
        assert prefs.user == user
        assert prefs.email_notifications is True
        assert prefs.marketing_emails is False
        assert prefs.theme == 'light'

    def test_preferences_str_representation(self, user):
        """Test preferences string representation."""
        prefs = user.preferences
        assert str(prefs) == f"{user.username}'s preferences"

    def test_preferences_unique_constraint(self, user):
        """Test one preferences per user constraint."""
        with pytest.raises(IntegrityError):
            UserPreferences.objects.create(user=user)

    def test_preferences_theme_choices(self, user):
        """Test theme choices validation."""
        prefs = user.preferences
        
        # Valid themes
        valid_themes = ['light', 'dark', 'auto']
        for theme in valid_themes:
            prefs.theme = theme
            prefs.full_clean()  # Should not raise
        
        # Invalid theme
        prefs.theme = 'invalid'
        with pytest.raises(ValidationError):
            prefs.full_clean()

    def test_preferences_defaults(self, user_data):
        """Test preferences default values."""
        new_user = User.objects.create_user(
            email='new@example.com',
            username='newuser',
            password='testpass123'
        )
        prefs = UserPreferences.objects.create(user=new_user)
        
        assert prefs.email_notifications is True
        assert prefs.marketing_emails is False
        assert prefs.public_profile is True
        assert prefs.show_email is False
        assert prefs.timezone == 'UTC'
        assert prefs.language == 'en'
        assert prefs.theme == 'light' 