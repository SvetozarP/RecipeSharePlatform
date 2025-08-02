"""
Management command to populate the database with sample ratings for testing.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from recipes.models import Recipe, Rating
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate the database with sample ratings for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing ratings before populating',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Starting rating population...')
        )

        try:
            with transaction.atomic():
                if options['clear']:
                    self.clear_existing_data()
                
                # Create test users if needed
                users = self.get_or_create_users()
                
                # Get existing recipes
                recipes = Recipe.objects.all()
                
                if not recipes.exists():
                    self.stdout.write(
                        self.style.WARNING('No recipes found. Please run populate_recipes first.')
                    )
                    return
                
                # Create sample ratings
                self.create_sample_ratings(users, recipes)
                
            self.stdout.write(
                self.style.SUCCESS('Successfully populated ratings!')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error populating ratings: {str(e)}')
            )

    def clear_existing_data(self):
        """Clear existing ratings."""
        self.stdout.write('Clearing existing ratings...')
        Rating.objects.all().delete()

    def get_or_create_users(self):
        """Get or create test users."""
        users_data = [
            {
                'email': 'user1@example.com',
                'username': 'user1',
                'first_name': 'John',
                'last_name': 'Doe'
            },
            {
                'email': 'user2@example.com',
                'username': 'user2',
                'first_name': 'Jane',
                'last_name': 'Smith'
            },
            {
                'email': 'user3@example.com',
                'username': 'user3',
                'first_name': 'Bob',
                'last_name': 'Johnson'
            },
            {
                'email': 'user4@example.com',
                'username': 'user4',
                'first_name': 'Alice',
                'last_name': 'Brown'
            },
            {
                'email': 'user5@example.com',
                'username': 'user5',
                'first_name': 'Charlie',
                'last_name': 'Wilson'
            }
        ]
        
        users = []
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    'username': user_data['username'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'is_active': True,
                }
            )
            if created:
                user.set_password('testpassword123')
                user.save()
                self.stdout.write(f'Created test user: {user.email}')
            else:
                self.stdout.write(f'Using existing user: {user.email}')
            
            users.append(user)
        
        return users

    def create_sample_ratings(self, users, recipes):
        """Create sample ratings for recipes."""
        self.stdout.write('Creating sample ratings...')
        
        # Sample review texts
        review_texts = [
            "Absolutely delicious! Will definitely make this again.",
            "Great recipe, easy to follow and tasty results.",
            "Good flavor, but could use a bit more seasoning.",
            "Perfect for a quick weeknight dinner.",
            "Love this recipe! The whole family enjoyed it.",
            "Excellent taste and texture. Highly recommend!",
            "Good recipe, but took longer than expected.",
            "Amazing flavors! This is now a family favorite.",
            "Simple and delicious. Perfect for beginners.",
            "Outstanding recipe! Will be making this regularly."
        ]
        
        ratings_created = 0
        
        for recipe in recipes:
            # Create 2-5 ratings per recipe
            num_ratings = random.randint(2, 5)
            
            for i in range(num_ratings):
                user = random.choice(users)
                
                # Check if user already rated this recipe
                if Rating.objects.filter(recipe=recipe, user=user).exists():
                    continue
                
                # Create rating with random values
                rating_value = random.randint(1, 5)
                review = random.choice(review_texts) if random.random() > 0.3 else ""
                helpful_count = random.randint(0, 10)
                is_verified = random.choice([True, False])
                
                Rating.objects.create(
                    recipe=recipe,
                    user=user,
                    rating=rating_value,
                    review=review,
                    helpful_count=helpful_count,
                    is_verified_purchase=is_verified
                )
                
                ratings_created += 1
                self.stdout.write(f'  Created rating: {user.username} rated {recipe.title} - {rating_value} stars')
        
        self.stdout.write(f'Successfully created {ratings_created} ratings!') 