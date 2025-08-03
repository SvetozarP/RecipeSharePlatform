"""
Management command to fix recipe image URLs from relative to absolute Azure URLs.
"""
import os
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from recipes.models import Recipe

logger = logging.getLogger(__name__)

def load_creds():
    """Load environment variables from CREDS file."""
    # Get the backend directory (go up 5 levels from the command file)
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
    creds_file = os.path.join(backend_dir, '..', 'devel', 'CREDS')
    print(f"Looking for CREDS file at: {creds_file}")
    print(f"File exists: {os.path.exists(creds_file)}")
    if os.path.exists(creds_file):
        with open(creds_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value
                    print(f"Loaded: {key} = {value[:10]}..." if len(value) > 10 else f"Loaded: {key} = {value}")


class Command(BaseCommand):
    help = 'Fix recipe image URLs from relative to absolute Azure URLs'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Load environment variables from CREDS file
        load_creds()
        
        # Get Azure storage settings
        azure_account = getattr(settings, 'AZURE_STORAGE_ACCOUNT_NAME', None)
        azure_container = getattr(settings, 'AZURE_STORAGE_CONTAINER_NAME', 'media')
        
        if not azure_account:
            self.stdout.write(
                self.style.ERROR('Azure storage not configured. Please check your settings.')
            )
            return
        
        self.stdout.write(f"Azure Account: {azure_account}")
        self.stdout.write(f"Azure Container: {azure_container}")
        
        # Find recipes with relative image URLs
        recipes_with_images = Recipe.objects.filter(images__isnull=False).exclude(images={})
        
        fixed_count = 0
        total_count = recipes_with_images.count()
        
        self.stdout.write(f"Found {total_count} recipes with images")
        
        for recipe in recipes_with_images:
            if not recipe.images:
                continue
                
            updated_images = {}
            needs_update = False
            
            for size_name, url in recipe.images.items():
                if url and url.startswith('/'):
                    # Convert relative URL to absolute Azure URL
                    if url.startswith('/media/'):
                        clean_url = url[7:]  # Remove '/media/' prefix
                    else:
                        clean_url = url[1:]  # Remove leading slash
                    
                    absolute_url = f"https://{azure_account}.blob.core.windows.net/{azure_container}/{clean_url}"
                    updated_images[size_name] = absolute_url
                    needs_update = True
                    
                    if dry_run:
                        self.stdout.write(f"Would fix: {url} -> {absolute_url}")
                    else:
                        self.stdout.write(f"Fixed: {url} -> {absolute_url}")
                else:
                    updated_images[size_name] = url
            
            if needs_update:
                if not dry_run:
                    recipe.images = updated_images
                    recipe.save(update_fields=['images'])
                fixed_count += 1
        
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(f"Dry run complete. Would fix {fixed_count} recipes.")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f"Successfully fixed {fixed_count} recipes.")
            ) 