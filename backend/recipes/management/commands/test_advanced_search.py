"""
Management command to test advanced search functionality.
"""

from django.core.management.base import BaseCommand
from rest_framework.test import APIRequestFactory
from recipes.views import RecipeViewSet
import traceback
import json


class Command(BaseCommand):
    help = 'Test advanced search functionality'

    def add_arguments(self, parser):
        parser.add_argument(
            '--order_by',
            type=str,
            help='Order by parameter to test',
            default='rating'
        )

    def handle(self, *args, **options):
        self.stdout.write('🧪 Testing Advanced Search Functionality...\n')
        
        order_by = options['order_by']
        
        try:
            # Create a mock request using DRF's APIRequestFactory
            factory = APIRequestFactory()
            
            # Test data for advanced search
            search_data = {
                'order_by': order_by,
                'page': 1,
                'page_size': 5
            }
            
            request = factory.post('/api/v1/recipes/advanced-search/', 
                                 data=json.dumps(search_data), 
                                 content_type='application/json')
            
            # Create the viewset
            viewset = RecipeViewSet()
            viewset.request = request
            
            self.stdout.write(f'✅ Testing advanced search with order_by: {order_by}')
            
            # Test the advanced_search method
            response = viewset.advanced_search(request)
            
            self.stdout.write(f'✅ SUCCESS: Got response with status {response.status_code}')
            self.stdout.write(f'📊 Response data keys: {list(response.data.keys())}')
            
            if 'results' in response.data:
                self.stdout.write(f'📝 Number of results: {len(response.data["results"])}')
                
                if 'search_time' in response.data:
                    self.stdout.write(f'⏱️ Search time: {response.data["search_time"]}s')
            
        except Exception as e:
            self.stdout.write(f'❌ ERROR: {str(e)}')
            self.stdout.write(f'🔍 Full traceback:\n{traceback.format_exc()}')
            
        self.stdout.write('\n🏁 Test completed.') 