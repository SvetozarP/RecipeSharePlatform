"""
Authentication middleware for JWT token handling.
Provides JWT token validation and user authentication.
"""

import jwt
from typing import Optional

from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import HttpRequest
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

User = get_user_model()

class JWTAuthenticationMiddleware:
    """
    Middleware for handling JWT authentication.
    Validates JWT tokens and sets request.user.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest):
        # Try to authenticate using JWT
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            user = self._authenticate_token(token)
            if user:
                request.user = user

        return self.get_response(request)

    def _authenticate_token(self, token: str) -> Optional[User]:
        """
        Authenticate a JWT token and return the corresponding user.
        
        Args:
            token: The JWT token to validate
            
        Returns:
            The authenticated user or None if token is invalid
        """
        try:
            # Decode and validate the token
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )

            # Get the user from the payload
            user_id = payload.get('user_id')
            if not user_id:
                return None

            # Get and return the user
            return User.objects.get(id=user_id, is_active=True)

        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            return None
        except User.DoesNotExist:
            return None


class JWTAuthentication(authentication.BaseAuthentication):
    """
    DRF authentication class for JWT tokens.
    Used by DRF views for authentication.
    """

    def authenticate(self, request: HttpRequest):
        """
        Authenticate the request using JWT token.
        
        Args:
            request: The HTTP request to authenticate
            
        Returns:
            Tuple of (user, token) if authentication successful,
            None if no token or invalid token
        """
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )

            user_id = payload.get('user_id')
            if not user_id:
                return None

            user = User.objects.get(id=user_id, is_active=True)
            return (user, token)

        except (jwt.InvalidTokenError, User.DoesNotExist):
            return None

    def authenticate_header(self, request: HttpRequest) -> str:
        """Return the authentication header format."""
        return 'Bearer' 