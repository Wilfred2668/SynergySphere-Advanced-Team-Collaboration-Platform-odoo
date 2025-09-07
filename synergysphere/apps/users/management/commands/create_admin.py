"""
Management command to create an admin user.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from decouple import config

User = get_user_model()


class Command(BaseCommand):
    help = 'Create an admin user from environment variables'

    def handle(self, *args, **options):
        admin_email = config('ADMIN_EMAIL', default='admin@synergysphere.com')
        admin_username = config('ADMIN_USERNAME', default='admin')
        admin_password = config('ADMIN_PASSWORD', default='admin123')
        admin_first_name = config('ADMIN_FIRST_NAME', default='System')
        admin_last_name = config('ADMIN_LAST_NAME', default='Administrator')

        # Check if admin user already exists
        if User.objects.filter(email=admin_email).exists():
            self.stdout.write(
                self.style.WARNING(f'Admin user with email {admin_email} already exists.')
            )
            return

        # Create admin user
        admin_user = User.objects.create_user(
            email=admin_email,
            username=admin_username,
            password=admin_password,
            first_name=admin_first_name,
            last_name=admin_last_name,
            role='admin',
            is_staff=True,
            is_superuser=True
        )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created admin user: {admin_email}')
        )
        self.stdout.write(f'Username: {admin_username}')
        self.stdout.write(f'Email: {admin_email}')
        self.stdout.write(f'Role: {admin_user.role}')
