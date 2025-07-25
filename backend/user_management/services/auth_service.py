"""
Authentication service implementation.
"""

from django.utils import timezone
from django.contrib.auth import authenticate, get_user_model
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from core.interfaces.service import BaseService
from core.events.bus import EventBus
from user_management.repositories.base import UserRepository

User = get_user_model()


class AuthService(BaseService):
    """Authentication business logic"""
    
    def __init__(self):
        super().__init__(UserRepository())
    
    def create(self, **kwargs) -> User:
        """Create a new user."""
        return super().create(**kwargs)
    
    def update(self, id: int, **kwargs) -> User:
        """Update user data."""
        return super().update(id, **kwargs)
    
    def delete(self, id: int) -> bool:
        """Delete user account."""
        return super().delete(id)
    
    def get_by_id(self, id: int) -> User:
        """Get user by ID."""
        return super().get_by_id(id)
    
    def get_all(self) -> list[User]:
        """Get all users."""
        return super().get_all()
    
    def login_user(self, email: str, password: str) -> dict:
        """Authenticate user and return tokens."""
        user = authenticate(email=email, password=password)
        
        if not user:
            raise ValidationError("Invalid credentials")
        
        if not user.is_active:
            raise ValidationError("Account is deactivated")
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        # Publish login event
        EventBus.publish('user.login', {
            'user_id': user.id,
            'timestamp': timezone.now(),
            'ip_address': None  # Will be set by middleware
        })
        
        return {
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            }
        }
    
    def logout_user(self, refresh_token: str) -> bool:
        """Logout user by blacklisting refresh token."""
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return True
        except Exception:
            return False
    
    def refresh_token(self, refresh_token: str) -> dict:
        """Get new access token using refresh token"""
        try:
            refresh = RefreshToken(refresh_token)
            
            return {
                'access': str(refresh.access_token)
            }
            
        except Exception as e:
            raise ValidationError("Invalid refresh token")
    
    def verify_token(self, token: str) -> bool:
        """Verify if a token is valid"""
        try:
            RefreshToken(token)
            return True
        except Exception:
            return False
    
    def change_password(self, user_id: int, old_password: str, new_password: str) -> bool:
        """Change user password"""
        try:
            user = self.repository.get_user_by_id(user_id)
            if not user:
                raise ValidationError("User not found")
            
            # Verify old password
            if not user.check_password(old_password):
                raise ValidationError("Invalid current password")
            
            # Set new password
            user.set_password(new_password)
            user.save()
            
            # Publish password changed event
            EventBus.publish('user.password_changed', {
                'user_id': user_id,
                'timestamp': timezone.now()
            })
            
            return True
            
        except ValidationError as e:
            raise ValidationError(str(e))
        except Exception as e:
            raise Exception(f"Error changing password: {str(e)}")
    
    def reset_password(self, email: str) -> bool:
        """Initiate password reset process"""
        try:
            user = self.repository.get_user_by_email(email)
            if not user:
                # Return True even if user not found for security
                return True
            
            # Generate password reset token
            token = RefreshToken.for_user(user)
            
            # Publish password reset requested event
            EventBus.publish('user.password_reset_requested', {
                'user_id': user.id,
                'email': user.email,
                'reset_token': str(token),
                'timestamp': timezone.now()
            })
            
            return True
            
        except Exception as e:
            raise Exception(f"Error initiating password reset: {str(e)}")
    
    def confirm_reset_password(self, token: str, new_password: str) -> bool:
        """Complete password reset process"""
        try:
            # Verify token and get user
            refresh = RefreshToken(token)
            user_id = refresh.payload.get('user_id')
            
            if not user_id:
                raise ValidationError("Invalid reset token")
            
            user = self.repository.get_user_by_id(user_id)
            if not user:
                raise ValidationError("User not found")
            
            # Set new password
            user.set_password(new_password)
            user.save()
            
            # Publish password reset completed event
            EventBus.publish('user.password_reset_completed', {
                'user_id': user_id,
                'timestamp': timezone.now()
            })
            
            return True
            
        except Exception as e:
            raise ValidationError("Invalid or expired reset token") 