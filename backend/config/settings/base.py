"""
Django settings for the project.
"""

from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Application definition
INSTALLED_APPS = [
    # Django apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',

    # Local apps
    'core.apps.CoreConfig',
    'accounts.apps.AccountsConfig',
    'user_management.apps.UserManagementConfig',
    'recipes.apps.RecipesConfig',
    'admin_api.apps.AdminApiConfig',
]

# Middleware configuration
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.error_handler.ErrorHandlerMiddleware',
    'core.middleware.logging.RequestLoggingMiddleware',
    # Performance optimization middleware
    'core.middleware.compression.CompressionMiddleware',
    'core.middleware.compression.ResponseCacheMiddleware',
    'core.middleware.compression.ETagMiddleware',
    'core.middleware.compression.PerformanceHeadersMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files (User uploaded content)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024  # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
FILE_UPLOAD_PERMISSIONS = 0o644

# Content storage settings
CONTENT_STORAGE = {
    'RECIPE_IMAGES_UPLOAD_PATH': 'recipes/images/',
    'ALLOWED_IMAGE_EXTENSIONS': ['.jpg', '.jpeg', '.png', '.webp'],
    'MAX_IMAGE_SIZE': 5 * 1024 * 1024,  # 5MB
    'IMAGE_QUALITY': 85,
    'THUMBNAIL_SIZES': {
        'small': (150, 150),
        'medium': (300, 300),
        'large': (800, 600),
    }
}

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
AUTH_USER_MODEL = 'accounts.User'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_SCHEMA_CLASS': 'rest_framework.schemas.coreapi.AutoSchema',
}

# CORS settings
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = True  # TODO: Change this in production

# Performance and caching settings
PERFORMANCE_MONITORING_ENABLED = True

# Cache configuration
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

# Database optimization settings
DATABASE_OPTIMIZATION = {
    'CONN_MAX_AGE': 600,  # 10 minutes
    'OPTIONS': {
        'timeout': 20,
    }
}

# API response optimization
API_OPTIMIZATION = {
    'COMPRESSION_ENABLED': True,
    'CACHE_ENABLED': True,
    'ETAG_ENABLED': True,
    'MAX_RESPONSE_SIZE': 1024 * 1024,  # 1MB
    'COMPRESSION_THRESHOLD': 1024,  # 1KB
}

# Logging configuration for performance monitoring
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
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'django.log'),
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'performance': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'performance.log'),
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'core.services.cache_manager': {
            'handlers': ['console', 'performance'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'core.services.performance_monitor': {
            'handlers': ['console', 'performance'],
            'level': 'INFO',
            'propagate': False,
        },
        'core.middleware.compression': {
            'handlers': ['console', 'performance'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
} 