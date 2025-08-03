"""
Factories for accounts tests.
"""

import factory
from django.contrib.auth import get_user_model
from faker import Faker

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
    is_email_verified = False 