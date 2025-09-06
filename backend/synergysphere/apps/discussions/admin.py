"""
Django admin configuration for Discussions app.
"""
from django.contrib import admin
from .models import Discussion, DiscussionReply, DiscussionAttachment, DiscussionVote


@admin.register(Discussion)
class DiscussionAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'project', 'created_by', 'is_pinned', 'reply_count', 'created_at']
    list_filter = ['category', 'is_pinned', 'is_locked', 'created_at']
    search_fields = ['title', 'content']
    readonly_fields = ['view_count', 'created_at', 'updated_at']
    
    def reply_count(self, obj):
        return obj.reply_count
    reply_count.short_description = 'Replies'


@admin.register(DiscussionReply)
class DiscussionReplyAdmin(admin.ModelAdmin):
    list_display = ['discussion', 'created_by', 'parent_reply', 'created_at']
    list_filter = ['created_at']
    search_fields = ['discussion__title', 'content', 'created_by__email']


@admin.register(DiscussionAttachment)
class DiscussionAttachmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'discussion', 'reply', 'file_type', 'created_by', 'created_at']
    list_filter = ['file_type', 'created_at']
    search_fields = ['name', 'discussion__title']


@admin.register(DiscussionVote)
class DiscussionVoteAdmin(admin.ModelAdmin):
    list_display = ['user', 'discussion', 'reply', 'vote_type', 'created_at']
    list_filter = ['vote_type', 'created_at']
    search_fields = ['user__email']
