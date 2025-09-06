# SynergySphere - Advanced Team Collaboration Platform

A comprehensive Django REST Framework backend for team collaboration, project management, and communication.

## 🚀 Features

- **User Management**: JWT authentication, OTP verification (email/SMS), role-based access
- **Project Management**: Create projects, manage teams, file attachments, activity tracking
- **Task Management**: Kanban-style tasks, dependencies, time tracking, comments
- **Discussions**: Team forums, threaded conversations, voting system
- **Notifications**: Real-time notifications, email/SMS/push preferences
- **API Documentation**: Auto-generated Swagger/ReDoc documentation
- **Background Jobs**: Celery integration for email sending and async tasks

## 🛠 Tech Stack

- **Backend**: Django 5.0, Django REST Framework
- **Database**: PostgreSQL 16 with pgAdmin
- **Authentication**: JWT (SimpleJWT) + OTP verification
- **Background Jobs**: Celery + Redis
- **Email**: Pluggable email backends
- **SMS**: Pluggable SMS gateways (Twilio, AWS SNS)
- **API Docs**: drf-spectacular (Swagger & ReDoc)
- **Caching**: Redis
- **Environment**: Docker Compose for development

## 📋 Prerequisites

- Python 3.12+
- Docker & Docker Compose
- Git
- Virtual environment (venv/conda)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SynergySphere-Advanced-Team-Collaboration-Platform-odoo/backend
```

### 2. Environment Setup

```bash
# Activate your virtual environment
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Variables

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` file with your configurations:

```env
# Django Settings
SECRET_KEY=your-super-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Database Configuration
DB_NAME=synergysphere
DB_USER=synergy_user
DB_PASSWORD=synergy_password
DB_HOST=localhost
DB_PORT=5432

# Email Configuration (Update for production)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Add other configurations as needed...
```

### 4. Database Setup with Docker

Start PostgreSQL and pgAdmin:

```bash
docker-compose up -d
```

This will start:

- PostgreSQL on port 5432
- pgAdmin on port 5050 (admin@synergysphere.com / admin123)
- Redis on port 6379

### 5. Django Setup

Navigate to the Django project directory:

```bash
cd synergysphere
```

Run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

Create a superuser:

```bash
python manage.py createsuperuser
```

Load sample data (optional):

```bash
python manage.py loaddata fixtures/sample_data.json
```

### 6. Start Development Server

```bash
python manage.py runserver
```

The API will be available at:

- **API Base**: http://127.0.0.1:8000/api/v1/
- **Admin Panel**: http://127.0.0.1:8000/admin/
- **API Documentation**: http://127.0.0.1:8000/api/docs/
- **ReDoc**: http://127.0.0.1:8000/api/redoc/

### 7. Start Celery (Optional)

For background task processing:

```bash
# Start Celery worker (in a new terminal)
celery -A synergysphere worker --loglevel=info

