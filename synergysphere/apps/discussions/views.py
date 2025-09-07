"""
Views for the Discussions app.
"""
from django.db import models
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Discussion, DiscussionReply, DiscussionAttachment, DiscussionVote
from .serializers import (
    DiscussionSerializer, DiscussionReplySerializer, 
    DiscussionAttachmentSerializer, DiscussionVoteSerializer
)
from apps.common.permissions import IsProjectMember
from apps.common.pagination import StandardResultsSetPagination


class DiscussionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Discussion CRUD operations.
    """
    serializer_class = DiscussionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'project', 'is_pinned']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'view_count']
    ordering = ['-is_pinned', '-created_at']
    
    def get_queryset(self):
        # Admins can see all discussions, regular users see public discussions and project discussions they have access to
        if self.request.user.is_admin_user:
            return Discussion.objects.filter(is_deleted=False)
        else:
            return Discussion.objects.filter(
                models.Q(project__isnull=True) |  # Public discussions
                models.Q(project__members__user=self.request.user),  # Project discussions
                is_deleted=False
            ).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """
        Allow a user to join a discussion.
        """
        discussion = self.get_object()
        user = request.user
        
        if user in discussion.participants.all():
            return Response(
                {'message': 'You are already a participant in this discussion.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        discussion.participants.add(user)
        return Response(
            {'message': 'Successfully joined the discussion.'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """
        Allow a user to leave a discussion.
        """
        discussion = self.get_object()
        user = request.user
        
        if user not in discussion.participants.all():
            return Response(
                {'message': 'You are not a participant in this discussion.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        discussion.participants.remove(user)
        return Response(
            {'message': 'Successfully left the discussion.'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['get', 'post'])
    def messages(self, request, pk=None):
        """
        Get messages/replies for a discussion or create a new message.
        """
        discussion = self.get_object()
        
        if request.method == 'GET':
            replies = discussion.replies.filter(is_deleted=False).order_by('created_at')
            serializer = DiscussionReplySerializer(replies, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Create a new message/reply
            serializer = DiscussionReplySerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(
                    discussion=discussion,
                    created_by=request.user
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DiscussionReplyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Discussion Reply management.
    """
    serializer_class = DiscussionReplySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return DiscussionReply.objects.filter(
            discussion__in=Discussion.objects.filter(
                models.Q(project__isnull=True) |
                models.Q(project__members__user=self.request.user)
            ),
            is_deleted=False
        )
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class DiscussionAttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Discussion Attachment management.
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return DiscussionAttachment.objects.filter(
            discussion__in=Discussion.objects.filter(
                models.Q(project__isnull=True) |
                models.Q(project__members__user=self.request.user)
            )
        )


class DiscussionVoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Discussion Vote management.
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return DiscussionVote.objects.filter(user=self.request.user)
