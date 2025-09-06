"""
Models for the Tasks app.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.common.models import BaseModel, UserTrackingModel, SoftDeleteModel, FullTrackingModel, TrackedModel


class Task(FullTrackingModel):
    """
    Task model for project management.
    """
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('review', 'In Review'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    # Assignment
    assignee = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, 
        null=True, blank=True, related_name='assigned_tasks'
    )
    
    # Dates
    due_date = models.DateTimeField(null=True, blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Progress
    estimated_hours = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    actual_hours = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Dependencies
    parent_task = models.ForeignKey(
        'self', on_delete=models.CASCADE,
        null=True, blank=True, related_name='subtasks'
    )
    depends_on = models.ManyToManyField(
        'self', blank=True, symmetrical=False, related_name='dependent_tasks'
    )
    
    # Metadata
    tags = models.JSONField(default=list, blank=True)
    custom_fields = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'tasks'
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.project.name})"
    
    @property
    def is_overdue(self):
        from django.utils import timezone
        if self.due_date and self.status not in ['completed', 'cancelled']:
            return timezone.now() > self.due_date
        return False
    
    @property
    def subtask_count(self):
        return self.subtasks.count()
    
    @property
    def completed_subtask_count(self):
        return self.subtasks.filter(status='completed').count()


class TaskComment(TrackedModel):
    """
    Task comments model.
    """
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    parent_comment = models.ForeignKey(
        'self', on_delete=models.CASCADE,
        null=True, blank=True, related_name='replies'
    )
    
    # Mentions
    mentioned_users = models.ManyToManyField(
        'users.User', blank=True, related_name='task_mentions'
    )
    
    class Meta:
        db_table = 'task_comments'
        verbose_name = 'Task Comment'
        verbose_name_plural = 'Task Comments'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.created_by.get_full_name()} on {self.task.title}"


class TaskAttachment(TrackedModel):
    """
    Task file attachments.
    """
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='task_attachments/%Y/%m/%d/')
    file_size = models.BigIntegerField()
    file_type = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'task_attachments'
        verbose_name = 'Task Attachment'
        verbose_name_plural = 'Task Attachments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.task.title}"
    
    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size
            self.file_type = self.file.name.split('.')[-1].lower()
        super().save(*args, **kwargs)


class TaskTimeLog(BaseModel):
    """
    Task time tracking.
    """
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='time_logs')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='task_time_logs')
    description = models.TextField(blank=True)
    hours = models.DecimalField(max_digits=8, decimal_places=2)
    log_date = models.DateField()
    
    class Meta:
        db_table = 'task_time_logs'
        verbose_name = 'Task Time Log'
        verbose_name_plural = 'Task Time Logs'
        ordering = ['-log_date', '-created_at']
    
    def __str__(self):
        return f"{self.hours}h logged by {self.user.get_full_name()} on {self.task.title}"


class TaskActivity(BaseModel):
    """
    Task activity log.
    """
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('status_changed', 'Status Changed'),
        ('assigned', 'Assigned'),
        ('comment_added', 'Comment Added'),
        ('attachment_added', 'Attachment Added'),
        ('time_logged', 'Time Logged'),
        ('completed', 'Completed'),
    ]
    
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='task_activities')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    description = models.TextField()
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'task_activities'
        verbose_name = 'Task Activity'
        verbose_name_plural = 'Task Activities'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.get_full_name()} {self.action} {self.task.title}"


class TaskTemplate(TrackedModel):
    """
    Task templates for reusable task structures.
    """
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    title_template = models.CharField(max_length=255)
    description_template = models.TextField(blank=True)
    default_priority = models.CharField(max_length=20, choices=Task.PRIORITY_CHOICES, default='medium')
    estimated_hours = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)
    custom_fields = models.JSONField(default=dict, blank=True)
    is_public = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'task_templates'
        verbose_name = 'Task Template'
        verbose_name_plural = 'Task Templates'
        ordering = ['name']
    
    def __str__(self):
        return self.name
