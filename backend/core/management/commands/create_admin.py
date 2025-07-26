from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
import os

class Command(BaseCommand):
    help = "Create a superuser if none exist"

    def handle(self, *args, **options):
        User = get_user_model()
        if not User.objects.filter(is_superuser=True).exists():
            User.objects.create_superuser(
                username=os.environ['ADMIN_USERNAME'],
                email=os.environ['ADMIN_EMAIL'],
                password=os.environ['ADMIN_PASSWORD']
            )
            self.stdout.write(self.style.SUCCESS('Superuser created'))
        else:
            self.stdout.write('Superuser already exists')