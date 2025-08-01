"""
Recipe views for API endpoints.
"""
from rest_framework import viewsets, status, permissions, filters, renderers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils.text import slugify

from .models import Recipe, Category, Rating, UserFavorite, RecipeView
from .serializers import (
    RecipeSerializer, 
    RecipeListSerializer, 
    RecipeCreateSerializer,
    RecipeUpdateSerializer,
    CategorySerializer,
    CategoryListSerializer,
    CategoryTreeSerializer,
    RatingSerializer,
    RatingCreateSerializer,
    RatingUpdateSerializer,
    RatingListSerializer,
    RecipeRatingStatsSerializer,
    SearchResultSerializer,
    SearchSuggestionsSerializer,
    AdvancedSearchSerializer,
    SearchResultsSerializer,
    UserFavoriteSerializer,
    RecipeViewSerializer,
    FavoriteStatsSerializer,
    ViewStatsSerializer
)
from .services.recipe_service import recipe_service
from .services.search_service import search_service
from core.services.storage_service import storage_service


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing recipe categories.
    
    Provides CRUD operations for categories including hierarchy management.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['parent', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'order', 'created_at']
    ordering = ['parent__name', 'order', 'name']
    lookup_field = 'slug'

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return CategoryListSerializer
        elif self.action == 'tree':
            return CategoryTreeSerializer
        return CategorySerializer

    def get_queryset(self):
        """Get queryset for categories."""
        queryset = Category.objects.select_related('parent').prefetch_related(
            'children', 'recipes'
        )
        
        # Filter active categories for non-staff users
        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            queryset = queryset.filter(is_active=True)
        
        return queryset

    def perform_create(self, serializer):
        """Create category with auto-generated slug if not provided."""
        if not serializer.validated_data.get('slug'):
            name = serializer.validated_data['name']
            base_slug = slugify(name)
            slug = base_slug
            counter = 1
            
            # Ensure unique slug
            while Category.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            serializer.save(slug=slug)
        else:
            serializer.save()

    @action(detail=False, methods=['get'], renderer_classes=[renderers.JSONRenderer])
    def tree(self, request):
        """
        Get category tree structure.
        Returns root categories with their nested children.
        """
        root_categories = self.get_queryset().filter(parent=None).order_by('order', 'name')
        serializer = CategoryTreeSerializer(root_categories, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def recipes(self, request, slug=None):
        """
        Get recipes in this category and optionally its descendants.
        """
        category = self.get_object()
        include_descendants = request.query_params.get('include_descendants', 'false').lower() == 'true'
        
        if include_descendants:
            # Get recipes from this category and all descendants
            categories = [category] + category.get_descendants()
            recipes = Recipe.objects.filter(
                categories__in=categories,
                is_published=True
            ).distinct().select_related('author').prefetch_related('categories')
        else:
            # Get recipes only from this category
            recipes = category.recipes.filter(
                is_published=True
            ).select_related('author').prefetch_related('categories')
        
        # Apply pagination
        page = self.paginate_queryset(recipes)
        if page is not None:
            from .serializers import RecipeListSerializer
            serializer = RecipeListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        from .serializers import RecipeListSerializer
        serializer = RecipeListSerializer(recipes, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reorder(self, request, slug=None):
        """
        Reorder categories within the same parent.
        Expects: {"orders": [{"id": "uuid", "order": 1}, ...]}
        """
        data = request.data.get('orders', [])
        
        try:
            for item in data:
                category_id = item.get('id')
                new_order = item.get('order')
                
                if category_id and new_order is not None:
                    Category.objects.filter(id=category_id).update(order=new_order)
            
            return Response({'message': 'Categories reordered successfully'})
        except Exception as e:
            return Response(
                {'error': f'Failed to reorder categories: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class RecipeViewSet(viewsets.ViewSet):
    """
    ViewSet for managing recipes with file upload support.
    
    Provides CRUD operations for recipes including image upload and processing.
    Search endpoints allow anonymous access to enable recipe discovery without authentication.
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['difficulty', 'cooking_method', 'is_published', 'author', 'categories']
    search_fields = ['title', 'description', 'tags', 'categories__name']

    def get_queryset(self):
        """Get queryset for recipes."""
        queryset = Recipe.objects.select_related('author').prefetch_related('categories', 'ratings')
        
        # Filter by published status for non-owners
        # Safely get user, defaulting to anonymous if not available
        user = getattr(self.request, 'user', None)
        
        if not user or not user.is_authenticated:
            # Anonymous users can only see published recipes
            queryset = queryset.filter(is_published=True)
        elif not user.is_staff:
            # Authenticated non-staff users can see published recipes and their own
            queryset = queryset.filter(
                Q(is_published=True) | Q(author=user)
            )
        
        return queryset

    def list(self, request):
        """List recipes with filtering and pagination."""
        from django.db.models import Avg, Count, F
        
        queryset = self.get_queryset()
        
        # Add rating statistics annotations for consistent data
        from django.db.models.functions import Coalesce
        from django.db.models import Value
        queryset = queryset.annotate(
            _avg_rating_sort=Coalesce(Avg('ratings__rating'), Value(0.0)),
            _rating_count_sort=Count('ratings')
        )
        
        # Handle ordering - use simple field-based ordering only
        # Safely access query parameters (DRF uses query_params, Django uses GET)
        query_params = getattr(request, 'query_params', request.GET)
        ordering = query_params.get('ordering', '-created_at')
        
        # Validate ordering field - support both simple fields and semantic ordering
        valid_ordering_fields = ['created_at', 'updated_at', 'title', 'prep_time', 'cook_time']
        semantic_ordering = ['newest', 'oldest', 'title']
        
        # Handle semantic ordering
        if ordering == 'newest':
            queryset = queryset.order_by('-created_at')
        elif ordering == 'oldest':
            queryset = queryset.order_by('created_at')
        elif ordering == 'title':
            queryset = queryset.order_by('title')
        elif ordering == 'prep_time':
            queryset = queryset.order_by('prep_time')
        elif ordering == 'cook_time':
            queryset = queryset.order_by('cook_time')
        elif ordering == 'total_time':
            # Use annotation for total time with different name to avoid property conflict
            from django.db.models import F
            queryset = queryset.annotate(_total_time_sort=F('prep_time') + F('cook_time')).order_by('_total_time_sort')
        else:
            # Extract field name (remove - if present) for legacy support
            field_name = ordering.lstrip('-')
            
            # Check if it's a valid field
            if field_name in valid_ordering_fields:
                queryset = queryset.order_by(ordering)
            else:
                # Default to newest first for invalid fields
                queryset = queryset.order_by('-created_at')
        
        # Apply filters
        difficulty = query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        cooking_method = query_params.get('cooking_method')
        if cooking_method:
            queryset = queryset.filter(cooking_method=cooking_method)
        
        author_id = query_params.get('author')
        if author_id:
            queryset = queryset.filter(author__id=author_id)
        
        # Category filtering - support multiple categories and hierarchy
        categories = query_params.getlist('categories')
        if categories:
            # Check if categories are numeric IDs or slugs
            try:
                # Try to convert to integers - if all succeed, they're IDs
                category_ids = [int(cat) for cat in categories]
                queryset = queryset.filter(categories__id__in=category_ids).distinct()
            except (ValueError, TypeError):
                # If conversion fails, treat as slugs
                queryset = queryset.filter(categories__slug__in=categories).distinct()
        
        category_slugs = query_params.getlist('category_slugs')
        if category_slugs:
            queryset = queryset.filter(categories__slug__in=category_slugs).distinct()
        
        # Search functionality
        search = query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(tags__icontains=search) |
                Q(categories__name__icontains=search)
            ).distinct()
        
        # Pagination
        from django.core.paginator import Paginator
        page_size = min(int(query_params.get('page_size', 20)), 100)
        page_number = int(query_params.get('page', 1))
        
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page_number)
        
        serializer = RecipeListSerializer(page_obj, many=True, context={'request': request})
        
        return Response({
            'count': paginator.count,
            'num_pages': paginator.num_pages,
            'current_page': page_number,
            'page_size': page_size,
            'results': serializer.data
        })

    def retrieve(self, request, pk=None):
        """Retrieve a single recipe."""
        try:
            recipe = self.get_queryset().get(pk=pk)
            
            # Check permissions
            user = request.user
            if not recipe.is_published:
                if not user.is_authenticated:
                    # Anonymous users cannot see unpublished recipes
                    return Response(
                        {'error': 'Recipe not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                elif recipe.author != user and not user.is_staff:
                    # Authenticated users can only see their own unpublished recipes or if they're staff
                    return Response(
                        {'error': 'Recipe not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            serializer = RecipeSerializer(recipe)
            return Response(serializer.data)
        except Recipe.DoesNotExist:
            return Response(
                {'error': 'Recipe not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    def create(self, request):
        """Create a new recipe."""
        serializer = RecipeCreateSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            recipe = serializer.save()
            return Response(
                RecipeSerializer(recipe).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        """Update a recipe."""
        try:
            recipe = Recipe.objects.get(pk=pk)
            
            # Check permissions
            if recipe.author != request.user and not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = RecipeUpdateSerializer(
                recipe, 
                data=request.data, 
                context={'request': request}
            )
            
            if serializer.is_valid():
                recipe = serializer.save()
                return Response(RecipeSerializer(recipe).data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Recipe.DoesNotExist:
            return Response(
                {'error': 'Recipe not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    def partial_update(self, request, pk=None):
        """Partially update a recipe."""
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        """Delete a recipe."""
        try:
            recipe = Recipe.objects.get(pk=pk)
            
            # Check permissions
            if recipe.author != request.user and not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Delete associated images
            if recipe.images:
                storage_service.delete_recipe_images(recipe.images)
            
            recipe.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Recipe.DoesNotExist:
            return Response(
                {'error': 'Recipe not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser])
    def upload_image(self, request, pk=None):
        """Upload an image for a recipe."""
        try:
            recipe = Recipe.objects.get(pk=pk)
            
            # Check permissions
            if recipe.author != request.user and not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            image_file = request.FILES.get('image')
            if not image_file:
                return Response(
                    {'error': 'No image file provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                # Delete existing images first
                if recipe.images:
                    storage_service.delete_recipe_images(recipe.images)
                
                # Save new image with thumbnails
                image_urls = storage_service.save_image_with_thumbnails(
                    image_file, 
                    str(recipe.id)
                )
                recipe.images = image_urls
                recipe.save(update_fields=['images'])
                
                return Response({
                    'message': 'Image uploaded successfully',
                    'images': image_urls
                })
            except Exception as e:
                return Response(
                    {'error': f'Failed to process image: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Recipe.DoesNotExist:
            return Response(
                {'error': 'Recipe not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['delete'])
    def remove_image(self, request, pk=None):
        """Remove the image from a recipe."""
        try:
            recipe = Recipe.objects.get(pk=pk)
            
            # Check permissions
            if recipe.author != request.user and not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if recipe.images:
                storage_service.delete_recipe_images(recipe.images)
                recipe.images = {}
                recipe.save(update_fields=['images'])
            
            return Response({'message': 'Image removed successfully'})
        except Recipe.DoesNotExist:
            return Response(
                {'error': 'Recipe not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def supported_formats(self, request):
        """Get supported image formats and limits."""
        return Response({
            'supported_formats': ['JPEG', 'PNG', 'WebP'],
            'max_file_size': '5MB',
            'max_dimensions': '4000x4000',
            'thumbnail_sizes': {
                'small': '150x150',
                'medium': '300x300', 
                'large': '800x600'
            }
        })

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get recipes filtered by category with hierarchy support."""
        category_slug = request.query_params.get('category')
        include_descendants = request.query_params.get('include_descendants', 'false').lower() == 'true'
        
        if not category_slug:
            return Response(
                {'error': 'Category slug is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            category = Category.objects.get(slug=category_slug, is_active=True)
        except Category.DoesNotExist:
            return Response(
                {'error': 'Category not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if include_descendants:
            # Get recipes from this category and all descendants
            categories = [category] + category.get_descendants()
            recipes = Recipe.objects.filter(
                categories__in=categories,
                is_published=True
            ).distinct().select_related('author').prefetch_related('categories')
        else:
            # Get recipes only from this category
            recipes = category.recipes.filter(
                is_published=True
            ).select_related('author').prefetch_related('categories')
        
        # Apply additional filters
        difficulty = request.query_params.get('difficulty')
        if difficulty:
            recipes = recipes.filter(difficulty=difficulty)
        
        cooking_method = request.query_params.get('cooking_method')
        if cooking_method:
            recipes = recipes.filter(cooking_method=cooking_method)
        
        # Ordering
        ordering = request.query_params.get('ordering', '-created_at')
        recipes = recipes.order_by(ordering)
        
        # Pagination
        from django.core.paginator import Paginator
        page_size = min(int(request.query_params.get('page_size', 20)), 100)
        page_number = int(request.query_params.get('page', 1))
        
        paginator = Paginator(recipes, page_size)
        page_obj = paginator.get_page(page_number)
        
        serializer = RecipeListSerializer(page_obj, many=True, context={'request': request})
        
        return Response({
            'category': {
                'id': category.id,
                'name': category.name,
                'slug': category.slug,
                'full_path': category.full_path
            },
            'include_descendants': include_descendants,
            'count': paginator.count,
            'num_pages': paginator.num_pages,
            'current_page': page_number,
            'page_size': page_size,
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='search', permission_classes=[permissions.AllowAny])
    def search(self, request):
        """
        Basic text search endpoint for recipes.
        
        Query Parameters:
        - q: Search query string
        - page: Page number (default: 1)
        - page_size: Results per page (default: 20, max: 100)
        - order_by: Ordering method (default: relevance)
        """
        import time
        start_time = time.time()
        
        # Safely access query parameters (DRF uses query_params, Django uses GET)
        query_params = getattr(request, 'query_params', request.GET)
        
        query = query_params.get('q', '').strip()
        if not query:
            return Response({
                'error': 'Search query is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Basic search parameters
        order_by = query_params.get('order_by', 'relevance')
        page_number = int(query_params.get('page', 1))
        page_size = min(int(query_params.get('page_size', 20)), 100)
        
        # Perform search
        try:
            results = search_service.full_text_search(query, order_by=order_by)
            
            # Pagination
            from django.core.paginator import Paginator
            paginator = Paginator(results, page_size)
            page_obj = paginator.get_page(page_number)
            
            # Serialize results
            serializer = SearchResultSerializer(page_obj, many=True, context={'request': request})
            
            search_time = time.time() - start_time
            
            return Response({
                'count': paginator.count,
                'num_pages': paginator.num_pages,
                'current_page': page_number,
                'page_size': page_size,
                'search_time': round(search_time, 3),
                'results': serializer.data
            })
            
        except Exception as e:
            return Response({
                'error': f'Search failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='advanced-search', permission_classes=[permissions.AllowAny])
    def advanced_search(self, request):
        """
        Advanced search endpoint with multiple filter criteria.
        
        Request Body: AdvancedSearchSerializer data
        """
        import time
        start_time = time.time()
        
        # Safely access request data (DRF uses data, Django uses POST)
        request_data = getattr(request, 'data', request.POST)
        
        serializer = AdvancedSearchSerializer(data=request_data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Extract pagination parameters
        page_number = data.pop('page', 1)
        page_size = data.pop('page_size', 20)
        
        try:
            # Perform advanced search
            results = search_service.advanced_search(**data)
            
            # Pagination
            from django.core.paginator import Paginator
            paginator = Paginator(results, page_size)
            page_obj = paginator.get_page(page_number)
            
            # Serialize results
            serializer = SearchResultSerializer(page_obj, many=True, context={'request': request})
            
            search_time = time.time() - start_time
            
            return Response({
                'count': paginator.count,
                'num_pages': paginator.num_pages,
                'current_page': page_number,
                'page_size': page_size,
                'search_time': round(search_time, 3),
                'results': serializer.data
            })
            
        except Exception as e:
            return Response({
                'error': f'Advanced search failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='search-suggestions', permission_classes=[permissions.AllowAny])
    def search_suggestions(self, request):
        """
        Get search suggestions for autocomplete functionality.
        
        Query Parameters:
        - q: Partial search query (minimum 2 characters)
        - limit: Maximum suggestions per category (default: 10)
        """
        # Safely access query parameters (DRF uses query_params, Django uses GET)
        query_params = getattr(request, 'query_params', request.GET)
        
        query = query_params.get('q', '').strip()
        limit = min(int(query_params.get('limit', 10)), 50)
        
        if len(query) < 2:
            return Response({
                'error': 'Query must be at least 2 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            suggestions = search_service.get_search_suggestions(query, limit)
            serializer = SearchSuggestionsSerializer(suggestions)
            return Response(serializer.data)
            
        except Exception as e:
            return Response({
                'error': f'Failed to get suggestions: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='popular-searches', permission_classes=[permissions.AllowAny])
    def popular_searches(self, request):
        """
        Get popular search terms based on recipe content analysis.
        
        Query Parameters:
        - limit: Maximum number of popular searches (default: 10)
        """
        # Safely access query parameters (DRF uses query_params, Django uses GET)
        query_params = getattr(request, 'query_params', request.GET)
        
        limit = min(int(query_params.get('limit', 10)), 50)
        
        try:
            popular_searches = search_service.get_popular_searches(limit)
            return Response({
                'popular_searches': popular_searches
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to get popular searches: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RatingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing recipe ratings.
    
    Provides CRUD operations for ratings with proper permissions and filtering.
    """
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['recipe', 'rating', 'is_verified_purchase']
    search_fields = ['review']
    ordering_fields = ['rating', 'created_at', 'helpful_count']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return RatingCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return RatingUpdateSerializer
        elif self.action == 'list':
            return RatingListSerializer
        return RatingSerializer

    def get_queryset(self):
        """Filter queryset based on permissions and query parameters."""
        queryset = Rating.objects.select_related('user', 'recipe')
        
        # Filter by recipe if provided
        recipe_id = self.request.query_params.get('recipe_id')
        if recipe_id:
            queryset = queryset.filter(recipe_id=recipe_id)
        
        # Filter by user for own ratings
        if self.action in ['update', 'partial_update', 'destroy']:
            queryset = queryset.filter(user=self.request.user)
        
        return queryset

    def perform_create(self, serializer):
        """Create rating with current user."""
        serializer.save(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create a new rating and return full details."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        rating = serializer.save(user=request.user)
        
        # Return full rating details using the main serializer
        response_serializer = RatingSerializer(rating, context={'request': request})
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        """Ensure users can only update their own ratings."""
        if serializer.instance.user != self.request.user:
            raise permissions.PermissionDenied("You can only update your own ratings.")
        serializer.save()

    def perform_destroy(self, instance):
        """Ensure users can only delete their own ratings."""
        if instance.user != self.request.user:
            raise permissions.PermissionDenied("You can only delete your own ratings.")
        super().perform_destroy(instance)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_helpful(self, request, pk=None):
        """Mark a rating as helpful."""
        rating = self.get_object()
        
        # Prevent users from marking their own ratings as helpful
        if rating.user == request.user:
            return Response(
                {'error': 'You cannot mark your own rating as helpful.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Simple increment for now - could be extended with user tracking
        rating.helpful_count += 1
        rating.save()
        
        return Response({
            'message': 'Rating marked as helpful.',
            'helpful_count': rating.helpful_count
        })

    @action(detail=False, methods=['get'])
    def my_ratings(self, request):
        """Get current user's ratings."""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        queryset = self.get_queryset().filter(user=request.user)
        queryset = self.filter_queryset(queryset)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = RatingListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = RatingListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recipe_stats(self, request):
        """Get rating statistics for a specific recipe."""
        recipe_id = request.query_params.get('recipe_id')
        if not recipe_id:
            return Response(
                {'error': 'recipe_id parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            recipe = Recipe.objects.get(id=recipe_id)
        except Recipe.DoesNotExist:
            return Response(
                {'error': 'Recipe not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = RecipeRatingStatsSerializer(recipe)
        return Response(serializer.data)


class UserFavoriteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user favorites.
    
    Provides CRUD operations for user favorites with proper permissions.
    """
    serializer_class = UserFavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """Return favorites for the current user."""
        return UserFavorite.objects.filter(user=self.request.user).select_related('recipe', 'recipe__author')

    def perform_create(self, serializer):
        """Create favorite for current user."""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """Toggle favorite status for a recipe."""
        recipe_id = request.data.get('recipe_id')
        if not recipe_id:
            return Response(
                {'error': 'recipe_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            recipe = Recipe.objects.get(id=recipe_id)
        except Recipe.DoesNotExist:
            return Response(
                {'error': 'Recipe not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        favorite, created = UserFavorite.objects.get_or_create(
            user=request.user, 
            recipe=recipe
        )

        if not created:
            # Remove from favorites
            favorite.delete()
            return Response(
                {
                    'message': 'Recipe removed from favorites',
                    'is_favorite': False
                },
                status=status.HTTP_200_OK
            )
        else:
            # Added to favorites
            serializer = self.get_serializer(favorite)
            return Response(
                {
                    'message': 'Recipe added to favorites',
                    'is_favorite': True,
                    'favorite': serializer.data
                },
                status=status.HTTP_201_CREATED
            )

    @action(detail=False, methods=['get'])
    def check(self, request):
        """Check if a recipe is favorited by current user."""
        recipe_id = request.query_params.get('recipe_id')
        if not recipe_id:
            return Response(
                {'error': 'recipe_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        is_favorite = UserFavorite.objects.filter(
            user=request.user, 
            recipe_id=recipe_id
        ).exists()

        return Response({'is_favorite': is_favorite})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user's favorite statistics."""
        user_favorites = self.get_queryset()
        favorite_recipes = [f.recipe for f in user_favorites[:10]]  # Top 10

        stats_data = {
            'total_favorites': user_favorites.count(),
            'favorite_recipes': favorite_recipes
        }

        serializer = FavoriteStatsSerializer(stats_data, context={'request': request})
        return Response(serializer.data)


class RecipeViewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing recipe views.
    
    Provides tracking and retrieval of recipe view statistics.
    """
    serializer_class = RecipeViewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['recipe', 'user']
    ordering_fields = ['created_at', 'view_duration_seconds']
    ordering = ['-created_at']

    def get_queryset(self):
        """Return views based on user permissions."""
        if self.request.user.is_authenticated:
            # Authenticated users can see their own views
            if self.action in ['list', 'retrieve']:
                return RecipeView.objects.filter(user=self.request.user).select_related('recipe', 'user')
        
        # For stats and creation, return all views
        return RecipeView.objects.all().select_related('recipe', 'user')

    def create(self, request, *args, **kwargs):
        """Create a new recipe view record."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if this is a duplicate view within a short time window
        recipe_id = serializer.validated_data.get('recipe_id')
        user = request.user if request.user.is_authenticated else None
        ip_address = serializer.get_client_ip(request)
        
        # Don't create duplicate views within 5 minutes
        from django.utils import timezone
        from datetime import timedelta
        
        recent_view_exists = False
        time_threshold = timezone.now() - timedelta(minutes=5)
        
        if user:
            recent_view_exists = RecipeView.objects.filter(
                recipe_id=recipe_id,
                user=user,
                created_at__gte=time_threshold
            ).exists()
        else:
            recent_view_exists = RecipeView.objects.filter(
                recipe_id=recipe_id,
                ip_address=ip_address,
                created_at__gte=time_threshold
            ).exists()
        
        if recent_view_exists:
            return Response(
                {'message': 'View already recorded recently'},
                status=status.HTTP_200_OK
            )

        view = serializer.save()
        return Response(
            {
                'message': 'View recorded successfully',
                'view': RecipeViewSerializer(view, context={'request': request}).data
            },
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['get'])
    def my_views(self, request):
        """Get current user's recipe views."""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recipe_stats(self, request):
        """Get view statistics for a specific recipe."""
        recipe_id = request.query_params.get('recipe_id')
        if not recipe_id:
            return Response(
                {'error': 'recipe_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            recipe = Recipe.objects.get(id=recipe_id)
        except Recipe.DoesNotExist:
            return Response(
                {'error': 'Recipe not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        views = RecipeView.objects.filter(recipe=recipe)
        total_views = views.count()
        unique_views = views.values('user', 'ip_address').distinct().count()
        
        # Calculate average view duration (excluding None values)
        view_durations = views.exclude(view_duration_seconds__isnull=True)
        avg_duration = None
        if view_durations.exists():
            from django.db.models import Avg
            avg_duration = view_durations.aggregate(Avg('view_duration_seconds'))['view_duration_seconds__avg']

        stats_data = {
            'recipe': recipe,
            'total_views': total_views,
            'unique_views': unique_views,
            'average_view_duration': avg_duration
        }

        return Response(stats_data)

    @action(detail=False, methods=['get'])
    def user_stats(self, request):
        """Get user's view statistics."""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        user_views = RecipeView.objects.filter(user=request.user)
        total_views = user_views.count()
        unique_recipes = user_views.values('recipe').distinct().count()
        
        # Get most viewed recipes by this user
        from django.db.models import Count
        most_viewed = (
            user_views.values('recipe')
            .annotate(view_count=Count('id'))
            .order_by('-view_count')[:5]
        )
        
        most_viewed_recipes = []
        for item in most_viewed:
            try:
                recipe = Recipe.objects.get(id=item['recipe'])
                most_viewed_recipes.append(recipe)
            except Recipe.DoesNotExist:
                continue

        # Calculate average view duration
        view_durations = user_views.exclude(view_duration_seconds__isnull=True)
        avg_duration = None
        if view_durations.exists():
            from django.db.models import Avg
            avg_duration = view_durations.aggregate(Avg('view_duration_seconds'))['view_duration_seconds__avg']

        stats_data = {
            'total_views': total_views,
            'unique_views': unique_recipes,
            'average_view_duration': avg_duration,
            'most_viewed_recipes': most_viewed_recipes
        }

        serializer = ViewStatsSerializer(stats_data, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def author_stats(self, request):
        """Get view statistics for recipes created by the current user."""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Get all recipes created by the current user
        user_recipes = Recipe.objects.filter(author=request.user)
        
        # Get total views for all user's recipes
        from django.db.models import Sum, Count
        recipe_views = RecipeView.objects.filter(recipe__author=request.user)
        total_views = recipe_views.count()
        
        # Get unique viewers (excluding the author's own views)
        unique_viewers = recipe_views.exclude(user=request.user).values('user', 'ip_address').distinct().count()
        
        # Get most viewed recipe by the user
        most_viewed_recipe = None
        if user_recipes.exists():
            most_viewed = (
                recipe_views.values('recipe')
                .annotate(view_count=Count('id'))
                .order_by('-view_count')
                .first()
            )
            if most_viewed:
                try:
                    most_viewed_recipe = Recipe.objects.get(id=most_viewed['recipe'])
                except Recipe.DoesNotExist:
                    pass

        # Calculate average view duration (excluding None values)
        view_durations = recipe_views.exclude(view_duration_seconds__isnull=True)
        avg_duration = None
        if view_durations.exists():
            from django.db.models import Avg
            avg_duration = view_durations.aggregate(Avg('view_duration_seconds'))['view_duration_seconds__avg']

        stats_data = {
            'total_views': total_views,
            'unique_viewers': unique_viewers,
            'average_view_duration': avg_duration,
            'most_viewed_recipe': most_viewed_recipe,
            'total_recipes': user_recipes.count()
        }

        # Serialize the most viewed recipe if it exists
        if most_viewed_recipe:
            from .serializers import RecipeSerializer
            stats_data['most_viewed_recipe'] = RecipeSerializer(most_viewed_recipe).data

        return Response(stats_data)
