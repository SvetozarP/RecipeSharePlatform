"""
URL configuration for admin API.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.AdminUserViewSet, basename='admin-users')
router.register(r'recipes', views.AdminRecipeViewSet, basename='admin-recipes')
router.register(r'categories', views.AdminCategoryViewSet, basename='admin-categories')
router.register(r'ratings', views.AdminRatingViewSet, basename='admin-ratings')
router.register(r'statistics', views.AdminStatisticsView, basename='admin-statistics')
router.register(r'moderation-queue', views.AdminModerationQueueView, basename='admin-moderation-queue')
router.register(r'analytics', views.AdminAnalyticsView, basename='admin-analytics')
router.register(r'recent-activity', views.AdminRecentActivityView, basename='admin-recent-activity')
router.register(r'settings', views.AdminSettingsView, basename='admin-settings')
router.register(r'bulk-operations', views.AdminBulkOperationsView, basename='admin-bulk-operations')
router.register(r'audit-log', views.AdminAuditLogView, basename='admin-audit-log')

# Export URLs
export_patterns = [
    path('users/', views.AdminExportView.as_view({'get': 'list'}), {'data_type': 'users'}, name='export-users'),
    path('recipes/', views.AdminExportView.as_view({'get': 'list'}), {'data_type': 'recipes'}, name='export-recipes'),
    path('ratings/', views.AdminExportView.as_view({'get': 'list'}), {'data_type': 'ratings'}, name='export-ratings'),
    path('categories/', views.AdminExportView.as_view({'get': 'list'}), {'data_type': 'categories'}, name='export-categories'),
]

urlpatterns = [
    path('', include(router.urls)),
    path('export/', include(export_patterns)),
] 