"""
Tests for user management models.
"""

import pytest
from django.core.exceptions import ValidationError

from user_management.models.user_profile import UserProfile
from user_management.models.user_preferences import UserPreferences
from user_management.tests.factories import UserFactory, UserProfileFactory, UserPreferencesFactory

pytestmark = pytest.mark.django_db


class TestUserProfile:
    """Test UserProfile model."""

    def test_create_profile(self):
        """Test creating a user profile."""
        profile = UserProfileFactory()
        assert profile.id is not None
        assert profile.user is not None
        assert profile.first_name is not None
        assert profile.last_name is not None
        assert isinstance(profile.is_public_profile, bool)

    def test_profile_str(self):
        """Test profile string representation."""
        profile = UserProfileFactory(first_name="John", last_name="Doe")
        assert str(profile) == "John Doe"

    def test_profile_full_name(self):
        """Test profile full name property."""
        profile = UserProfileFactory(first_name="John", last_name="Doe")
        assert profile.full_name == "John Doe"

    def test_invalid_website(self):
        """Test invalid website validation."""
        profile = UserProfileFactory()
        profile.website = "not-a-url"
        with pytest.raises(ValidationError):
            profile.full_clean()

    def test_invalid_phone(self):
        """Test invalid phone validation."""
        profile = UserProfileFactory()
        profile.phone = "a" * 21  # Too long
        with pytest.raises(ValidationError):
            profile.full_clean()


class TestUserPreferences:
    """Test UserPreferences model."""

    def test_create_preferences(self):
        """Test creating user preferences."""
        preferences = UserPreferencesFactory()
        assert preferences.id is not None
        assert preferences.user is not None
        assert isinstance(preferences.email_notifications, bool)
        assert isinstance(preferences.marketing_emails, bool)
        assert isinstance(preferences.public_profile, bool)
        assert isinstance(preferences.show_email, bool)
        assert preferences.timezone is not None
        assert preferences.language is not None
        assert preferences.theme is not None

    def test_preferences_str(self):
        """Test preferences string representation."""
        preferences = UserPreferencesFactory()
        assert str(preferences) == f"Preferences for {preferences.user.email}"

    def test_default_values(self):
        """Test default values for preferences."""
        preferences = UserPreferencesFactory()
        assert preferences.email_notifications is True
        assert preferences.marketing_emails is False
        assert preferences.public_profile is True
        assert preferences.show_email is False
        assert preferences.timezone == "UTC"
        assert preferences.language == "en"
        assert preferences.theme == "light"

    def test_invalid_timezone(self):
        """Test invalid timezone validation."""
        preferences = UserPreferencesFactory()
        preferences.timezone = "invalid-timezone"
        with pytest.raises(ValidationError):
            preferences.full_clean()

    def test_invalid_language(self):
        """Test invalid language validation."""
        preferences = UserPreferencesFactory()
        preferences.language = "invalid-lang"
        with pytest.raises(ValidationError):
            preferences.full_clean()

    def test_invalid_theme(self):
        """Test invalid theme validation."""
        preferences = UserPreferencesFactory()
        preferences.theme = "invalid-theme"
        with pytest.raises(ValidationError):
            preferences.full_clean() 