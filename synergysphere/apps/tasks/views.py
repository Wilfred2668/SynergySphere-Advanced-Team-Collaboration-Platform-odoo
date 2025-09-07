"""
Views for the Tasks app.
"""
import logging
from django.db import models
from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

logger = logging.getLogger(__name__)

from .models import Task, TaskComment, TaskAttachment, TaskTimeLog, TaskTemplate
from .serializers import (
    TaskSerializer, TaskCommentSerializer, TaskAttachmentSerializer, 
    TaskTimeLogSerializer, TaskTemplateSerializer
)
from apps.common.permissions import IsProjectMember, TaskPermission
from apps.common.pagination import StandardResultsSetPagination


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task CRUD operations.
    """
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, TaskPermission]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'assignee', 'project']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'priority']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Admins can see all tasks, regular users only see tasks from projects they're members of
        if self.request.user.is_admin_user:
            return Task.objects.filter(is_deleted=False)
        else:
            return Task.objects.filter(
                project__members__user=self.request.user,
                is_deleted=False
            ).distinct()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        """Override to add logging and custom update logic."""
        logger.info(f"TaskViewSet perform_update called")
        logger.info(f"Request data: {self.request.data}")
        logger.info(f"User: {self.request.user}")
        
        try:
            serializer.save(updated_by=self.request.user)
            logger.info(f"Task updated successfully")
        except Exception as e:
            logger.error(f"Error updating task: {str(e)}")
            raise


class TaskCommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task Comment management.
    """
    serializer_class = TaskCommentSerializer
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
    serializer_class = TaskAttachmentSerializer
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
    serializer_class = TaskTimeLogSerializer
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
    serializer_class = TaskTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return TaskTemplate.objects.filter(
            models.Q(created_by=self.request.user) | 
            models.Q(is_public=True)
        )
