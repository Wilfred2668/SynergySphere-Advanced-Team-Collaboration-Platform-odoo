"""
Views for the Projects app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Project, ProjectMember, ProjectInvitation, ProjectFile, ProjectActivity
from apps.common.permissions import IsProjectMember, IsProjectManagerOrOwner
from apps.common.pagination import StandardResultsSetPagination


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project CRUD operations.
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'created_by']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name', 'start_date', 'end_date']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Return projects where user is a member
        return Project.objects.filter(
            members__user=self.request.user,
            is_deleted=False
        ).distinct()
    
    def perform_create(self, serializer):
        project = serializer.save(created_by=self.request.user)
        # Add creator as admin member
        ProjectMember.objects.create(
            project=project,
            user=self.request.user,
            role='admin'
        )


class ProjectMemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project Member management.
    """
    permission_classes = [permissions.IsAuthenticated, IsProjectMember]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return ProjectMember.objects.filter(
            project__members__user=self.request.user,
            is_active=True
        )


class ProjectInvitationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project Invitation management.
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return ProjectInvitation.objects.filter(
            project__members__user=self.request.user
        )


class ProjectFileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project File management.
    """
    permission_classes = [permissions.IsAuthenticated, IsProjectMember]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return ProjectFile.objects.filter(
            project__members__user=self.request.user
        )


class ProjectActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Project Activity (read-only).
    """
    permission_classes = [permissions.IsAuthenticated, IsProjectMember]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return ProjectActivity.objects.filter(
            project__members__user=self.request.user
        )
