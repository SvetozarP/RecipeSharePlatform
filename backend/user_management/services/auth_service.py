from django.utils import timezone
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from core.interfaces.service import Service
from core.events.bus import EventBus
from ..repositories.user_repository import UserRepository

class AuthService(Service):
    """Authentication business logic"""
    
    def __init__(self):
        self.repository = UserRepository()
    
    def login_user(self, email: str, password: str) -> dict:
        """Authenticate user and return tokens"""
        try:
            # Authenticate user
            user = authenticate(email=email, password=password)
            
            if not user:
                raise ValidationError("Invalid credentials")
            
            if not user.is_active:
                raise ValidationError("Account is deactivated")
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            # Get user profile data
            profile = self.repository.get_profile(user.id)
            preferences = self.repository.get_preferences(user.id)
            
            # Publish login event
            EventBus.publish('user.login', {
                'user_id': user.id,
                'timestamp': timezone.now()
            })
            
            return {
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                },
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username
                },
                'profile': {
                    'first_name': profile.first_name,
                    'last_name': profile.last_name,
                    'is_public_profile': profile.is_public_profile
                } if profile else None,
                'preferences': {
                    'timezone': preferences.timezone,
                    'language': preferences.language,
                    'theme': preferences.theme
                } if preferences else None
            }
            
        except ValidationError as e:
            raise ValidationError(str(e))
        except Exception as e:
            raise Exception(f"Error during login: {str(e)}")
    
    def logout_user(self, refresh_token: str) -> bool:
        """Logout user by blacklisting refresh token"""
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            # Publish logout event
            EventBus.publish('user.logout', {
                'timestamp': timezone.now()
            })
            
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