"""
Management command to clean up duplicate or orphaned user profiles
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.users.models import UserProfile
from django.db import transaction

User = get_user_model()


class Command(BaseCommand):
    help = 'Clean up duplicate or orphaned user profiles'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be cleaned up without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE - No changes will be made')
            )

        # Find users without profiles
        users_without_profiles = User.objects.filter(profile__isnull=True)
        
        # Find orphaned profiles (profiles without users)
        orphaned_profiles = UserProfile.objects.filter(user__isnull=True)
        
        # Find duplicate profiles (multiple profiles for same user)
        duplicate_profiles = []
        for user in User.objects.all():
            profiles = UserProfile.objects.filter(user=user)
            if profiles.count() > 1:
                # Keep the first one, mark others as duplicates
                duplicate_profiles.extend(profiles[1:])

        self.stdout.write(f"Found {users_without_profiles.count()} users without profiles")
        self.stdout.write(f"Found {orphaned_profiles.count()} orphaned profiles")
        self.stdout.write(f"Found {len(duplicate_profiles)} duplicate profiles")

        if not dry_run:
            with transaction.atomic():
                # Create missing profiles
                for user in users_without_profiles:
                    UserProfile.objects.get_or_create(user=user)
                    self.stdout.write(
                        self.style.SUCCESS(f'Created profile for user: {user.email}')
                    )

                # Delete orphaned profiles
                deleted_orphaned = orphaned_profiles.delete()
                if deleted_orphaned[0] > 0:
                    self.stdout.write(
                        self.style.SUCCESS(f'Deleted {deleted_orphaned[0]} orphaned profiles')
                    )

                # Delete duplicate profiles
                for profile in duplicate_profiles:
                    profile.delete()
                    self.stdout.write(
                        self.style.SUCCESS(f'Deleted duplicate profile for user: {profile.user.email}')
                    )

                self.stdout.write(
                    self.style.SUCCESS('Cleanup completed successfully!')
                )
        else:
            self.stdout.write(
                self.style.WARNING('Run without --dry-run to apply changes')
            )
