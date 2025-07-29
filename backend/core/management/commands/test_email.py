"""
Management command to test email sending with SendGrid.
"""

import os
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings


class Command(BaseCommand):
    help = 'Test email sending configuration with SendGrid'

    def add_arguments(self, parser):
        parser.add_argument(
            '--to',
            type=str,
            help='Email address to send test email to',
            default='svetozarp@students.softuni.bg'
        )

    def handle(self, *args, **options):
        self.stdout.write('🧪 Testing Email Configuration...\n')
        
        # Check environment variables
        self.stdout.write('📋 Environment Variables:')
        email_vars = [
            'EMAIL_HOST',
            'EMAIL_PORT', 
            'EMAIL_USE_TLS',
            'EMAIL_HOST_USER',
            'EMAIL_HOST_PASSWORD',
            'DEFAULT_FROM_EMAIL'
        ]
        
        for var in email_vars:
            value = os.environ.get(var, 'NOT SET')
            if var == 'EMAIL_HOST_PASSWORD':
                # Mask the password for security
                value = f"{'*' * (len(value) - 4)}{value[-4:]}" if value != 'NOT SET' else 'NOT SET'
            self.stdout.write(f'  {var}: {value}')
        
        self.stdout.write(f'\n📧 Django Email Settings:')
        self.stdout.write(f'  EMAIL_BACKEND: {settings.EMAIL_BACKEND}')
        self.stdout.write(f'  EMAIL_HOST: {settings.EMAIL_HOST}')
        self.stdout.write(f'  EMAIL_PORT: {settings.EMAIL_PORT}')
        self.stdout.write(f'  EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}')
        self.stdout.write(f'  DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}')
        
        # Check if using console backend
        if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
            self.stdout.write(
                self.style.WARNING(
                    '\n⚠️  Using console backend - emails will not be sent!'
                )
            )
            self.stdout.write('   This means EMAIL_HOST_USER or EMAIL_HOST_PASSWORD are not set.')
            return
        
        # Send test email
        try:
            self.stdout.write(f'\n📤 Sending test email to {options["to"]}...')
            
            result = send_mail(
                subject='[Recipe Sharing] Test Email from Django',
                message='This is a test email to verify SendGrid configuration is working.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[options['to']],
                fail_silently=False,
            )
            
            if result == 1:
                self.stdout.write(
                    self.style.SUCCESS('✅ Email sent successfully!')
                )
                self.stdout.write('   Check your inbox for the test email.')
            else:
                self.stdout.write(
                    self.style.ERROR('❌ Email sending failed - no error reported')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Email sending failed: {str(e)}')
            )
            
            # Provide specific guidance for common errors
            error_str = str(e).lower()
            if 'authentication failed' in error_str:
                self.stdout.write(
                    self.style.WARNING('💡 This usually means your SendGrid API key is incorrect.')
                )
            elif 'connection refused' in error_str:
                self.stdout.write(
                    self.style.WARNING('💡 This usually means EMAIL_HOST is incorrect.')
                )
            elif 'timeout' in error_str:
                self.stdout.write(
                    self.style.WARNING('💡 This usually means EMAIL_PORT or EMAIL_USE_TLS is incorrect.')
                ) 