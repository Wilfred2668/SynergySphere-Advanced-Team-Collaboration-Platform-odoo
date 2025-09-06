#!/usr/bin/env python
"""
Setup script for SynergySphere backend.
This script helps with initial project setup and database initialization.
"""
import os
import sys
import subprocess
import platform


def run_command(command, description=""):
    """Run a command and handle errors."""
    print(f"📋 {description}")
    print(f"💻 Running: {command}")
    
    try:
        if platform.system() == "Windows":
            result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        else:
            result = subprocess.run(command.split(), check=True, capture_output=True, text=True)
        
        if result.stdout:
            print(f"✅ {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        if e.stderr:
            print(f"📝 Details: {e.stderr}")
        return False


def check_requirements():
    """Check if required tools are installed."""
    print("🔍 Checking requirements...")
    
    # Check Python version
    python_version = sys.version_info
    if python_version.major == 3 and python_version.minor >= 12:
        print(f"✅ Python {python_version.major}.{python_version.minor} detected")
    else:
        print(f"❌ Python 3.12+ required, found {python_version.major}.{python_version.minor}")
        return False
    
    # Check Docker
    try:
        subprocess.run(["docker", "--version"], check=True, capture_output=True)
        print("✅ Docker detected")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Docker not found. Please install Docker Desktop.")
        return False
    
    # Check Docker Compose
    try:
        subprocess.run(["docker-compose", "--version"], check=True, capture_output=True)
        print("✅ Docker Compose detected")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Docker Compose not found. Please install Docker Compose.")
        return False
    
    return True


def setup_environment():
    """Set up environment file."""
    print("\n🔧 Setting up environment...")
    
    if not os.path.exists('.env'):
        if os.path.exists('.env.example'):
            try:
                import shutil
                shutil.copy('.env.example', '.env')
                print("✅ Created .env file from .env.example")
                print("📝 Please edit .env file with your configurations")
            except Exception as e:
                print(f"❌ Failed to create .env file: {e}")
                return False
        else:
            print("❌ .env.example not found")
            return False
    else:
        print("✅ .env file already exists")
    
    return True


def start_services():
    """Start Docker services."""
    print("\n🐳 Starting Docker services...")
    
    # Change to backend directory if needed
    if not os.path.exists('docker-compose.yml'):
        print("❌ docker-compose.yml not found in current directory")
        return False
    
    return run_command("docker-compose up -d", "Starting PostgreSQL, pgAdmin, and Redis")


def setup_django():
    """Set up Django project."""
    print("\n🚀 Setting up Django project...")
    
    # Change to Django project directory
    if os.path.exists('synergysphere'):
        os.chdir('synergysphere')
    else:
        print("❌ synergysphere directory not found")
        return False
    
    # Make migrations
    if not run_command("python manage.py makemigrations", "Creating migrations"):
        return False
    
    # Apply migrations
    if not run_command("python manage.py migrate", "Applying migrations"):
        return False
    
    # Create superuser (interactive)
    print("\n👤 Creating superuser account...")
    print("📝 Please follow the prompts to create an admin user:")
    try:
        subprocess.run(["python", "manage.py", "createsuperuser"], check=True)
        print("✅ Superuser created successfully")
    except subprocess.CalledProcessError:
        print("❌ Failed to create superuser")
        return False
    except KeyboardInterrupt:
        print("\n⚠️ Superuser creation cancelled")
    
    return True


def show_success_message():
    """Show success message with next steps."""
    print("\n" + "="*60)
    print("🎉 SynergySphere Backend Setup Complete!")
    print("="*60)
    print()
    print("📋 Next Steps:")
    print("1. Edit .env file with your configurations")
    print("2. Start the Django development server:")
    print("   cd synergysphere")
    print("   python manage.py runserver")
    print()
    print("🌐 Access your application:")
    print("• Django Admin: http://127.0.0.1:8000/admin/")
    print("• API Documentation: http://127.0.0.1:8000/api/docs/")
    print("• pgAdmin: http://localhost:5050 (admin@synergysphere.com / admin123)")
    print()
    print("🔧 Optional - Start Celery for background tasks:")
    print("• Worker: celery -A synergysphere worker --loglevel=info")
    print("• Beat: celery -A synergysphere beat --loglevel=info")
    print()
    print("📚 Documentation: See README.md for detailed instructions")
    print("="*60)


def main():
    """Main setup function."""
    print("🚀 SynergySphere Backend Setup")
    print("="*40)
    
    # Check requirements
    if not check_requirements():
        print("\n❌ Requirements check failed. Please install missing dependencies.")
        sys.exit(1)
    
    # Setup environment
    if not setup_environment():
        print("\n❌ Environment setup failed.")
        sys.exit(1)
    
    # Start Docker services
    if not start_services():
        print("\n❌ Failed to start Docker services.")
        sys.exit(1)
    
    # Wait a moment for services to start
    print("⏳ Waiting for services to start...")
    import time
    time.sleep(10)
    
    # Setup Django
    if not setup_django():
        print("\n❌ Django setup failed.")
        sys.exit(1)
    
    # Show success message
    show_success_message()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Setup interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
