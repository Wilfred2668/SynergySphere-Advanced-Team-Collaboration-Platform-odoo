"""
Django admin configuration for Notifications app.
"""
from django.contrib import admin
from .models import Notification, NotificationPreference, NotificationTemplate


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'title', 'notification_type', 'priority', 'is_read', 'created_at']
    list_filter = ['notification_type', 'priority', 'is_read', 'created_at']
    search_fields = ['recipient__email', 'title', 'message']
    readonly_fields = ['created_at', 'read_at']


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'digest_frequency', 'created_at']
    list_filter = ['digest_frequency', 'created_at']
    search_fields = ['user__email']


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'notification_type', 'is_active', 'created_at']
    list_filter = ['notification_type', 'is_active', 'created_at']
    search_fields = ['name', 'title_template']
