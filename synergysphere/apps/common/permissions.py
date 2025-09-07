"""
Common permissions for the SynergySphere project.
"""
from rest_framework import permissions
from rest_framework.permissions import BasePermission


class IsOwnerOrReadOnly(BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner of the object.
        return obj.created_by == request.user


class IsProjectMember(BasePermission):
    """
    Custom permission to check if user is a project member.
    """
    
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'project'):
            return obj.project.members.filter(user=request.user).exists()
        return False


class IsProjectManagerOrOwner(BasePermission):
    """
    Custom permission for project managers and owners.
    """
    
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'project'):
            membership = obj.project.members.filter(user=request.user).first()
            if membership:
                return membership.role in ['manager', 'admin'] or obj.created_by == request.user
        return obj.created_by == request.user


class IsAdminOrReadOnly(BasePermission):
    """
    Custom permission to only allow admins to edit.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_staff or request.user.is_superuser


class IsTeamLeaderOrAdmin(BasePermission):
    """
    Permission for team leaders and admins only.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role in ['team_leader', 'admin'] or
            request.user.is_staff or
            request.user.is_superuser
        )


class IsAdminUser(BasePermission):
    """
    Permission for admin users only.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role == 'admin' or
            request.user.is_staff or
            request.user.is_superuser
        )


class TaskPermission(BasePermission):
    """
    Custom permission for task operations.
    - Admins can create, assign, edit, and delete tasks
    - Regular users can update all task fields except assignee for tasks in their projects
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Allow read access to all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Only admins can create tasks
        if view.action == 'create':
            return request.user.is_admin_user
        
        return True
    
    def has_object_permission(self, request, view, obj):
        # Admins have full access to all tasks
        if request.user.is_admin_user:
            return True
            
        # For regular users, check if they have access to the task through project membership
        # The task object should have a project, and the user should be a member of that project
        if hasattr(obj, 'project') and obj.project:
            # Check if user is a member of the task's project
            from apps.projects.models import ProjectMember
            is_project_member = ProjectMember.objects.filter(
                project=obj.project,
                user=request.user
            ).exists()
            
            if not is_project_member:
                return False
        
        # Read access for project members
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Only admins can delete tasks
        if view.action == 'destroy':
            return False  # Already checked admin above
        
        # For updates, check what fields are being updated
        if view.action in ['update', 'partial_update']:
            # Only the assignee field is restricted to admins (already checked above)
            admin_only_fields = {'assignee', 'assignee_id'}
            update_data = request.data
            
            forbidden_fields = set(update_data.keys()) & admin_only_fields
            if forbidden_fields:
                return False
            
            # Regular users can update all other fields for tasks in their projects
            return True
        
        return False
