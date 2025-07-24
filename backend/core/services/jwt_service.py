"""
JWT service for token generation and validation.
Provides methods for creating and validating JWT tokens.
"""

from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

class JWTService:
    """
    Service for handling JWT token operations.
    Provides methods for token generation, validation, and refresh.
    """

    def __init__(self):
        """Initialize the JWT service with settings."""
        self.secret_key = settings.JWT_SECRET_KEY
        self.algorithm = settings.JWT_ALGORITHM
        self.access_token_lifetime = settings.JWT_ACCESS_TOKEN_LIFETIME
        self.refresh_token_lifetime = settings.JWT_REFRESH_TOKEN_LIFETIME

    def generate_token_pair(self, user: User) -> Tuple[str, str]:
        """
        Generate a new access and refresh token pair.
        
        Args:
            user: The user to generate tokens for
            
        Returns:
            Tuple of (access_token, refresh_token)
        """
        access_token = self._generate_token(
            user,
            'access',
            self.access_token_lifetime
        )
        refresh_token = self._generate_token(
            user,
            'refresh',
            self.refresh_token_lifetime
        )
        return access_token, refresh_token

    def refresh_tokens(self, refresh_token: str) -> Optional[Tuple[str, str]]:
        """
        Generate new token pair using a refresh token.
        
        Args:
            refresh_token: The refresh token to use
            
        Returns:
            Tuple of (access_token, refresh_token) if successful,
            None if refresh token is invalid
        """
        try:
            # Validate the refresh token
            payload = jwt.decode(
                refresh_token,
                self.secret_key,
                algorithms=[self.algorithm]
            )

            # Check token type
            if payload.get('token_type') != 'refresh':
                return None

            # Get the user
            user_id = payload.get('user_id')
            user = User.objects.get(id=user_id, is_active=True)

            # Generate new token pair
            return self.generate_token_pair(user)

        except (jwt.InvalidTokenError, User.DoesNotExist):
            return None

    def validate_token(self, token: str, token_type: str = 'access') -> Optional[Dict]:
        """
        Validate a JWT token.
        
        Args:
            token: The token to validate
            token_type: The expected token type ('access' or 'refresh')
            
        Returns:
            The token payload if valid, None if invalid
        """
        try:
            # Decode and validate the token
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm]
            )

            # Check token type
            if payload.get('token_type') != token_type:
                return None

            return payload

        except jwt.InvalidTokenError:
            return None

    def _generate_token(self, user: User, token_type: str, lifetime: timedelta) -> str:
        """
        Generate a JWT token.
        
        Args:
            user: The user to generate token for
            token_type: Type of token ('access' or 'refresh')
            lifetime: How long the token should be valid
            
        Returns:
            The generated JWT token
        """
        now = datetime.utcnow()
        payload = {
            'user_id': str(user.id),
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'token_type': token_type,
            'iat': now,
            'exp': now + lifetime,
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm) 