#!/bin/bash

# Production deployment script for Recipe Sharing Platform
# Automatically enables performance monitoring and optimizations

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Set production environment
export DJANGO_ENV=production
export DJANGO_SETTINGS_MODULE=config.settings.production

echo "📋 Environment Configuration:"
echo "  - DJANGO_ENV: $DJANGO_ENV"
echo "  - DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements/production.txt

# Run database migrations
echo "🗄️  Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Create logs directory
echo "📝 Creating logs directory..."
mkdir -p logs

# Verify performance monitoring is enabled
echo "🔍 Verifying performance monitoring configuration..."
python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
import django
django.setup()
from django.conf import settings
print(f'Performance monitoring enabled: {settings.PERFORMANCE_MONITORING_ENABLED}')
print(f'Middleware count: {len(settings.MIDDLEWARE)}')
print(f'Cache backend: {settings.CACHES[\"default\"][\"BACKEND\"]}')
"

# Run tests to ensure everything works
echo "🧪 Running tests..."
python manage.py test --noinput

echo "✅ Production deployment completed successfully!"
echo ""
echo "🎯 Performance optimizations are now enabled:"
echo "  - Response compression"
echo "  - Response caching"
echo "  - ETag support"
echo "  - Performance headers"
echo "  - Query optimization"
echo "  - Performance monitoring"
echo ""
echo "📊 Monitor performance at: /api/v1/admin/performance/" 