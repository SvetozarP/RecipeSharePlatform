"""
User preferences model.
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
import pytz
from core.models import BaseModel

User = get_user_model()


class UserPreferences(BaseModel):
    """User application preferences and settings"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    
    # Communication preferences
    email_notifications = models.BooleanField(default=True)
    marketing_emails = models.BooleanField(default=False)
    
    # Privacy preferences
    public_profile = models.BooleanField(default=True)
    show_email = models.BooleanField(default=False)
    
    # Application preferences
    timezone = models.CharField(max_length=50, default='UTC')
    language = models.CharField(max_length=10, default='en')
    theme = models.CharField(max_length=20, default='light', choices=[
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('auto', 'Auto')
    ])
    
    def clean(self):
        """Validate the model fields."""
        super().clean()
        
        # Validate timezone
        if self.timezone and self.timezone not in pytz.all_timezones:
            raise ValidationError({'timezone': 'Invalid timezone'})
    
    def save(self, *args, **kwargs):
        """Override save to call clean."""
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Preferences for {self.user.email}"
    
    class Meta:
        db_table = 'user_preferences' 