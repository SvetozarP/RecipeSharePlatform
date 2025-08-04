#!/usr/bin/env python
"""
Development setup script for the Recipe Sharing Platform backend.
This script helps initialize the development environment.
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors."""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def main():
    """Main setup function."""
    print("🚀 Setting up Recipe Sharing Platform Development Environment")
    print("=" * 60)
    
    # Check if we're in the backend directory
    if not Path('manage.py').exists():
        print("❌ Error: This script must be run from the backend directory")
        print("Please navigate to the backend directory and run this script again.")
        sys.exit(1)
    
    # Check if virtual environment exists
    venv_path = Path('venv')
    if not venv_path.exists():
        print("\n🐍 Creating virtual environment...")
        if not run_command("python -m venv venv", "Creating virtual environment"):
            print("❌ Failed to create virtual environment.")
            sys.exit(1)
        print("✅ Virtual environment created successfully")
        print("⚠️  Please activate the virtual environment before running this script:")
        print("   Windows (cmd): venv\\Scripts\\activate")
        print("   Windows (PowerShell): .\\venv\\Scripts\\Activate.ps1")
        print("   Linux/macOS: source venv/bin/activate")
        print("   Then run this script again.")
        sys.exit(0)
    else:
        print("✅ Virtual environment found")
    
    # Create necessary directories
    print("\n📁 Creating necessary directories...")
    directories = ['media', 'staticfiles', 'logs']
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✅ Created directory: {directory}")
    
    # Install dependencies
    if not run_command("pip install -r requirements/base.txt", "Installing Python dependencies"):
        print("❌ Failed to install dependencies. Please check your Python environment.")
        sys.exit(1)
    
    # Run migrations
    if not run_command("python manage.py makemigrations", "Creating database migrations"):
        print("❌ Failed to create migrations.")
        sys.exit(1)
    
    if not run_command("python manage.py migrate", "Applying database migrations"):
        print("❌ Failed to apply migrations.")
        sys.exit(1)
    
    # Create superuser (optional)
    print("\n👤 Would you like to create a superuser account? (y/n): ", end="")
    create_superuser = input().lower().strip()
    
    if create_superuser in ['y', 'yes']:
        run_command("python manage.py createsuperuser", "Creating superuser account")
    
    # Collect static files
    if not run_command("python manage.py collectstatic --noinput", "Collecting static files"):
        print("❌ Failed to collect static files.")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("✅ Development environment setup completed!")
    print("\n📋 Next steps:")
    print("1. Start the Django development server:")
    print("   python manage.py runserver")
    print("\n2. In another terminal, navigate to the frontend directory and run:")
    print("   npm install")
    print("   npm start")
    print("\n3. Access the application at:")
    print("   - Frontend: http://localhost:4200")
    print("   - Backend API: http://localhost:8000/api/v1/")
    print("   - Django Admin: http://localhost:8000/admin/")
    print("\n📝 Development Notes:")
    print("- Database: SQLite (db.sqlite3)")
    print("- Email: Console backend (emails printed to console)")
    print("- Cache: Local memory (no Redis)")
    print("- Media files: Stored locally in 'media' directory")
    print("- Debug toolbar: Available at http://localhost:8000/__debug__/")

if __name__ == '__main__':
    main() 