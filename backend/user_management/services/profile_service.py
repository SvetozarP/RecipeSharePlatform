from django.utils import timezone
from django.core.exceptions import ValidationError
from core.interfaces.service import Service
from core.events.bus import EventBus
from ..repositories.user_repository import UserRepository

class ProfileService(Service):
    """Profile management business logic"""
    
    def __init__(self):
        self.repository = UserRepository()
    
    def get_profile(self, user_id: int) -> dict:
        """Get user profile with preferences"""
        try:
            user = self.repository.get_user_by_id(user_id)
            if not user:
                raise ValidationError("User not found")
            
            profile = self.repository.get_profile(user_id)
            preferences = self.repository.get_preferences(user_id)
            
            return {
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
            raise Exception(f"Error fetching profile: {str(e)}")
    
    def update_profile(self, user_id: int, profile_data: dict) -> dict:
        """Update profile information"""
        try:
            user = self.repository.get_user_by_id(user_id)
            if not user:
                raise ValidationError("User not found")
            
            # Update profile
            profile = self.repository.update_profile(user_id, profile_data)
            
            # Publish event
            EventBus.publish('user.profile_updated', {
                'user_id': user_id,
                'fields_updated': list(profile_data.keys()),
                'timestamp': timezone.now()
            })
            
            return self.get_profile(user_id)
            
        except ValidationError as e:
            raise ValidationError(str(e))
        except Exception as e:
            raise Exception(f"Error updating profile: {str(e)}")
    
    def update_preferences(self, user_id: int, preferences_data: dict) -> dict:
        """Update user preferences"""
        try:
            user = self.repository.get_user_by_id(user_id)
            if not user:
                raise ValidationError("User not found")
            
            # Update preferences
            preferences = self.repository.update_preferences(user_id, preferences_data)
            
            # Publish event
            EventBus.publish('user.preferences_updated', {
                'user_id': user_id,
                'fields_updated': list(preferences_data.keys()),
                'timestamp': timezone.now()
            })
            
            return self.get_profile(user_id)
            
        except ValidationError as e:
            raise ValidationError(str(e))
        except Exception as e:
            raise Exception(f"Error updating preferences: {str(e)}")
    
    def toggle_profile_visibility(self, user_id: int) -> dict:
        """Toggle profile public/private status"""
        try:
            profile = self.repository.get_profile(user_id)
            if not profile:
                raise ValidationError("Profile not found")
            
            # Toggle visibility
            profile_data = {
                'is_public_profile': not profile.is_public_profile
            }
            
            # Update profile
            updated_profile = self.repository.update_profile(user_id, profile_data)
            
            # Publish event
            EventBus.publish('user.profile_visibility_changed', {
                'user_id': user_id,
                'is_public': updated_profile.is_public_profile,
                'timestamp': timezone.now()
            })
            
            return self.get_profile(user_id)
            
        except ValidationError as e:
            raise ValidationError(str(e))
        except Exception as e:
            raise Exception(f"Error toggling profile visibility: {str(e)}")
    
    def validate_profile_access(self, viewer_id: int, profile_id: int) -> bool:
        """Check if a user can view another user's profile"""
        try:
            # Owner can always view their profile
            if viewer_id == profile_id:
                return True
            
            profile = self.repository.get_profile(profile_id)
            if not profile:
                return False
            
            # Public profiles are visible to all
            return profile.is_public_profile
            
        except Exception:
            return False 