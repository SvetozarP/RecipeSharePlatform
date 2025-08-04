# Recipe Sharing Platform Development Setup Script for PowerShell
# This script helps initialize the development environment on Windows

Write-Host "🚀 Setting up Recipe Sharing Platform Development Environment" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python and try again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if pip is available
try {
    $pipVersion = pip --version 2>&1
    Write-Host "✅ pip found: $pipVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: pip is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install pip and try again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if we're in the backend directory
if (-not (Test-Path "manage.py")) {
    Write-Host "❌ Error: This script must be run from the backend directory" -ForegroundColor Red
    Write-Host "Please navigate to the backend directory and run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "`n🐍 Creating virtual environment..." -ForegroundColor Cyan
    if (Run-Command "python -m venv venv" "Creating virtual environment") {
        Write-Host "✅ Virtual environment created successfully" -ForegroundColor Green
        Write-Host "⚠️  Please activate the virtual environment before running this script:" -ForegroundColor Yellow
        Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
        Write-Host "   Then run this script again." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 0
    } else {
        Write-Host "❌ Failed to create virtual environment." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "✅ Virtual environment found" -ForegroundColor Green
}

# Function to run commands and handle errors
function Run-Command {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "`n🔄 $Description..." -ForegroundColor Cyan
    try {
        $result = Invoke-Expression $Command 2>&1
        Write-Host "✅ $Description completed successfully" -ForegroundColor Green
        if ($result) {
            Write-Host $result
        }
        return $true
    } catch {
        Write-Host "❌ $Description failed:" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        return $false
    }
}

# Create necessary directories
Write-Host "`n📁 Creating necessary directories..." -ForegroundColor Cyan
$directories = @('media', 'staticfiles', 'logs')
foreach ($directory in $directories) {
    if (-not (Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
        Write-Host "✅ Created directory: $directory" -ForegroundColor Green
    } else {
        Write-Host "✅ Directory already exists: $directory" -ForegroundColor Green
    }
}

# Install dependencies
if (-not (Run-Command "pip install -r requirements/base.txt" "Installing Python dependencies")) {
    Write-Host "❌ Failed to install dependencies. Please check your Python environment." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Run migrations
if (-not (Run-Command "python manage.py makemigrations" "Creating database migrations")) {
    Write-Host "❌ Failed to create migrations." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Run-Command "python manage.py migrate" "Applying database migrations")) {
    Write-Host "❌ Failed to apply migrations." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Create superuser (optional)
Write-Host "`n👤 Would you like to create a superuser account? (y/n): " -NoNewline -ForegroundColor Yellow
$createSuperuser = Read-Host

if ($createSuperuser -eq 'y' -or $createSuperuser -eq 'yes') {
    Run-Command "python manage.py createsuperuser" "Creating superuser account"
}

# Collect static files
if (-not (Run-Command "python manage.py collectstatic --noinput" "Collecting static files")) {
    Write-Host "❌ Failed to collect static files." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`n" + "=" * 60 -ForegroundColor Green
Write-Host "✅ Development environment setup completed!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the Django development server:" -ForegroundColor White
Write-Host "   python manage.py runserver" -ForegroundColor Gray
Write-Host "`n2. In another terminal, navigate to the frontend directory and run:" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host "`n3. Access the application at:" -ForegroundColor White
Write-Host "   - Frontend: http://localhost:4200" -ForegroundColor Gray
Write-Host "   - Backend API: http://localhost:8000/api/v1/" -ForegroundColor Gray
Write-Host "   - Django Admin: http://localhost:8000/admin/" -ForegroundColor Gray
Write-Host "`n📝 Development Notes:" -ForegroundColor Cyan
Write-Host "- Database: SQLite (db.sqlite3)" -ForegroundColor Gray
Write-Host "- Email: Console backend (emails printed to console)" -ForegroundColor Gray
Write-Host "- Cache: Local memory (no Redis)" -ForegroundColor Gray
Write-Host "- Media files: Stored locally in 'media' directory" -ForegroundColor Gray
Write-Host "- Debug toolbar: Available at http://localhost:8000/__debug__/" -ForegroundColor Gray

Read-Host "`nPress Enter to exit" 