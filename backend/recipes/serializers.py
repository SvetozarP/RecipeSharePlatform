"""
Serializers for recipe data.
"""
from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError

from .models import Recipe
from core.services.storage_service import storage_service


class RecipeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating recipes with optional image upload."""
    
    # File upload field for recipe image
    image = serializers.ImageField(
        write_only=True,
        required=False,
        help_text="Recipe image file (JPEG, PNG, WebP supported, max 5MB)"
    )
    
    class Meta:
        model = Recipe
        fields = [
            'title', 'description', 'prep_time', 'cook_time', 'servings',
            'difficulty', 'cooking_method', 'ingredients', 'instructions',
            'nutrition_info', 'tags', 'is_published', 'image'
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
        
        # Set author from request context
        validated_data['author'] = self.context['request'].user
        
        # Create recipe instance
        recipe = Recipe.objects.create(**validated_data)
        
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
    
    class Meta:
        model = Recipe
        fields = [
            'title', 'description', 'prep_time', 'cook_time', 'servings',
            'difficulty', 'cooking_method', 'ingredients', 'instructions',
            'nutrition_info', 'tags', 'is_published', 'image', 'remove_image'
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
    
    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'prep_time', 'cook_time', 'total_time',
            'servings', 'difficulty', 'cooking_method', 'ingredients', 
            'instructions', 'nutrition_info', 'images', 'main_image_url', 
            'thumbnail_url', 'has_images', 'author', 'author_name', 
            'author_username', 'is_published', 'tags', 'version', 
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'author', 'version', 'created_at', 'updated_at',
            'total_time', 'main_image_url', 'thumbnail_url', 'has_images'
        ]

    def get_has_images(self, obj):
        """Check if recipe has images."""
        return obj.has_images()


class RecipeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for recipe listing."""
    
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    total_time = serializers.IntegerField(read_only=True)
    thumbnail_url = serializers.CharField(read_only=True)
    
    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'prep_time', 'cook_time', 'total_time',
            'servings', 'difficulty', 'cooking_method', 'thumbnail_url',
            'author_name', 'is_published', 'tags', 'created_at'
        ]
        read_only_fields = fields 