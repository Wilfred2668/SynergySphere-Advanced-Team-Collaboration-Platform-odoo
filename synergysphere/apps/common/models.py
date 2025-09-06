"""
Common base models for the SynergySphere project.
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model


class BaseModel(models.Model):
    """
    Abstract base model with common fields for all models.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


class UserTrackingModel(models.Model):
    """
    Abstract model that tracks who created and last modified the record.
    """
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_created'
    )
    updated_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_updated'
    )
    
    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    """
    Abstract model for soft delete functionality.
    """
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_deleted'
    )
    
    class Meta:
        abstract = True


class FullTrackingModel(BaseModel, UserTrackingModel, SoftDeleteModel):
    """
    Abstract model that combines BaseModel, UserTrackingModel, and SoftDeleteModel.
    Use this instead of multiple inheritance to avoid MRO issues.
    """
    class Meta:
        abstract = True


class TrackedModel(BaseModel, UserTrackingModel):
    """
    Abstract model that combines BaseModel and UserTrackingModel.
    Use this for models that need tracking but not soft delete.
    """
    class Meta:
        abstract = True
