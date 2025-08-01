from django.contrib import admin
from .models import User


# Making user profile visible in admin panel
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'is_email_verified', 'is_active', 'is_staff', 'is_superuser')
    list_filter = ('is_email_verified', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('email', 'username')
    ordering = ('email',)
    
    