"""
Serializers for recipe management.
"""

from rest_framework import serializers
from django.utils.translation import gettext_lazy as _

from .models import Recipe


class RecipeSerializer(serializers.ModelSerializer):
    """Serializer for recipe model."""

    total_time = serializers.IntegerField(read_only=True)
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)

    class Meta:
        model = Recipe
        fields = [
            'id',
            'title',
            'description',
            'prep_time',
            'cook_time',
            'total_time',
            'servings',
            'difficulty',
            'cooking_method',
            'ingredients',
            'instructions',
            'nutrition_info',
            'image_url',
            'author',
            'author_name',
            'is_published',
            'tags',
            'version',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'author', 'version', 'created_at', 'updated_at']

    def validate_ingredients(self, value):
        """Validate ingredients format."""
        if not isinstance(value, list):
            raise serializers.ValidationError(_('Ingredients must be a list.'))
        if not value:
            raise serializers.ValidationError(_('At least one ingredient is required.'))
        return value

    def validate_instructions(self, value):
        """Validate instructions format."""
        if not isinstance(value, list):
            raise serializers.ValidationError(_('Instructions must be a list.'))
        if not value:
            raise serializers.ValidationError(_('At least one instruction step is required.'))
        return value

    def validate_tags(self, value):
        """Validate tags format."""
        if not isinstance(value, list):
            raise serializers.ValidationError(_('Tags must be a list.'))
        return value

    def validate_nutrition_info(self, value):
        """Validate nutrition info format."""
        if value is not None and not isinstance(value, dict):
            raise serializers.ValidationError(_('Nutrition info must be a dictionary.'))
        return value


class RecipeListSerializer(RecipeSerializer):
    """Serializer for recipe list view."""

    class Meta(RecipeSerializer.Meta):
        fields = [
            'id',
            'title',
            'description',
            'total_time',
            'difficulty',
            'cooking_method',
            'image_url',
            'author_name',
            'is_published',
            'tags',
            'created_at',
        ] 