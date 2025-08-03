"""
Serializers for recipe data.
"""
from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError

from .models import Recipe, Category, Rating, UserFavorite, RecipeView
from core.services.service_wrapper import service_wrapper


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
                # Use service wrapper for validation
                from core.services.storage_service import storage_service
                storage_service.validate_image_file(value)
            except DjangoValidationError as e:
                raise serializers.ValidationError(str(e))
        return value

    def create(self, validated_data):
        """Create recipe with image processing."""
        image_file = validated_data.pop('image', None)
        categories = validated_data.pop('categories', [])
        is_published = validated_data.pop('is_published', False)
        
        # Set author from request context
        validated_data['author'] = self.context['request'].user
        
        # Set moderation status based on publication status
        if is_published:
            # If user wants to publish, set to APPROVED (users can publish their own recipes)
            validated_data['moderation_status'] = Recipe.ModerationStatus.APPROVED
        else:
            # If saving as draft, keep as DRAFT
            validated_data['moderation_status'] = Recipe.ModerationStatus.DRAFT
        
        # Create recipe instance
        recipe = Recipe.objects.create(**validated_data)
        
        # Set categories
        if categories:
            recipe.categories.set(categories)
        
        # Process and save image if provided
        if image_file:
            try:
                image_urls = service_wrapper.save_image(image_file, str(recipe.id))
                if image_urls:
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
                # Use service wrapper for validation
                from core.services.storage_service import storage_service
                storage_service.validate_image_file(value)
            except DjangoValidationError as e:
                raise serializers.ValidationError(str(e))
        return value

    def update(self, instance, validated_data):
        """Update recipe with image processing."""
        image_file = validated_data.pop('image', None)
        remove_image = validated_data.pop('remove_image', False)
        categories = validated_data.pop('categories', None)
        is_published = validated_data.pop('is_published', None)
        
        # Handle categories update
        if categories is not None:
            instance.categories.set(categories)
        
        # Handle publication status and moderation status
        if is_published is not None:
            instance.is_published = is_published
            if is_published:
                # If user wants to publish, set to APPROVED (users can publish their own recipes)
                instance.moderation_status = Recipe.ModerationStatus.APPROVED
            else:
                # If saving as draft, set to DRAFT
                instance.moderation_status = Recipe.ModerationStatus.DRAFT
        
        # Handle image removal
        if remove_image and instance.images:
            service_wrapper.delete_images(instance.images)
            instance.images = {}
        
        # Process new image if provided
        if image_file:
            # Delete existing images first
            if instance.images:
                service_wrapper.delete_images(instance.images)
            
            try:
                image_urls = service_wrapper.save_image(image_file, str(instance.id))
                if image_urls:
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
    
    # Author information - serialize as full object for permissions
    author = serializers.SerializerMethodField()
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    total_time = serializers.IntegerField(read_only=True)
    main_image_url = serializers.CharField(read_only=True)
    thumbnail_url = serializers.CharField(read_only=True)
    has_images = serializers.SerializerMethodField()
    
    # Image information for frontend
    images = serializers.SerializerMethodField()
    
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
            'id', 'version', 'created_at', 'updated_at',
            'total_time', 'main_image_url', 'thumbnail_url', 'has_images',
            'category_names', 'category_paths'
        ]

    def get_author(self, obj):
        """Serialize author information for frontend permissions."""
        if obj.author:
            return {
                'id': str(obj.author.id),  # Ensure ID is string for UUID consistency
                'username': obj.author.username,
                'firstName': obj.author.first_name,
                'lastName': obj.author.last_name,
            }
        return None

    def get_images(self, obj):
        """Serialize images in the format expected by frontend."""
        if obj.images and isinstance(obj.images, dict):
            from core.services.storage_service import storage_service
            # Convert stored image URLs to frontend-expected format
            images = []
            if 'original' in obj.images:
                images.append({
                    'id': 1,
                    'image': storage_service._ensure_absolute_url(obj.images['original']),
                    'alt_text': obj.title,
                    'is_primary': True,
                    'ordering': 0
                })
            elif 'large' in obj.images:
                images.append({
                    'id': 1,
                    'image': storage_service._ensure_absolute_url(obj.images['large']),
                    'alt_text': obj.title,
                    'is_primary': True,
                    'ordering': 0
                })
            elif 'medium' in obj.images:
                images.append({
                    'id': 1,
                    'image': storage_service._ensure_absolute_url(obj.images['medium']),
                    'alt_text': obj.title,
                    'is_primary': True,
                    'ordering': 0
                })
            return images
        return []

    def get_has_images(self, obj):
        """Check if recipe has images."""
        return obj.has_images()


class RecipeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for recipe listing."""
    
    # Author information for listing
    author = serializers.SerializerMethodField()
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    total_time = serializers.IntegerField(read_only=True)
    thumbnail_url = serializers.CharField(read_only=True)
    
    # Image information for listing
    images = serializers.SerializerMethodField()
    
    # Category information for listing
    categories = CategoryListSerializer(many=True, read_only=True)
    category_names = serializers.ListField(read_only=True)
    
    # Rating information
    rating_stats = serializers.SerializerMethodField()
    
    # Favorite status for authenticated users
    is_favorited = serializers.SerializerMethodField()
    
    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'prep_time', 'cook_time', 'total_time',
            'servings', 'difficulty', 'cooking_method', 'thumbnail_url',
            'author', 'author_name', 'images', 'categories', 'category_names', 'is_published', 
            'tags', 'created_at', 'rating_stats', 'is_favorited'
        ]

    def get_author(self, obj):
        """Serialize author information for frontend permissions."""
        if obj.author:
            return {
                'id': str(obj.author.id),  # Ensure ID is string for UUID consistency
                'username': obj.author.username,
                'firstName': obj.author.first_name,
                'lastName': obj.author.last_name,
            }
        return None

    def get_images(self, obj):
        """Serialize images in the format expected by frontend."""
        if obj.images and isinstance(obj.images, dict):
            from core.services.storage_service import storage_service
            # Convert stored image URLs to frontend-expected format
            images = []
            # Use thumbnail for list view for better performance
            if 'thumbnail' in obj.images:
                images.append({
                    'id': 1,
                    'image': storage_service._ensure_absolute_url(obj.images['thumbnail']),
                    'alt_text': obj.title,
                    'is_primary': True,
                    'ordering': 0
                })
            elif 'medium' in obj.images:
                images.append({
                    'id': 1,
                    'image': storage_service._ensure_absolute_url(obj.images['medium']),
                    'alt_text': obj.title,
                    'is_primary': True,
                    'ordering': 0
                })
            return images
        return [] 

    def get_rating_stats(self, obj):
        """Get rating statistics for the recipe."""
        # Use annotated fields if available (from list view), otherwise fall back to properties
        avg_rating = 0.0
        total_ratings = 0
        
        if hasattr(obj, '_avg_rating_sort') and obj._avg_rating_sort is not None:
            avg_rating = round(obj._avg_rating_sort, 1)
        else:
            avg_rating = obj.average_rating or 0.0
            
        if hasattr(obj, '_rating_count_sort'):
            total_ratings = obj._rating_count_sort
        else:
            total_ratings = obj.rating_count or 0
            
        return {
            'average_rating': avg_rating,
            'total_ratings': total_ratings,
            'rating_distribution': getattr(obj, 'rating_distribution', {})
        }

    def get_is_favorited(self, obj):
        """Check if the current user has favorited this recipe."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from recipes.models import UserFavorite
            is_favorited = UserFavorite.objects.filter(user=request.user, recipe=obj).exists()
            return is_favorited
        return False


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


