"""
Views for the Notifications app.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from .models import Notification, NotificationPreference
from apps.common.pagination import StandardResultsSetPagination


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Notification management.
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['is_read', 'notification_type', 'priority']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Notification Preference management.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)


class MarkAllNotificationsReadView(APIView):
    """
    Mark all notifications as read for the current user.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        updated_count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True)
        
        return Response({
            'message': f'{updated_count} notifications marked as read'
        }, status=status.HTTP_200_OK)


class UnreadNotificationCountView(APIView):
    """
    Get the count of unread notifications for the current user.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        
        return Response({
            'unread_count': count
        }, status=status.HTTP_200_OK)
