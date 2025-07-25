"""
Profile service implementation.
"""

from django.utils import timezone
from django.core.exceptions import ValidationError
from core.interfaces.service import BaseService
from core.events.bus import EventBus
from user_management.models import UserProfile
from user_management.repositories.base import ProfileRepository


class ProfileService(BaseService):
    """Profile management business logic"""
    
    def __init__(self):
        super().__init__(ProfileRepository())
    
    def create(self, **kwargs) -> UserProfile:
        """Create a new profile."""
        return super().create(**kwargs)
    
    def update(self, id: int, **kwargs) -> UserProfile:
        """Update profile data."""
        profile = super().update(id, **kwargs)
        
        EventBus.publish('user.profile_updated', {
            'user_id': id,
            'fields_updated': list(kwargs.keys()),
            'timestamp': timezone.now()
        })
        
        return profile
    
    def delete(self, id: int) -> bool:
        """Delete profile."""
        return super().delete(id)
    
    def get_by_id(self, id: int) -> UserProfile:
        """Get profile by ID."""
        return super().get_by_id(id)
    
    def get_all(self) -> list[UserProfile]:
        """Get all profiles."""
        return super().get_all()
    
    def get_profile(self, user_id: int) -> dict:
        """Get user profile."""
        profile = self.get_by_id(user_id)
        if not profile:
            raise ValidationError("Profile not found")
        
        return {
            'first_name': profile.first_name,
            'last_name': profile.last_name,
            'bio': profile.bio,
            'location': profile.location,
            'website': profile.website,
            'phone': profile.phone,
            'birth_date': profile.birth_date.isoformat() if profile.birth_date else None,
            'is_public_profile': profile.is_public_profile
        }
    
    def update_profile(self, user_id: int, profile_data: dict) -> dict:
        """Update user profile."""
        profile = self.get_by_id(user_id)
        if not profile:
            raise ValidationError("Profile not found")
        
        # Handle user fields
        user_fields = ['email', 'username']
        user_data = {k: v for k, v in profile_data.items() if k in user_fields}
        if user_data:
            user = profile.user
            for key, value in user_data.items():
                setattr(user, key, value)
            user.full_clean()
            user.save()
        
        # Update profile fields
        profile_fields = ['first_name', 'last_name', 'bio', 'location', 'website', 'phone', 'birth_date']
        profile_data = {k: v for k, v in profile_data.items() if k in profile_fields}
        if profile_data:
            profile = self.update(user_id, **profile_data)
        
        return self.get_profile(user_id)
    
    def update_preferences(self, user_id: int, preferences_data: dict) -> dict:
        """Update user preferences."""
        profile = self.get_by_id(user_id)
        if not profile:
            raise ValidationError("Profile not found")
        
        preferences = profile.user.preferences
        for key, value in preferences_data.items():
            setattr(preferences, key, value)
        preferences.full_clean()
        preferences.save()
        
        EventBus.publish('user.preferences_updated', {
            'user_id': user_id,
            'fields_updated': list(preferences_data.keys()),
            'timestamp': timezone.now()
        })
        
        return {
            'email_notifications': preferences.email_notifications,
            'marketing_emails': preferences.marketing_emails,
            'public_profile': preferences.public_profile,
            'show_email': preferences.show_email,
            'timezone': preferences.timezone,
            'language': preferences.language,
            'theme': preferences.theme
        }
    
    def toggle_profile_visibility(self, user_id: int) -> dict:
        """Toggle profile visibility."""
        profile = self.get_by_id(user_id)
        if not profile:
            raise ValidationError("Profile not found")
        
        profile.is_public_profile = not profile.is_public_profile
        profile = self.update(user_id, is_public_profile=profile.is_public_profile)
        
        EventBus.publish('user.visibility_updated', {
            'user_id': user_id,
            'is_public': profile.is_public_profile,
            'timestamp': timezone.now()
        })
        
        return self.get_profile(user_id)
    
    def validate_profile_access(self, viewer_id: int | None, profile_id: int) -> bool:
        """Validate if viewer has access to profile."""
        profile = self.get_by_id(profile_id)
        if not profile:
            return False
        
        # Owner always has access
        if viewer_id == profile_id:
            return True
        
        # Public profiles are accessible to everyone
        return profile.is_public_profile 