"""
Views for the Projects app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Project, ProjectMember, ProjectInvitation, ProjectFile, ProjectActivity
from .serializers import (
    ProjectSerializer, ProjectMemberSerializer, ProjectInvitationSerializer,
    ProjectFileSerializer, ProjectActivitySerializer
)
from apps.common.permissions import IsProjectMember, IsProjectManagerOrOwner
from apps.common.pagination import StandardResultsSetPagination


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project CRUD operations.
    """
    serializer_class = ProjectSerializer
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

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_member(self, request, pk=None):
        """Add a member to the project."""
        from apps.users.models import User
        from django.shortcuts import get_object_or_404
        
        project = self.get_object()
        email = request.data.get('email')
        role = request.data.get('role', 'member')
        
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User with this email does not exist'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user is already a member
        if ProjectMember.objects.filter(project=project, user=user, is_active=True).exists():
            return Response({'error': 'User is already a member of this project'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create or reactivate membership
        member, created = ProjectMember.objects.get_or_create(
            project=project,
            user=user,
            defaults={'role': role, 'is_active': True}
        )
        
        if not created:
            member.is_active = True
            member.role = role
            member.save()
        
        return Response({'message': 'Member added successfully'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='members/(?P<member_id>[^/.]+)', permission_classes=[permissions.IsAuthenticated])
    def remove_member(self, request, pk=None, member_id=None):
        """Remove a member from the project."""
        project = self.get_object()
        
        try:
            member = ProjectMember.objects.get(
                project=project, 
                user_id=member_id, 
                is_active=True
            )
        except ProjectMember.DoesNotExist:
            return Response({'error': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Don't allow removing the project owner
        if member.user == project.created_by:
            return Response({'error': 'Cannot remove project owner'}, status=status.HTTP_400_BAD_REQUEST)
        
        member.is_active = False
        member.save()
        
        return Response({'message': 'Member removed successfully'}, status=status.HTTP_200_OK)


class ProjectMemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project Member management.
    """
    serializer_class = ProjectMemberSerializer
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
    serializer_class = ProjectInvitationSerializer
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
    serializer_class = ProjectFileSerializer
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
    serializer_class = ProjectActivitySerializer
    permission_classes = [permissions.IsAuthenticated, IsProjectMember]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return ProjectActivity.objects.filter(
            project__members__user=self.request.user
        )
