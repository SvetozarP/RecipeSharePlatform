"""
Recipe app configuration.
"""

from django.apps import AppConfig


class RecipesConfig(AppConfig):
    """Configuration for the recipes app."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'recipes'
    verbose_name = 'Recipe Management'

    def ready(self):
        """Initialize app."""
        import recipes.signals  # noqa
