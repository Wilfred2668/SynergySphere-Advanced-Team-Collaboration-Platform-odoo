"""
Django admin configuration for Tasks app.
"""
from django.contrib import admin
from .models import Task, TaskComment, TaskAttachment, TaskTimeLog, TaskActivity, TaskTemplate


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'status', 'priority', 'assignee', 'due_date', 'created_at']
    list_filter = ['status', 'priority', 'project', 'created_at']
    search_fields = ['title', 'description', 'project__name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'created_by', 'created_at']
    list_filter = ['created_at']
    search_fields = ['task__title', 'content', 'created_by__email']


@admin.register(TaskAttachment)
class TaskAttachmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'task', 'file_type', 'file_size', 'created_by', 'created_at']
    list_filter = ['file_type', 'created_at']
    search_fields = ['name', 'task__title']


@admin.register(TaskTimeLog)
class TaskTimeLogAdmin(admin.ModelAdmin):
    list_display = ['task', 'user', 'hours', 'log_date', 'created_at']
    list_filter = ['log_date', 'created_at']
    search_fields = ['task__title', 'user__email', 'description']


@admin.register(TaskActivity)
class TaskActivityAdmin(admin.ModelAdmin):
    list_display = ['task', 'user', 'action', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['task__title', 'user__email', 'description']
    readonly_fields = ['created_at']


@admin.register(TaskTemplate)
class TaskTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'default_priority', 'is_public', 'created_by', 'created_at']
    list_filter = ['default_priority', 'is_public', 'created_at']
    search_fields = ['name', 'description']
