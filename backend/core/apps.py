from django.apps import AppConfig


class CoreConfig(AppConfig):
    name = 'core'
    verbose_name = 'Core Framework'

    def ready(self):
        """
        Initialize core module components when Django starts.
        This is where we'll register signal handlers and initialize services.
        """
        # Import signal handlers to register them
        from . import signals  # noqa 