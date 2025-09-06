"""
Views for the Tasks app.
"""
from django.db import models
from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Task, TaskComment, TaskAttachment, TaskTimeLog, TaskTemplate
from apps.common.permissions import IsProjectMember
from apps.common.pagination import StandardResultsSetPagination


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task CRUD operations.
    """
    permission_classes = [permissions.IsAuthenticated, IsProjectMember]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'assignee', 'project']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'priority']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Task.objects.filter(
            project__members__user=self.request.user,
            is_deleted=False
        ).distinct()


class TaskCommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task Comment management.
    """
    permission_classes = [permissions.IsAuthenticated, IsProjectMember]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return TaskComment.objects.filter(
            task__project__members__user=self.request.user
        )


class TaskAttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task Attachment management.
    """
    permission_classes = [permissions.IsAuthenticated, IsProjectMember]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return TaskAttachment.objects.filter(
            task__project__members__user=self.request.user
        )


class TaskTimeLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task Time Log management.
    """
    permission_classes = [permissions.IsAuthenticated, IsProjectMember]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return TaskTimeLog.objects.filter(
            task__project__members__user=self.request.user
        )


class TaskTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task Template management.
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return TaskTemplate.objects.filter(
            models.Q(created_by=self.request.user) | 
            models.Q(is_public=True)
        )
