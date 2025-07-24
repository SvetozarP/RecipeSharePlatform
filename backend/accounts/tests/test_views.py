"""
Tests for authentication views.
"""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


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


class TestRegistration:
    """Test user registration endpoint."""

    url = '/api/v1/auth/register/'

    def test_user_can_register(self, api_client):
        """Test successful user registration."""
        data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User'
        }

        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert 'user' in response.data
        assert 'tokens' in response.data
        assert response.data['user']['email'] == data['email']

    def test_cannot_register_with_existing_email(self, api_client, user):
        """Test registration with existing email fails."""
        data = {
            'email': user.email,
            'username': 'newuser',
            'password': 'testpass123',
            'password_confirm': 'testpass123'
        }

        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'email' in response.data

    def test_cannot_register_with_invalid_password(self, api_client):
        """Test registration with invalid password fails."""
        data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'password': '123',  # Too short
            'password_confirm': '123'
        }

        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password' in response.data


class TestLogin:
    """Test login endpoint."""

    url = '/api/v1/auth/login/'

    def test_user_can_login(self, api_client, user):
        """Test successful user login."""
        data = {
            'email': user.email,
            'password': 'testpass123'
        }

        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert 'user' in response.data

    def test_cannot_login_with_wrong_password(self, api_client, user):
        """Test login with wrong password fails."""
        data = {
            'email': user.email,
            'password': 'wrongpass'
        }

        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestLogout:
    """Test logout endpoint."""

    url = '/api/v1/auth/logout/'

    def test_user_can_logout(self, auth_client, user):
        """Test successful user logout."""
        refresh = RefreshToken.for_user(user)
        data = {'refresh': str(refresh)}

        response = auth_client.post(self.url, data)
        assert response.status_code == status.HTTP_200_OK

    def test_cannot_logout_without_token(self, api_client):
        """Test logout without token fails."""
        response = api_client.post(self.url, {})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestChangePassword:
    """Test change password endpoint."""

    url = '/api/v1/auth/password/change/'

    def test_user_can_change_password(self, auth_client, user):
        """Test successful password change."""
        data = {
            'old_password': 'testpass123',
            'new_password': 'newtestpass123',
            'new_password_confirm': 'newtestpass123'
        }

        response = auth_client.post(self.url, data)
        assert response.status_code == status.HTTP_200_OK

        # Verify can login with new password
        login_data = {
            'email': user.email,
            'password': 'newtestpass123'
        }
        response = auth_client.post('/api/v1/auth/login/', login_data)
        assert response.status_code == status.HTTP_200_OK

    def test_cannot_change_password_with_wrong_old_password(self, auth_client):
        """Test password change with wrong old password fails."""
        data = {
            'old_password': 'wrongpass',
            'new_password': 'newtestpass123',
            'new_password_confirm': 'newtestpass123'
        }

        response = auth_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST 