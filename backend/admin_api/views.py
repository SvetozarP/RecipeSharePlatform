"""
Views for admin API endpoints.
"""

from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import get_user_model
from django.db.models import Q, Count, Avg, Sum
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from django.http import HttpResponse
import csv
import json
import uuid
from datetime import datetime, timedelta

from recipes.models import Recipe, Category, Rating, RecipeView, UserFavorite
from .serializers import (
    AdminUserSerializer,
    AdminRecipeSerializer,
    AdminCategorySerializer,
    AdminRatingSerializer,
    PlatformStatisticsSerializer,
    ModerationQueueSerializer,
    SystemSettingsSerializer,
    BulkOperationSerializer
)

User = get_user_model()


class AdminPagination(PageNumberPagination):
    """Custom pagination for admin endpoints."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class AdminUserViewSet(viewsets.ModelViewSet):
    """ViewSet for admin user management."""
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminPagination
    lookup_field = 'id'
    
    def get_queryset(self):
        """Get filtered queryset based on query parameters."""
        queryset = User.objects.all()
        
        # Search filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        # Status filter
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            if status_filter == 'active':
                queryset = queryset.filter(is_active=True)
            elif status_filter == 'inactive':
                queryset = queryset.filter(is_active=False)
            elif status_filter == 'staff':
                queryset = queryset.filter(is_staff=True)
            elif status_filter == 'superuser':
                queryset = queryset.filter(is_superuser=True)
        
        # Date filters
        date_after = self.request.query_params.get('date_joined_after', None)
        if date_after:
            queryset = queryset.filter(date_joined__gte=date_after)
        
        date_before = self.request.query_params.get('date_joined_before', None)
        if date_before:
            queryset = queryset.filter(date_joined__lte=date_before)
        
        return queryset.order_by('-date_joined')
    
    @action(detail=True, methods=['patch'])
    def toggle_status(self, request, id=None):
        """Toggle user active status."""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def toggle_staff(self, request, id=None):
        """Toggle user staff status."""
        user = self.get_object()
        user.is_staff = not user.is_staff
        user.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data)


class AdminRecipeViewSet(viewsets.ModelViewSet):
    """ViewSet for admin recipe management."""
    queryset = Recipe.objects.all()
    serializer_class = AdminRecipeSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminPagination
    lookup_field = 'id'
    
    def get_queryset(self):
        """Get filtered queryset based on query parameters."""
        queryset = Recipe.objects.select_related('author').prefetch_related('categories')
        
        # Search filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(author__username__icontains=search)
            )
        
        # Status filter
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            if status_filter == 'published':
                queryset = queryset.filter(is_published=True, moderation_status=Recipe.ModerationStatus.APPROVED)
            elif status_filter == 'draft':
                queryset = queryset.filter(moderation_status=Recipe.ModerationStatus.DRAFT)
            elif status_filter == 'pending':
                queryset = queryset.filter(moderation_status=Recipe.ModerationStatus.PENDING)
            elif status_filter == 'rejected':
                queryset = queryset.filter(moderation_status=Recipe.ModerationStatus.REJECTED)
            elif status_filter == 'flagged':
                queryset = queryset.filter(moderation_status=Recipe.ModerationStatus.FLAGGED)
        
        # Author filter
        author = self.request.query_params.get('author', None)
        if author:
            queryset = queryset.filter(author__username__icontains=author)
        
        # Category filter
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(categories__id=category)
        
        # Date filters
        date_after = self.request.query_params.get('date_created_after', None)
        if date_after:
            queryset = queryset.filter(created_at__gte=date_after)
        
        date_before = self.request.query_params.get('date_created_before', None)
        if date_before:
            queryset = queryset.filter(created_at__lte=date_before)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def approve(self, request, id=None):
        """Approve a recipe."""
        recipe = self.get_object()
        recipe.moderation_status = Recipe.ModerationStatus.APPROVED
        recipe.is_published = True
        recipe.save()
        serializer = self.get_serializer(recipe)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, id=None):
        """Reject a recipe."""
        recipe = self.get_object()
        recipe.moderation_status = Recipe.ModerationStatus.REJECTED
        recipe.is_published = False
        recipe.moderation_notes = request.data.get('reason', '')
        recipe.save()
        serializer = self.get_serializer(recipe)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def flag(self, request, id=None):
        """Flag a recipe for review."""
        recipe = self.get_object()
        recipe.moderation_status = Recipe.ModerationStatus.FLAGGED
        recipe.moderation_notes = request.data.get('reason', '')
        recipe.save()
        serializer = self.get_serializer(recipe)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """Update a recipe."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


class AdminCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for admin category management."""
    queryset = Category.objects.all()
    serializer_class = AdminCategorySerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminPagination
    
    def get_queryset(self):
        """Get filtered queryset based on query parameters."""
        queryset = Category.objects.all()
        
        # Search filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Status filter
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            if status_filter == 'active':
                queryset = queryset.filter(is_active=True)
            elif status_filter == 'inactive':
                queryset = queryset.filter(is_active=False)
        
        # Parent filter
        parent = self.request.query_params.get('parent', None)
        if parent:
            queryset = queryset.filter(parent__id=parent)
        
        return queryset.order_by('parent__name', 'order', 'name')
    
    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """Reorder categories."""
        orders = request.data.get('orders', [])
        
        for item in orders:
            category_id = item.get('id')
            new_order = item.get('order')
            
            if category_id and new_order is not None:
                Category.objects.filter(id=category_id).update(order=new_order)
        
        return Response({'message': 'Categories reordered successfully'})


class AdminRatingViewSet(viewsets.ModelViewSet):
    """ViewSet for admin rating management."""
    queryset = Rating.objects.all()
    serializer_class = AdminRatingSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminPagination
    lookup_field = 'id'
    
    def get_queryset(self):
        """Get filtered queryset based on query parameters."""
        queryset = Rating.objects.select_related('recipe', 'user')
        
        # Search filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(review__icontains=search) |
                Q(recipe__title__icontains=search) |
                Q(user__username__icontains=search)
            )
        
        # Rating filter
        rating = self.request.query_params.get('rating', None)
        if rating:
            queryset = queryset.filter(rating=rating)
        
        # Status filter (placeholder)
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            # Placeholder implementation
            pass
        
        # Date filters
        date_after = self.request.query_params.get('date_created_after', None)
        if date_after:
            queryset = queryset.filter(created_at__gte=date_after)
        
        date_before = self.request.query_params.get('date_created_before', None)
        if date_before:
            queryset = queryset.filter(created_at__lte=date_before)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def approve(self, request, id=None):
        """Approve a rating."""
        # Placeholder implementation
        rating = self.get_object()
        serializer = self.get_serializer(rating)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, id=None):
        """Reject a rating."""
        # Placeholder implementation
        rating = self.get_object()
        serializer = self.get_serializer(rating)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def flag(self, request, id=None):
        """Flag a rating for review."""
        # Placeholder implementation
        rating = self.get_object()
        serializer = self.get_serializer(rating)
        return Response(serializer.data)


class AdminStatisticsView(viewsets.ViewSet):
    """ViewSet for platform statistics."""
    permission_classes = [permissions.IsAdminUser]
    
    def list(self, request):
        """Get platform statistics."""
        serializer = PlatformStatisticsSerializer(data={})
        serializer.is_valid()
        return Response(serializer.data)


class AdminModerationQueueView(viewsets.ViewSet):
    """ViewSet for moderation queue."""
    permission_classes = [permissions.IsAdminUser]
    
    def list(self, request):
        """Get moderation queue."""
        serializer = ModerationQueueSerializer(data={})
        serializer.is_valid()
        return Response(serializer.data)


class AdminAnalyticsView(viewsets.ViewSet):
    """ViewSet for analytics data."""
    permission_classes = [permissions.IsAdminUser]
    
    def list(self, request):
        """Get analytics data."""
        period = request.query_params.get('period', '30d')
        
        # Calculate date range based on period
        now = timezone.now()
        
        if period == '7d':
            start_date = now - timedelta(days=7)
            date_trunc = TruncDate
        elif period == '30d':
            start_date = now - timedelta(days=30)
            date_trunc = TruncDate
        elif period == '90d':
            start_date = now - timedelta(days=90)
            date_trunc = TruncDate
        elif period == '1y':
            start_date = now - timedelta(days=365)
            date_trunc = TruncMonth
        else:
            start_date = now - timedelta(days=30)
            date_trunc = TruncDate
        
        # User growth data
        user_growth_data = User.objects.filter(
            date_joined__gte=start_date
        ).annotate(
            date=date_trunc('date_joined')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        user_growth_labels = []
        user_growth_values = []
        cumulative_users = 0
        
        for entry in user_growth_data:
            cumulative_users += entry['count']
            if period == '1y':
                user_growth_labels.append(entry['date'].strftime('%b %Y'))
            else:
                user_growth_labels.append(entry['date'].strftime('%b %d'))
            user_growth_values.append(cumulative_users)
        
        # Recipe activity data
        recipe_activity_data = Recipe.objects.filter(
            created_at__gte=start_date
        ).annotate(
            date=date_trunc('created_at')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        recipe_activity_labels = []
        recipe_activity_values = []
        cumulative_recipes = 0
        
        for entry in recipe_activity_data:
            cumulative_recipes += entry['count']
            if period == '1y':
                recipe_activity_labels.append(entry['date'].strftime('%b %Y'))
            else:
                recipe_activity_labels.append(entry['date'].strftime('%b %d'))
            recipe_activity_values.append(cumulative_recipes)
        
        # Rating distribution
        rating_distribution = Rating.objects.values('rating').annotate(
            count=Count('id')
        ).order_by('rating')
        
        rating_labels = ['1★', '2★', '3★', '4★', '5★']
        rating_values = [0, 0, 0, 0, 0]
        
        for entry in rating_distribution:
            if 1 <= entry['rating'] <= 5:
                rating_values[entry['rating'] - 1] = entry['count']
        
        # Top recipes (by rating count and average rating)
        top_recipes = Recipe.objects.annotate(
            calculated_avg_rating=Avg('ratings__rating'),
            calculated_rating_count=Count('ratings'),
            calculated_views=Count('views'),
            calculated_favorites=Count('favorites')
        ).filter(
            calculated_rating_count__gt=0
        ).order_by('-calculated_rating_count', '-calculated_avg_rating')[:10]
        
        top_recipes_data = []
        for recipe in top_recipes:
            top_recipes_data.append({
                'id': str(recipe.id),
                'title': recipe.title,
                'views': recipe.calculated_views,
                'favorites': recipe.calculated_favorites,
                'average_rating': float(recipe.calculated_avg_rating or 0)
            })
        
        # Top categories (by recipe count and average rating)
        top_categories = Category.objects.annotate(
            calculated_recipe_count=Count('recipes'),
            calculated_avg_rating=Avg('recipes__ratings__rating')
        ).filter(
            calculated_recipe_count__gt=0
        ).order_by('-calculated_recipe_count', '-calculated_avg_rating')[:10]
        
        top_categories_data = []
        for category in top_categories:
            top_categories_data.append({
                'id': category.id,
                'name': category.name,
                'recipe_count': category.calculated_recipe_count,
                'average_rating': float(category.calculated_avg_rating or 0)
            })
        
        # Top users (by recipe count)
        top_users = User.objects.annotate(
            calculated_recipe_count=Count('recipes'),
            calculated_avg_rating=Avg('recipes__ratings__rating'),
            calculated_total_views=Count('recipes__views')
        ).filter(
            calculated_recipe_count__gt=0
        ).order_by('-calculated_recipe_count')[:10]
        
        top_users_data = []
        for user in top_users:
            top_users_data.append({
                'id': str(user.id),
                'username': user.username,
                'recipe_count': user.calculated_recipe_count,
                'total_views': user.calculated_total_views,
                'average_rating': float(user.calculated_avg_rating or 0)
            })
        
        # Category distribution
        category_distribution = Category.objects.annotate(
            calculated_recipe_count=Count('recipes')
        ).filter(
            calculated_recipe_count__gt=0
        ).order_by('-calculated_recipe_count')
        
        category_labels = []
        category_values = []
        
        for category in category_distribution[:10]:  # Top 10 categories
            category_labels.append(category.name)
            category_values.append(category.calculated_recipe_count)
        
        analytics_data = {
            'user_growth': {
                'labels': user_growth_labels,
                'datasets': [{
                    'label': 'Users',
                    'data': user_growth_values,
                    'borderColor': '#1976d2',
                    'backgroundColor': 'rgba(25, 118, 210, 0.1)'
                }]
            },
            'recipe_activity': {
                'labels': recipe_activity_labels,
                'datasets': [{
                    'label': 'Recipes',
                    'data': recipe_activity_values,
                    'borderColor': '#388e3c',
                    'backgroundColor': 'rgba(56, 142, 60, 0.1)'
                }]
            },
            'rating_distribution': {
                'labels': rating_labels,
                'datasets': [{
                    'data': rating_values,
                    'backgroundColor': ['#f44336', '#ff9800', '#ffc107', '#4caf50', '#2196f3']
                }]
            },
            'category_distribution': {
                'labels': category_labels,
                'datasets': [{
                    'data': category_values,
                    'backgroundColor': [
                        '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
                        '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50'
                    ]
                }]
            },
            'top_recipes': top_recipes_data,
            'top_categories': top_categories_data,
            'top_users': top_users_data
        }
        
        return Response(analytics_data)


class AdminSettingsView(viewsets.ViewSet):
    """ViewSet for system settings."""
    permission_classes = [permissions.IsAdminUser]
    
    def list(self, request):
        """Get system settings."""
        serializer = SystemSettingsSerializer(data={})
        serializer.is_valid()
        return Response(serializer.data)
    
    def update(self, request, pk=None):
        """Update system settings."""
        serializer = SystemSettingsSerializer(data=request.data)
        if serializer.is_valid():
            # Placeholder implementation - in real app, save to database
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def partial_update(self, request, pk=None):
        """Partially update system settings (PATCH method)."""
        serializer = SystemSettingsSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            # Placeholder implementation - in real app, save to database
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['patch'])
    def update_settings(self, request):
        """Update system settings without requiring pk."""
        serializer = SystemSettingsSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            # Placeholder implementation - in real app, save to database
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminBulkOperationsView(viewsets.ViewSet):
    """ViewSet for bulk operations."""
    permission_classes = [permissions.IsAdminUser]
    
    def list(self, request):
        """Get bulk operations."""
        # Placeholder implementation
        operations = []
        serializer = BulkOperationSerializer(operations, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        """Create a bulk operation."""
        operation_type = request.data.get('type')
        target_type = request.data.get('target_type')
        target_ids = request.data.get('target_ids', [])
        
        # Placeholder implementation
        operation = {
            'id': str(uuid.uuid4()),
            'type': operation_type,
            'target_type': target_type,
            'target_ids': target_ids,
            'status': 'pending',
            'progress': 0,
            'total': len(target_ids),
            'completed': 0,
            'failed': 0,
            'errors': [],
            'created_at': timezone.now(),
            'created_by': {
                'id': str(request.user.id),
                'username': request.user.username
            }
        }
        
        serializer = BulkOperationSerializer(data=operation)
        serializer.is_valid()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def retrieve(self, request, pk=None):
        """Get a specific bulk operation."""
        # Placeholder implementation
        operation = {
            'id': pk,
            'type': 'delete',
            'target_type': 'users',
            'target_ids': ['1', '2', '3'],
            'status': 'completed',
            'progress': 100,
            'total': 3,
            'completed': 3,
            'failed': 0,
            'errors': [],
            'created_at': timezone.now(),
            'completed_at': timezone.now(),
            'created_by': {
                'id': str(request.user.id),
                'username': request.user.username
            }
        }
        
        serializer = BulkOperationSerializer(data=operation)
        serializer.is_valid()
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a bulk operation."""
        # Placeholder implementation
        return Response({'message': 'Operation cancelled successfully'})


