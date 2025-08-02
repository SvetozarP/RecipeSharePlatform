from django.core.management.base import BaseCommand
from recipes.models import Recipe


class Command(BaseCommand):
    help = 'Update existing recipes with proper moderation status'

    def handle(self, *args, **options):
        # Update published recipes to approved status
        published_recipes = Recipe.objects.filter(is_published=True)
        updated_published = published_recipes.update(moderation_status=Recipe.ModerationStatus.APPROVED)
        
        # Update unpublished recipes to draft status
        unpublished_recipes = Recipe.objects.filter(is_published=False)
        updated_unpublished = unpublished_recipes.update(moderation_status=Recipe.ModerationStatus.DRAFT)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully updated {updated_published} published recipes to approved status and '
                f'{updated_unpublished} unpublished recipes to draft status'
            )
        ) 