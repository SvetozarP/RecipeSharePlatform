"""
Signal handlers for the accounts app.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_profile_and_preferences(sender, instance, created, **kwargs):
    """
    Create user profile and preferences when a user is created.
    """
    if created:
        from user_management.models.user_profile import UserProfile
        from user_management.models.user_preferences import UserPreferences
        
        # Create profile
        UserProfile.objects.create(user=instance)
        
        # Create preferences
        UserPreferences.objects.create(user=instance) 