# Start Celery beat scheduler (in another terminal)
celery -A synergysphere beat --loglevel=info
```

## 📚 API Endpoints

### Authentication

- `POST /api/v1/auth/register/` - User registration
- `POST /api/v1/auth/login/` - User login
- `POST /api/v1/auth/logout/` - User logout
- `POST /api/v1/auth/token/refresh/` - Refresh JWT token
- `POST /api/v1/auth/otp/send/` - Send OTP
- `POST /api/v1/auth/otp/verify/` - Verify OTP

### User Management

- `GET /api/v1/auth/profile/` - Get user profile
- `PUT /api/v1/auth/profile/update/` - Update profile
- `POST /api/v1/auth/password/change/` - Change password
- `POST /api/v1/auth/password/reset/request/` - Request password reset
- `POST /api/v1/auth/password/reset/` - Reset password

### Projects

- `GET /api/v1/projects/` - List projects
- `POST /api/v1/projects/` - Create project
- `GET /api/v1/projects/{id}/` - Get project details
- `PUT /api/v1/projects/{id}/` - Update project
- `DELETE /api/v1/projects/{id}/` - Delete project

### Tasks

- `GET /api/v1/tasks/` - List tasks
- `POST /api/v1/tasks/` - Create task
- `GET /api/v1/tasks/{id}/` - Get task details
- `PUT /api/v1/tasks/{id}/` - Update task
- `DELETE /api/v1/tasks/{id}/` - Delete task

### Discussions

- `GET /api/v1/discussions/` - List discussions
- `POST /api/v1/discussions/` - Create discussion
- `GET /api/v1/discussions/{id}/` - Get discussion details

### Notifications

- `GET /api/v1/notifications/` - List notifications
- `POST /api/v1/notifications/mark-all-read/` - Mark all as read
- `GET /api/v1/notifications/unread-count/` - Get unread count

## 🔐 Authentication

The API uses JWT authentication. After login, include the access token in headers:

```bash
Authorization: Bearer <access_token>
```

### OTP Verification

Email OTP is enabled by default. To enable SMS OTP:

1. Configure SMS provider in `.env`:

   ```env
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your-sid
   TWILIO_AUTH_TOKEN=your-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

2. Send OTP:
   ```bash
   POST /api/v1/auth/otp/send/
   {
       "verification_type": "phone",
       "contact_info": "+1234567890"
   }
   ```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs

# Rebuild services
docker-compose up --build
```

## 📊 Database Access

### pgAdmin Access

- URL: http://localhost:5050
- Email: admin@synergysphere.com
- Password: admin123

### Direct PostgreSQL Access

```bash
docker exec -it synergy_postgres psql -U synergy_user -d synergysphere
```

## 🧪 Testing

Run tests:

```bash
python manage.py test
```

Run with coverage:

```bash
coverage run --source='.' manage.py test
coverage report
coverage html
```

## 📁 Project Structure

```
synergysphere/
├── synergysphere/          # Main project settings
│   ├── settings.py         # Django settings
│   ├── urls.py            # Main URL configuration
│   ├── celery.py          # Celery configuration
│   └── wsgi.py            # WSGI configuration
├── apps/                  # Application modules
│   ├── common/            # Shared utilities
│   ├── users/             # User management
│   ├── projects/          # Project management
│   ├── tasks/             # Task management
│   ├── discussions/       # Discussion forums
│   └── notifications/     # Notification system
├── templates/             # Email templates
├── static/               # Static files
├── media/                # User uploads
├── fixtures/             # Sample data
└── manage.py             # Django management
```

## 🔧 Development

### Creating Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Adding Sample Data

Create fixtures in `fixtures/` directory and load:

```bash
python manage.py loaddata fixtures/users.json
python manage.py loaddata fixtures/projects.json
```

### Custom Management Commands

Create custom commands in `apps/<app>/management/commands/`:

```bash
python manage.py <command_name>
```

## 🚀 Production Deployment

### Environment Variables for Production

```env
DEBUG=False
SECRET_KEY=<strong-secret-key>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DB_HOST=<production-db-host>
DB_PASSWORD=<strong-db-password>

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST_USER=<production-email>
EMAIL_HOST_PASSWORD=<app-password>

# Security
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
```

### Collect Static Files

```bash
python manage.py collectstatic --noinput
```

### Database Optimization

```sql
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_notifications_recipient_read ON notifications(recipient_id, is_read);
CREATE INDEX CONCURRENTLY idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX CONCURRENTLY idx_project_members_user ON project_members(user_id, is_active);
```

## 🔍 Monitoring & Logging

Logs are configured in `settings.py` and written to:

- Console (development)
- `logs/django.log` (production)

### Health Check Endpoint

Create a health check view for monitoring:

```python
# apps/common/views.py
from django.http import JsonResponse
from django.db import connection

def health_check(request):
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")

        return JsonResponse({
            'status': 'healthy',
            'database': 'connected'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=503)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@synergysphere.com or create an issue in the repository.

---

**Made with ❤️ by the SynergySphere Team**
