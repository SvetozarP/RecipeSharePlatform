"""
Factories for recipe tests.
"""

import factory
from django.contrib.auth import get_user_model
from faker import Faker

from ..models import Recipe

fake = Faker()
User = get_user_model()


class RecipeFactory(factory.django.DjangoModelFactory):
    """Factory for Recipe model."""

    class Meta:
        model = Recipe

    title = factory.LazyFunction(lambda: fake.sentence(nb_words=4))
    description = factory.LazyFunction(lambda: fake.paragraph())
    prep_time = factory.LazyFunction(lambda: fake.random_int(min=5, max=60))
    cook_time = factory.LazyFunction(lambda: fake.random_int(min=10, max=120))
    servings = factory.LazyFunction(lambda: fake.random_int(min=1, max=8))
    difficulty = factory.LazyFunction(lambda: fake.random_element(elements=Recipe.DifficultyLevel.values))
    cooking_method = factory.LazyFunction(lambda: fake.random_element(elements=Recipe.CookingMethod.values))
    ingredients = factory.LazyFunction(lambda: [
        {
            'name': fake.word(),
            'amount': fake.random_int(min=1, max=1000),
            'unit': fake.random_element(elements=['g', 'ml', 'tsp', 'tbsp', 'cup', 'piece'])
        } for _ in range(fake.random_int(min=3, max=10))
    ])
    instructions = factory.LazyFunction(lambda: [
        fake.sentence() for _ in range(fake.random_int(min=3, max=8))
    ])
    nutrition_info = factory.LazyFunction(lambda: {
        'calories': fake.random_int(min=50, max=1000),
        'protein': fake.random_int(min=0, max=50),
        'carbohydrates': fake.random_int(min=0, max=100),
        'fat': fake.random_int(min=0, max=50)
    })
    images = factory.LazyFunction(lambda: {})  # Default to empty images dict
    author = factory.SubFactory('accounts.tests.factories.UserFactory')
    is_published = factory.LazyFunction(lambda: fake.boolean())
    tags = factory.LazyFunction(lambda: [
        fake.word() for _ in range(fake.random_int(min=1, max=5))
    ]) 