"""
Tests for health check endpoints.
"""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    """Return an API client."""
    return APIClient()


def test_simple_health_check(api_client):
    """Test simple health check endpoint."""
    url = reverse('simple_health_check')
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data['status'] == 'healthy'


def test_api_health_check(api_client):
    """Test detailed API health check endpoint."""
    url = reverse('api_health_check')
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data['status'] == 'healthy'
    assert 'timestamp' in response.data
    assert 'services' in response.data
    assert response.data['services']['database'] == 'connected' 