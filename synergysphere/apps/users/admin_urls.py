"""
URL configuration for Admin-only endpoints.
"""
from django.urls import path
from . import views

app_name = 'api_admin'

urlpatterns = [
    # Admin Dashboard
    path('dashboard/', views.AdminDashboardView.as_view(), name='dashboard'),
    
    # User Management
    path('users/', views.AdminUserManagementView.as_view(), name='users'),
    path('users/<int:pk>/promote/', views.AdminPromoteUserView.as_view(), name='promote_user'),
    path('users/<int:pk>/demote/', views.AdminPromoteUserView.as_view(), name='demote_user'),
    path('users/<int:pk>/activate/', views.AdminActivateUserView.as_view(), name='activate_user'),
    path('users/<int:pk>/deactivate/', views.AdminRemoveUserView.as_view(), name='deactivate_user'),
]
