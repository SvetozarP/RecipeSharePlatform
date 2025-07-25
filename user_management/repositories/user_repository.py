from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from user_management.models import UserProfile, UserPreferences
from .base import UserRepositoryInterface

User = get_user_model()

class UserRepository(UserRepositoryInterface):
    """Concrete implementation of user data access"""
    
    def create_user(self, user_data: dict) -> User:
        """Create a new user"""
        user = User.objects.create_user(
            email=user_data['email'],
            username=user_data.get('username', user_data['email']),
            password=user_data['password']
        )
        return user
    
    def get_user_by_id(self, user_id: int) -> User:
        """Get user by ID"""
        try:
            return User.objects.get(id=user_id)
        except ObjectDoesNotExist:
            return None
    
    def get_user_by_email(self, email: str) -> User:
        """Get user by email"""
        try:
            return User.objects.get(email=email)
        except ObjectDoesNotExist:
            return None
    
    def update_user(self, user_id: int, user_data: dict) -> User:
        """Update user data"""
        try:
            user = User.objects.get(id=user_id)
            for key, value in user_data.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            user.save()
            return user
        except ObjectDoesNotExist:
            return None
    
    def deactivate_user(self, user_id: int) -> bool:
        """Soft delete user account"""
        try:
            user = User.objects.get(id=user_id)
            user.is_active = False
            user.save()
            return True
        except ObjectDoesNotExist:
            return False
    
    def create_profile(self, user: User) -> UserProfile:
        """Create user profile"""
        profile = UserProfile.objects.create(
            user=user,
            first_name=user.first_name if hasattr(user, 'first_name') else '',
            last_name=user.last_name if hasattr(user, 'last_name') else ''
        )
        return profile
    
    def get_profile(self, user_id: int) -> UserProfile:
        """Get user profile"""
        try:
            return UserProfile.objects.get(user_id=user_id)
        except ObjectDoesNotExist:
            return None
    
    def update_profile(self, user_id: int, profile_data: dict) -> UserProfile:
        """Update user profile"""
        try:
            profile = UserProfile.objects.get(user_id=user_id)
            for key, value in profile_data.items():
                if hasattr(profile, key):
                    setattr(profile, key, value)
            profile.save()
            return profile
        except ObjectDoesNotExist:
            return None
    
    def create_preferences(self, user: User) -> UserPreferences:
        """Create user preferences"""
        preferences = UserPreferences.objects.create(user=user)
        return preferences
    
    def get_preferences(self, user_id: int) -> UserPreferences:
        """Get user preferences"""
        try:
            return UserPreferences.objects.get(user_id=user_id)
        except ObjectDoesNotExist:
            return None
    
    def update_preferences(self, user_id: int, preferences_data: dict) -> UserPreferences:
        """Update user preferences"""
        try:
            preferences = UserPreferences.objects.get(user_id=user_id)
            for key, value in preferences_data.items():
                if hasattr(preferences, key):
                    setattr(preferences, key, value)
            preferences.save()
            return preferences
        except ObjectDoesNotExist:
            return None 