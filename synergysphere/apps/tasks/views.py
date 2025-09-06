"""
Views for the Tasks app.
"""
import logging
from django.db import models
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

logger = logging.getLogger(__name__)

from .models import Task, TaskComment, TaskAttachment, TaskTimeLog, TaskTemplate
from .serializers import (
    TaskSerializer, TaskCommentSerializer, TaskAttachmentSerializer, 
    TaskTimeLogSerializer, TaskTemplateSerializer
)
from apps.common.permissions import IsProjectMember
from apps.common.admin_permissions import IsAdminOrTaskOwner, IsAdminUser
from apps.common.pagination import StandardResultsSetPagination


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task CRUD operations.
    """
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrTaskOwner]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'assignee', 'project']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'priority']
    ordering = ['-created_at']
    
    def get_queryset(self):
        if self.request.user.role == 'admin':
            # Admin can see all tasks
            return Task.objects.filter(is_deleted=False).distinct()
        else:
            # Regular users can see tasks they're assigned to or in projects they're members of
            return Task.objects.filter(
                models.Q(assignee=self.request.user) |
                models.Q(project__members__user=self.request.user),
                is_deleted=False
            ).distinct()
    
    def get_permissions(self):
        """
        Instantiate and return the list of permissions that this view requires.
        """
        if self.action == 'create':
            # Only admins can create tasks
            permission_classes = [permissions.IsAuthenticated, IsAdminUser]
        elif self.action in ['update', 'partial_update']:
            # Admins can update anything, users can only update status of their tasks
            permission_classes = [permissions.IsAuthenticated, IsAdminOrTaskOwner]
        elif self.action == 'destroy':
            # Only admins can delete tasks
            permission_classes = [permissions.IsAuthenticated, IsAdminUser]
        else:
            # Default permissions for list, retrieve, etc.
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        """Override to add logging and custom update logic."""
        logger.info(f"TaskViewSet perform_update called")
        logger.info(f"Request data: {self.request.data}")
        logger.info(f"User: {self.request.user}")
        logger.info(f"User role: {self.request.user.role}")
        
        try:
            serializer.save(updated_by=self.request.user)
            logger.info(f"Task updated successfully")
        except Exception as e:
            logger.error(f"Error updating task: {str(e)}")
            raise
    
    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def update_status(self, request, pk=None):
        """Allow users to update task status if they are assignee."""
        task = self.get_object()
        
        # Check if user can update this task status
        if request.user.role != 'admin' and task.assignee != request.user:
            return Response(
                {'error': 'You can only update status of tasks assigned to you'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_status = request.data.get('status')
        if not new_status:
            return Response(
                {'error': 'Status field is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.status = new_status
        task.save(update_fields=['status', 'updated_at'])
        
        serializer = self.get_serializer(task)
        return Response(serializer.data)


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
