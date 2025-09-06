"""
Custom permissions for admin operations.
"""
from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Permission class that allows only admin users.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission class that allows admin users full access and others read-only.
    """
    def has_permission(self, request, view):
        if request.method in permissions.READONLY_METHODS:
            return request.user and request.user.is_authenticated
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )


class IsAdminOrTaskOwner(permissions.BasePermission):
    """
    Permission class for task operations.
    - Admins can do everything
    - Regular users can only update status of their assigned tasks
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admin can do anything
        if request.user.role == 'admin':
            return True
        
        # For tasks, check if user is assignee and only allow status updates
        if hasattr(obj, 'assignee'):
            if request.method in ['PUT', 'PATCH']:
                # Regular users can only update status if they are assignee
                if obj.assignee == request.user:
                    # Only allow status updates for non-admin users
                    if hasattr(request, 'data'):
                        allowed_fields = {'status'}
                        request_fields = set(request.data.keys())
                        return request_fields.issubset(allowed_fields)
                return False
            elif request.method == 'GET':
                # Users can view tasks they're assigned to or in projects they're members of
                return (
                    obj.assignee == request.user or 
                    obj.project.members.filter(user=request.user).exists()
                )
        
        return False


class CanManageUsers(permissions.BasePermission):
    """
    Permission class for user management operations.
    Only admins can promote users, deactivate users, etc.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )
