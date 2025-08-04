@echo off
echo 🚀 Setting up Recipe Sharing Platform Development Environment
echo ============================================================

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Python is not installed or not in PATH
    echo Please install Python and try again.
    pause
    exit /b 1
)

REM Check if pip is available
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: pip is not installed or not in PATH
    echo Please install pip and try again.
    pause
    exit /b 1
)

REM Run the setup script
echo Running development setup script...
python setup_dev.py

if errorlevel 1 (
    echo ❌ Setup failed. Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ✅ Setup completed successfully!
echo.
echo 📋 To start the development servers:
echo 1. Backend: python manage.py runserver
echo 2. Frontend: cd ../frontend && npm install && npm start
echo.
pause 