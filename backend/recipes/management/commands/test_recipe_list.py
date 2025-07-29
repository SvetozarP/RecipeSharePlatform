"""
Management command to test recipe listing functionality.
"""

from django.core.management.base import BaseCommand
from rest_framework.test import APIRequestFactory
from recipes.views import RecipeViewSet
import traceback


class Command(BaseCommand):
    help = 'Test recipe listing functionality'

    def add_arguments(self, parser):
        parser.add_argument(
            '--ordering',
            type=str,
            help='Ordering parameter to test',
            default='newest'
        )

    def handle(self, *args, **options):
        self.stdout.write('🧪 Testing Recipe List Functionality...\n')
        
        ordering = options['ordering']
        
        try:
            # Create a mock request using DRF's APIRequestFactory
            factory = APIRequestFactory()
            request = factory.get(f'/api/v1/recipes/?ordering={ordering}&page=1&page_size=5')
            
            # Create the viewset
            viewset = RecipeViewSet()
            viewset.request = request
            
            self.stdout.write(f'✅ Testing with ordering: {ordering}')
            
            # Test the list method
            response = viewset.list(request)
            
            self.stdout.write(f'✅ SUCCESS: Got response with status {response.status_code}')
            self.stdout.write(f'📊 Response data keys: {list(response.data.keys())}')
            
            if 'results' in response.data:
                self.stdout.write(f'📝 Number of results: {len(response.data["results"])}')
            
        except Exception as e:
            self.stdout.write(f'❌ ERROR: {str(e)}')
            self.stdout.write(f'🔍 Full traceback:\n{traceback.format_exc()}')
            
        self.stdout.write('\n🏁 Test completed.') 