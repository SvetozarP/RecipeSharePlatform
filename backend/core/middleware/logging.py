"""
Logging middleware for request/response logging.
Provides structured logging for API requests and responses.
"""

import json
import logging
import time
from typing import Any, Callable

from django.http import HttpRequest, HttpResponse, JsonResponse

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    """
    Middleware for logging HTTP requests and responses.
    Logs request details, timing, and response status.
    """

    def __init__(self, get_response: Callable):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        # Start timing the request
        start_time = time.time()

        # Log the request
        self._log_request(request)

        # Process the request
        response = self.get_response(request)

        # Log the response
        self._log_response(request, response, start_time)

        return response

    def _log_request(self, request: HttpRequest) -> None:
        """Log the incoming request details."""
        try:
            log_data = {
                'type': 'request',
                'method': request.method,
                'path': request.path,
                'query_params': dict(request.GET.items()),
                'headers': dict(request.headers.items()),
                'client_ip': self._get_client_ip(request),
            }

            # Only log request body for POST/PUT/PATCH requests
            if request.method in ('POST', 'PUT', 'PATCH'):
                try:
                    log_data['body'] = json.loads(request.body)
                except json.JSONDecodeError:
                    log_data['body'] = 'Invalid JSON'
                except Exception:
                    log_data['body'] = 'Body logging failed'

            logger.info('API Request', extra=log_data)
        except Exception as e:
            logger.error(f'Request logging failed: {str(e)}')

    def _log_response(self, request: HttpRequest, response: HttpResponse, start_time: float) -> None:
        """Log the outgoing response details."""
        try:
            duration = time.time() - start_time
            status_code = getattr(response, 'status_code', 0)

            log_data = {
                'type': 'response',
                'method': request.method,
                'path': request.path,
                'status_code': status_code,
                'duration': f'{duration:.3f}s',
                'content_type': response.get('Content-Type', 'unknown'),
            }

            # Log response data for JSON responses
            if isinstance(response, JsonResponse):
                try:
                    log_data['body'] = json.loads(response.content)
                except json.JSONDecodeError:
                    log_data['body'] = 'Invalid JSON'
                except Exception:
                    log_data['body'] = 'Body logging failed'

            # Use appropriate log level based on status code
            if status_code >= 500:
                logger.error('API Response', extra=log_data)
            elif status_code >= 400:
                logger.warning('API Response', extra=log_data)
            else:
                logger.info('API Response', extra=log_data)
        except Exception as e:
            logger.error(f'Response logging failed: {str(e)}')

    def _get_client_ip(self, request: HttpRequest) -> str:
        """Get the client's IP address from the request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown') 