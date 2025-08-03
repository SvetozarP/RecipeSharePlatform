"""
Views for user registration and authentication.
"""

import logging
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
logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    """
    Register a new user.
    Returns user data and authentication tokens.
    Sends verification email if email backend is configured.
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
        
        # Send verification email (if email backend is configured)
        self._send_verification_email(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Registration successful! Please check your email for verification link.' if not user.is_email_verified else 'Registration successful!'
        }, status=status.HTTP_201_CREATED)
    
    def _send_verification_email(self, user):
        """Send email verification link to the user."""
        try:
            # Only send if not using console backend
            if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
                print(f"📧 Email verification would be sent to {user.email}")
                return
            
            # Generate verification token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Build verification link
            verification_link = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}"
            
            # Send email
            send_mail(
                f'{settings.EMAIL_SUBJECT_PREFIX}Please verify your email',
                f'Click the following link to verify your email: {verification_link}',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,  # Don't break registration if email fails
                html_message=f'''
                <h2>Welcome to Recipe Sharing Platform!</h2>
                <p>Thank you for registering. Please click the link below to verify your email address:</p>
                <p><a href="{verification_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
                <p>If you didn't create this account, you can safely ignore this email.</p>
                '''
            )
        except Exception as e:
            print(f"Failed to send verification email: {e}")


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
        try:
            logger.info("Password reset request received")
            
            # Validate serializer
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            email = serializer.validated_data['email']
            
            logger.info(f"Password reset request for email: {email}")
            
            try:
                user = User.objects.get(email=email)
                logger.info(f"User found for email: {email}, user_id: {user.id}")
                
                # Generate reset token
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                
                logger.info(f"Generated token and uid for user: {user.id}")
                
                # Build reset link - frontend URL
                reset_link = f"{settings.FRONTEND_URL}/auth/reset-password/{uid}/{token}"
                logger.info(f"Reset link generated: {reset_link}")
                
                # Try to send email with comprehensive error handling
                try:
                    # Check if template exists, otherwise use simple HTML
                    try:
                        html_message = render_to_string('accounts/password_reset_email.html', {
                            'reset_link': reset_link,
                        })
                        logger.info("Email template rendered successfully")
                    except Exception as template_error:
                        logger.warning(f"Template rendering failed: {template_error}, using fallback HTML")
                        html_message = f'''
                        <!DOCTYPE html>
                        <html>
                        <head><title>Password Reset</title></head>
                        <body>
                            <h2>Password Reset Request</h2>
                            <p>Click the following link to reset your password:</p>
                            <a href="{reset_link}">Reset Password</a>
                            <p>If you didn't request this reset, you can ignore this email.</p>
                        </body>
                        </html>
                        '''
                    
                    # Send email
                    logger.info("Attempting to send password reset email")
                    send_mail(
                        f'{settings.EMAIL_SUBJECT_PREFIX}Password Reset Request',
                        f'Click the following link to reset your password: {reset_link}',  # Plain text version
                        settings.DEFAULT_FROM_EMAIL,
                        [email],
                        fail_silently=False,
                        html_message=html_message,
                    )
                    logger.info(f"Password reset email sent successfully to: {email}")
                    
                except Exception as email_error:
                    logger.error(f"Email sending failed: {email_error}")
                    # Don't return error to avoid user enumeration, but log it
                    
            except User.DoesNotExist:
                logger.info(f"Password reset requested for non-existent email: {email}")
                # Don't reveal whether a user exists
                pass
                
        except Exception as e:
            logger.error(f"Unexpected error in password reset request: {e}", exc_info=True)
            # Return a generic error in production
            return Response(
                {"detail": "An error occurred processing your request."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
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


class EmailVerificationView(generics.GenericAPIView):
    """
    Verify user email address
    """
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        """Verify email using token and uid."""
        try:
            from django.utils.http import urlsafe_base64_decode
            from django.utils.encoding import force_str
            
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
            
            if default_token_generator.check_token(user, token):
                user.is_email_verified = True
                user.save()
                return Response(
                    {"detail": "Email verified successfully."},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"detail": "Invalid or expired verification link."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"detail": "Invalid verification link."},
                status=status.HTTP_400_BAD_REQUEST
            )


class ResendVerificationEmailView(generics.GenericAPIView):
    """
    Resend email verification link
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """Resend verification email to user."""
        email = request.data.get('email')
        if not email:
            return Response(
                {"detail": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            
            # Check if email is already verified
            if user.is_email_verified:
                return Response(
                    {"detail": "Email is already verified."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Send verification email
            self._send_verification_email(user)
            
            return Response(
                {"detail": "Verification email sent successfully. Please check your inbox."},
                status=status.HTTP_200_OK
            )
            
        except User.DoesNotExist:
            # Don't reveal whether a user exists
            return Response(
                {"detail": "If an account with this email exists, a verification link has been sent."},
                status=status.HTTP_200_OK
            )
    
    def _send_verification_email(self, user):
        """Send email verification link to the user."""
        try:
            # Only send if not using console backend
            if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
                print(f"📧 Email verification would be sent to {user.email}")
                return
            
            # Generate verification token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Build verification link
            verification_link = f"{settings.FRONTEND_URL}/auth/verify-email/{uid}/{token}"
            
            # Send email
            send_mail(
                f'{settings.EMAIL_SUBJECT_PREFIX}Please verify your email',
                f'Click the following link to verify your email: {verification_link}',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,  # Don't break if email fails
                html_message=f'''
                <h2>Email Verification</h2>
                <p>Please click the link below to verify your email address:</p>
                <p><a href="{verification_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
                <p>If you didn't request this verification, you can safely ignore this email.</p>
                '''
            )
        except Exception as e:
            print(f"Failed to send verification email: {e}") 