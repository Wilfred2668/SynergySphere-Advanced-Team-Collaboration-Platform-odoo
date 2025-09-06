"""
URL configuration for the Discussions app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'discussions'

router = DefaultRouter()
router.register('', views.DiscussionViewSet, basename='discussion')
router.register('replies', views.DiscussionReplyViewSet, basename='discussion-reply')
router.register('attachments', views.DiscussionAttachmentViewSet, basename='discussion-attachment')
router.register('votes', views.DiscussionVoteViewSet, basename='discussion-vote')

urlpatterns = [
    path('', include(router.urls)),
]
