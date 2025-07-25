"""
Common fixtures for user management tests.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from user_management.tests.factories import UserFactory, UserProfileFactory, UserPreferencesFactory
from user_management.services.user_service import UserService
from user_management.services.auth_service import AuthService
from user_management.services.profile_service import ProfileService

User = get_user_model()


@pytest.fixture
def api_client():
    """Return an API client."""
    return APIClient()


@pytest.fixture
def user():
    """Create and return a regular user."""
    return UserFactory()


@pytest.fixture
def auth_client(api_client, user):
    """Return an authenticated API client."""
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def user_data():
    """Return test user data."""
    return {
        'email': 'test@example.com',
        'username': 'testuser',
        'password': 'testpass123',
        'first_name': 'Test',
        'last_name': 'User'
    }


@pytest.fixture
def profile_data():
    """Return test profile data."""
    return {
        'first_name': 'Updated',
        'last_name': 'Name',
        'bio': 'Test bio',
        'location': 'Test City',
        'website': 'https://example.com',
        'phone': '+1234567890',
        'birth_date': '1990-01-01'
    }


@pytest.fixture
def preferences_data():
    """Return test preferences data."""
    return {
        'email_notifications': True,
        'marketing_emails': False,
        'public_profile': True,
        'show_email': False,
        'timezone': 'UTC',
        'language': 'en',
        'theme': 'light'
    }


@pytest.fixture
def user_service():
    """Return a UserService instance."""
    return UserService()


@pytest.fixture
def auth_service():
    """Return an AuthService instance."""
    return AuthService()


@pytest.fixture
def profile_service():
    """Return a ProfileService instance."""
    return ProfileService() 