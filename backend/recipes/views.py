"""
Recipe views for API endpoints.
"""
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Recipe
from .serializers import (
    RecipeSerializer, 
    RecipeListSerializer, 
    RecipeCreateSerializer,
    RecipeUpdateSerializer
)
from .services.recipe_service import recipe_service
from core.services.storage_service import storage_service


class RecipeViewSet(viewsets.ViewSet):
    """
    ViewSet for managing recipes with file upload support.
    
    Provides CRUD operations for recipes including image upload and processing.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['difficulty', 'cooking_method', 'is_published', 'author']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at', 'updated_at', 'title', 'prep_time', 'cook_time']
    ordering = ['-created_at']

    def get_queryset(self):
        """Get queryset for recipes."""
        queryset = Recipe.objects.select_related('author').all()
        
        # Filter by published status for non-owners
        user = self.request.user
        if not user.is_staff:
            queryset = queryset.filter(
                Q(is_published=True) | Q(author=user)
            )
        
        return queryset

    def get_permissions(self):
        """Get permissions based on action."""
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticatedOrReadOnly]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def list(self, request):
        """List recipes with pagination and filtering."""
        try:
            queryset = self.get_queryset()
            
            # Apply filters
            for backend in list(self.filter_backends):
                queryset = backend().filter_queryset(request, queryset, self)
            
            # Get paginated results
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = RecipeListSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = RecipeListSerializer(queryset, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': 'Failed to list recipes', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request):
        """Create a new recipe with optional image upload."""
        try:
            serializer = RecipeCreateSerializer(
                data=request.data, 
                context={'request': request}
            )
            
            if serializer.is_valid():
                recipe = serializer.save()
                response_serializer = RecipeSerializer(recipe)
                return Response(
                    response_serializer.data, 
                    status=status.HTTP_201_CREATED
                )
            
            return Response(
                serializer.errors, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Exception as e:
            return Response(
                {'error': 'Failed to create recipe', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, pk=None):
        """Retrieve a single recipe."""
        try:
            recipe = recipe_service.get_recipe_by_id(pk)
            
            # Check permissions
            if not recipe.is_published and recipe.author != request.user and not request.user.is_staff:
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
        except Exception as e:
            return Response(
                {'error': 'Failed to retrieve recipe', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, pk=None):
        """Update a recipe with optional image upload."""
        try:
            recipe = recipe_service.get_recipe_by_id(pk)
            
            # Check permissions
            if recipe.author != request.user and not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = RecipeUpdateSerializer(
                recipe, 
                data=request.data,
                partial=True,
                context={'request': request}
            )
            
            if serializer.is_valid():
                updated_recipe = serializer.save()
                response_serializer = RecipeSerializer(updated_recipe)
                return Response(response_serializer.data)
            
            return Response(
                serializer.errors, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Recipe.DoesNotExist:
            return Response(
                {'error': 'Recipe not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to update recipe', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def partial_update(self, request, pk=None):
        """Partially update a recipe."""
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        """Delete a recipe and its associated images."""
        try:
            recipe = recipe_service.get_recipe_by_id(pk)
            
            # Check permissions
            if recipe.author != request.user and not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Delete associated images
            if recipe.images:
                storage_service.delete_recipe_images(recipe.images)
            
            recipe_service.delete_recipe(pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Recipe.DoesNotExist:
            return Response(
                {'error': 'Recipe not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to delete recipe', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request, pk=None):
        """Upload or update recipe image."""
        try:
            recipe = recipe_service.get_recipe_by_id(pk)
            
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
            
            # Validate and process image
            try:
                storage_service.validate_image_file(image_file)
                
                # Delete existing images
                if recipe.images:
                    storage_service.delete_recipe_images(recipe.images)
                
                # Save new image with thumbnails
                image_urls = storage_service.save_image_with_thumbnails(
                    image_file, 
                    str(recipe.id)
                )
                
                recipe.images = image_urls
                recipe.save(update_fields=['images'])
                
                serializer = RecipeSerializer(recipe)
                return Response(serializer.data)
                
            except Exception as e:
                return Response(
                    {'error': 'Failed to process image', 'detail': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except Recipe.DoesNotExist:
            return Response(
                {'error': 'Recipe not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to upload image', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['delete'])
    def remove_image(self, request, pk=None):
        """Remove recipe image."""
        try:
            recipe = recipe_service.get_recipe_by_id(pk)
            
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
            
            serializer = RecipeSerializer(recipe)
            return Response(serializer.data)
            
        except Recipe.DoesNotExist:
            return Response(
                {'error': 'Recipe not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to remove image', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def supported_formats(self, request):
        """Get supported image formats."""
        try:
            formats = storage_service.get_supported_formats()
            return Response({'supported_formats': formats})
        except Exception as e:
            return Response(
                {'error': 'Failed to get supported formats', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def my_recipes(self, request):
        """Get current user's recipes."""
        try:
            queryset = Recipe.objects.filter(author=request.user).order_by('-created_at')
            
            # Apply search and ordering
            for backend in [filters.SearchFilter, filters.OrderingFilter]:
                queryset = backend().filter_queryset(request, queryset, self)
            
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = RecipeListSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = RecipeListSerializer(queryset, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': 'Failed to get user recipes', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # Pagination methods
    def paginate_queryset(self, queryset):
        """Paginate the queryset if pagination is configured."""
        paginator = self.pagination_class()
        if paginator is None:
            return None
        return paginator.paginate_queryset(queryset, self.request, view=self)

    def get_paginated_response(self, data):
        """Return paginated response."""
        return self.pagination_class().get_paginated_response(data)

    @property
    def pagination_class(self):
        """Get pagination class from settings."""
        from django.conf import settings
        from rest_framework.pagination import PageNumberPagination
        
        class RecipePagination(PageNumberPagination):
            page_size = getattr(settings, 'REST_FRAMEWORK', {}).get('PAGE_SIZE', 10)
            page_size_query_param = 'page_size'
            max_page_size = 100
            
        return RecipePagination
