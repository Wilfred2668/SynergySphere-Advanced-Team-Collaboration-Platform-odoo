"""
Serializers for the Discussions app.
"""
from rest_framework import serializers
from .models import Discussion, DiscussionReply, DiscussionAttachment, DiscussionVote
from apps.users.serializers import UserSerializer


class DiscussionReplySerializer(serializers.ModelSerializer):
    """Serializer for DiscussionReply model."""
    author = UserSerializer(source='created_by', read_only=True)
    
    class Meta:
        model = DiscussionReply
        fields = [
            'id', 'discussion', 'author', 'content', 'parent_reply',
            'created_at', 'updated_at', 'is_deleted'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'author', 'discussion', 'is_deleted']


class DiscussionSerializer(serializers.ModelSerializer):
    """Serializer for Discussion model."""
    author = UserSerializer(source='created_by', read_only=True)
    participants = UserSerializer(many=True, read_only=True)
    replies = DiscussionReplySerializer(many=True, read_only=True)
    reply_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Discussion
        fields = [
            'id', 'title', 'content', 'category', 'project', 'author',
            'participants', 'tags', 'is_pinned', 'is_locked', 'view_count',
            'created_at', 'updated_at', 'replies', 'reply_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'author', 'view_count']
    
    def get_reply_count(self, obj):
        return obj.replies.filter(is_deleted=False).count()


class DiscussionAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for DiscussionAttachment model."""
    uploaded_by = UserSerializer(read_only=True)
    
    class Meta:
        model = DiscussionAttachment
        fields = [
            'id', 'discussion', 'file', 'filename', 'file_size',
            'uploaded_by', 'uploaded_at', 'description'
        ]
        read_only_fields = ['id', 'uploaded_at', 'uploaded_by', 'file_size']


class DiscussionVoteSerializer(serializers.ModelSerializer):
    """Serializer for DiscussionVote model."""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = DiscussionVote
        fields = ['id', 'discussion', 'reply', 'user', 'vote_type', 'created_at']
        read_only_fields = ['id', 'created_at', 'user']
