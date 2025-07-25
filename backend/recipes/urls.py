"""
URL configuration for recipes app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import RecipeViewSet, CategoryViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'', RecipeViewSet, basename='recipe')

urlpatterns = [
    path('', include(router.urls)),
] 