"""
Views for user registration and authentication.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from core.views.base import BaseAPIView
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Register a new user.
    Returns user data and authentication tokens.
    """
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        """Create a new user and return tokens."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that returns user data with tokens.
    """
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(BaseAPIView):
    """
    Logout a user by blacklisting their refresh token.
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        """Blacklist the refresh token."""
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return self.get_success_response(message="Successfully logged out.")
        except Exception:
            return self.get_error_response(
                message="Invalid token.",
                code='invalid_token',
                status_code=status.HTTP_400_BAD_REQUEST
            )


class ChangePasswordView(BaseAPIView):
    """
    Change user password.
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        """Change user password."""
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check old password
        if not request.user.check_password(serializer.validated_data['old_password']):
            return self.get_error_response(
                message="Wrong password.",
                code='wrong_password',
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()

        return self.get_success_response(message="Password updated successfully.") 

class PasswordResetRequestView(generics.GenericAPIView):
    """
    Request password reset link
    """
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
            # Generate reset token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Build reset link - frontend URL
            reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            
            # Render email template
            html_message = render_to_string('accounts/password_reset_email.html', {
                'reset_link': reset_link,
            })
            
            # Send email
            send_mail(
                f'{settings.EMAIL_SUBJECT_PREFIX}Password Reset Request',
                'Click the following link to reset your password: ' + reset_link,  # Plain text version
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
                html_message=html_message,
            )
        except User.DoesNotExist:
            # Don't reveal whether a user exists
            pass
        
        return Response(
            {"detail": "Password reset link sent if account exists."},
            status=status.HTTP_200_OK
        )

class PasswordResetConfirmView(generics.GenericAPIView):
    """
    Confirm password reset and set new password
    """
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(
            {"detail": "Password has been reset successfully."},
            status=status.HTTP_200_OK
        ) 