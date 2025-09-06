"""
Django admin configuration for Users app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile, UserSession


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Admin configuration for User model.
    """
    list_display = [
        'email', 'username', 'get_full_name', 'role',
        'is_active', 'date_joined'
    ]
    list_filter = [
        'role', 'is_active', 'is_staff', 'date_joined'
    ]
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Fields', {
            'fields': (
                'phone_number', 'role', 'profile_picture', 'bio',
                'date_of_birth', 'timezone'
            )
        }),
        ('Preferences', {
            'fields': (
                'email_notifications', 'push_notifications'
            )
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Custom Fields', {
            'fields': (
                'email', 'first_name', 'last_name', 'phone_number', 'role'
            )
        }),
    )
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    get_full_name.short_description = 'Full Name'


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """
    Admin configuration for UserProfile model.
    """
    list_display = ['user', 'department', 'position', 'created_at']
    list_filter = ['department', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'department', 'position']
    raw_id_fields = ['user']


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    """
    Admin configuration for UserSession model.
    """
    list_display = [
        'user', 'ip_address', 'device_type', 'is_active',
        'last_activity', 'created_at'
    ]
    list_filter = ['is_active', 'device_type', 'created_at']
    search_fields = ['user__email', 'ip_address', 'user_agent']
    raw_id_fields = ['user']
    readonly_fields = ['session_key', 'created_at', 'updated_at']
