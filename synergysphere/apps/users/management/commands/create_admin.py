"""
Management command to create the admin user from environment variables.
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()


class Command(BaseCommand):
    help = 'Create admin user from environment variables'

    def handle(self, *args, **options):
        admin_email = os.getenv('ADMIN_EMAIL')
        admin_password = os.getenv('ADMIN_PASSWORD')
        admin_first_name = os.getenv('ADMIN_FIRST_NAME', 'Admin')
        admin_last_name = os.getenv('ADMIN_LAST_NAME', 'User')

        if not admin_email or not admin_password:
            self.stdout.write(
                self.style.ERROR('ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables')
            )
            return

        try:
            with transaction.atomic():
                user, created = User.objects.get_or_create(
                    email=admin_email,
                    defaults={
                        'username': 'admin',
                        'first_name': admin_first_name,
                        'last_name': admin_last_name,
                        'is_staff': True,
                        'is_superuser': True,
                        'is_active': True,
                        'role': 'admin',
                    }
                )
                
                if created:
                    user.set_password(admin_password)
                    user.save()
                    self.stdout.write(
                        self.style.SUCCESS(f'Successfully created admin user: {admin_email}')
                    )
                else:
                    # Update existing user to admin if not already
                    if user.role != 'admin':
                        user.role = 'admin'
                        user.is_staff = True
                        user.is_superuser = True
                        user.save()
                        self.stdout.write(
                            self.style.SUCCESS(f'Updated user {admin_email} to admin role')
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING(f'Admin user {admin_email} already exists')
                        )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating admin user: {str(e)}')
            )
