from rest_framework import serializers

class ProfileSerializer(serializers.Serializer):
    """Profile data serializer"""
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    bio = serializers.CharField(max_length=500, allow_blank=True)
    location = serializers.CharField(max_length=100, allow_blank=True)
    website = serializers.URLField(max_length=200, allow_blank=True)
    phone = serializers.CharField(max_length=20, allow_blank=True)
    birth_date = serializers.DateField(allow_null=True)
    is_public_profile = serializers.BooleanField()

class ProfileUpdateSerializer(serializers.Serializer):
    """Profile update serializer"""
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    bio = serializers.CharField(max_length=500, required=False, allow_blank=True)
    location = serializers.CharField(max_length=100, required=False, allow_blank=True)
    website = serializers.URLField(max_length=200, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    birth_date = serializers.DateField(required=False, allow_null=True)
    email = serializers.EmailField(required=False)
    username = serializers.CharField(max_length=150, required=False)

class PreferencesSerializer(serializers.Serializer):
    """User preferences serializer"""
    email_notifications = serializers.BooleanField()
    marketing_emails = serializers.BooleanField()
    public_profile = serializers.BooleanField()
    show_email = serializers.BooleanField()
    timezone = serializers.CharField(max_length=50)
    language = serializers.CharField(max_length=10)
    theme = serializers.CharField(max_length=20)

class PreferencesUpdateSerializer(serializers.Serializer):
    """User preferences update serializer"""
    email_notifications = serializers.BooleanField(required=False)
    marketing_emails = serializers.BooleanField(required=False)
    public_profile = serializers.BooleanField(required=False)
    show_email = serializers.BooleanField(required=False)
    timezone = serializers.CharField(max_length=50, required=False)
    language = serializers.CharField(max_length=10, required=False)
    theme = serializers.CharField(max_length=20, required=False) 