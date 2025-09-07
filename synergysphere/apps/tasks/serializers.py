"""
Serializers for the Tasks app.
"""
import logging
from rest_framework import serializers
from .models import Task, TaskComment, TaskAttachment, TaskTimeLog, TaskTemplate
from apps.users.serializers import UserSerializer
from apps.projects.serializers import ProjectSerializer

logger = logging.getLogger(__name__)


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model."""
    created_by = UserSerializer(read_only=True)
    assignee = UserSerializer(read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    assignee_id = serializers.CharField(write_only=True, required=False, allow_null=True)
    is_due_soon = serializers.SerializerMethodField()
    can_edit_all = serializers.SerializerMethodField()
    can_assign = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'priority', 'due_date',
            'created_at', 'updated_at', 'project', 'project_name', 'assignee', 
            'assignee_id', 'created_by', 'is_overdue', 'is_due_soon', 
            'custom_fields', 'start_date', 'completed_at', 'estimated_hours',
            'actual_hours', 'progress', 'can_edit_all', 'can_assign'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'created_by', 'is_overdue', 
            'is_due_soon', 'project_name', 'assignee', 'project', 'can_edit_all', 'can_assign'
        ]
    
    def update(self, instance, validated_data):
        """Custom update method to handle assignee updates."""
        logger.info(f"TaskSerializer update called with data: {validated_data}")
        
        # Remove read-only fields that might be sent from frontend
        read_only_fields = [
            'assignee', 'created_by', 'project_name', 'assignee_id', 
            'is_overdue', 'is_due_soon', 'created_at', 'updated_at', 'project'
        ]
        removed_fields = {}
        for field in read_only_fields:
            if field in validated_data:
                removed_fields[field] = validated_data.pop(field)
        
        if removed_fields:
            logger.info(f"Removed read-only fields: {removed_fields}")
        
        logger.info(f"Final validated_data for update: {validated_data}")
        return super().update(instance, validated_data)
    
    def validate(self, data):
        """Custom validation to ensure data integrity and permissions."""
        logger.info(f"TaskSerializer validate called with data: {data}")
        
        request = self.context.get('request')
        user = request.user if request else None
        
        # Ensure project is not being changed for existing tasks
        if self.instance and 'project' in data:
            if data['project'] != self.instance.project:
                logger.error(f"Attempted to change project from {self.instance.project} to {data['project']}")
                raise serializers.ValidationError("Cannot change project for existing task")
        
        # Admin-only field validation (only assignee_id and project are admin-only for updates)
        if user and not user.is_admin_user:
            admin_only_fields = {'assignee_id', 'project'}
            forbidden_fields = set(data.keys()) & admin_only_fields
            if forbidden_fields:
                logger.error(f"Non-admin user {user} attempted to update admin-only fields: {forbidden_fields}")
                raise serializers.ValidationError(f"Only admins can modify: {', '.join(forbidden_fields)}")
        
        # Validate status choices
        if 'status' in data:
            valid_statuses = [choice[0] for choice in self.Meta.model.STATUS_CHOICES]
            if data['status'] not in valid_statuses:
                logger.error(f"Invalid status: {data['status']}. Valid choices: {valid_statuses}")
                raise serializers.ValidationError(f"Invalid status. Must be one of: {valid_statuses}")
        
        # Validate assignee_id
        if 'assignee_id' in data:
            if user and not user.is_admin_user:
                raise serializers.ValidationError("Only admins can assign tasks")
            
            assignee_id = data['assignee_id']
            if assignee_id:
                try:
                    from apps.users.models import User
                    User.objects.get(id=assignee_id)
                except User.DoesNotExist:
                    raise serializers.ValidationError("Invalid assignee ID")
        
        logger.info(f"TaskSerializer validation passed")
        return data
    
    def get_assignee_id(self, obj):
        """Get assignee ID safely."""
        return obj.assignee.id if obj.assignee else None
    
    def get_can_edit_all(self, obj):
        """Check if user can edit all task fields."""
        request = self.context.get('request')
        if request and request.user:
            return request.user.is_admin_user
        return False
    
    def get_can_assign(self, obj):
        """Check if user can assign tasks."""
        request = self.context.get('request')
        if request and request.user:
            return request.user.is_admin_user
        return False
    
    def update(self, instance, validated_data):
        """Custom update method to handle assignee updates and permissions."""
        logger.info(f"TaskSerializer update called with data: {validated_data}")
        
        request = self.context.get('request')
        user = request.user if request else None
        
        # Handle assignee_id field
        assignee_id = validated_data.pop('assignee_id', None)
        if assignee_id is not None:
            if user and user.is_admin_user:
                if assignee_id:
                    try:
                        from apps.users.models import User
                        assignee = User.objects.get(id=assignee_id)
                        validated_data['assignee'] = assignee
                    except User.DoesNotExist:
                        raise serializers.ValidationError("Invalid assignee ID")
                else:
                    validated_data['assignee'] = None
            else:
                logger.warning(f"Non-admin user {user} attempted to change assignee")
                # This should be caught by validation, but double-check here
                pass
        
        logger.info(f"Final validated_data for update: {validated_data}")
        return super().update(instance, validated_data)
    
    def get_is_due_soon(self, obj):
        """Check if task is due within 3 days."""
        from django.utils import timezone
        from datetime import timedelta
        
        if obj.due_date and obj.status not in ['completed', 'cancelled']:
            days_until_due = (obj.due_date - timezone.now()).days
            return 0 <= days_until_due <= 3
        return False


class TaskCommentSerializer(serializers.ModelSerializer):
    """Serializer for TaskComment model."""
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'author', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'author']


class TaskAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for TaskAttachment model."""
    uploaded_by = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskAttachment
        fields = [
            'id', 'task', 'file', 'filename', 'file_size', 'file_type',
            'uploaded_by', 'uploaded_at', 'description'
        ]
        read_only_fields = ['id', 'uploaded_at', 'uploaded_by', 'file_size']


class TaskTimeLogSerializer(serializers.ModelSerializer):
    """Serializer for TaskTimeLog model."""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskTimeLog
        fields = [
            'id', 'task', 'user', 'start_time', 'end_time', 'duration',
            'description', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'user']


class TaskTemplateSerializer(serializers.ModelSerializer):
    """Serializer for TaskTemplate model."""
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskTemplate
        fields = [
            'id', 'name', 'title', 'description', 'priority', 'estimated_hours',
            'template_fields', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
