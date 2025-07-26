#!/bin/bash
echo "🚀 Starting Azure App Service for Recipe Sharing Platform..."

# Wait for database to be ready
echo "📡 Checking database connection..."
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()
from django.db import connection
try:
    connection.ensure_connection()
    print('✅ Database connection successful')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
"

# Run migrations
echo "🔄 Running database migrations..."
python manage.py migrate --settings=config.settings.production --noinput

# Create admin user
echo "👤 Creating admin user..."
python manage.py create_admin --settings=config.settings.production

# Collect static files (in case not done during build)
echo "📦 Collecting static files..."
python manage.py collectstatic --settings=config.settings.production --noinput

echo "✅ Startup complete. Starting Gunicorn server..."

# Start Gunicorn server
exec gunicorn --bind 0.0.0.0:8000 --workers 2 --timeout 120 config.wsgi:application 