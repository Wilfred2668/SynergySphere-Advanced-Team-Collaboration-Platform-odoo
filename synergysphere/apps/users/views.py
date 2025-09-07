"""
Views for the Users app.
"""
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import User, UserProfile
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserSerializer,
    UserUpdateSerializer, UserProfileSerializer, PasswordChangeSerializer,
    PasswordResetRequestSerializer, PasswordResetSerializer
)


class UserRegistrationView(APIView):
    """
    User registration endpoint.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # UserProfile is automatically created by signals
            # No need to manually create it here
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'User registered successfully.',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    """
    User login endpoint.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLogoutView(APIView):
    """
    User logout endpoint.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get and update user profile.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer


class UserProfileUpdateView(generics.UpdateAPIView):
    """
    Update user profile information.
    """
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class UserProfileDetailsView(generics.RetrieveUpdateAPIView):
    """
    Get and update extended user profile.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile


class PasswordChangeView(APIView):
    """
    Change user password.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """
    Request password reset (simplified - just validates email exists).
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            return Response({
                'message': 'Password reset instructions would be sent to your email (feature simplified for demo)'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetView(APIView):
    """
    Reset password (simplified - no OTP required).
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            new_password = serializer.validated_data['new_password']
            
            # Update password
            user.set_password(new_password)
            user.save()
            
            return Response({
                'message': 'Password reset successfully'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListView(generics.ListAPIView):
    """
    List all users (for admin or team leaders).
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin_user or user.is_team_leader:
            return User.objects.all()
        return User.objects.none()


class UserDetailView(generics.RetrieveAPIView):
    """
    Get user details by ID.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


class AdminUserManagementView(APIView):
    """
    Admin-only view for user management operations.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        # Only allow admin users
        if not self.request.user.is_admin_user:
            return [permissions.AllowAny()]  # This will be caught and return 403
        return super().get_permissions()
    
    def get(self, request):
        """Get all users for admin management."""
        if not request.user.is_admin_user:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
    def patch(self, request, pk=None):
        """Update user role (promote/demote admin)."""
        if not request.user.is_admin_user:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        new_role = request.data.get('role')
        if new_role not in ['admin', 'team_leader', 'member']:
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.role = new_role
        if new_role == 'admin':
            user.is_staff = True
            user.is_superuser = True
        else:
            user.is_staff = False
            user.is_superuser = False
        
        user.save()
        
        return Response({
            'message': f'User role updated to {new_role}',
            'user': UserSerializer(user).data
        })
    
    def delete(self, request, pk=None):
        """Deactivate/remove a user."""
        if not request.user.is_admin_user:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if user.is_admin_user and User.objects.filter(role='admin').count() <= 1:
            return Response({'error': 'Cannot remove the last admin user'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.is_active = False
        user.save()
        
        return Response({'message': 'User deactivated successfully'})


class AdminPromoteUserView(APIView):
    """
    Admin-only endpoint to promote/demote users.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk=None):
        if not request.user.is_admin_user:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check the URL path to determine action
        action = request.resolver_match.url_name
        
        if 'promote' in action:
            if user.role == 'admin':
                return Response({'error': 'User is already an admin'}, status=status.HTTP_400_BAD_REQUEST)
            
            user.role = 'admin'
            user.is_staff = True
            user.is_superuser = True
            user.save()
            
            return Response({
                'message': f'User {user.email} promoted to admin',
                'user': UserSerializer(user).data
            })
        
        elif 'demote' in action:
            if user.role != 'admin':
                return Response({'error': 'User is not an admin'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Prevent demoting the last admin
            if User.objects.filter(role='admin', is_active=True).count() <= 1:
                return Response({'error': 'Cannot demote the last admin user'}, status=status.HTTP_400_BAD_REQUEST)
            
            user.role = 'member'
            user.is_staff = False
            user.is_superuser = False
            user.save()
            
            return Response({
                'message': f'User {user.email} demoted from admin',
                'user': UserSerializer(user).data
            })
        
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


class AdminRemoveUserView(APIView):
    """
    Admin-only endpoint to deactivate users.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk=None):
        if not request.user.is_admin_user:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if not user.is_active:
            return Response({'error': 'User is already inactive'}, status=status.HTTP_400_BAD_REQUEST)
        
        if user.is_admin_user and User.objects.filter(role='admin', is_active=True).count() <= 1:
            return Response({'error': 'Cannot deactivate the last admin user'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.is_active = False
        user.save()
        
        return Response({'message': f'User {user.email} deactivated successfully'})


class AdminActivateUserView(APIView):
    """
    Admin-only endpoint to activate users.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk=None):
        if not request.user.is_admin_user:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if user.is_active:
            return Response({'error': 'User is already active'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.is_active = True
        user.save()
        
        return Response({'message': f'User {user.email} activated successfully'})


class AdminDashboardView(APIView):
    """
    Admin dashboard with system statistics.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_admin_user:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get user statistics
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        admin_users = User.objects.filter(role='admin', is_active=True).count()
        
        # Get recent users (last 10)
        recent_users = User.objects.filter(is_active=True).order_by('-date_joined')[:10]
        
        dashboard_data = {
            'total_users': total_users,
            'active_users': active_users,
            'admin_users': admin_users,
            'recent_users': UserSerializer(recent_users, many=True).data
        }
        
        return Response(dashboard_data)
