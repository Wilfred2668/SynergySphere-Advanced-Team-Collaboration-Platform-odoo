"""
URL configuration for the Tasks app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'tasks'

router = DefaultRouter()
router.register('', views.TaskViewSet, basename='task')
router.register('comments', views.TaskCommentViewSet, basename='task-comment')
router.register('attachments', views.TaskAttachmentViewSet, basename='task-attachment')
router.register('time-logs', views.TaskTimeLogViewSet, basename='task-time-log')
router.register('templates', views.TaskTemplateViewSet, basename='task-template')

urlpatterns = [
    path('', include(router.urls)),
]
