from core.services.registry import ServiceRegistry
from .services.user_service import UserService
from .services.auth_service import AuthService
from .services.profile_service import ProfileService

MODULE_CONFIG = {
    'name': 'user_management',
    'version': '1.0.0',
    'description': 'Handles user registration, authentication, and profile management',
    'dependencies': ['core'],
    'services': {
        'user_service': 'user_management.services.user_service.UserService',
        'auth_service': 'user_management.services.auth_service.AuthService',
        'profile_service': 'user_management.services.profile_service.ProfileService'
    },
    'event_handlers': {
        'user.registered': 'user_management.services.user_service.handle_user_registered',
        'user.login': 'user_management.services.auth_service.handle_user_login',
        'user.profile_updated': 'user_management.services.profile_service.handle_profile_updated'
    }
}

def register_services():
    """Register all services with the service registry"""
    ServiceRegistry.register('user_service', UserService())
    ServiceRegistry.register('auth_service', AuthService())
    ServiceRegistry.register('profile_service', ProfileService())

def initialize_module():
    """Initialize the user management module"""
    register_services() 