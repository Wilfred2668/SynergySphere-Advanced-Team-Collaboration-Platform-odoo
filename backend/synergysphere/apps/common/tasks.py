"""
Celery tasks for the SynergySphere project.
"""
from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
from apps.users.models import User
from apps.notifications.models import Notification


@shared_task
def send_email_async(subject, message, from_email, recipient_list, html_message=None):
    """
    Send email asynchronously using Celery.
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False,
        )
        return f"Email sent successfully to {recipient_list}"
    except Exception as e:
        return f"Email sending failed: {str(e)}"


@shared_task
def send_otp_email_async(email, otp_code, user_name=None):
    """
    Send OTP email asynchronously.
    """
    try:
        context = {
            'otp': otp_code,
            'user_name': user_name or 'User',
            'expiry_minutes': settings.OTP_EXPIRY_MINUTES,
        }
        
        html_message = render_to_string('emails/otp_email.html', context)
        plain_message = strip_tags(html_message)
        
        return send_email_async.delay(
            subject='SynergySphere - Verification Code',
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
        )
    except Exception as e:
        return f"OTP email task failed: {str(e)}"


@shared_task
def send_notification_emails():
    """
    Send pending notification emails.
    """
    # Get unread notifications that need email delivery
    notifications = Notification.objects.filter(
        is_read=False,
        email_sent=False,
        recipient__email_notifications=True
    ).select_related('recipient')
    
    sent_count = 0
    for notification in notifications[:100]:  # Limit batch size
        try:
            context = {
                'notification': notification,
                'user': notification.recipient,
                'action_url': notification.action_url,
            }
            
            html_message = render_to_string('emails/notification_email.html', context)
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject=f"SynergySphere - {notification.title}",
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[notification.recipient.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            notification.email_sent = True
            notification.save(update_fields=['email_sent'])
            sent_count += 1
            
        except Exception as e:
            print(f"Failed to send notification email: {e}")
    
    return f"Sent {sent_count} notification emails"


@shared_task
def cleanup_expired_otps():
    """
    Clean up expired OTP verification records.
    """
    from django.utils import timezone
    from apps.users.models import OTPVerification
    
    expired_count = OTPVerification.objects.filter(
        expires_at__lt=timezone.now(),
        is_verified=False
    ).delete()[0]
    
    return f"Cleaned up {expired_count} expired OTP records"


@shared_task
def generate_daily_digest():
    """
    Generate daily digest emails for users.
    """
    from datetime import datetime, timedelta
    from django.utils import timezone
    
    yesterday = timezone.now() - timedelta(days=1)
    users_with_digest = User.objects.filter(
        notification_preferences__digest_frequency='daily',
        email_notifications=True
    )
    
    sent_count = 0
    for user in users_with_digest:
        # Get user's notifications from yesterday
        notifications = Notification.objects.filter(
            recipient=user,
            created_at__gte=yesterday,
            created_at__lt=timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        )
        
        if notifications.exists():
            context = {
                'user': user,
                'notifications': notifications,
                'date': yesterday.date(),
            }
            
            html_message = render_to_string('emails/daily_digest.html', context)
            plain_message = strip_tags(html_message)
            
            try:
                send_mail(
                    subject=f"SynergySphere Daily Digest - {yesterday.strftime('%B %d, %Y')}",
                    message=plain_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    html_message=html_message,
                    fail_silently=False,
                )
                sent_count += 1
            except Exception as e:
                print(f"Failed to send digest to {user.email}: {e}")
    
    return f"Sent {sent_count} daily digest emails"


@shared_task
def update_project_progress():
    """
    Update project progress based on completed tasks.
    """
    from apps.projects.models import Project
    
    updated_count = 0
    for project in Project.objects.filter(is_deleted=False):
        total_tasks = project.tasks.filter(is_deleted=False).count()
        if total_tasks > 0:
            completed_tasks = project.tasks.filter(status='completed', is_deleted=False).count()
            new_progress = int((completed_tasks / total_tasks) * 100)
            
            if project.progress != new_progress:
                project.progress = new_progress
                project.save(update_fields=['progress'])
                updated_count += 1
    
    return f"Updated progress for {updated_count} projects"
