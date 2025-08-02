"""
Views for admin API endpoints.
"""

from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from django.http import HttpResponse
import csv
import json
import uuid

from recipes.models import Recipe, Category, Rating
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
        
        # Placeholder analytics data
        analytics_data = {
            'user_growth': {
                'labels': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                'datasets': [{
                    'label': 'Users',
                    'data': [10, 25, 45, 60, 80, 100],
                    'borderColor': '#1976d2',
                    'backgroundColor': 'rgba(25, 118, 210, 0.1)'
                }]
            },
            'recipe_activity': {
                'labels': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                'datasets': [{
                    'label': 'Recipes',
                    'data': [5, 15, 30, 45, 60, 75],
                    'borderColor': '#388e3c',
                    'backgroundColor': 'rgba(56, 142, 60, 0.1)'
                }]
            },
            'rating_distribution': {
                'labels': ['1★', '2★', '3★', '4★', '5★'],
                'datasets': [{
                    'data': [5, 10, 25, 40, 20],
                    'backgroundColor': ['#f44336', '#ff9800', '#ffc107', '#4caf50', '#2196f3']
                }]
            },
            'top_recipes': [
                {
                    'id': '1',
                    'title': 'Spaghetti Carbonara',
                    'views': 1500,
                    'favorites': 120,
                    'average_rating': 4.5
                },
                {
                    'id': '2',
                    'title': 'Chicken Curry',
                    'views': 1200,
                    'favorites': 95,
                    'average_rating': 4.3
                }
            ]
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
    
    def update(self, request):
        """Update system settings."""
        serializer = SystemSettingsSerializer(data=request.data)
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
    
    def list(self, request, data_type=None):
        """Export data."""
        format_type = request.query_params.get('format', 'csv')
        
        if data_type == 'users':
            queryset = User.objects.all()
            fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'date_joined']
        elif data_type == 'recipes':
            queryset = Recipe.objects.all()
            fields = ['id', 'title', 'slug', 'author__username', 'is_published', 'created_at']
        elif data_type == 'ratings':
            queryset = Rating.objects.all()
            fields = ['id', 'rating', 'review', 'user__username', 'recipe__title', 'created_at']
        elif data_type == 'categories':
            queryset = Category.objects.all()
            fields = ['id', 'name', 'slug', 'description', 'is_active', 'created_at']
        else:
            return Response({'error': 'Invalid data type'}, status=status.HTTP_400_BAD_REQUEST)
        
        if format_type == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{data_type}_{timezone.now().date()}.csv"'
            
            writer = csv.writer(response)
            writer.writerow(fields)
            
            for obj in queryset:
                row = []
                for field in fields:
                    if '__' in field:
                        # Handle related fields
                        parts = field.split('__')
                        value = obj
                        for part in parts:
                            value = getattr(value, part, '')
                        row.append(str(value))
                    else:
                        row.append(str(getattr(obj, field, '')))
                writer.writerow(row)
            
            return response
        else:
            # JSON export
            data = []
            for obj in queryset:
                item = {}
                for field in fields:
                    if '__' in field:
                        parts = field.split('__')
                        value = obj
                        for part in parts:
                            value = getattr(value, part, '')
                        item[field] = str(value)
                    else:
                        item[field] = str(getattr(obj, field, ''))
                data.append(item)
            
            response = HttpResponse(json.dumps(data, indent=2), content_type='application/json')
            response['Content-Disposition'] = f'attachment; filename="{data_type}_{timezone.now().date()}.json"'
            return response


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
