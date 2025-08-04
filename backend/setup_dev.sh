#!/bin/bash

# Recipe Sharing Platform Development Setup Script for Linux/macOS
# This script helps initialize the development environment

echo "🚀 Setting up Recipe Sharing Platform Development Environment"
echo "==========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${CYAN}🔄 $1${NC}"
}

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed or not in PATH"
    echo "Please install Python 3 and try again."
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1)
print_status "Python found: $PYTHON_VERSION"

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    print_error "pip3 is not installed or not in PATH"
    echo "Please install pip3 and try again."
    exit 1
fi

PIP_VERSION=$(pip3 --version 2>&1)
print_status "pip found: $PIP_VERSION"

# Check if we're in the backend directory
if [ ! -f "manage.py" ]; then
    print_error "This script must be run from the backend directory"
    echo "Please navigate to the backend directory and run this script again."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_info "Creating virtual environment..."
    if run_command "python3 -m venv venv" "Creating virtual environment"; then
        print_status "Virtual environment created successfully"
        print_warning "Please activate the virtual environment before running this script:"
        echo "   source venv/bin/activate"
        echo "   Then run this script again."
        exit 0
    else
        print_error "Failed to create virtual environment."
        exit 1
    fi
else
    print_status "Virtual environment found"
fi

# Function to run commands and handle errors
run_command() {
    local command="$1"
    local description="$2"
    
    print_info "$description..."
    if eval "$command" 2>&1; then
        print_status "$description completed successfully"
        return 0
    else
        print_error "$description failed"
        return 1
    fi
}

# Create necessary directories
echo ""
print_info "Creating necessary directories..."
directories=("media" "staticfiles" "logs")
for directory in "${directories[@]}"; do
    if [ ! -d "$directory" ]; then
        mkdir -p "$directory"
        print_status "Created directory: $directory"
    else
        print_status "Directory already exists: $directory"
    fi
done

# Install dependencies
if ! run_command "pip3 install -r requirements/base.txt" "Installing Python dependencies"; then
    print_error "Failed to install dependencies. Please check your Python environment."
    exit 1
fi

# Run migrations
if ! run_command "python3 manage.py makemigrations" "Creating database migrations"; then
    print_error "Failed to create migrations."
    exit 1
fi

if ! run_command "python3 manage.py migrate" "Applying database migrations"; then
    print_error "Failed to apply migrations."
    exit 1
fi

# Create superuser (optional)
echo ""
read -p "👤 Would you like to create a superuser account? (y/n): " create_superuser

if [[ $create_superuser =~ ^[Yy]$ ]] || [[ $create_superuser =~ ^[Yy][Ee][Ss]$ ]]; then
    run_command "python3 manage.py createsuperuser" "Creating superuser account"
fi

# Collect static files
if ! run_command "python3 manage.py collectstatic --noinput" "Collecting static files"; then
    print_error "Failed to collect static files."
    exit 1
fi

echo ""
echo "==========================================================="
print_status "Development environment setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Start the Django development server:"
echo "   python3 manage.py runserver"
echo ""
echo "2. In another terminal, navigate to the frontend directory and run:"
echo "   npm install"
echo "   npm start"
echo ""
echo "3. Access the application at:"
echo "   - Frontend: http://localhost:4200"
echo "   - Backend API: http://localhost:8000/api/v1/"
echo "   - Django Admin: http://localhost:8000/admin/"
echo ""
echo "📝 Development Notes:"
echo "- Database: SQLite (db.sqlite3)"
echo "- Email: Console backend (emails printed to console)"
echo "- Cache: Local memory (no Redis)"
echo "- Media files: Stored locally in 'media' directory"
echo "- Debug toolbar: Available at http://localhost:8000/__debug__/"
echo ""
read -p "Press Enter to exit" 