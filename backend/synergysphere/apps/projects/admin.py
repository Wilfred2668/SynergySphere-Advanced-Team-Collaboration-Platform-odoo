"""
Django admin configuration for Projects app.
"""
from django.contrib import admin
from .models import Project, ProjectMember, ProjectInvitation, ProjectFile, ProjectActivity


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'priority', 'created_by', 'member_count', 'created_at']
    list_filter = ['status', 'priority', 'is_public', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    def member_count(self, obj):
        return obj.member_count
    member_count.short_description = 'Members'


@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'project', 'role', 'is_active', 'joined_at']
    list_filter = ['role', 'is_active', 'joined_at']
    search_fields = ['user__email', 'project__name']


@admin.register(ProjectInvitation)
class ProjectInvitationAdmin(admin.ModelAdmin):
    list_display = ['invitee_email', 'project', 'status', 'role', 'inviter', 'created_at']
    list_filter = ['status', 'role', 'created_at']
    search_fields = ['invitee_email', 'project__name']


@admin.register(ProjectFile)
class ProjectFileAdmin(admin.ModelAdmin):
    list_display = ['name', 'project', 'file_type', 'file_size', 'created_by', 'created_at']
    list_filter = ['file_type', 'is_public', 'created_at']
    search_fields = ['name', 'project__name']


@admin.register(ProjectActivity)
class ProjectActivityAdmin(admin.ModelAdmin):
    list_display = ['project', 'user', 'action', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['project__name', 'user__email', 'description']
    readonly_fields = ['created_at']