class SearchResultSerializer(serializers.ModelSerializer):
    """Serializer for search result recipes with additional search metadata."""
    
    # Author information  
    author = serializers.SerializerMethodField()
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    total_time = serializers.IntegerField(read_only=True)
    main_image_url = serializers.CharField(read_only=True)
    thumbnail_url = serializers.CharField(read_only=True)
    
    # Image information for consistency with RecipeListSerializer
    images = serializers.SerializerMethodField()
    
    # Category information
    categories = CategoryListSerializer(many=True, read_only=True)
    category_names = serializers.ListField(read_only=True)
    
    # Search-specific fields
    search_rank = serializers.FloatField(source='rank', read_only=True, default=0.0)
    search_snippet = serializers.SerializerMethodField()
    
    # Rating information - using same format as RecipeListSerializer
    rating_stats = serializers.SerializerMethodField()
    
    # Favorite status for authenticated users
    is_favorited = serializers.SerializerMethodField()
    
    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'prep_time', 'cook_time', 'total_time',
            'servings', 'difficulty', 'cooking_method', 'main_image_url', 
            'thumbnail_url', 'author', 'author_name', 'author_username', 
            'images', 'categories', 'category_names', 'tags', 'created_at',
            'search_rank', 'search_snippet', 'rating_stats', 'is_published', 'is_favorited'
        ]
        read_only_fields = [
            'id', 'created_at', 'search_rank', 'search_snippet', 'is_favorited'
        ]

    def get_author(self, obj):
        """Serialize author information for frontend permissions."""
        if obj.author:
            return {
                'id': str(obj.author.id),  # Ensure ID is string for UUID consistency
                'username': obj.author.username,
                'firstName': obj.author.first_name,
                'lastName': obj.author.last_name,
            }
        return None

    def get_images(self, obj):
        """Serialize images in the format expected by frontend."""
        if obj.images and isinstance(obj.images, dict):
            from core.services.storage_service import storage_service
            # Convert stored image URLs to frontend-expected format
            images = []
            # Use thumbnail for list view for better performance
            if 'thumbnail' in obj.images:
                images.append({
                    'id': 1,
                    'image': storage_service._ensure_absolute_url(obj.images['thumbnail']),
                    'alt_text': obj.title,
                    'is_primary': True,
                    'ordering': 0
                })
            elif 'medium' in obj.images:
                images.append({
                    'id': 1,
                    'image': storage_service._ensure_absolute_url(obj.images['medium']),
                    'alt_text': obj.title,
                    'is_primary': True,
                    'ordering': 0
                })
            return images
        return []

    def get_search_snippet(self, obj):
        """Get search snippet highlighting matched terms."""
        if hasattr(obj, 'search_snippet'):
            return obj.search_snippet
        return None

    def get_rating_stats(self, obj):
        """Get rating statistics for the recipe."""
        # Use annotated fields if available (from search view), otherwise fall back to properties
        avg_rating = 0.0
        total_ratings = 0
        
        if hasattr(obj, '_avg_rating_sort') and obj._avg_rating_sort is not None:
            avg_rating = round(obj._avg_rating_sort, 1)
        else:
            avg_rating = obj.average_rating or 0.0
            
        if hasattr(obj, '_rating_count_sort'):
            total_ratings = obj._rating_count_sort
        else:
            total_ratings = obj.rating_count or 0
            
        return {
            'average_rating': avg_rating,
            'total_ratings': total_ratings,
            'rating_distribution': getattr(obj, 'rating_distribution', {})
        }

    def get_is_favorited(self, obj):
        """Check if the current user has favorited this recipe."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from recipes.models import UserFavorite
            is_favorited = UserFavorite.objects.filter(user=request.user, recipe=obj).exists()
            return is_favorited
        return False


class SearchSuggestionsSerializer(serializers.Serializer):
    """Serializer for search suggestions response."""
    
    recipes = serializers.ListField(child=serializers.CharField(), read_only=True)
    ingredients = serializers.ListField(child=serializers.CharField(), read_only=True)
    categories = serializers.ListField(child=serializers.CharField(), read_only=True)
    tags = serializers.ListField(child=serializers.CharField(), read_only=True)
    authors = serializers.ListField(child=serializers.CharField(), read_only=True)
    
    class Meta:
        fields = ['recipes', 'ingredients', 'categories', 'tags', 'authors']


class AdvancedSearchSerializer(serializers.Serializer):
    """Serializer for advanced search request parameters."""
    
    query = serializers.CharField(required=False, allow_blank=True)
    q = serializers.CharField(required=False, allow_blank=True)  # Alias for query
    ingredients = serializers.ListField(child=serializers.CharField(), required=False)
    exclude_ingredients = serializers.ListField(child=serializers.CharField(), required=False)
    categories = serializers.ListField(child=serializers.CharField(), required=False)
    difficulty = serializers.ChoiceField(
        choices=['easy', 'medium', 'hard'], 
        required=False, 
        allow_blank=True
    )
    cooking_method = serializers.ChoiceField(
        choices=['baking', 'frying', 'boiling', 'grilling', 'steaming', 'other'], 
        required=False, 
        allow_blank=True
    )
    max_prep_time = serializers.IntegerField(min_value=1, required=False)
    max_cook_time = serializers.IntegerField(min_value=1, required=False)
    max_total_time = serializers.IntegerField(min_value=1, required=False)
    min_servings = serializers.IntegerField(min_value=1, required=False)
    max_servings = serializers.IntegerField(min_value=1, required=False)
    dietary_restrictions = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 
            'nut-free', 'low-carb', 'paleo', 'keto'
        ]), 
        required=False
    )
    author = serializers.CharField(required=False, allow_blank=True)
    min_rating = serializers.FloatField(min_value=1.0, max_value=5.0, required=False)
    has_nutrition_info = serializers.BooleanField(required=False)
    tags = serializers.ListField(child=serializers.CharField(), required=False)
    order_by = serializers.ChoiceField(
        choices=[
            'relevance', 'rating', 'popularity', 'newest', 'oldest', 
            'title', 'cook_time', 'prep_time', 'total_time'
        ], 
        default='relevance', 
        required=False
    )
    page = serializers.IntegerField(min_value=1, default=1, required=False)
    page_size = serializers.IntegerField(min_value=1, max_value=100, default=20, required=False)
    
    def validate(self, data):
        """Map 'q' to 'query' for compatibility."""
        if 'q' in data and not data.get('query'):
            data['query'] = data.pop('q')
        elif 'q' in data:
            data.pop('q')  # Remove q if query is already present
        return data

    class Meta:
        fields = [
            'query', 'q', 'ingredients', 'exclude_ingredients', 'categories', 
            'difficulty', 'cooking_method', 'max_prep_time', 'max_cook_time', 
            'max_total_time', 'min_servings', 'max_servings', 'dietary_restrictions',
            'author', 'min_rating', 'has_nutrition_info', 'tags', 'order_by',
            'page', 'page_size'
        ]


class SearchResultsSerializer(serializers.Serializer):
    """Serializer for paginated search results."""
    
    count = serializers.IntegerField(read_only=True)
    num_pages = serializers.IntegerField(read_only=True)
    current_page = serializers.IntegerField(read_only=True)
    page_size = serializers.IntegerField(read_only=True)
    results = SearchResultSerializer(many=True, read_only=True)
    search_time = serializers.FloatField(read_only=True, required=False)
    
    class Meta:
        fields = ['count', 'num_pages', 'current_page', 'page_size', 'results', 'search_time']


class UserFavoriteSerializer(serializers.ModelSerializer):
    """Serializer for UserFavorite model."""
    
    recipe = RecipeListSerializer(read_only=True)
    recipe_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = UserFavorite
        fields = [
            'id', 'recipe', 'recipe_id', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        """Create a new favorite."""
        recipe_id = validated_data.pop('recipe_id')
        user = self.context['request'].user
        
        # Check if recipe exists
        try:
            recipe = Recipe.objects.get(id=recipe_id)
        except Recipe.DoesNotExist:
            raise serializers.ValidationError({'recipe_id': 'Recipe not found.'})
        
        # Check if already favorited
        if UserFavorite.objects.filter(user=user, recipe=recipe).exists():
            raise serializers.ValidationError('Recipe is already in favorites.')
        
        return UserFavorite.objects.create(user=user, recipe=recipe)


class RecipeViewSerializer(serializers.ModelSerializer):
    """Serializer for RecipeView model."""
    
    recipe = RecipeListSerializer(read_only=True)
    recipe_id = serializers.UUIDField(write_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = RecipeView
        fields = [
            'id', 'recipe', 'recipe_id', 'user_email', 'ip_address',
            'view_duration_seconds', 'created_at'
        ]
        read_only_fields = ['id', 'user_email', 'ip_address', 'created_at']
    
    def create(self, validated_data):
        """Create a new recipe view."""
        recipe_id = validated_data.pop('recipe_id')
        request = self.context['request']
        
        # Check if recipe exists
        try:
            recipe = Recipe.objects.get(id=recipe_id)
        except Recipe.DoesNotExist:
            raise serializers.ValidationError({'recipe_id': 'Recipe not found.'})
        
        # Get IP address and user agent from request
        ip_address = self.get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Create view record
        view_data = {
            'recipe': recipe,
            'ip_address': ip_address,
            'user_agent': user_agent,
            **validated_data
        }
        
        # Add user if authenticated
        if request.user.is_authenticated:
            view_data['user'] = request.user
        else:
            view_data['session_key'] = request.session.session_key or ''
        
        return RecipeView.objects.create(**view_data)
    
    def get_client_ip(self, request):
        """Get the client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        # Strip port number if present (e.g., "154.56.239.200:50458" -> "154.56.239.200")
        if ip and ':' in ip:
            ip = ip.split(':')[0]
        
        return ip


class FavoriteStatsSerializer(serializers.Serializer):
    """Serializer for favorite statistics."""
    
    total_favorites = serializers.IntegerField()
    favorite_recipes = RecipeListSerializer(many=True)
    
    
class ViewStatsSerializer(serializers.Serializer):
    """Serializer for view statistics."""
    
    total_views = serializers.IntegerField()
    unique_views = serializers.IntegerField()
    average_view_duration = serializers.FloatField(allow_null=True)
    most_viewed_recipes = RecipeListSerializer(many=True)