"""
Serializers for the Notifications app.
"""
from rest_framework import serializers
from .models import Notification, NotificationPreference
from apps.users.serializers import UserSerializer


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model."""
    recipient = UserSerializer(read_only=True)
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'sender', 'title', 'message', 'notification_type',
            'priority', 'project', 'task', 'discussion', 'is_read',
            'read_at', 'created_at', 'metadata', 'action_url'
        ]
        read_only_fields = ['id', 'created_at', 'recipient', 'sender']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for NotificationPreference model."""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'user', 'notification_type', 'email_enabled',
            'push_enabled', 'in_app_enabled', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']
