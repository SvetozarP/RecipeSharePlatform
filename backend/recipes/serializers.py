"""
Serializers for recipe data.
"""
from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError

from .models import Recipe, Category, Rating
from core.services.storage_service import storage_service


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model with hierarchy support."""
    
    full_path = serializers.CharField(read_only=True)
    level = serializers.IntegerField(read_only=True)
    recipe_count = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    ancestors = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description', 'slug', 'icon', 'color',
            'parent', 'order', 'is_active', 'full_path', 'level',
            'recipe_count', 'children', 'ancestors', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        
    def get_recipe_count(self, obj):
        """Get the number of active recipes in this category."""
        return obj.recipes.filter(is_published=True).count()
        
    def get_children(self, obj):
        """Get immediate children categories."""
        children = obj.children.filter(is_active=True).order_by('order', 'name')
        return CategoryListSerializer(children, many=True).data
        
    def get_ancestors(self, obj):
        """Get ancestor categories."""
        ancestors = obj.get_ancestors()
        return CategoryListSerializer(ancestors, many=True).data

    def validate_slug(self, value):
        """Validate slug uniqueness within parent scope."""
        if self.instance:
            # For updates, exclude current instance
            queryset = Category.objects.exclude(id=self.instance.id)
        else:
            queryset = Category.objects.all()
            
        parent = self.initial_data.get('parent')
        if queryset.filter(slug=value, parent=parent).exists():
            raise serializers.ValidationError(
                "Category with this slug already exists in the same parent."
            )
        return value

    def validate(self, data):
        """Validate category data."""
        # Prevent circular references
        if 'parent' in data and data['parent']:
            parent = data['parent']
            current = self.instance
            
            # Check if we're trying to set ourselves as parent
            if current and parent == current:
                raise serializers.ValidationError({
                    'parent': "Category cannot be its own parent."
                })
                
            # Check for circular references in hierarchy
            while parent:
                if current and parent == current:
                    raise serializers.ValidationError({
                        'parent': "Category cannot be its own ancestor."
                    })
                parent = parent.parent
                
        return data


class CategoryListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for category listing."""
    
    full_path = serializers.CharField(read_only=True)
    level = serializers.IntegerField(read_only=True)
    recipe_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'icon', 'color', 'parent',
            'order', 'is_active', 'full_path', 'level', 'recipe_count'
        ]
        
    def get_recipe_count(self, obj):
        """Get the number of active recipes in this category."""
        return obj.recipes.filter(is_published=True).count()


class CategoryTreeSerializer(serializers.ModelSerializer):
    """Serializer for category tree structure."""
    
    children = serializers.SerializerMethodField()
    recipe_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'icon', 'color', 'order',
            'children', 'recipe_count'
        ]
        
    def get_children(self, obj):
        """Get all children recursively."""
        children = obj.children.filter(is_active=True).order_by('order', 'name')
        return CategoryTreeSerializer(children, many=True).data
        
    def get_recipe_count(self, obj):
        """Get the number of active recipes in this category and all descendants."""
        # Get recipes in this category
        count = obj.recipes.filter(is_published=True).count()
        # Add recipes from all descendants
        descendants = obj.get_descendants()
        for descendant in descendants:
            count += descendant.recipes.filter(is_published=True).count()
        return count


class RecipeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating recipes with optional image upload."""
    
    # File upload field for recipe image
    image = serializers.ImageField(
        write_only=True,
        required=False,
        help_text="Recipe image file (JPEG, PNG, WebP supported, max 5MB)"
    )
    
    # Categories field
    categories = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.filter(is_active=True),
        many=True,
        required=False,
        help_text="List of category IDs for this recipe"
    )
    
    class Meta:
        model = Recipe
        fields = [
            'title', 'description', 'prep_time', 'cook_time', 'servings',
            'difficulty', 'cooking_method', 'ingredients', 'instructions',
            'nutrition_info', 'tags', 'categories', 'is_published', 'image'
        ]
        extra_kwargs = {
            'title': {'required': True},
            'description': {'required': True},
            'prep_time': {'required': True, 'min_value': 1},
            'cook_time': {'required': True, 'min_value': 1},
            'servings': {'required': True, 'min_value': 1},
            'ingredients': {'required': True},
            'instructions': {'required': True},
        }

    def validate_ingredients(self, value):
        """Validate ingredients list."""
        if not value or len(value) == 0:
            raise serializers.ValidationError("At least one ingredient is required.")
        
        for i, ingredient in enumerate(value):
            if not isinstance(ingredient, dict):
                raise serializers.ValidationError(f"Ingredient {i+1} must be an object.")
            if not ingredient.get('name'):
                raise serializers.ValidationError(f"Ingredient {i+1} must have a name.")
            if not ingredient.get('amount'):
                raise serializers.ValidationError(f"Ingredient {i+1} must have an amount.")
        
        return value

    def validate_instructions(self, value):
        """Validate instructions list."""
        if not value or len(value) == 0:
            raise serializers.ValidationError("At least one instruction step is required.")
        
        for i, instruction in enumerate(value):
            if not isinstance(instruction, str) or not instruction.strip():
                raise serializers.ValidationError(f"Instruction step {i+1} must be a non-empty string.")
        
        return value

    def validate_image(self, value):
        """Validate uploaded image file."""
        if value:
            try:
                storage_service.validate_image_file(value)
            except DjangoValidationError as e:
                raise serializers.ValidationError(str(e))
        return value

    def create(self, validated_data):
        """Create recipe with image processing."""
        image_file = validated_data.pop('image', None)
        categories = validated_data.pop('categories', [])
        
        # Set author from request context
        validated_data['author'] = self.context['request'].user
        
        # Create recipe instance
        recipe = Recipe.objects.create(**validated_data)
        
        # Set categories
        if categories:
            recipe.categories.set(categories)
        
        # Process and save image if provided
        if image_file:
            try:
                image_urls = storage_service.save_image_with_thumbnails(
                    image_file, 
                    str(recipe.id)
                )
                recipe.images = image_urls
                recipe.save(update_fields=['images'])
            except DjangoValidationError as e:
                # If image processing fails, delete the recipe and raise error
                recipe.delete()
                raise serializers.ValidationError({'image': str(e)})
        
        return recipe


class RecipeUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating recipes with optional image upload."""
    
    # File upload field for recipe image
    image = serializers.ImageField(
        write_only=True,
        required=False,
        help_text="Recipe image file (JPEG, PNG, WebP supported, max 5MB)"
    )
    
    # Flag to remove existing image
    remove_image = serializers.BooleanField(
        write_only=True,
        required=False,
        default=False,
        help_text="Set to true to remove existing image"
    )
    
    # Categories field
    categories = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.filter(is_active=True),
        many=True,
        required=False,
        help_text="List of category IDs for this recipe"
    )
    
    class Meta:
        model = Recipe
        fields = [
            'title', 'description', 'prep_time', 'cook_time', 'servings',
            'difficulty', 'cooking_method', 'ingredients', 'instructions',
            'nutrition_info', 'tags', 'categories', 'is_published', 'image', 'remove_image'
        ]
        extra_kwargs = {
            'prep_time': {'min_value': 1},
            'cook_time': {'min_value': 1},
            'servings': {'min_value': 1},
        }

    def validate_ingredients(self, value):
        """Validate ingredients list."""
        if value is not None:
            if not value or len(value) == 0:
                raise serializers.ValidationError("At least one ingredient is required.")
            
            for i, ingredient in enumerate(value):
                if not isinstance(ingredient, dict):
                    raise serializers.ValidationError(f"Ingredient {i+1} must be an object.")
                if not ingredient.get('name'):
                    raise serializers.ValidationError(f"Ingredient {i+1} must have a name.")
                if not ingredient.get('amount'):
                    raise serializers.ValidationError(f"Ingredient {i+1} must have an amount.")
        
        return value

    def validate_instructions(self, value):
        """Validate instructions list."""
        if value is not None:
            if not value or len(value) == 0:
                raise serializers.ValidationError("At least one instruction step is required.")
            
            for i, instruction in enumerate(value):
                if not isinstance(instruction, str) or not instruction.strip():
                    raise serializers.ValidationError(f"Instruction step {i+1} must be a non-empty string.")
        
        return value

    def validate_image(self, value):
        """Validate uploaded image file."""
        if value:
            try:
                storage_service.validate_image_file(value)
            except DjangoValidationError as e:
                raise serializers.ValidationError(str(e))
        return value

    def update(self, instance, validated_data):
        """Update recipe with image processing."""
        image_file = validated_data.pop('image', None)
        remove_image = validated_data.pop('remove_image', False)
        categories = validated_data.pop('categories', None)
        
        # Handle categories update
        if categories is not None:
            instance.categories.set(categories)
        
        # Handle image removal
        if remove_image and instance.images:
            storage_service.delete_recipe_images(instance.images)
            instance.images = {}
        
        # Process new image if provided
        if image_file:
            # Delete existing images first
            if instance.images:
                storage_service.delete_recipe_images(instance.images)
            
            try:
                image_urls = storage_service.save_image_with_thumbnails(
                    image_file, 
                    str(instance.id)
                )
                instance.images = image_urls
            except DjangoValidationError as e:
                raise serializers.ValidationError({'image': str(e)})
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


