"""
URL configuration for recipes app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import RecipeViewSet, CategoryViewSet, RatingViewSet, UserFavoriteViewSet, RecipeViewViewSet

app_name = 'recipes'

# Create router and register viewsets
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'ratings', RatingViewSet, basename='rating')
router.register(r'favorites', UserFavoriteViewSet, basename='favorite')
router.register(r'views', RecipeViewViewSet, basename='view')
router.register(r'', RecipeViewSet, basename='recipe')

urlpatterns = [
    path('', include(router.urls)),
] 