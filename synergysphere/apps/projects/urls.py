"""
URL configuration for the Projects app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'projects'

router = DefaultRouter()
router.register('', views.ProjectViewSet, basename='project')
router.register('members', views.ProjectMemberViewSet, basename='project-member')
router.register('invitations', views.ProjectInvitationViewSet, basename='project-invitation')
router.register('files', views.ProjectFileViewSet, basename='project-file')
router.register('activities', views.ProjectActivityViewSet, basename='project-activity')

urlpatterns = [
    path('', include(router.urls)),
]
