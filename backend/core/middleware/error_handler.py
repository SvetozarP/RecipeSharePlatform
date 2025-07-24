"""
Error handling middleware for consistent error responses.
Provides standardized error handling and response formatting.
"""

import logging
import traceback
from typing import Any, Callable, Dict, Optional

from django.conf import settings
from django.core.exceptions import ValidationError
from django.http import HttpRequest, JsonResponse
from rest_framework import status
from rest_framework.exceptions import APIException

logger = logging.getLogger(__name__)

class ErrorHandlerMiddleware:
    """
    Middleware for handling errors and providing consistent error responses.
    Catches exceptions and formats them into standardized JSON responses.
    """

    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> JsonResponse:
        try:
            response = self.get_response(request)
            return response
        except Exception as e:
            return self.handle_error(e)

    def handle_error(self, exc: Exception) -> JsonResponse:
        """
        Handle different types of exceptions and return appropriate responses.
        
        Args:
            exc: The exception to handle
            
        Returns:
            A JsonResponse with standardized error format
        """
        error_data = self._get_error_data(exc)
        status_code = self._get_status_code(exc)

        # Log the error
        self._log_error(exc, error_data, status_code)

        return JsonResponse(
            {
                'error': {
                    'type': exc.__class__.__name__,
                    'message': str(exc),
                    'details': error_data.get('details'),
                    'code': error_data.get('code'),
                }
            },
            status=status_code
        )

    def _get_error_data(self, exc: Exception) -> Dict[str, Any]:
        """Get error details based on exception type."""
        if isinstance(exc, ValidationError):
            return {
                'code': 'validation_error',
                'details': exc.message_dict if hasattr(exc, 'message_dict') else exc.messages
            }
        elif isinstance(exc, APIException):
            return {
                'code': exc.default_code,
                'details': exc.detail if hasattr(exc, 'detail') else None
            }
        else:
            return {
                'code': 'internal_error',
                'details': str(exc) if settings.DEBUG else None
            }

    def _get_status_code(self, exc: Exception) -> int:
        """Get HTTP status code based on exception type."""
        if isinstance(exc, ValidationError):
            return status.HTTP_400_BAD_REQUEST
        elif isinstance(exc, APIException):
            return exc.status_code
        else:
            return status.HTTP_500_INTERNAL_SERVER_ERROR

    def _log_error(self, exc: Exception, error_data: Dict[str, Any], status_code: int) -> None:
        """Log error details with appropriate severity."""
        log_data = {
            'error_type': exc.__class__.__name__,
            'error_message': str(exc),
            'error_details': error_data.get('details'),
            'error_code': error_data.get('code'),
            'status_code': status_code,
        }

        if settings.DEBUG:
            log_data['traceback'] = traceback.format_exc()

        if status_code >= 500:
            logger.error('Unhandled exception', extra=log_data, exc_info=True)
        else:
            logger.warning('Request error', extra=log_data) 