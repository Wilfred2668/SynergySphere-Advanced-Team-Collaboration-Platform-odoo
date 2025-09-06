"""
Models for the Discussions app.
"""
from django.db import models
from apps.common.models import BaseModel, UserTrackingModel, SoftDeleteModel, FullTrackingModel, TrackedModel


class Discussion(FullTrackingModel):
    """
    Discussion/Forum model.
    """
    CATEGORY_CHOICES = [
        ('general', 'General'),
        ('project', 'Project Related'),
        ('technical', 'Technical'),
        ('announcement', 'Announcement'),
        ('question', 'Question'),
        ('feedback', 'Feedback'),
    ]
    
    title = models.CharField(max_length=255)
    content = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    project = models.ForeignKey(
        'projects.Project', on_delete=models.CASCADE,
        null=True, blank=True, related_name='discussions'
    )
    is_pinned = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)
    view_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'discussions'
        verbose_name = 'Discussion'
        verbose_name_plural = 'Discussions'
        ordering = ['-is_pinned', '-created_at']
    
    def __str__(self):
        return self.title
    
    @property
    def reply_count(self):
        return self.replies.count()
    
    @property
    def last_activity(self):
        last_reply = self.replies.order_by('-created_at').first()
        return last_reply.created_at if last_reply else self.created_at


class DiscussionReply(FullTrackingModel):
    """
    Discussion replies model.
    """
    discussion = models.ForeignKey(Discussion, on_delete=models.CASCADE, related_name='replies')
    content = models.TextField()
    parent_reply = models.ForeignKey(
        'self', on_delete=models.CASCADE,
        null=True, blank=True, related_name='child_replies'
    )
    mentioned_users = models.ManyToManyField(
        'users.User', blank=True, related_name='discussion_mentions'
    )
    
    class Meta:
        db_table = 'discussion_replies'
        verbose_name = 'Discussion Reply'
        verbose_name_plural = 'Discussion Replies'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Reply by {self.created_by.get_full_name()} to {self.discussion.title}"


class DiscussionAttachment(TrackedModel):
    """
    Discussion file attachments.
    """
    discussion = models.ForeignKey(Discussion, on_delete=models.CASCADE, related_name='attachments')
    reply = models.ForeignKey(
        DiscussionReply, on_delete=models.CASCADE,
        null=True, blank=True, related_name='attachments'
    )
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='discussion_attachments/%Y/%m/%d/')
    file_size = models.BigIntegerField()
    file_type = models.CharField(max_length=100)
    
    class Meta:
        db_table = 'discussion_attachments'
        verbose_name = 'Discussion Attachment'
        verbose_name_plural = 'Discussion Attachments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.discussion.title}"


class DiscussionVote(BaseModel):
    """
    Discussion voting system.
    """
    VOTE_CHOICES = [
        ('up', 'Upvote'),
        ('down', 'Downvote'),
    ]
    
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    discussion = models.ForeignKey(
        Discussion, on_delete=models.CASCADE,
        null=True, blank=True, related_name='votes'
    )
    reply = models.ForeignKey(
        DiscussionReply, on_delete=models.CASCADE,
        null=True, blank=True, related_name='votes'
    )
    vote_type = models.CharField(max_length=10, choices=VOTE_CHOICES)
    
    class Meta:
        db_table = 'discussion_votes'
        verbose_name = 'Discussion Vote'
        verbose_name_plural = 'Discussion Votes'
        unique_together = [
            ['user', 'discussion'],
            ['user', 'reply'],
        ]
    
    def __str__(self):
        target = self.discussion or self.reply
        return f"{self.user.get_full_name()} {self.vote_type}voted {target}"
