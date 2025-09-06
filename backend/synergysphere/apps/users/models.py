"""
User models for the SynergySphere project.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
from apps.common.models import BaseModel


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    """
    ROLE_CHOICES = [
        ('member', 'Member'),
        ('team_leader', 'Team Leader'),
        ('admin', 'Admin'),
    ]
    
    email = models.EmailField(unique=True)
    phone_number = models.CharField(
        max_length=17,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
            )
        ],
        blank=True,
        null=True
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    timezone = models.CharField(max_length=50, default='UTC')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Preferences
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.email} ({self.get_full_name()})"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def is_team_leader(self):
        return self.role == 'team_leader'
    
    @property
    def is_admin_user(self):
        return self.role == 'admin' or self.is_staff or self.is_superuser


class UserProfile(BaseModel):
    """
    Extended user profile information.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    department = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    skills = models.JSONField(default=list, blank=True)
    social_links = models.JSONField(default=dict, blank=True)
    emergency_contact = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'user_profiles'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
    
    def __str__(self):
        return f"Profile of {self.user.email}"


class UserSession(BaseModel):
    """
    Track user sessions for security and analytics.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    device_type = models.CharField(max_length=50, blank=True)
    location = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_sessions'
        verbose_name = 'User Session'
        verbose_name_plural = 'User Sessions'
        ordering = ['-last_activity']
    
    def __str__(self):
        return f"Session for {self.user.email} - {self.ip_address}"
