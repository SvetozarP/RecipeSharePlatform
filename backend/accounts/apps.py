from django.apps import AppConfig


class AccountsConfig(AppConfig):
    name = 'accounts'
    verbose_name = 'User Accounts'

    def ready(self):
        """Initialize app and register signal handlers."""
        import accounts.signals  # noqa 