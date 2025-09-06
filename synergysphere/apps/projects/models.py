"""
Models for the Projects app.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.common.models import BaseModel, UserTrackingModel, SoftDeleteModel, FullTrackingModel, TrackedModel


class Project(FullTrackingModel):
    """
    Project model for team collaboration.
    """
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('on_hold', 'On Hold'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Project settings
    is_public = models.BooleanField(default=False)
    allow_external_members = models.BooleanField(default=False)
    
    # Metadata
    tags = models.JSONField(default=list, blank=True)
    custom_fields = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'projects'
        verbose_name = 'Project'
        verbose_name_plural = 'Projects'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    @property
    def member_count(self):
        return self.members.count()
    
    @property
    def task_count(self):
        return self.tasks.count()
    
    @property
    def completed_task_count(self):
        return self.tasks.filter(status='completed').count()


class ProjectMember(BaseModel):
    """
    Project membership model.
    """
    ROLE_CHOICES = [
        ('member', 'Member'),
        ('manager', 'Manager'),
        ('admin', 'Admin'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='project_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    # Permissions
    can_create_tasks = models.BooleanField(default=True)
    can_edit_project = models.BooleanField(default=False)
    can_manage_members = models.BooleanField(default=False)
    can_delete_project = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'project_members'
        verbose_name = 'Project Member'
        verbose_name_plural = 'Project Members'
        unique_together = ['project', 'user']
        ordering = ['-joined_at']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.project.name} ({self.role})"
    
    def save(self, *args, **kwargs):
        # Set permissions based on role
        if self.role == 'admin':
            self.can_edit_project = True
            self.can_manage_members = True
            self.can_delete_project = True
        elif self.role == 'manager':
            self.can_edit_project = True
            self.can_manage_members = True
        
        super().save(*args, **kwargs)


class ProjectInvitation(BaseModel):
    """
    Project invitation model.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='invitations')
    inviter = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='sent_invitations')
    invitee_email = models.EmailField()
    invitee_user = models.ForeignKey(
        'users.User', on_delete=models.CASCADE, 
        related_name='received_invitations', null=True, blank=True
    )
    role = models.CharField(max_length=20, choices=ProjectMember.ROLE_CHOICES, default='member')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True)
    expires_at = models.DateTimeField()
    responded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'project_invitations'
        verbose_name = 'Project Invitation'
        verbose_name_plural = 'Project Invitations'
        unique_together = ['project', 'invitee_email']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invitation to {self.invitee_email} for {self.project.name}"
    
    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at


class ProjectFile(TrackedModel):
    """
    Project file attachments.
    """
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='files')
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='project_files/%Y/%m/%d/')
    file_size = models.BigIntegerField()
    file_type = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)
    download_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'project_files'
        verbose_name = 'Project File'
        verbose_name_plural = 'Project Files'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.project.name}"
    
    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size
            self.file_type = self.file.name.split('.')[-1].lower()
        super().save(*args, **kwargs)


class ProjectActivity(BaseModel):
    """
    Project activity log.
    """
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('deleted', 'Deleted'),
        ('member_added', 'Member Added'),
        ('member_removed', 'Member Removed'),
        ('task_created', 'Task Created'),
        ('task_updated', 'Task Updated'),
        ('task_completed', 'Task Completed'),
        ('file_uploaded', 'File Uploaded'),
        ('comment_added', 'Comment Added'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='project_activities')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'project_activities'
        verbose_name = 'Project Activity'
        verbose_name_plural = 'Project Activities'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.get_full_name()} {self.action} in {self.project.name}"
