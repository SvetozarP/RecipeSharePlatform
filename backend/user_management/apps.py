"""
User management app configuration.
"""

from django.apps import AppConfig


class UserManagementConfig(AppConfig):
    """User management app configuration."""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'user_management'
    verbose_name = 'User Management'

    def ready(self):
        """Initialize app."""
        from . import config
        config.initialize_module() 