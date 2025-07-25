from django.utils import timezone
from django.core.exceptions import ValidationError
from core.interfaces.service import Service
from core.events.bus import EventBus
from ..repositories.user_repository import UserRepository

class UserService(Service):
    """Business logic for user management"""
    
    def __init__(self):
        self.repository = UserRepository()
    
    def create_user(self, user_data: dict) -> dict:
        """Create a new user with profile and preferences"""
        try:
            # Create user
            user = self.repository.create_user(user_data)
            
            # Create associated profile and preferences
            profile = self.repository.create_profile(user)
            preferences = self.repository.create_preferences(user)
            
            # Publish event
            EventBus.publish('user.registered', {
                'user_id': user.id,
                'email': user.email,
                'timestamp': timezone.now()
            })
            
            return {
                'user_id': user.id,
                'email': user.email,
                'profile_id': profile.id,
                'preferences_id': preferences.id
            }
            
        except ValidationError as e:
            raise ValidationError(str(e))
        except Exception as e:
            raise Exception(f"Error creating user: {str(e)}")
    
    def get_user_profile(self, user_id: int) -> dict:
        """Get user profile information"""
        try:
            user = self.repository.get_user_by_id(user_id)
            if not user:
                raise ValidationError("User not found")
                
            profile = self.repository.get_profile(user_id)
            preferences = self.repository.get_preferences(user_id)
            
            return {
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'is_active': user.is_active
                },
                'profile': {
                    'first_name': profile.first_name,
                    'last_name': profile.last_name,
                    'bio': profile.bio,
                    'location': profile.location,
                    'website': profile.website,
                    'phone': profile.phone,
                    'birth_date': profile.birth_date,
                    'is_public_profile': profile.is_public_profile
                } if profile else None,
                'preferences': {
                    'email_notifications': preferences.email_notifications,
                    'marketing_emails': preferences.marketing_emails,
                    'public_profile': preferences.public_profile,
                    'show_email': preferences.show_email,
                    'timezone': preferences.timezone,
                    'language': preferences.language,
                    'theme': preferences.theme
                } if preferences else None
            }
            
        except ValidationError as e:
            raise ValidationError(str(e))
        except Exception as e:
            raise Exception(f"Error fetching user profile: {str(e)}")
    
    def update_profile(self, user_id: int, profile_data: dict) -> dict:
        """Update user profile information"""
        try:
            user = self.repository.get_user_by_id(user_id)
            if not user:
                raise ValidationError("User not found")
            
            # Update user fields if provided
            user_fields = ['email', 'username']
            user_data = {k: v for k, v in profile_data.items() if k in user_fields}
            if user_data:
                user = self.repository.update_user(user_id, user_data)
            
            # Update profile fields
            profile_fields = ['first_name', 'last_name', 'bio', 'location', 'website', 'phone', 'birth_date', 'is_public_profile']
            profile_data = {k: v for k, v in profile_data.items() if k in profile_fields}
            if profile_data:
                profile = self.repository.update_profile(user_id, profile_data)
            
            # Update preferences if provided
            preferences_fields = ['email_notifications', 'marketing_emails', 'public_profile', 'show_email', 'timezone', 'language', 'theme']
            preferences_data = {k: v for k, v in profile_data.items() if k in preferences_fields}
            if preferences_data:
                preferences = self.repository.update_preferences(user_id, preferences_data)
            
            # Publish event
            EventBus.publish('user.profile_updated', {
                'user_id': user_id,
                'fields_updated': list(profile_data.keys()) + list(user_data.keys()) + list(preferences_data.keys()),
                'timestamp': timezone.now()
            })
            
            # Return updated profile
            return self.get_user_profile(user_id)
            
        except ValidationError as e:
            raise ValidationError(str(e))
        except Exception as e:
            raise Exception(f"Error updating user profile: {str(e)}")
    
    def deactivate_account(self, user_id: int) -> bool:
        """Soft delete user account"""
        try:
            result = self.repository.deactivate_user(user_id)
            
            if result:
                EventBus.publish('user.deactivated', {
                    'user_id': user_id,
                    'timestamp': timezone.now()
                })
            
            return result
            
        except Exception as e:
            raise Exception(f"Error deactivating user account: {str(e)}")
    
    def validate_user_exists(self, user_id: int) -> bool:
        """Check if user exists and is active"""
        user = self.repository.get_user_by_id(user_id)
        return user is not None and user.is_active 