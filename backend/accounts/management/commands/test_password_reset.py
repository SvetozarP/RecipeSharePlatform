"""
Management command to test password reset functionality.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from accounts.views import PasswordResetRequestView
import json
import uuid

User = get_user_model()


class Command(BaseCommand):
    help = 'Test password reset functionality'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email address to test password reset with',
            default='test@example.com'
        )

    def handle(self, *args, **options):
        self.stdout.write('🧪 Testing Password Reset Functionality...\n')
        
        email = options['email']
        
        # Try to get existing user or create one with unique username
        try:
            user = User.objects.get(email=email)
            self.stdout.write(f'✅ Using existing user: {email}')
        except User.DoesNotExist:
            # Create user with unique username
            unique_username = f'testuser_{uuid.uuid4().hex[:8]}'
            user = User.objects.create_user(
                email=email,
                username=unique_username,
                first_name='Test',
                last_name='User'
            )
            self.stdout.write(f'✅ Created test user: {email} with username: {unique_username}')
        
        # Test the view directly using DRF APIRequestFactory
        try:
            factory = APIRequestFactory()
            
            # Create proper DRF request
            request = factory.post(
                '/api/v1/auth/password/reset/', 
                {'email': email},
                format='json'
            )
            
            view = PasswordResetRequestView.as_view()
            
            self.stdout.write('📤 Calling password reset view...')
            
            # Call the view
            response = view(request)
            
            self.stdout.write(f'✅ Response status: {response.status_code}')
            self.stdout.write(f'✅ Response data: {response.data}')
            
            if response.status_code == 200:
                self.stdout.write(
                    self.style.SUCCESS('🎉 Password reset test successful!')
                )
            else:
                self.stdout.write(
                    self.style.ERROR('❌ Password reset test failed!')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Password reset test error: {str(e)}')
            )
            self.stdout.write(f'Error type: {type(e).__name__}')
            import traceback
            self.stdout.write(f'Traceback: {traceback.format_exc()}') 