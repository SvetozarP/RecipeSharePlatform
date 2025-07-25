"""
Tests for user management services.
"""

import pytest
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from user_management.services.user_service import UserService
from user_management.services.auth_service import AuthService
from user_management.services.profile_service import ProfileService
from user_management.tests.factories import UserFactory, UserProfileFactory, UserPreferencesFactory

User = get_user_model()
pytestmark = pytest.mark.django_db


class TestUserService:
    """Test UserService."""

    def test_create_user(self, user_service, user_data):
        """Test user creation with profile and preferences."""
        user = user_service.create_user(user_data)
        
        assert user.email == user_data['email']
        assert user.username == user_data['username']
        assert user.check_password(user_data['password'])
        
        # Check profile was created
        assert hasattr(user, 'profile')
        assert user.profile.first_name == user_data['first_name']
        assert user.profile.last_name == user_data['last_name']
        
        # Check preferences were created
        assert hasattr(user, 'preferences')
        assert user.preferences.theme == 'light'

    def test_update_profile(self, user_service, user, profile_data):
        """Test profile update."""
        updated_profile = user_service.update_profile(user.id, profile_data)
        
        assert updated_profile.first_name == profile_data['first_name']
        assert updated_profile.last_name == profile_data['last_name']
        assert updated_profile.bio == profile_data['bio']
        assert updated_profile.location == profile_data['location']
        assert updated_profile.website == profile_data['website']
        assert updated_profile.phone == profile_data['phone']
        assert str(updated_profile.birth_date) == profile_data['birth_date']

    def test_deactivate_account(self, user_service, user):
        """Test account deactivation."""
        result = user_service.deactivate_account(user.id)
        
        assert result is True
        user.refresh_from_db()
        assert user.is_active is False


class TestAuthService:
    """Test AuthService."""

    def test_login_user(self, auth_service, user, user_data):
        """Test user login."""
        tokens = auth_service.login_user(user_data['email'], user_data['password'])
        
        assert 'access_token' in tokens
        assert 'refresh_token' in tokens
        assert 'user' in tokens
        assert tokens['user']['id'] == user.id
        assert tokens['user']['email'] == user.email

    def test_login_with_wrong_password(self, auth_service, user, user_data):
        """Test login with wrong password fails."""
        with pytest.raises(ValidationError):
            auth_service.login_user(user_data['email'], 'wrongpass')

    def test_login_inactive_user(self, auth_service, user, user_data):
        """Test login with inactive user fails."""
        user.is_active = False
        user.save()
        
        with pytest.raises(ValidationError):
            auth_service.login_user(user_data['email'], user_data['password'])

    def test_logout_user(self, auth_service, user):
        """Test user logout."""
        refresh = RefreshToken.for_user(user)
        result = auth_service.logout_user(str(refresh))
        
        assert result is True


class TestProfileService:
    """Test ProfileService."""

    def test_get_profile(self, profile_service, user):
        """Test profile retrieval."""
        profile_data = profile_service.get_profile(user.id)
        
        assert profile_data['first_name'] == user.profile.first_name
        assert profile_data['last_name'] == user.profile.last_name
        assert profile_data['is_public_profile'] == user.profile.is_public_profile

    def test_update_preferences(self, profile_service, user, preferences_data):
        """Test preferences update."""
        updated_prefs = profile_service.update_preferences(user.id, preferences_data)
        
        assert updated_prefs['email_notifications'] == preferences_data['email_notifications']
        assert updated_prefs['marketing_emails'] == preferences_data['marketing_emails']
        assert updated_prefs['public_profile'] == preferences_data['public_profile']
        assert updated_prefs['show_email'] == preferences_data['show_email']
        assert updated_prefs['timezone'] == preferences_data['timezone']
        assert updated_prefs['language'] == preferences_data['language']
        assert updated_prefs['theme'] == preferences_data['theme']

    def test_toggle_profile_visibility(self, profile_service, user):
        """Test profile visibility toggle."""
        initial_visibility = user.profile.is_public_profile
        
        profile_data = profile_service.toggle_profile_visibility(user.id)
        assert profile_data['is_public_profile'] != initial_visibility
        
        # Toggle back
        profile_data = profile_service.toggle_profile_visibility(user.id)
        assert profile_data['is_public_profile'] == initial_visibility

    def test_validate_profile_access(self, profile_service, user):
        """Test profile access validation."""
        # Public profile
        user.profile.is_public_profile = True
        user.profile.save()
        assert profile_service.validate_profile_access(None, user.id) is True
        
        # Private profile
        user.profile.is_public_profile = False
        user.profile.save()
        assert profile_service.validate_profile_access(None, user.id) is False
        assert profile_service.validate_profile_access(user.id, user.id) is True 