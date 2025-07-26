Write-Host "Setting up local development environment..." -ForegroundColor Green

# Clear any production database environment variables
$env:DB_NAME = $null
$env:DB_USER = $null
$env:DB_PASSWORD = $null
$env:DB_HOST = $null
$env:DB_PORT = $null

# Set Django to use development settings
$env:DJANGO_SETTINGS_MODULE = "config.settings.development"

Write-Host "Environment configured for development." -ForegroundColor Yellow
Write-Host "Running migrations..." -ForegroundColor Blue
python manage.py migrate

Write-Host "Starting development server..." -ForegroundColor Green
python manage.py runserver 