"""
Management command to populate the database with sample recipes for testing.
"""
import json
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from recipes.models import Recipe, Category

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate the database with sample recipes for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing recipes before populating',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Starting recipe population...')
        )

        try:
            with transaction.atomic():
                if options['clear']:
                    self.clear_existing_data()
                
                # Create categories first
                categories = self.create_categories()
                
                # Create a test user if needed
                author = self.get_or_create_author()
                
                # Create sample recipes
                self.create_sample_recipes(author, categories)
                
            self.stdout.write(
                self.style.SUCCESS('Successfully populated recipes!')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error populating recipes: {str(e)}')
            )

    def clear_existing_data(self):
        """Clear existing recipes and categories."""
        self.stdout.write('Clearing existing recipes...')
        Recipe.objects.all().delete()
        Category.objects.all().delete()

    def get_or_create_author(self):
        """Get or create a test author."""
        email = 'chef@example.com'
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': 'testchef',
                'first_name': 'Test',
                'last_name': 'Chef',
                'is_active': True,
            }
        )
        if created:
            user.set_password('testpassword123')
            user.save()
            self.stdout.write(f'Created test author: {user.email}')
        else:
            self.stdout.write(f'Using existing author: {user.email}')
        
        return user

    def create_categories(self):
        """Create sample categories."""
        self.stdout.write('Creating categories...')
        
        categories_data = [
            {
                'name': 'Main Dishes',
                'slug': 'main-dishes',
                'description': 'Hearty main course recipes',
                'icon': 'restaurant',
                'color': '#FF6B6B'
            },
            {
                'name': 'Desserts',
                'slug': 'desserts', 
                'description': 'Sweet treats and desserts',
                'icon': 'cake',
                'color': '#4ECDC4'
            },
            {
                'name': 'Appetizers',
                'slug': 'appetizers',
                'description': 'Starters and small plates',
                'icon': 'local_dining',
                'color': '#45B7D1'
            },
            {
                'name': 'Beverages',
                'slug': 'beverages',
                'description': 'Drinks and smoothies',
                'icon': 'local_bar',
                'color': '#96CEB4'
            },
            {
                'name': 'Healthy',
                'slug': 'healthy',
                'description': 'Nutritious and healthy recipes',
                'icon': 'favorite',
                'color': '#FFEAA7'
            },
            {
                'name': 'Quick & Easy',
                'slug': 'quick-easy',
                'description': 'Fast recipes for busy days',
                'icon': 'timer',
                'color': '#DDA0DD'
            }
        ]
        
        categories = {}
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults={
                    'name': cat_data['name'],
                    'description': cat_data['description'],
                    'icon': cat_data['icon'],
                    'color': cat_data['color'],
                    'is_active': True,
                    'order': len(categories) + 1
                }
            )
            categories[cat_data['slug']] = category
            
            if created:
                self.stdout.write(f'  Created category: {category.name}')
        
        return categories

    def create_sample_recipes(self, author, categories):
        """Create sample recipes."""
        self.stdout.write('Creating sample recipes...')
        
        recipes_data = [
            {
                'title': 'Classic Spaghetti Carbonara',
                'description': 'A traditional Italian pasta dish with eggs, cheese, and pancetta. Creamy, rich, and absolutely delicious.',
                'prep_time': 10,
                'cook_time': 15,
                'servings': 4,
                'difficulty': Recipe.DifficultyLevel.MEDIUM,
                'cooking_method': Recipe.CookingMethod.BOILING,
                'ingredients': [
                    '400g spaghetti',
                    '200g pancetta or guanciale, diced',
                    '4 large eggs',
                    '100g Pecorino Romano cheese, grated',
                    '50g Parmesan cheese, grated',
                    'Freshly ground black pepper',
                    'Salt for pasta water',
                    '2 cloves garlic (optional)'
                ],
                'instructions': [
                    'Bring a large pot of salted water to boil and cook spaghetti according to package directions.',
                    'While pasta cooks, heat a large skillet over medium heat and cook pancetta until crispy.',
                    'In a bowl, whisk together eggs, Pecorino Romano, Parmesan, and plenty of black pepper.',
                    'Reserve 1 cup of pasta cooking water, then drain the pasta.',
                    'Add hot pasta to the skillet with pancetta and toss to combine.',
                    'Remove from heat and quickly stir in the egg mixture, adding pasta water as needed.',
                    'Serve immediately with extra cheese and black pepper.'
                ],
                'tags': ['italian', 'pasta', 'classic', 'comfort-food'],
                'categories': ['main-dishes'],
                'nutrition_info': {
                    'calories': 520,
                    'protein': 22,
                    'carbs': 58,
                    'fat': 23,
                    'fiber': 3
                }
            },
            {
                'title': 'Chocolate Chip Cookies',
                'description': 'Soft, chewy chocolate chip cookies that are perfect for any occasion. A timeless classic everyone loves.',
                'prep_time': 15,
                'cook_time': 12,
                'servings': 24,
                'difficulty': Recipe.DifficultyLevel.EASY,
                'cooking_method': Recipe.CookingMethod.BAKING,
                'ingredients': [
                    '2 1/4 cups all-purpose flour',
                    '1 tsp baking soda',
                    '1 tsp salt',
                    '1 cup butter, softened',
                    '3/4 cup granulated sugar',
                    '3/4 cup brown sugar, packed',
                    '2 large eggs',
                    '2 tsp vanilla extract',
                    '2 cups chocolate chips'
                ],
                'instructions': [
                    'Preheat oven to 375°F (190°C).',
                    'In a bowl, whisk together flour, baking soda, and salt.',
                    'In a large bowl, cream together butter and both sugars until light and fluffy.',
                    'Beat in eggs one at a time, then add vanilla.',
                    'Gradually mix in the flour mixture until just combined.',
                    'Stir in chocolate chips.',
                    'Drop rounded tablespoons of dough onto ungreased baking sheets.',
                    'Bake for 9-11 minutes until golden brown. Cool on baking sheet for 2 minutes.'
                ],
                'tags': ['dessert', 'cookies', 'chocolate', 'baking', 'family-friendly'],
                'categories': ['desserts'],
                'nutrition_info': {
                    'calories': 180,
                    'protein': 2,
                    'carbs': 26,
                    'fat': 8,
                    'fiber': 1,
                    'sugar': 18
                }
            },
            {
                'title': 'Quinoa Buddha Bowl',
                'description': 'A nutritious and colorful bowl packed with quinoa, roasted vegetables, and a tahini dressing.',
                'prep_time': 20,
                'cook_time': 25,
                'servings': 2,
                'difficulty': Recipe.DifficultyLevel.EASY,
                'cooking_method': Recipe.CookingMethod.BAKING,
                'ingredients': [
                    '1 cup quinoa',
                    '2 cups vegetable broth',
                    '1 sweet potato, cubed',
                    '1 cup broccoli florets',
                    '1 bell pepper, sliced',
                    '1/2 red onion, sliced',
                    '1 can chickpeas, drained',
                    '2 tbsp olive oil',
                    '1/4 cup tahini',
                    '2 tbsp lemon juice',
                    '1 tbsp maple syrup',
                    '2 tbsp water',
                    'Salt and pepper to taste',
                    '2 cups baby spinach',
                    '1/4 cup pumpkin seeds'
                ],
                'instructions': [
                    'Preheat oven to 400°F (200°C).',
                    'Cook quinoa in vegetable broth according to package directions.',
                    'Toss sweet potato, broccoli, bell pepper, onion, and chickpeas with olive oil, salt, and pepper.',
                    'Roast vegetables for 20-25 minutes until tender.',
                    'Make dressing by whisking together tahini, lemon juice, maple syrup, and water.',
                    'Assemble bowls with spinach, quinoa, roasted vegetables, and drizzle with dressing.',
                    'Top with pumpkin seeds and serve.'
                ],
                'tags': ['healthy', 'vegetarian', 'vegan', 'gluten-free', 'buddha-bowl', 'quinoa'],
                'categories': ['main-dishes', 'healthy'],
                'nutrition_info': {
                    'calories': 485,
                    'protein': 18,
                    'carbs': 68,
                    'fat': 18,
                    'fiber': 12
                }
            },
            {
                'title': 'Chicken Caesar Salad',
                'description': 'Crisp romaine lettuce with grilled chicken, parmesan cheese, and homemade Caesar dressing.',
                'prep_time': 15,
                'cook_time': 15,
                'servings': 4,
                'difficulty': Recipe.DifficultyLevel.MEDIUM,
                'cooking_method': Recipe.CookingMethod.GRILLING,
                'ingredients': [
                    '2 chicken breasts',
                    '6 cups romaine lettuce, chopped',
                    '1/2 cup Parmesan cheese, grated',
                    '1 cup croutons',
                    '1/4 cup mayonnaise',
                    '2 tbsp lemon juice',
                    '2 cloves garlic, minced',
                    '1 tsp Dijon mustard',
                    '1 tsp Worcestershire sauce',
                    '2 anchovy fillets (optional)',
                    'Salt and pepper to taste',
                    '2 tbsp olive oil'
                ],
                'instructions': [
                    'Season chicken breasts with salt, pepper, and olive oil.',
                    'Grill chicken for 6-7 minutes per side until cooked through. Let rest, then slice.',
                    'Make dressing by whisking together mayonnaise, lemon juice, garlic, Dijon, Worcestershire, and anchovies.',
                    'In a large bowl, toss romaine with dressing.',
                    'Add Parmesan cheese and croutons, toss gently.',
                    'Top with sliced chicken and serve immediately.'
                ],
                'tags': ['salad', 'chicken', 'protein', 'classic', 'lunch'],
                'categories': ['main-dishes'],
                'nutrition_info': {
                    'calories': 320,
                    'protein': 28,
                    'carbs': 12,
                    'fat': 18,
                    'fiber': 3
                }
            },
            {
                'title': 'Mango Smoothie Bowl',
                'description': 'A refreshing and tropical smoothie bowl topped with fresh fruits and granola.',
                'prep_time': 10,
                'cook_time': 0,
                'servings': 2,
                'difficulty': Recipe.DifficultyLevel.EASY,
                'cooking_method': Recipe.CookingMethod.OTHER,
                'ingredients': [
                    '2 frozen mangoes, cubed',
                    '1 frozen banana',
                    '1/2 cup coconut milk',
                    '1 tbsp honey',
                    '1/2 cup granola',
                    '1/4 cup fresh blueberries',
                    '1 kiwi, sliced',
                    '2 tbsp coconut flakes',
                    '1 tbsp chia seeds',
                    '4-5 mint leaves'
                ],
                'instructions': [
                    'Blend frozen mango, banana, coconut milk, and honey until smooth and thick.',
                    'Pour smoothie into two bowls.',
                    'Arrange toppings: granola, blueberries, kiwi slices, coconut flakes, and chia seeds.',
                    'Garnish with mint leaves and serve immediately.'
                ],
                'tags': ['smoothie', 'breakfast', 'healthy', 'vegan', 'tropical', 'fruit'],
                'categories': ['beverages', 'healthy'],
                'nutrition_info': {
                    'calories': 280,
                    'protein': 6,
                    'carbs': 52,
                    'fat': 8,
                    'fiber': 8,
                    'sugar': 42
                }
            },
            {
                'title': 'Garlic Butter Shrimp Pasta',
                'description': 'Quick and delicious pasta with succulent shrimp in a rich garlic butter sauce.',
                'prep_time': 10,
                'cook_time': 15,
                'servings': 4,
                'difficulty': Recipe.DifficultyLevel.EASY,
                'cooking_method': Recipe.CookingMethod.FRYING,
                'ingredients': [
                    '1 lb large shrimp, peeled and deveined',
                    '12 oz linguine pasta',
                    '6 cloves garlic, minced',
                    '1/2 cup butter',
                    '1/4 cup white wine',
                    '1/4 cup fresh parsley, chopped',
                    '1/4 cup Parmesan cheese, grated',
                    '2 tbsp lemon juice',
                    '1/4 tsp red pepper flakes',
                    'Salt and black pepper to taste',
                    '2 tbsp olive oil'
                ],
                'instructions': [
                    'Cook linguine according to package directions. Reserve 1/2 cup pasta water.',
                    'Season shrimp with salt and pepper.',
                    'Heat olive oil in a large skillet over medium-high heat.',
                    'Cook shrimp for 2-3 minutes per side until pink. Remove from pan.',
                    'Add butter and garlic to the same pan, cook for 1 minute.',
                    'Add white wine and red pepper flakes, simmer for 2 minutes.',
                    'Add cooked pasta, shrimp, lemon juice, and parsley. Toss to combine.',
                    'Add pasta water if needed. Serve with Parmesan cheese.'
                ],
                'tags': ['seafood', 'pasta', 'garlic', 'quick', 'dinner'],
                'categories': ['main-dishes', 'quick-easy'],
                'nutrition_info': {
                    'calories': 420,
                    'protein': 32,
                    'carbs': 45,
                    'fat': 16,
                    'fiber': 2
                }
            }
        ]

        for recipe_data in recipes_data:
            # Create the recipe
            recipe = Recipe.objects.create(
                title=recipe_data['title'],
                description=recipe_data['description'],
                prep_time=recipe_data['prep_time'],
                cook_time=recipe_data['cook_time'],
                servings=recipe_data['servings'],
                difficulty=recipe_data['difficulty'],
                cooking_method=recipe_data['cooking_method'],
                ingredients=recipe_data['ingredients'],
                instructions=recipe_data['instructions'],
                nutrition_info=recipe_data['nutrition_info'],
                author=author,
                tags=recipe_data['tags'],
                is_published=True,
                images={}  # Empty for now, can be added later
            )
            
            # Add categories
            for cat_slug in recipe_data['categories']:
                if cat_slug in categories:
                    recipe.categories.add(categories[cat_slug])
            
            self.stdout.write(f'  Created recipe: {recipe.title}')

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {len(recipes_data)} recipes!')
        )