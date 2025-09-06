"""
Views for the Discussions app.
"""
from django.db import models
from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Discussion, DiscussionReply, DiscussionAttachment, DiscussionVote
from apps.common.permissions import IsProjectMember
from apps.common.pagination import StandardResultsSetPagination


class DiscussionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Discussion CRUD operations.
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'project', 'is_pinned']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'view_count']
    ordering = ['-is_pinned', '-created_at']
    
    def get_queryset(self):
        return Discussion.objects.filter(
            models.Q(project__isnull=True) |  # Public discussions
            models.Q(project__members__user=self.request.user),  # Project discussions
            is_deleted=False
        ).distinct()


class DiscussionReplyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Discussion Reply management.
    """
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
