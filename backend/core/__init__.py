"""
Core module for Recipe Sharing Platform.

This module provides foundational services and utilities used across the application:
- Event system for module communication
- Service registry for dependency management
- Shared interfaces for consistent patterns
- Cross-cutting concerns (auth, logging, validation)
"""

default_app_config = 'core.apps.CoreConfig' 