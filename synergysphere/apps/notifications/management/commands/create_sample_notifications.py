"""
Management command to create sample notifications for testing.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.notifications.models import Notification

User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample notifications for testing'

    def handle(self, *args, **options):
        # Get the first user as recipient
        try:
            user = User.objects.first()
            if not user:
                self.stdout.write(
                    self.style.ERROR('No users found. Please create a user first.')
                )
                return
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error finding user: {e}')
            )
            return

        # Sample notifications data
        sample_notifications = [
            {
                'title': 'New Task Assigned',
                'message': 'You have been assigned to work on "Create User Authentication System"',
                'notification_type': 'TASK_ASSIGNED',
                'is_read': False
            },
            {
                'title': 'Task Due Soon',
                'message': 'Your task "Review Code Changes" is due in 2 days',
                'notification_type': 'TASK_DUE_SOON',
                'is_read': False
            },
            {
                'title': 'Task Overdue',
                'message': 'Your task "Update Documentation" is now overdue',
                'notification_type': 'TASK_OVERDUE',
                'is_read': False
            },
            {
                'title': 'New Message',
                'message': 'John Doe sent you a message in project discussion',
                'notification_type': 'MESSAGE',
                'is_read': True
            },
            {
                'title': 'Project Update',
                'message': 'Project "SynergySphere Platform" has been updated',
                'notification_type': 'PROJECT_UPDATE',
                'is_read': True
            },
            {
                'title': 'Task Completed',
                'message': 'Task "Setup Database Schema" has been marked as completed',
                'notification_type': 'TASK_ASSIGNED',
                'is_read': False
            }
        ]

        # Create notifications
        created_count = 0
        for notification_data in sample_notifications:
            try:
                Notification.objects.create(
                    recipient=user,
                    **notification_data
                )
                created_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error creating notification: {e}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} sample notifications for user {user.username}'
            )
        )
