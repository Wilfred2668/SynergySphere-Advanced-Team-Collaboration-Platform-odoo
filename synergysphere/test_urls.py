#!/usr/bin/env python
import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'synergysphere.settings')
django.setup()

from django.urls import reverse
from rest_framework.routers import DefaultRouter
from apps.users.views import AdminUserManagementViewSet

# Create a router and register the viewset
router = DefaultRouter()
router.register(r'admin', AdminUserManagementViewSet, basename='admin-users')

# Print all URLs
print("Generated URLs:")
for pattern in router.urls:
    print(f"Pattern: {pattern.pattern}")
    print(f"Name: {pattern.name}")
    print("---")
