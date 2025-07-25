from abc import ABC, abstractmethod
from django.contrib.auth import get_user_model
from ..models import UserProfile, UserPreferences

User = get_user_model()

class UserRepositoryInterface(ABC):
    """Base interface for user data access"""
    
    @abstractmethod
    def create_user(self, user_data: dict) -> User:
        """Create a new user"""
        pass
    
    @abstractmethod
    def get_user_by_id(self, user_id: int) -> User:
        """Get user by ID"""
        pass
    
    @abstractmethod
    def get_user_by_email(self, email: str) -> User:
        """Get user by email"""
        pass
    
    @abstractmethod
    def update_user(self, user_id: int, user_data: dict) -> User:
        """Update user data"""
        pass
    
    @abstractmethod
    def deactivate_user(self, user_id: int) -> bool:
        """Soft delete user account"""
        pass
    
    @abstractmethod
    def create_profile(self, user: User) -> UserProfile:
        """Create user profile"""
        pass
    
    @abstractmethod
    def get_profile(self, user_id: int) -> UserProfile:
        """Get user profile"""
        pass
    
    @abstractmethod
    def update_profile(self, user_id: int, profile_data: dict) -> UserProfile:
        """Update user profile"""
        pass
    
    @abstractmethod
    def create_preferences(self, user: User) -> UserPreferences:
        """Create user preferences"""
        pass
    
    @abstractmethod
    def get_preferences(self, user_id: int) -> UserPreferences:
        """Get user preferences"""
        pass
    
    @abstractmethod
    def update_preferences(self, user_id: int, preferences_data: dict) -> UserPreferences:
        """Update user preferences"""
        pass 