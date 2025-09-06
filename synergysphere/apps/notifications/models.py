"""
Models for the Notifications app.
"""
from django.db import models
from apps.common.models import BaseModel


class Notification(BaseModel):
    """
    Notification model for user notifications.
    """
    TYPE_CHOICES = [
        ('task_assigned', 'Task Assigned'),
        ('task_due', 'Task Due'),
        ('task_completed', 'Task Completed'),
        ('project_invitation', 'Project Invitation'),
        ('project_update', 'Project Update'),
        ('discussion_reply', 'Discussion Reply'),
        ('mention', 'Mention'),
        ('system', 'System Notification'),
        ('announcement', 'Announcement'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    recipient = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(
        'users.User', on_delete=models.CASCADE,
        null=True, blank=True, related_name='sent_notifications'
    )
    
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # Related objects
    project = models.ForeignKey(
        'projects.Project', on_delete=models.CASCADE,
        null=True, blank=True, related_name='notifications'
    )
    task = models.ForeignKey(
        'tasks.Task', on_delete=models.CASCADE,
        null=True, blank=True, related_name='notifications'
    )
    discussion = models.ForeignKey(
        'discussions.Discussion', on_delete=models.CASCADE,
        null=True, blank=True, related_name='notifications'
    )
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Delivery channels
    email_sent = models.BooleanField(default=False)
    sms_sent = models.BooleanField(default=False)
    push_sent = models.BooleanField(default=False)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    action_url = models.URLField(blank=True)
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Notification for {self.recipient.get_full_name()}: {self.title}"
    
    def mark_as_read(self):
        from django.utils import timezone
        self.is_read = True
        self.read_at = timezone.now()
        self.save(update_fields=['is_read', 'read_at'])


class NotificationPreference(BaseModel):
    """
    User notification preferences.
    """
    user = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Email preferences
    email_task_assigned = models.BooleanField(default=True)
    email_task_due = models.BooleanField(default=True)
    email_project_updates = models.BooleanField(default=True)
    email_discussion_replies = models.BooleanField(default=True)
    email_mentions = models.BooleanField(default=True)
    email_announcements = models.BooleanField(default=True)
    
    # Push notification preferences
    push_task_assigned = models.BooleanField(default=True)
    push_task_due = models.BooleanField(default=True)
    push_project_updates = models.BooleanField(default=False)
    push_discussion_replies = models.BooleanField(default=True)
    push_mentions = models.BooleanField(default=True)
    push_announcements = models.BooleanField(default=False)
    
    # SMS preferences
    sms_urgent_only = models.BooleanField(default=True)
    sms_task_due = models.BooleanField(default=False)
    sms_mentions = models.BooleanField(default=False)
    
    # General preferences
    digest_frequency = models.CharField(
        max_length=10,
        choices=[
            ('never', 'Never'),
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
            ('monthly', 'Monthly'),
        ],
        default='weekly'
    )
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'notification_preferences'
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'
    
    def __str__(self):
        return f"Notification preferences for {self.user.get_full_name()}"


class NotificationTemplate(BaseModel):
    """
    Notification templates for consistent messaging.
    """
    name = models.CharField(max_length=100, unique=True)
    notification_type = models.CharField(max_length=20, choices=Notification.TYPE_CHOICES)
    title_template = models.CharField(max_length=255)
    message_template = models.TextField()
    email_template = models.TextField(blank=True)
    sms_template = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'notification_templates'
        verbose_name = 'Notification Template'
        verbose_name_plural = 'Notification Templates'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.notification_type})"
