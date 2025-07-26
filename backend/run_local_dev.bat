@echo off
echo Setting up local development environment...

REM Clear any production database environment variables
set "DB_NAME="
set "DB_USER="
set "DB_PASSWORD="
set "DB_HOST="
set "DB_PORT="

REM Set Django to use development settings
set "DJANGO_SETTINGS_MODULE=config.settings.development"

echo Environment configured for development.
echo Running migrations...
python manage.py migrate

echo Starting development server...
python manage.py runserver 