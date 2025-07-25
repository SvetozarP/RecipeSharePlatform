"""
Tests for user management views.
"""

import pytest
from django.urls import reverse
from rest_framework import status

pytestmark = pytest.mark.django_db


class TestProfileView:
    """Test profile management endpoints."""

    def test_get_own_profile(self, auth_client, user):
        """Test retrieving own profile."""
        url = reverse('user_management:profile')
        response = auth_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == user.profile.first_name
        assert response.data['last_name'] == user.profile.last_name
        assert response.data['is_public_profile'] == user.profile.is_public_profile

    def test_update_profile(self, auth_client, profile_data):
        """Test updating profile."""
        url = reverse('user_management:profile')
        response = auth_client.put(url, profile_data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == profile_data['first_name']
        assert response.data['last_name'] == profile_data['last_name']
        assert response.data['bio'] == profile_data['bio']
        assert response.data['location'] == profile_data['location']
        assert response.data['website'] == profile_data['website']
        assert response.data['phone'] == profile_data['phone']
        assert response.data['birth_date'] == profile_data['birth_date']

    def test_update_profile_invalid_data(self, auth_client):
        """Test updating profile with invalid data."""
        url = reverse('user_management:profile')
        invalid_data = {
            'website': 'not-a-url',
            'phone': 'a' * 21  # Too long
        }
        
        response = auth_client.put(url, invalid_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'website' in response.data
        assert 'phone' in response.data

    def test_profile_requires_auth(self, api_client):
        """Test profile endpoints require authentication."""
        url = reverse('user_management:profile')
        
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        response = api_client.put(url, {})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestPreferencesView:
    """Test preferences management endpoints."""

    def test_get_preferences(self, auth_client, user):
        """Test retrieving preferences."""
        url = reverse('user_management:preferences')
        response = auth_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email_notifications'] == user.preferences.email_notifications
        assert response.data['marketing_emails'] == user.preferences.marketing_emails
        assert response.data['theme'] == user.preferences.theme

    def test_update_preferences(self, auth_client, preferences_data):
        """Test updating preferences."""
        url = reverse('user_management:preferences')
        response = auth_client.put(url, preferences_data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email_notifications'] == preferences_data['email_notifications']
        assert response.data['marketing_emails'] == preferences_data['marketing_emails']
        assert response.data['public_profile'] == preferences_data['public_profile']
        assert response.data['show_email'] == preferences_data['show_email']
        assert response.data['timezone'] == preferences_data['timezone']
        assert response.data['language'] == preferences_data['language']
        assert response.data['theme'] == preferences_data['theme']

    def test_update_preferences_invalid_data(self, auth_client):
        """Test updating preferences with invalid data."""
        url = reverse('user_management:preferences')
        invalid_data = {
            'theme': 'invalid-theme',
            'language': 'invalid-lang'
        }
        
        response = auth_client.put(url, invalid_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'theme' in response.data
        assert 'language' in response.data

    def test_preferences_requires_auth(self, api_client):
        """Test preferences endpoints require authentication."""
        url = reverse('user_management:preferences')
        
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        response = api_client.put(url, {})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestProfileVisibilityView:
    """Test profile visibility toggle endpoint."""

    def test_toggle_visibility(self, auth_client, user):
        """Test toggling profile visibility."""
        url = reverse('user_management:profile-visibility')
        initial_visibility = user.profile.is_public_profile
        
        response = auth_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_public_profile'] != initial_visibility
        
        # Toggle back
        response = auth_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_public_profile'] == initial_visibility

    def test_visibility_requires_auth(self, api_client):
        """Test visibility toggle requires authentication."""
        url = reverse('user_management:profile-visibility')
        response = api_client.post(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestPublicProfileView:
    """Test public profile endpoint."""

    def test_get_public_profile(self, api_client, user):
        """Test retrieving public profile."""
        url = reverse('user_management:public-profile', args=[user.id])
        user.profile.is_public_profile = True
        user.profile.save()
        
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == user.profile.first_name
        assert response.data['last_name'] == user.profile.last_name

    def test_private_profile_access_denied(self, api_client, user):
        """Test private profile access denied."""
        url = reverse('user_management:public-profile', args=[user.id])
        user.profile.is_public_profile = False
        user.profile.save()
        
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_owner_can_access_private_profile(self, auth_client, user):
        """Test profile owner can access private profile."""
        url = reverse('user_management:public-profile', args=[user.id])
        user.profile.is_public_profile = False
        user.profile.save()
        
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['first_name'] == user.profile.first_name
        assert response.data['last_name'] == user.profile.last_name 