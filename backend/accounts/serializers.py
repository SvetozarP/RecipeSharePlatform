"""
Serializers for user registration and authentication.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for the User model."""

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'is_email_verified')
        read_only_fields = ('id', 'is_email_verified')


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password_confirm', 'first_name', 'last_name')

    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': "Password fields didn't match."
            })
        return attrs

    def create(self, validated_data):
        """Create and return a new user."""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer that includes user data."""

    def validate(self, attrs):
        """Add user data to token payload."""
        data = super().validate(attrs)
        user = self.user
        data.update({
            'user': {
                'id': str(user.id),
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_email_verified': user.is_email_verified,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser
            }
        })
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""

    old_password = serializers.CharField(required=True, style={'input_type': 'password'})
    new_password = serializers.CharField(required=True, style={'input_type': 'password'})
    new_password_confirm = serializers.CharField(required=True, style={'input_type': 'password'})

    def validate_new_password(self, value):
        """Validate new password."""
        validate_password(value)
        return value

    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': "Password fields didn't match."
            })
        return attrs 


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for requesting a password reset
    """
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
            if not user.is_active:
                raise serializers.ValidationError("Account is not active.")
        except User.DoesNotExist:
            # Don't reveal whether a user exists
            pass
        return value

class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for confirming a password reset
    """
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    token = serializers.CharField()
    uidb64 = serializers.CharField()

    def validate(self, data):
        try:
            uid = urlsafe_base64_decode(data['uidb64']).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("Invalid reset link")

        if not default_token_generator.check_token(user, data['token']):
            raise serializers.ValidationError("Invalid or expired reset link")

        data['user'] = user
        return data

    def save(self):
        user = self.validated_data['user']
        user.set_password(self.validated_data['password'])
        user.save()
        return user 