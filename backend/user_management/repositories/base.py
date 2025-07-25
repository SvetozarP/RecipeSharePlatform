"""
Base repository interface for user management.
"""

from django.contrib.auth import get_user_model
from core.interfaces.repository import DjangoRepository
from user_management.models import UserProfile, UserPreferences

User = get_user_model()


class UserRepository(DjangoRepository):
    """Repository for User model."""
    def __init__(self):
        super().__init__(User)
    
    def create_profile(self, user: User) -> UserProfile:
        """Create user profile."""
        return UserProfile.objects.create(user=user)
    
    def create_preferences(self, user: User) -> UserPreferences:
        """Create user preferences."""
        return UserPreferences.objects.create(user=user)


class ProfileRepository(DjangoRepository):
    """Repository for UserProfile model."""
    def __init__(self):
        super().__init__(UserProfile)
    
    def update_preferences(self, user_id: int, preferences_data: dict) -> UserPreferences:
        """Update user preferences."""
        preferences = UserPreferences.objects.get(user_id=user_id)
        for key, value in preferences_data.items():
            setattr(preferences, key, value)
        preferences.save()
        return preferences


class PreferencesRepository(DjangoRepository):
    """Repository for UserPreferences model."""
    def __init__(self):
        super().__init__(UserPreferences) 