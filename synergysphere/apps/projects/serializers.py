"""
Serializers for the Projects app.
"""
from rest_framework import serializers
from .models import Project, ProjectMember, ProjectInvitation, ProjectFile, ProjectActivity
from apps.users.serializers import UserSerializer


class ProjectMemberSerializer(serializers.ModelSerializer):
    """Serializer for ProjectMember model."""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ProjectMember
        fields = ['id', 'user', 'role', 'joined_at', 'is_active']


class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for Project model."""
    created_by = UserSerializer(read_only=True)
    owner = UserSerializer(read_only=True)
    members = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status', 'priority', 'start_date', 
            'end_date', 'created_at', 'updated_at', 'created_by', 'owner', 'members'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
    
    def get_members(self, obj):
        """Get active members for the project."""
        active_members = obj.members.filter(is_active=True)
        return ProjectMemberSerializer(active_members, many=True).data


class ProjectInvitationSerializer(serializers.ModelSerializer):
    """Serializer for ProjectInvitation model."""
    project = ProjectSerializer(read_only=True)
    invited_by = UserSerializer(read_only=True)
    
    class Meta:
        model = ProjectInvitation
        fields = [
            'id', 'project', 'email', 'role', 'status', 'invited_by', 
            'invited_at', 'responded_at', 'token'
        ]
        read_only_fields = ['id', 'invited_at', 'responded_at', 'token', 'invited_by']


class ProjectFileSerializer(serializers.ModelSerializer):
    """Serializer for ProjectFile model."""
    project = ProjectSerializer(read_only=True)
    uploaded_by = UserSerializer(read_only=True)
    
    class Meta:
        model = ProjectFile
        fields = [
            'id', 'project', 'name', 'file', 'file_type', 'file_size', 
            'uploaded_by', 'uploaded_at', 'description'
        ]
        read_only_fields = ['id', 'uploaded_at', 'uploaded_by', 'file_size']


class ProjectActivitySerializer(serializers.ModelSerializer):
    """Serializer for ProjectActivity model."""
    project = ProjectSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ProjectActivity
        fields = [
            'id', 'project', 'user', 'action', 'description', 
            'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
