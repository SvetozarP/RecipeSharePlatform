Write-Host "Setting up production deployment..." -ForegroundColor Green

# Set production environment variables (these should be set in your deployment environment)
# $env:DJANGO_SETTINGS_MODULE = "config.settings.production"
# $env:DB_NAME = "your_postgres_db_name"
# $env:DB_USER = "your_postgres_user"
# $env:DB_PASSWORD = "your_postgres_password"
# $env:DB_HOST = "your_postgres_host.postgres.database.azure.com"
# $env:DB_PORT = "5432"

Write-Host "Collecting static files..." -ForegroundColor Blue
python manage.py collectstatic --noinput

Write-Host "Running migrations..." -ForegroundColor Blue
python manage.py migrate

Write-Host "Checking deployment configuration..." -ForegroundColor Yellow
python manage.py check --deploy

Write-Host "Production deployment setup complete!" -ForegroundColor Green
Write-Host "Note: Make sure all environment variables are set in your production environment." -ForegroundColor Yellow 