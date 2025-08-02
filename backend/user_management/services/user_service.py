"""
User service implementation.
"""

from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from core.interfaces.service import BaseService
from core.events.bus import EventBus
from user_management.repositories.base import UserRepository

User = get_user_model()


class UserService(BaseService):
    """Business logic for user management"""
    
    def __init__(self):
        super().__init__(UserRepository())
    
    def create(self, **kwargs) -> User:
        """Create a new user."""
        if 'password' not in kwargs:
            raise ValidationError({'password': ['This field is required.']})
        
        password = kwargs.pop('password')
        if not password:
            raise ValidationError({'password': ['This field cannot be blank.']})
        
        # Extract profile fields
        profile_fields = ['first_name', 'last_name', 'bio', 'location', 'website', 'phone', 'birth_date']
        profile_data = {k: v for k, v in kwargs.items() if k in profile_fields}
        for k in profile_fields:
            kwargs.pop(k, None)
        
        # Create user - profile and preferences will be created automatically by signal
        user = User(**kwargs)
        user.set_password(password)
        user.full_clean()
        user.save()
        
        # Update profile with any additional data after signal creates it
        if profile_data:
            profile = user.profile  # Profile now exists due to signal
            for key, value in profile_data.items():
                setattr(profile, key, value)
            profile.save()
        
        # Publish event
        EventBus.publish('user.registered', {
            'user_id': user.id,
            'email': user.email,
            'timestamp': timezone.now()
        })
        
        return user
    
    def update(self, id: int, **kwargs) -> User:
        """Update user data."""
        user = super().update(id, **kwargs)
        
        EventBus.publish('user.updated', {
            'user_id': id,
            'fields_updated': list(kwargs.keys()),
            'timestamp': timezone.now()
        })
        
        return user
    
    def delete(self, id: int) -> bool:
        """Soft delete user account."""
        user = self.get_by_id(id)
        if not user:
            return False
        
        user.is_active = False
        user.save()
        
        EventBus.publish('user.deactivated', {
            'user_id': id,
            'timestamp': timezone.now()
        })
        
        return True
    
    def get_by_id(self, id: int) -> User:
        """Get user by ID."""
        return super().get_by_id(id)
    
    def get_all(self) -> list[User]:
        """Get all users."""
        return super().get_all()
    
    def create_user(self, user_data: dict) -> User:
        """Create a new user with profile and preferences."""
        return self.create(**user_data)
    
    def update_profile(self, user_id: int, profile_data: dict) -> User:
        """Update user profile information."""
        return self.update(user_id, **profile_data)
    
 