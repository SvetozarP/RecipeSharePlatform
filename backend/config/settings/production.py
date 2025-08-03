"""
Production settings for the Recipe Sharing Platform.
Automatically enables performance monitoring and optimizations.
"""

import os
from datetime import timedelta
from .base import *  # noqa

# Set production environment
os.environ['DJANGO_ENV'] = 'production'

# Add WhiteNoise middleware for static file serving in production (with fallback)
try:
    import whitenoise
    MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
except ImportError:
    # WhiteNoise not available - static files will be served by web server
    pass

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-this-in-production')

# JWT settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=30),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# Security settings for production
DEBUG = False

# Default allowed hosts for production
DEFAULT_ALLOWED_HOSTS = [
    'recipe-api-dev98298.azurewebsites.net',
    'localhost',
    '169.254.129.3'
]

# Combine environment variable hosts with default hosts
env_hosts = os.getenv('ALLOWED_HOSTS', '').split(',') if os.getenv('ALLOWED_HOSTS') else []
ALLOWED_HOSTS = list(set(DEFAULT_ALLOWED_HOSTS + [host.strip() for host in env_hosts if host.strip()]))

# Remove debug toolbar from installed apps
if 'debug_toolbar' in INSTALLED_APPS:
    INSTALLED_APPS.remove('debug_toolbar')

if 'debug_toolbar.middleware.DebugToolbarMiddleware' in MIDDLEWARE:
    MIDDLEWARE.remove('debug_toolbar.middleware.DebugToolbarMiddleware')

# Database configuration for production
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'recipe_platform'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}

# Cache configuration for production (Redis with fallback)
try:
    import django_redis
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': os.getenv('REDIS_URL', 'redis://localhost:6379/1'),
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            }
        }
    }
except ImportError:
    # Fallback to local memory cache if django-redis is not available
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unique-snowflake',
            'TIMEOUT': 300,  # 5 minutes default
            'OPTIONS': {
                'MAX_ENTRIES': 1000,
                'CULL_FREQUENCY': 3,  # Remove 1/3 of entries when max is reached
            }
        }
    }

# Email configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').lower() == 'true'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', '')
EMAIL_SUBJECT_PREFIX = '[Recipe Sharing] '

# If email settings are not configured, use console backend
if not (EMAIL_HOST_USER and EMAIL_HOST_PASSWORD):
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Frontend URL
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://white-rock-011c63e03.2.azurestaticapps.net')

# HTTPS settings
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Static files configuration
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# WhiteNoise configuration (with fallback)
try:
    import whitenoise
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
    # Enable static file compression and caching
    WHITENOISE_USE_FINDERS = True
    WHITENOISE_AUTOREFRESH = True
except ImportError:
    # Fallback to default storage if whitenoise is not installed
    STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'

# Media files configuration (Azure Blob Storage)
DEFAULT_FILE_STORAGE = 'storages.backends.azure_storage.AzureStorage'
AZURE_ACCOUNT_NAME = os.getenv('AZURE_ACCOUNT_NAME')
AZURE_ACCOUNT_KEY = os.getenv('AZURE_ACCOUNT_KEY')
AZURE_CUSTOM_DOMAIN = os.getenv('AZURE_CUSTOM_DOMAIN')
AZURE_CONTAINER = os.getenv('AZURE_CONTAINER', 'media')

# Azure Blob Storage configuration for media files
if AZURE_ACCOUNT_NAME and AZURE_ACCOUNT_KEY:
    # Use Azure Blob Storage for media files
    DEFAULT_FILE_STORAGE = 'storages.backends.azure_storage.AzureStorage'
    AZURE_STORAGE_ACCOUNT_NAME = AZURE_ACCOUNT_NAME
    AZURE_STORAGE_ACCOUNT_KEY = AZURE_ACCOUNT_KEY  
    AZURE_STORAGE_CONTAINER_NAME = AZURE_CONTAINER
    AZURE_URL_EXPIRATION_SECS = None  # Never expire URLs
    MEDIA_URL = f'https://{AZURE_ACCOUNT_NAME}.blob.core.windows.net/{AZURE_CONTAINER}/'
else:
    # Fallback to local media storage
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'

# Performance monitoring is automatically enabled in production
# (handled by base.py based on DJANGO_ENV)

# Logging configuration for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

# Add file logging if logs directory is available
logs_dir = os.path.join(BASE_DIR, 'logs')
try:
    os.makedirs(logs_dir, exist_ok=True)
    LOGGING['handlers'].update({
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(logs_dir, 'django.log'),
            'formatter': 'verbose',
        },
        'performance': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(logs_dir, 'performance.log'),
            'formatter': 'verbose',
        },
    })
    
    # Update loggers to include file handlers
    LOGGING['loggers']['django']['handlers'].append('file')
    LOGGING['loggers'].update({
        'core.services.cache_manager': {
            'handlers': ['console', 'performance'],
            'level': 'INFO',
            'propagate': False,
        },
        'core.services.performance_monitor': {
            'handlers': ['console', 'performance'],
            'level': 'INFO',
            'propagate': False,
        },
        'core.middleware.compression': {
            'handlers': ['console', 'performance'],
            'level': 'INFO',
            'propagate': False,
        },
    })
except (OSError, PermissionError):
    # If we can't create logs directory, use console-only logging
    pass

# CORS settings for production
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',') if os.getenv('CORS_ALLOWED_ORIGINS') else []
CORS_ALLOW_CREDENTIALS = True

# X_FRAME_OPTIONS = 'DENY'
# SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https') 