class RecipeSerializer(serializers.ModelSerializer):
    """Serializer for reading recipe data."""
    
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    total_time = serializers.IntegerField(read_only=True)
    main_image_url = serializers.CharField(read_only=True)
    thumbnail_url = serializers.CharField(read_only=True)
    has_images = serializers.SerializerMethodField()
    
    # Category information
    categories = CategoryListSerializer(many=True, read_only=True)
    category_names = serializers.ListField(read_only=True)
    category_paths = serializers.ListField(read_only=True)
    
    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'prep_time', 'cook_time', 'total_time',
            'servings', 'difficulty', 'cooking_method', 'ingredients', 
            'instructions', 'nutrition_info', 'images', 'main_image_url', 
            'thumbnail_url', 'has_images', 'author', 'author_name', 
            'author_username', 'categories', 'category_names', 'category_paths',
            'is_published', 'tags', 'version', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'author', 'version', 'created_at', 'updated_at',
            'total_time', 'main_image_url', 'thumbnail_url', 'has_images',
            'category_names', 'category_paths'
        ]

    def get_has_images(self, obj):
        """Check if recipe has images."""
        return obj.has_images()


class RecipeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for recipe listing."""
    
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    total_time = serializers.IntegerField(read_only=True)
    thumbnail_url = serializers.CharField(read_only=True)
    
    # Category information for listing
    categories = CategoryListSerializer(many=True, read_only=True)
    category_names = serializers.ListField(read_only=True)
    
    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'prep_time', 'cook_time', 'total_time',
            'servings', 'difficulty', 'cooking_method', 'thumbnail_url',
            'author_name', 'categories', 'category_names', 'is_published', 
            'tags', 'created_at'
        ]
        read_only_fields = fields 


class RatingSerializer(serializers.ModelSerializer):
    """Serializer for Rating model with full details."""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    recipe_title = serializers.CharField(source='recipe.title', read_only=True)
    star_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = Rating
        fields = [
            'id', 'recipe', 'user', 'rating', 'review',
            'is_verified_purchase', 'helpful_count',
            'user_email', 'user_name', 'recipe_title', 'star_display',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'user_email', 'user_name', 'recipe_title', 
            'star_display', 'helpful_count', 'created_at', 'updated_at'
        ]

    def validate(self, data):
        """Validate rating data."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            recipe = data.get('recipe')
            user = request.user
            
            # Check if user already rated this recipe (for create only)
            if not self.instance and Rating.objects.filter(recipe=recipe, user=user).exists():
                raise serializers.ValidationError({
                    'recipe': 'You have already rated this recipe. Use update to modify your rating.'
                })
                
            # Check if user is trying to rate their own recipe
            if recipe and recipe.author == user:
                raise serializers.ValidationError({
                    'recipe': 'You cannot rate your own recipe.'
                })
        
        return data

    def create(self, validated_data):
        """Create a new rating."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        return super().create(validated_data)


class RatingCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating ratings."""
    
    class Meta:
        model = Rating
        fields = ['recipe', 'rating', 'review']

    def validate(self, data):
        """Validate rating data."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            recipe = data.get('recipe')
            user = request.user
            
            # Check if user already rated this recipe
            if Rating.objects.filter(recipe=recipe, user=user).exists():
                raise serializers.ValidationError({
                    'recipe': 'You have already rated this recipe.'
                })
                
            # Check if user is trying to rate their own recipe
            if recipe and recipe.author == user:
                raise serializers.ValidationError({
                    'recipe': 'You cannot rate your own recipe.'
                })
        
        return data

    def create(self, validated_data):
        """Create a new rating."""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        return super().create(validated_data)


class RatingUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating ratings."""
    
    class Meta:
        model = Rating
        fields = ['rating', 'review']


class RatingListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing ratings."""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    star_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = Rating
        fields = [
            'id', 'rating', 'review', 'user_name', 'star_display',
            'helpful_count', 'is_verified_purchase', 'created_at'
        ]
        read_only_fields = fields


class RecipeRatingStatsSerializer(serializers.Serializer):
    """Serializer for recipe rating statistics."""
    
    average_rating = serializers.FloatField()
    rating_count = serializers.IntegerField()
    rating_distribution = serializers.DictField()
    star_display = serializers.CharField()
    
    def to_representation(self, recipe):
        """Convert recipe instance to rating stats representation."""
        return {
            'average_rating': recipe.average_rating,
            'rating_count': recipe.rating_count,
            'rating_distribution': recipe.rating_distribution,
            'star_display': recipe.star_display,
        }