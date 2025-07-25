"""
Views for user management.
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.exceptions import ValidationError
from .services.profile_service import ProfileService
from .serializers import (
    ProfileSerializer,
    ProfileUpdateSerializer,
    PreferencesSerializer,
    PreferencesUpdateSerializer
)


class ProfileView(APIView):
    """Profile management endpoints"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.profile_service = ProfileService()
    
    def get(self, request):
        """Get user profile"""
        try:
            profile_data = self.profile_service.get_profile(request.user.id)
            return Response(profile_data)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch profile'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request):
        """Update user profile"""
        serializer = ProfileUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            profile_data = self.profile_service.update_profile(
                request.user.id,
                serializer.validated_data
            )
            return Response(profile_data)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': 'Failed to update profile'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PreferencesView(APIView):
    """User preferences endpoints"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.profile_service = ProfileService()
    
    def get(self, request):
        """Get user preferences"""
        try:
            profile_data = self.profile_service.get_profile(request.user.id)
            preferences = self.profile_service.update_preferences(request.user.id, {})
            return Response(preferences)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch preferences'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request):
        """Update user preferences"""
        serializer = PreferencesUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            preferences = self.profile_service.update_preferences(
                request.user.id,
                serializer.validated_data
            )
            return Response(preferences)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': 'Failed to update preferences'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProfileVisibilityView(APIView):
    """Profile visibility toggle endpoint"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.profile_service = ProfileService()
    
    def post(self, request):
        """Toggle profile visibility"""
        try:
            profile_data = self.profile_service.toggle_profile_visibility(request.user.id)
            return Response(profile_data)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': 'Failed to toggle profile visibility'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PublicProfileView(APIView):
    """Public profile endpoint"""
    permission_classes = [AllowAny]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.profile_service = ProfileService()
    
    def get(self, request, user_id):
        """Get public profile by user ID"""
        viewer_id = request.user.id if request.user.is_authenticated else None
        
        try:
            # Check if viewer has access to the profile
            if not self.profile_service.validate_profile_access(viewer_id, user_id):
                return Response(
                    {'error': 'Profile is private'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            profile_data = self.profile_service.get_profile(user_id)
            return Response(profile_data)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch profile'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 