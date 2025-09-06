"""
Management command to create admin user from environment variables
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.users.models import UserProfile
from django.db import transaction

User = get_user_model()


class Command(BaseCommand):
    help = 'Create admin user from environment variables'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force create admin user even if one already exists',
        )

    def handle(self, *args, **options):
        try:
            # Get admin credentials from environment
            admin_email = os.environ.get('ADMIN_EMAIL')
            admin_password = os.environ.get('ADMIN_PASSWORD')
            admin_first_name = os.environ.get('ADMIN_FIRST_NAME', 'Admin')
            admin_last_name = os.environ.get('ADMIN_LAST_NAME', 'User')

            if not admin_email or not admin_password:
                self.stdout.write(
                    self.style.ERROR(
                        'ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables'
                    )
                )
                return

            # Check if admin user already exists
            existing_admin = User.objects.filter(email=admin_email).first()
            
            if existing_admin and not options['force']:
                self.stdout.write(
                    self.style.WARNING(
                        f'Admin user with email {admin_email} already exists. '
                        'Use --force to recreate.'
                    )
                )
                return

            with transaction.atomic():
                # Delete existing admin if force is used
                if existing_admin and options['force']:
                    existing_admin.delete()
                    self.stdout.write(
                        self.style.WARNING(
                            f'Deleted existing admin user: {admin_email}'
                        )
                    )

                # Create new admin user
                admin_user = User.objects.create_superuser(
                    email=admin_email,
                    password=admin_password,
                    first_name=admin_first_name,
                    last_name=admin_last_name,
                    role='admin'
                )

                # Create user profile
                UserProfile.objects.create(
                    user=admin_user,
                    bio='System Administrator',
                    timezone='UTC'
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully created admin user: {admin_email}'
                    )
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Name: {admin_first_name} {admin_last_name}'
                    )
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f'Error creating admin user: {str(e)}'
                )
            )
            raise
