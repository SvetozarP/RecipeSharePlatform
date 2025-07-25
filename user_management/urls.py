from django.urls import path
from .views import (
    ProfileView,
    PreferencesView,
    ProfileVisibilityView,
    PublicProfileView
)

app_name = 'user_management'

urlpatterns = [
    # Profile management
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/preferences/', PreferencesView.as_view(), name='preferences'),
    path('profile/visibility/', ProfileVisibilityView.as_view(), name='profile-visibility'),
    path('profile/<int:user_id>/', PublicProfileView.as_view(), name='public-profile'),
] 