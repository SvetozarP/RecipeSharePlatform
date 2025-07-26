"""
Factories for user management tests.
"""

import factory
from django.contrib.auth import get_user_model
from faker import Faker

from user_management.models.user_profile import UserProfile
from user_management.models.user_preferences import UserPreferences

fake = Faker()
User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    """Factory for User model."""

    class Meta:
        model = User

    email = factory.LazyFunction(lambda: fake.email())
    username = factory.LazyFunction(lambda: fake.user_name())
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')
    is_active = True


class UserProfileFactory(factory.django.DjangoModelFactory):
    """Factory for UserProfile model."""

    class Meta:
        model = UserProfile

    user = factory.SubFactory(UserFactory)
    first_name = factory.LazyFunction(lambda: fake.first_name())
    last_name = factory.LazyFunction(lambda: fake.last_name())
    bio = factory.LazyFunction(lambda: fake.text(max_nb_chars=500))
    location = factory.LazyFunction(lambda: fake.city())
    website = factory.LazyFunction(lambda: fake.url())
    phone = factory.LazyFunction(lambda: fake.phone_number())
    birth_date = factory.LazyFunction(lambda: fake.date())
    is_public_profile = True

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override create to get existing profile from signal and update it."""
        user = kwargs.pop('user')
        # Get the profile that was created by the signal
        try:
            profile = user.profile
            # Update it with the factory data
            for key, value in kwargs.items():
                setattr(profile, key, value)
            profile.save()
            return profile
        except UserProfile.DoesNotExist:
            # Fallback: create normally if no profile exists
            kwargs['user'] = user
            return super()._create(model_class, *args, **kwargs)


class UserPreferencesFactory(factory.django.DjangoModelFactory):
    """Factory for UserPreferences model."""

    class Meta:
        model = UserPreferences

    user = factory.SubFactory(UserFactory)
    email_notifications = True
    marketing_emails = False
    public_profile = True
    show_email = False
    timezone = 'UTC'
    language = 'en'
    theme = 'light'

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override create to get existing preferences from signal and update them."""
        user = kwargs.pop('user')
        # Get the preferences that were created by the signal
        try:
            preferences = user.preferences
            # Update them with the factory data
            for key, value in kwargs.items():
                setattr(preferences, key, value)
            preferences.save()
            return preferences
        except UserPreferences.DoesNotExist:
            # Fallback: create normally if no preferences exist
            kwargs['user'] = user
            return super()._create(model_class, *args, **kwargs) 