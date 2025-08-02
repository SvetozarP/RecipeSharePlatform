"""
Serializers for admin API endpoints.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from recipes.models import Recipe, Category, Rating
from user_management.models import UserProfile, UserPreferences
from django.db.models import Avg, Count, Q
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for admin user management."""
    profile = serializers.SerializerMethodField()
    statistics = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'is_active', 'is_staff', 'is_superuser', 'is_email_verified',
            'date_joined', 'last_login', 'profile', 'statistics'
        ]
    
    def get_profile(self, obj):
        """Get user profile information."""
        try:
            profile = UserProfile.objects.get(user=obj)
            return {
                'bio': profile.bio,
                'location': profile.location,
                'website': profile.website,
                'phone': profile.phone,
                'birth_date': profile.birth_date.isoformat() if profile.birth_date else None,
            }
        except UserProfile.DoesNotExist:
            return None
    
    def get_statistics(self, obj):
        """Get user statistics."""
        recipes = Recipe.objects.filter(author=obj)
        ratings = Rating.objects.filter(user=obj)
        from recipes.models import UserFavorite
        
        return {
            'total_recipes': recipes.count(),
            'published_recipes': recipes.filter(is_published=True).count(),
            'total_ratings': ratings.count(),
            'total_favorites': UserFavorite.objects.filter(user=obj).count(),
        }


class AdminRecipeSerializer(serializers.ModelSerializer):
    """Serializer for admin recipe management."""
    author = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()
    rating_stats = serializers.SerializerMethodField()
    view_count = serializers.SerializerMethodField()
    favorite_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'author', 'is_published',
            'created_at', 'updated_at', 'categories', 'rating_stats',
            'view_count', 'favorite_count', 'moderation_status', 'moderation_notes'
        ]
    
    def get_author(self, obj):
        """Get author information."""
        return {
            'id': str(obj.author.id),
            'username': obj.author.username,
            'email': obj.author.email,
        }
    
    def get_categories(self, obj):
        """Get recipe categories."""
        return [
            {
                'id': category.id,
                'name': category.name,
                'slug': category.slug,
            }
            for category in obj.categories.all()
        ]
    
    def get_rating_stats(self, obj):
        """Get recipe rating statistics."""
        ratings = obj.ratings.all()
        avg_rating = ratings.aggregate(avg=Avg('rating'))['avg'] or 0
        
        return {
            'average_rating': round(avg_rating, 2),
            'total_ratings': ratings.count(),
        }
    
    def get_view_count(self, obj):
        """Get recipe view count."""
        from recipes.models import RecipeView
        return RecipeView.objects.filter(recipe=obj).count()
    
    def get_favorite_count(self, obj):
        """Get recipe favorite count."""
        from recipes.models import UserFavorite
        return UserFavorite.objects.filter(recipe=obj).count()


class AdminCategorySerializer(serializers.ModelSerializer):
    """Serializer for admin category management."""
    children = serializers.SerializerMethodField()
    recipe_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'icon', 'color',
            'parent', 'children', 'is_active', 'order', 'recipe_count',
            'created_at', 'updated_at'
        ]
    
    def get_children(self, obj):
        """Get child categories."""
        children = Category.objects.filter(parent=obj, is_active=True)
        return AdminCategorySerializer(children, many=True).data
    
    def get_recipe_count(self, obj):
        """Get number of recipes in this category."""
        return obj.recipes.filter(is_published=True).count()


class AdminRatingSerializer(serializers.ModelSerializer):
    """Serializer for admin rating management."""
    recipe = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    moderation_status = serializers.CharField(default='approved')  # Placeholder
    
    class Meta:
        model = Rating
        fields = [
            'id', 'recipe', 'user', 'rating', 'review', 'is_verified_purchase',
            'helpful_count', 'created_at', 'updated_at', 'moderation_status'
        ]
    
    def get_recipe(self, obj):
        """Get recipe information."""
        return {
            'id': str(obj.recipe.id),
            'title': obj.recipe.title,
        }
    
    def get_user(self, obj):
        """Get user information."""
        return {
            'id': str(obj.user.id),
            'username': obj.user.username,
            'email': obj.user.email,
        }


