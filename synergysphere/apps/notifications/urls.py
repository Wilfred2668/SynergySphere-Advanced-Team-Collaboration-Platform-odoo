"""
URL configuration for the Notifications app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'notifications'

router = DefaultRouter()
router.register('', views.NotificationViewSet, basename='notification')
router.register('preferences', views.NotificationPreferenceViewSet, basename='notification-preference')

urlpatterns = [
    path('', include(router.urls)),
    path('mark_all_read/', views.MarkAllNotificationsReadView.as_view(), name='mark_all_read'),
    path('unread_count/', views.UnreadNotificationCountView.as_view(), name='unread_count'),
]
