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
