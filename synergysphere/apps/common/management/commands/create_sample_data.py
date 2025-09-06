from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.projects.models import Project, ProjectMember
from apps.tasks.models import Task
from apps.discussions.models import Discussion, DiscussionReply
from datetime import datetime, timedelta
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')
        
        # Create sample users
        self.create_sample_users()
        
        # Create sample projects
        self.create_sample_projects()
        
        # Create sample tasks
        self.create_sample_tasks()
        
        # Create sample discussions
        self.create_sample_discussions()
        
        self.stdout.write(self.style.SUCCESS('Sample data created successfully!'))

    def create_sample_users(self):
        users_data = [
            {
                'username': 'john_doe',
                'email': 'john@example.com',
                'first_name': 'John',
                'last_name': 'Doe',
                'bio': 'Project Manager with 5+ years of experience'
            },
            {
                'username': 'jane_smith',
                'email': 'jane@example.com',
                'first_name': 'Jane',
                'last_name': 'Smith',
                'bio': 'Full-stack developer passionate about clean code'
            },
            {
                'username': 'bob_wilson',
                'email': 'bob@example.com',
                'first_name': 'Bob',
                'last_name': 'Wilson',
                'bio': 'UI/UX designer focusing on user experience'
            },
            {
                'username': 'alice_brown',
                'email': 'alice@example.com',
                'first_name': 'Alice',
                'last_name': 'Brown',
                'bio': 'DevOps engineer and cloud specialist'
            }
        ]
        
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'bio': user_data['bio']
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'Created user: {user.username}')

    def create_sample_projects(self):
        users = list(User.objects.all())
        
        projects_data = [
            {
                'name': 'E-commerce Platform',
                'description': 'A modern e-commerce platform with React frontend and Django backend',
                'status': 'active'
            },
            {
                'name': 'Mobile App Development',
                'description': 'Cross-platform mobile application using React Native',
                'status': 'active'
            },
            {
                'name': 'Data Analytics Dashboard',
                'description': 'Real-time analytics dashboard for business intelligence',
                'status': 'on_hold'
            },
            {
                'name': 'API Integration Project',
                'description': 'Integration of multiple third-party APIs for data synchronization',
                'status': 'completed'
            }
        ]
        
        for project_data in projects_data:
            if not Project.objects.filter(name=project_data['name']).exists():
                project = Project.objects.create(
                    name=project_data['name'],
                    description=project_data['description'],
                    status=project_data['status'],
                    created_by=random.choice(users)
                )
                
                # Add random members to the project
                members = random.sample(users, random.randint(2, len(users)))
                for member in members:
                    ProjectMember.objects.get_or_create(
                        project=project,
                        user=member,
                        defaults={'role': random.choice(['owner', 'admin', 'member'])}
                    )
                
                self.stdout.write(f'Created project: {project.name}')

    def create_sample_tasks(self):
        projects = Project.objects.all()
        users = list(User.objects.all())
        
        tasks_data = [
            'Design user interface mockups',
            'Implement user authentication',
            'Set up database schema',
            'Create API endpoints',
            'Write unit tests',
            'Deploy to staging environment',
            'Conduct user testing',
            'Fix responsive design issues',
            'Optimize database queries',
            'Update documentation',
            'Implement search functionality',
            'Add email notifications',
            'Security audit and fixes',
            'Performance optimization',
            'Code review and refactoring'
        ]
        
        statuses = ['todo', 'in_progress', 'completed']
        
        for project in projects:
            # Create 5-10 tasks per project
            num_tasks = random.randint(5, 10)
            selected_tasks = random.sample(tasks_data, min(num_tasks, len(tasks_data)))
            
            for i, task_title in enumerate(selected_tasks):
                due_date = datetime.now().date() + timedelta(days=random.randint(1, 30))
                
                task = Task.objects.create(
                    title=task_title,
                    description=f'Detailed description for {task_title.lower()}. This task is part of the {project.name} project.',
                    project=project,
                    assignee=random.choice(users),
                    status=random.choice(statuses),
                    due_date=due_date,
                    created_by=random.choice(users)
                )
                
                self.stdout.write(f'Created task: {task.title} for {project.name}')

    def create_sample_discussions(self):
        projects = Project.objects.all()
        users = list(User.objects.all())
        
        discussion_topics = [
            'Project Requirements Discussion',
            'Technical Architecture Planning',
            'Weekly Status Update',
            'Bug Reports and Issues',
            'Feature Request Review',
            'Design Feedback Session',
            'Testing Strategy Discussion',
            'Deployment Planning Meeting',
            'Performance Optimization Ideas',
            'User Experience Improvements'
        ]
        
        for project in projects:
            # Create 3-5 discussions per project
            num_discussions = random.randint(3, 5)
            selected_topics = random.sample(discussion_topics, min(num_discussions, len(discussion_topics)))
            
            for topic in selected_topics:
                discussion = Discussion.objects.create(
                    title=topic,
                    content=f'Discussion about {topic.lower()} for the {project.name} project.',
                    project=project,
                    created_by=random.choice(users)
                )
                
                # Add some replies to the discussion
                num_replies = random.randint(1, 5)
                for i in range(num_replies):
                    reply_contents = [
                        'I think we should consider this approach...',
                        'Great idea! I agree with this proposal.',
                        'We might face some challenges with this implementation.',
                        'Let me look into this and get back to you.',
                        'This aligns well with our project goals.',
                        'I have some concerns about the timeline.',
                        'We should definitely move forward with this.',
                        'Can we schedule a meeting to discuss this further?'
                    ]
                    
                    DiscussionReply.objects.create(
                        discussion=discussion,
                        created_by=random.choice(users),
                        content=random.choice(reply_contents)
                    )
                
                self.stdout.write(f'Created discussion: {discussion.title} for {project.name}')
