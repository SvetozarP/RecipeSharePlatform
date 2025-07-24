"""
Base API view classes.
Provides common functionality for API views.
"""

from typing import Any, Dict, Optional

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


class BaseAPIView(APIView):
    """
    Base class for all API views.
    Provides standard response formatting and error handling.
    """

    def get_error_response(
        self,
        message: str,
        code: str = 'error',
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Dict[str, Any]] = None
    ) -> Response:
        """
        Create a standardized error response.
        
        Args:
            message: Error message
            code: Error code
            status_code: HTTP status code
            details: Additional error details
            
        Returns:
            Response object with error data
        """
        error_data = {
            'error': {
                'message': message,
                'code': code,
            }
        }
        if details:
            error_data['error']['details'] = details

        return Response(error_data, status=status_code)

    def get_success_response(
        self,
        data: Optional[Dict[str, Any]] = None,
        message: Optional[str] = None,
        status_code: int = status.HTTP_200_OK
    ) -> Response:
        """
        Create a standardized success response.
        
        Args:
            data: Response data
            message: Success message
            status_code: HTTP status code
            
        Returns:
            Response object with success data
        """
        response_data = {}
        
        if data is not None:
            response_data['data'] = data
            
        if message:
            response_data['message'] = message

        return Response(response_data, status=status_code) 