class PlatformStatisticsSerializer(serializers.Serializer):
    """Serializer for platform statistics."""
    
    def to_representation(self, instance):
        """Generate platform statistics."""
        now = timezone.now()
        month_ago = now - timedelta(days=30)
        week_ago = now - timedelta(days=7)
        today = now.date()
        
        # User statistics
        users = User.objects.all()
        active_users = users.filter(is_active=True)
        new_users_month = users.filter(date_joined__gte=month_ago)
        new_users_week = users.filter(date_joined__gte=week_ago)
        verified_users = users.filter(is_email_verified=True)
        staff_users = users.filter(is_staff=True)
        
        # Recipe statistics
        recipes = Recipe.objects.all()
        published_recipes = recipes.filter(is_published=True, moderation_status=Recipe.ModerationStatus.APPROVED)
        pending_recipes = recipes.filter(moderation_status=Recipe.ModerationStatus.PENDING)
        rejected_recipes = recipes.filter(moderation_status=Recipe.ModerationStatus.REJECTED)
        flagged_recipes = recipes.filter(moderation_status=Recipe.ModerationStatus.FLAGGED)
        new_recipes_month = recipes.filter(created_at__gte=month_ago)
        new_recipes_week = recipes.filter(created_at__gte=week_ago)
        
        # Rating statistics
        ratings = Rating.objects.all()
        avg_rating = ratings.aggregate(avg=Avg('rating'))['avg'] or 0
        pending_ratings = ratings.none()  # Placeholder
        flagged_ratings = ratings.none()  # Placeholder
        
        # Engagement statistics
        from recipes.models import RecipeView, UserFavorite
        
        total_views = RecipeView.objects.count()
        total_favorites = UserFavorite.objects.count()
        avg_views_per_recipe = total_views / recipes.count() if recipes.count() > 0 else 0
        avg_favorites_per_recipe = total_favorites / recipes.count() if recipes.count() > 0 else 0
        
        # Activity statistics
        recipes_today = recipes.filter(created_at__date=today)
        ratings_today = ratings.filter(created_at__date=today)
        users_today = users.filter(date_joined__date=today)
        active_users_week = users.filter(last_login__gte=week_ago)
        
        return {
            'users': {
                'total': users.count(),
                'active': active_users.count(),
                'new_this_month': new_users_month.count(),
                'new_this_week': new_users_week.count(),
                'verified': verified_users.count(),
                'staff': staff_users.count(),
            },
            'recipes': {
                'total': recipes.count(),
                'published': published_recipes.count(),
                'pending_moderation': pending_recipes.count(),
                'rejected': rejected_recipes.count(),
                'new_this_month': new_recipes_month.count(),
                'new_this_week': new_recipes_week.count(),
            },
            'ratings': {
                'total': ratings.count(),
                'average_rating': round(avg_rating, 2),
                'pending_moderation': pending_ratings.count(),
                'flagged': flagged_ratings.count(),
            },
            'engagement': {
                'total_views': total_views,
                'total_favorites': total_favorites,
                'average_views_per_recipe': round(avg_views_per_recipe, 2),
                'average_favorites_per_recipe': round(avg_favorites_per_recipe, 2),
            },
            'activity': {
                'recipes_created_today': recipes_today.count(),
                'ratings_submitted_today': ratings_today.count(),
                'users_registered_today': users_today.count(),
                'active_users_this_week': active_users_week.count(),
            },
        }


class ModerationQueueSerializer(serializers.Serializer):
    """Serializer for moderation queue."""
    
    def to_representation(self, instance):
        """Generate moderation queue data."""
        pending_recipes = Recipe.objects.filter(moderation_status=Recipe.ModerationStatus.PENDING)
        flagged_recipes = Recipe.objects.filter(moderation_status=Recipe.ModerationStatus.FLAGGED)
        
        pending_ratings = Rating.objects.none()  # Placeholder - Rating model doesn't have moderation status yet
        flagged_ratings = Rating.objects.none()  # Placeholder
        
        pending_users = User.objects.filter(is_active=False)
        flagged_users = User.objects.none()  # Placeholder
        
        return {
            'recipes': {
                'pending': pending_recipes.count(),
                'flagged': flagged_recipes.count(),
                'total': pending_recipes.count() + flagged_recipes.count(),
            },
            'ratings': {
                'pending': pending_ratings.count(),
                'flagged': flagged_ratings.count(),
                'total': pending_ratings.count() + flagged_ratings.count(),
            },
            'users': {
                'pending_verification': pending_users.count(),
                'flagged': flagged_users.count(),
                'total': pending_users.count() + flagged_users.count(),
            },
        }


class SystemSettingsSerializer(serializers.Serializer):
    """Serializer for system settings."""
    site_name = serializers.CharField(default='Recipe Sharing Platform')
    site_description = serializers.CharField(default='A platform for sharing and discovering recipes')
    contact_email = serializers.EmailField(default='admin@recipesharing.com')
    max_upload_size = serializers.IntegerField(default=5242880)  # 5MB
    allowed_image_formats = serializers.ListField(
        child=serializers.CharField(),
        default=['jpg', 'jpeg', 'png', 'gif', 'webp']
    )
    moderation_enabled = serializers.BooleanField(default=True)
    auto_approve_recipes = serializers.BooleanField(default=False)
    auto_approve_ratings = serializers.BooleanField(default=True)
    registration_enabled = serializers.BooleanField(default=True)
    email_verification_required = serializers.BooleanField(default=False)
    max_recipes_per_user = serializers.IntegerField(default=100)
    max_images_per_recipe = serializers.IntegerField(default=10)
    maintenance_mode = serializers.BooleanField(default=False)
    maintenance_message = serializers.CharField(default='Site is under maintenance')


class BulkOperationSerializer(serializers.Serializer):
    """Serializer for bulk operations."""
    id = serializers.CharField()
    type = serializers.ChoiceField(choices=[
        'delete', 'approve', 'reject', 'ban', 'activate', 'deactivate'
    ])
    target_type = serializers.ChoiceField(choices=[
        'users', 'recipes', 'ratings', 'categories'
    ])
    target_ids = serializers.ListField(child=serializers.CharField())
    status = serializers.ChoiceField(choices=[
        'pending', 'processing', 'completed', 'failed'
    ], default='pending')
    progress = serializers.IntegerField(default=0)
    total = serializers.IntegerField()
    completed = serializers.IntegerField(default=0)
    failed = serializers.IntegerField(default=0)
    errors = serializers.ListField(child=serializers.CharField(), default=list)
    created_at = serializers.DateTimeField()
    completed_at = serializers.DateTimeField(required=False, allow_null=True)
    created_by = serializers.DictField() 