class AdminExportView(viewsets.ViewSet):
    """ViewSet for data export."""
    permission_classes = [permissions.IsAdminUser]
    
    def list(self, request, data_type=None, **kwargs):
        """Export data."""
        try:
            format_type = kwargs.get('format_type', 'csv')
            
            if not data_type:
                return Response({'error': 'Data type is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            if data_type == 'users':
                queryset = User.objects.all().order_by('-date_joined')
                fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff', 'date_joined', 'last_login']
            elif data_type == 'recipes':
                queryset = Recipe.objects.all().order_by('-created_at')
                fields = ['id', 'title', 'description', 'author__username', 'is_published', 'created_at', 'updated_at', 'prep_time', 'cook_time', 'servings']
            elif data_type == 'ratings':
                queryset = Rating.objects.all().order_by('-created_at')
                fields = ['id', 'rating', 'review', 'user__username', 'recipe__title', 'created_at', 'updated_at', 'helpful_count']
            elif data_type == 'categories':
                queryset = Category.objects.all().order_by('name')
                fields = ['id', 'name', 'slug', 'description', 'is_active', 'created_at', 'updated_at', 'parent__name']
            else:
                return Response({'error': f'Invalid data type: {data_type}'}, status=status.HTTP_400_BAD_REQUEST)
            
            if format_type == 'csv':
                response = HttpResponse(content_type='text/csv; charset=utf-8')
                response['Content-Disposition'] = f'attachment; filename="{data_type}_{timezone.now().date()}.csv"'
                
                writer = csv.writer(response)
                writer.writerow(fields)
                
                for obj in queryset:
                    row = []
                    for field in fields:
                        try:
                            if '__' in field:
                                # Handle related fields
                                parts = field.split('__')
                                value = obj
                                for part in parts:
                                    value = getattr(value, part, '')
                                row.append(str(value) if value else '')
                            else:
                                value = getattr(obj, field, '')
                                row.append(str(value) if value else '')
                        except Exception as e:
                            row.append('')
                    writer.writerow(row)
                
                return response
            elif format_type == 'json':
                # JSON export
                data = []
                for obj in queryset:
                    item = {}
                    for field in fields:
                        try:
                            if '__' in field:
                                parts = field.split('__')
                                value = obj
                                for part in parts:
                                    value = getattr(value, part, '')
                                item[field] = str(value) if value else ''
                            else:
                                value = getattr(obj, field, '')
                                item[field] = str(value) if value else ''
                        except Exception as e:
                            item[field] = ''
                    data.append(item)
                
                response = HttpResponse(json.dumps(data, indent=2, ensure_ascii=False), content_type='application/json; charset=utf-8')
                response['Content-Disposition'] = f'attachment; filename="{data_type}_{timezone.now().date()}.json"'
                return response
            else:
                return Response({'error': f'Unsupported format: {format_type}'}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'error': f'Export failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminAuditLogView(viewsets.ViewSet):
    """ViewSet for audit log."""
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminPagination
    
    def list(self, request):
        """Get audit log."""
        # Placeholder implementation
        audit_log = [
            {
                'id': 1,
                'action': 'user_created',
                'user': 'admin',
                'target': 'user:john_doe',
                'timestamp': timezone.now(),
                'details': 'User account created'
            },
            {
                'id': 2,
                'action': 'recipe_approved',
                'user': 'admin',
                'target': 'recipe:spaghetti-carbonara',
                'timestamp': timezone.now(),
                'details': 'Recipe approved for publication'
            }
        ]
        
        return Response({
            'results': audit_log,
            'pagination': {
                'page': 1,
                'page_size': 20,
                'total': len(audit_log),
                'total_pages': 1
            }
        })


class AdminRecentActivityView(viewsets.ViewSet):
    """ViewSet for recent activity."""
    permission_classes = [permissions.IsAdminUser]
    
    def list(self, request):
        """Get recent activity."""
        limit = int(request.query_params.get('limit', 10))
        
        # Get recent user registrations
        recent_users = User.objects.filter(
            date_joined__gte=timezone.now() - timedelta(days=7)
        ).order_by('-date_joined')[:limit//3]
        
        # Get recent recipe creations
        recent_recipes = Recipe.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).order_by('-created_at')[:limit//3]
        
        # Get recent ratings
        recent_ratings = Rating.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).order_by('-created_at')[:limit//3]
        
        activities = []
        
        # Add user registrations
        for user in recent_users:
            activities.append({
                'id': str(uuid.uuid4()),
                'type': 'user_registered',
                'icon': 'person_add',
                'message': f'New user registered: {user.email}',
                'timestamp': user.date_joined.isoformat(),
                'time_ago': self._get_time_ago(user.date_joined),
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email
                }
            })
        
        # Add recipe creations
        for recipe in recent_recipes:
            activities.append({
                'id': str(uuid.uuid4()),
                'type': 'recipe_created',
                'icon': 'restaurant',
                'message': f'Recipe "{recipe.title}" created by {recipe.author.username}',
                'timestamp': recipe.created_at.isoformat(),
                'time_ago': self._get_time_ago(recipe.created_at),
                'user': {
                    'id': str(recipe.author.id),
                    'username': recipe.author.username,
                    'email': recipe.author.email
                },
                'recipe': {
                    'id': str(recipe.id),
                    'title': recipe.title
                }
            })
        
        # Add ratings
        for rating in recent_ratings:
            activities.append({
                'id': str(uuid.uuid4()),
                'type': 'rating_submitted',
                'icon': 'star',
                'message': f'Rating submitted for "{rating.recipe.title}" by {rating.user.username}',
                'timestamp': rating.created_at.isoformat(),
                'time_ago': self._get_time_ago(rating.created_at),
                'user': {
                    'id': str(rating.user.id),
                    'username': rating.user.username,
                    'email': rating.user.email
                },
                'recipe': {
                    'id': str(rating.recipe.id),
                    'title': rating.recipe.title
                },
                'rating': {
                    'id': str(rating.id),
                    'rating': rating.rating,
                    'review': rating.review
                }
            })
        
        # Sort by timestamp (most recent first) and limit
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        activities = activities[:limit]
        
        return Response(activities)
    
    def _get_time_ago(self, timestamp):
        """Calculate time ago string."""
        now = timezone.now()
        diff = now - timestamp
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days != 1 else ''} ago"
        elif diff.seconds >= 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif diff.seconds >= 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        else:
            return "Just now"
