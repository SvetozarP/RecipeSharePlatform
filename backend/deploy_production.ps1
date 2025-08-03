# Production deployment script for Recipe Sharing Platform (PowerShell)
# Automatically enables performance monitoring and optimizations

param(
    [switch]$SkipTests
)

# Stop on any error
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting production deployment..." -ForegroundColor Green

# Set production environment
$env:DJANGO_ENV = "production"
$env:DJANGO_SETTINGS_MODULE = "config.settings.production"

Write-Host "📋 Environment Configuration:" -ForegroundColor Cyan
Write-Host "  - DJANGO_ENV: $env:DJANGO_ENV"
Write-Host "  - DJANGO_SETTINGS_MODULE: $env:DJANGO_SETTINGS_MODULE"

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements/production.txt

# Run database migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
python manage.py migrate --noinput

# Collect static files
Write-Host "📁 Collecting static files..." -ForegroundColor Yellow
python manage.py collectstatic --noinput

# Create logs directory
Write-Host "📝 Creating logs directory..." -ForegroundColor Yellow
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs"
}

# Verify performance monitoring is enabled
Write-Host "🔍 Verifying performance monitoring configuration..." -ForegroundColor Yellow
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

# Run tests (unless skipped)
if (-not $SkipTests) {
    Write-Host "🧪 Running tests..." -ForegroundColor Yellow
    python manage.py test --noinput
} else {
    Write-Host "🧪 Skipping tests (--SkipTests flag used)" -ForegroundColor Yellow
}

Write-Host "✅ Production deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Performance optimizations are now enabled:" -ForegroundColor Cyan
Write-Host "  - Response compression"
Write-Host "  - Response caching"
Write-Host "  - ETag support"
Write-Host "  - Performance headers"
Write-Host "  - Query optimization"
Write-Host "  - Performance monitoring"
Write-Host ""
Write-Host "📊 Monitor performance at: /api/v1/admin/performance/" -ForegroundColor Cyan 