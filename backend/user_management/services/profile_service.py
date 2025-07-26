"""
Profile service implementation.
"""

from django.utils import timezone
from django.core.exceptions import ValidationError
from typing import Optional, Union
import uuid
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
    
    def update(self, profile_id: Union[str, uuid.UUID], **kwargs) -> UserProfile:
        """Update profile data."""
        profile = super().update(super().get_by_id(profile_id), **kwargs)
        
        EventBus.publish('user.profile_updated', {
            'user_id': str(profile.user.id),
            'fields_updated': list(kwargs.keys()),
            'timestamp': timezone.now()
        })
        
        return profile
    
    def delete(self, profile_id: Union[str, uuid.UUID]) -> bool:
        """Delete profile."""
        return super().delete(profile_id)
    
    def get_by_id(self, profile_id: Union[str, uuid.UUID]) -> UserProfile:
        """Get profile by profile ID."""
        return super().get_by_id(profile_id)
    
    def get_all(self) -> list[UserProfile]:
        """Get all profiles."""
        return super().get_all()
    
    def get_profile_by_user_id(self, user_id: Union[str, uuid.UUID]) -> UserProfile:
        """Get profile by user ID."""
        try:
            return UserProfile.objects.get(user_id=user_id)
        except UserProfile.DoesNotExist:
            raise ValidationError("Profile not found")
    
    def get_profile(self, user_id: Union[str, uuid.UUID]) -> dict:
        """Get user profile data."""
        profile = self.get_profile_by_user_id(user_id)
        
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
    
    def update_profile(self, user_id: Union[str, uuid.UUID], profile_data: dict) -> dict:
        """Update user profile."""
        profile = self.get_profile_by_user_id(user_id)
        
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
        profile_update_data = {k: v for k, v in profile_data.items() if k in profile_fields}
        if profile_update_data:
            for key, value in profile_update_data.items():
                setattr(profile, key, value)
            profile.full_clean()
            profile.save()
        
        return self.get_profile(user_id)
    
    def update_preferences(self, user_id: Union[str, uuid.UUID], preferences_data: dict) -> dict:
        """Update user preferences."""
        profile = self.get_profile_by_user_id(user_id)
        
        preferences = profile.user.preferences
        for key, value in preferences_data.items():
            setattr(preferences, key, value)
        preferences.full_clean()
        preferences.save()
        
        EventBus.publish('user.preferences_updated', {
            'user_id': str(user_id),
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
    
    def toggle_profile_visibility(self, user_id: Union[str, uuid.UUID]) -> dict:
        """Toggle profile visibility."""
        profile = self.get_profile_by_user_id(user_id)
        
        profile.is_public_profile = not profile.is_public_profile
        profile.save()
        
        EventBus.publish('user.visibility_updated', {
            'user_id': str(user_id),
            'is_public': profile.is_public_profile,
            'timestamp': timezone.now()
        })
        
        return self.get_profile(user_id)
    
    def validate_profile_access(self, viewer_id: Optional[Union[str, uuid.UUID]], profile_user_id: Union[str, uuid.UUID]) -> bool:
        """Validate if viewer has access to profile."""
        try:
            profile = self.get_profile_by_user_id(profile_user_id)
        except ValidationError:
            return False
        
        # Owner always has access
        if viewer_id and str(viewer_id) == str(profile_user_id):
            return True
        
        # Public profiles are accessible to everyone
        return profile.is_public_profile 