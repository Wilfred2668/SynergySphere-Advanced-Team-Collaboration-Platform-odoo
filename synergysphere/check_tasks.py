#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'synergysphere.settings')
django.setup()

from apps.tasks.models import Task
from apps.projects.models import Project, ProjectMember
from django.contrib.auth import get_user_model

User = get_user_model()

# Check the failing task IDs
task_ids = ['14dbb415-d57e-46d2-97d8-00d961466849', '98fcc408-41f5-4441-92ae-050d22b40b35']

print("Checking failing tasks:")
for task_id in task_ids:
    try:
        task = Task.objects.get(id=task_id)
        print(f'\nTask: {task.title}')
        print(f'Project: {task.project.name if task.project else "No project"}')
        print(f'Assignee: {task.assignee.email if task.assignee else "Unassigned"}')
        print('Project members:')
        if task.project:
            for member in task.project.members.all():
                print(f'  - {member.user.email} (role: {member.role})')
        else:
            print('  No project members (no project)')
    except Task.DoesNotExist:
        print(f'Task {task_id} not found')

# Check what user1@gmail.com (ID: 1) can access
print("\n" + "="*50)
print("Checking user1@gmail.com access:")
user = User.objects.get(email='user1@gmail.com')
print(f"User: {user.email} (ID: {user.id}, Role: {user.role})")

# Check project memberships
print("\nProject memberships:")
memberships = ProjectMember.objects.filter(user=user)
for membership in memberships:
    print(f"  - {membership.project.name} (role: {membership.role})")

if not memberships.exists():
    print("  No project memberships found!")
