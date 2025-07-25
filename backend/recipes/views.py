"""
Views for recipe management.
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError

from .services.recipe_service import RecipeService
from .serializers import RecipeSerializer, RecipeListSerializer


class RecipeViewSet(viewsets.ViewSet):
    """ViewSet for recipe management."""

    def get_permissions(self):
        """Return appropriate permissions for each action."""
        if self.action in ['list', 'retrieve', 'search', 'by_tags', 'by_difficulty', 'by_cooking_method']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        """Return appropriate serializer class."""
        if self.action == 'list':
            return RecipeListSerializer
        return RecipeSerializer

    def list(self, request):
        """List recipes."""
        service = RecipeService()
        filters = {}

        # Apply filters
        if 'difficulty' in request.query_params:
            filters['difficulty'] = request.query_params['difficulty']
        if 'cooking_method' in request.query_params:
            filters['cooking_method'] = request.query_params['cooking_method']
        if 'tags' in request.query_params:
            filters['tags'] = request.query_params['tags'].split(',')

        # Handle published/unpublished recipes
        if request.user.is_authenticated:
            if request.query_params.get('my_recipes') == 'true':
                filters['author_id'] = str(request.user.id)
            else:
                filters['is_published'] = True
                filters['user_id'] = str(request.user.id)  # Pass user_id for author check
        else:
            filters['is_published'] = True

        recipes = service.get_recipes(filters)
        serializer = self.get_serializer_class()(recipes, many=True)
        return Response(serializer.data)

    def create(self, request):
        """Create a recipe."""
        serializer = RecipeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            service = RecipeService()
            recipe = service.create_recipe(serializer.validated_data, str(request.user.id))
            return Response(RecipeSerializer(recipe).data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        """Retrieve a recipe."""
        service = RecipeService()
        recipe = service.get_recipe(pk, str(request.user.id) if request.user.is_authenticated else None)

        if not recipe:
            return Response({'detail': _('Recipe not found.')}, status=status.HTTP_404_NOT_FOUND)

        serializer = RecipeSerializer(recipe)
        return Response(serializer.data)

    def update(self, request, pk=None):
        """Update a recipe."""
        serializer = RecipeSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            service = RecipeService()
            recipe = service.update_recipe(pk, serializer.validated_data, str(request.user.id))
            if not recipe:
                return Response({'detail': _('Recipe not found.')}, status=status.HTTP_404_NOT_FOUND)
            return Response(RecipeSerializer(recipe).data)
        except ValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_403_FORBIDDEN)

    def partial_update(self, request, pk=None):
        """Partially update a recipe."""
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        """Delete a recipe."""
        try:
            service = RecipeService()
            if service.delete_recipe(pk, str(request.user.id)):
                return Response(status=status.HTTP_204_NO_CONTENT)
            return Response({'detail': _('Recipe not found.')}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search recipes."""
        query = request.query_params.get('q', '')
        if not query:
            return Response({'detail': _('Search query is required.')}, status=status.HTTP_400_BAD_REQUEST)

        service = RecipeService()
        recipes = service.search_recipes(query, request.user.is_authenticated)
        serializer = self.get_serializer_class()(recipes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_tags(self, request):
        """Get recipes by tags."""
        tags = request.query_params.get('tags', '').split(',')
        if not tags or not tags[0]:
            return Response({'detail': _('Tags are required.')}, status=status.HTTP_400_BAD_REQUEST)

        service = RecipeService()
        recipes = service.get_recipes_by_tags(tags, request.user.is_authenticated)
        serializer = self.get_serializer_class()(recipes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_difficulty(self, request):
        """Get recipes by difficulty level."""
        difficulty = request.query_params.get('difficulty')
        if not difficulty:
            return Response({'detail': _('Difficulty level is required.')}, status=status.HTTP_400_BAD_REQUEST)

        service = RecipeService()
        recipes = service.get_recipes_by_difficulty(difficulty, request.user.is_authenticated)
        serializer = self.get_serializer_class()(recipes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_cooking_method(self, request):
        """Get recipes by cooking method."""
        method = request.query_params.get('method')
        if not method:
            return Response({'detail': _('Cooking method is required.')}, status=status.HTTP_400_BAD_REQUEST)

        service = RecipeService()
        recipes = service.get_recipes_by_cooking_method(method, request.user.is_authenticated)
        serializer = self.get_serializer_class()(recipes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a recipe."""
        try:
            service = RecipeService()
            recipe = service.publish_recipe(pk, str(request.user.id))
            if not recipe:
                return Response({'detail': _('Recipe not found.')}, status=status.HTTP_404_NOT_FOUND)
            return Response(RecipeSerializer(recipe).data)
        except ValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Unpublish a recipe."""
        try:
            service = RecipeService()
            recipe = service.unpublish_recipe(pk, str(request.user.id))
            if not recipe:
                return Response({'detail': _('Recipe not found.')}, status=status.HTTP_404_NOT_FOUND)
            return Response(RecipeSerializer(recipe).data)
        except ValidationError as e:
            return Response({'detail': str(e)}, status=status.HTTP_403_FORBIDDEN)
