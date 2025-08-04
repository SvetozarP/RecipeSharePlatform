# Recipe Sharing Platform - Development Setup

This guide will help you set up the development environment for the Recipe Sharing Platform.

## Prerequisites

- **Python 3.8+** (with pip)
- **Node.js 20+** (with npm)
- **Git**

## Quick Start

### Windows

#### Option 1: Using Command Prompt (cmd)
1. **Clone the repository** (if not already done):
   ```cmd
   git clone https://github.com/SvetozarP/RecipeSharePlatform
   cd "Recipe sharing platform"
   ```

2. **Setup Backend**:
   ```cmd
   cd backend
   # Create and activate virtual environment
   python -m venv venv
   venv\Scripts\activate
   setup_dev.bat
   ```

3. **Setup Frontend**:
   ```cmd
   cd ../frontend
   npm install
   ```

4. **Start Development Servers**:

   **Terminal 1 (Backend)**:
   ```cmd
   cd backend
   venv\Scripts\activate
   python manage.py runserver
   ```

   **Terminal 2 (Frontend)**:
   ```cmd
   cd frontend
   npm start
   ```

#### Option 2: Using PowerShell
1. **Clone the repository** (if not already done):
   ```powershell
   git clone https://github.com/SvetozarP/RecipeSharePlatform
   cd "Recipe sharing platform"
   ```

2. **Setup Backend** (choose one):
   ```powershell
   cd backend
   # Create and activate virtual environment
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   
   # Option A: Run the Python setup script
   python setup_dev.py
   
   # Option B: Run the PowerShell setup script
   .\setup_dev.ps1
   ```

3. **Setup Frontend**:
   ```powershell
   cd ../frontend
   npm install
   ```

4. **Start Development Servers**:

   **Terminal 1 (Backend)**:
   ```powershell
   cd backend
   .\venv\Scripts\Activate.ps1
   python manage.py runserver
   ```

   **Terminal 2 (Frontend)**:
   ```powershell
   cd frontend
   npm start
   ```

### Linux/macOS

1. **Clone the repository** (if not already done):
   ```bash
   git clone https://github.com/SvetozarP/RecipeSharePlatform
   cd "Recipe sharing platform"
   ```

2. **Setup Backend** (choose one):
   ```bash
   cd backend
   # Create and activate virtual environment
   python3 -m venv venv
   source venv/bin/activate
   
   # Option A: Run the Python setup script
   python3 setup_dev.py
   
   # Option B: Run the shell setup script
   chmod +x setup_dev.sh
   ./setup_dev.sh
   ```

3. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start Development Servers**:

   **Terminal 1 (Backend)**:
   ```bash
   cd backend
   source venv/bin/activate
   python3 manage.py runserver
   ```

   **Terminal 2 (Frontend)**:
   ```bash
   cd frontend
   npm start
   ```

## Manual Setup

### Backend Setup

#### Windows - Command Prompt (cmd)
1. **Navigate to backend directory**:
   ```cmd
   cd backend
   ```

2. **Create and activate virtual environment**:
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install Python dependencies**:
   ```cmd
   pip install -r requirements/base.txt
   ```

3. **Run database migrations**:
   ```cmd
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Create superuser (optional)**:
   ```cmd
   python manage.py createsuperuser
   ```

5. **Collect static files**:
   ```cmd
   python manage.py collectstatic --noinput
   ```

6. **Start the development server**:
   ```cmd
   # Make sure virtual environment is activated
   venv\Scripts\activate
   python manage.py runserver
   ```

#### Windows - PowerShell
1. **Navigate to backend directory**:
   ```powershell
   cd backend
   ```

2. **Create and activate virtual environment**:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install Python dependencies**:
   ```powershell
   pip install -r requirements/base.txt
   ```

3. **Run database migrations**:
   ```powershell
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Create superuser (optional)**:
   ```powershell
   python manage.py createsuperuser
   ```

5. **Collect static files**:
   ```powershell
   python manage.py collectstatic --noinput
   ```

6. **Start the development server**:
   ```powershell
   # Make sure virtual environment is activated
   .\venv\Scripts\Activate.ps1
   python manage.py runserver
   ```

#### Linux/macOS
1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip3 install -r requirements/base.txt
   ```

3. **Run database migrations**:
   ```bash
   python3 manage.py makemigrations
   python3 manage.py migrate
   ```

4. **Create superuser (optional)**:
   ```bash
   python3 manage.py createsuperuser
   ```

5. **Collect static files**:
   ```bash
   python3 manage.py collectstatic --noinput
   ```

6. **Start the development server**:
   ```bash
   # Make sure virtual environment is activated
   source venv/bin/activate
   python3 manage.py runserver
   ```

### Frontend Setup

#### Windows - Command Prompt (cmd)
1. **Navigate to frontend directory**:
   ```cmd
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```cmd
   npm install
   ```

3. **Start the development server**:
   ```cmd
   npm start
   ```

#### Windows - PowerShell
1. **Navigate to frontend directory**:
   ```powershell
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```powershell
   npm install
   ```

3. **Start the development server**:
   ```powershell
   npm start
   ```

#### Linux/macOS
1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

## Development Environment Configuration

### Backend Configuration (`backend/config/settings/development.py`)

- **Database**: SQLite3 (`db.sqlite3`)
- **Email**: Console backend (emails printed to console with verification links)
- **Cache**: Local memory (no Redis)
- **Media files**: Stored locally in `media/` directory
- **Debug**: Enabled with debug toolbar
- **CORS**: Configured for `http://localhost:4200`

### Frontend Configuration (`frontend/src/environments/environment.ts`)

- **API URL**: `http://localhost:8000/api/v1`
- **Production**: `false`
- **App Name**: "Recipe Sharing Platform"

## Access Points

- **Frontend Application**: http://localhost:4200
- **Backend API**: http://localhost:8000/api/v1/
- **Django Admin**: http://localhost:8000/admin/
- **Debug Toolbar**: http://localhost:8000/__debug__/

## Development Features

### Backend
- ✅ SQLite database for easy development
- ✅ Console email backend (emails printed to console with verification links)
- ✅ Local file storage (no cloud storage)
- ✅ Debug toolbar for development
- ✅ Comprehensive logging
- ✅ CORS configured for frontend

### Frontend
- ✅ Hot reload development server
- ✅ TypeScript compilation
- ✅ Angular Material components
- ✅ Tailwind CSS styling
- ✅ ESLint for code quality

## File Structure

```
Recipe sharing platform/
├── backend/
│   ├── config/settings/development.py  # Development settings
│   ├── manage.py                       # Django management
│   ├── setup_dev.py                    # Python setup script (cross-platform)
│   ├── setup_dev.bat                   # Windows cmd setup script
│   ├── setup_dev.ps1                   # PowerShell setup script
│   ├── setup_dev.sh                    # Linux/macOS shell script
│   ├── venv/                           # Python virtual environment
│   ├── media/                          # Uploaded files
│   ├── staticfiles/                    # Collected static files
│   └── db.sqlite3                      # SQLite database
└── frontend/
    ├── src/environments/environment.ts # Development environment
    ├── package.json                    # Node.js dependencies
    └── angular.json                    # Angular configuration
```

## Troubleshooting

### Common Issues

1. **Port already in use**:
   - Backend: Change port with `python manage.py runserver 8001`
   - Frontend: Change port with `npm start -- --port 4201`

2. **Database issues**:
   ```cmd
   cd backend
   venv\Scripts\activate
   python manage.py migrate --run-syncdb
   ```
   ```powershell
   cd backend
   .\venv\Scripts\Activate.ps1
   python manage.py migrate --run-syncdb
   ```
   ```bash
   cd backend
   source venv/bin/activate
   python3 manage.py migrate --run-syncdb
   ```

3. **Static files not loading**:
   ```cmd
   cd backend
   venv\Scripts\activate
   python manage.py collectstatic --noinput
   ```
   ```powershell
   cd backend
   .\venv\Scripts\Activate.ps1
   python manage.py collectstatic --noinput
   ```
   ```bash
   cd backend
   source venv/bin/activate
   python3 manage.py collectstatic --noinput
   ```

4. **Node modules issues**:
   ```cmd
   cd frontend
   rmdir /s /q node_modules
   del package-lock.json
   npm install
   ```
   ```powershell
   cd frontend
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   npm install
   ```
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

### Environment Variables

No environment variables are required for development. All configuration is handled in the development settings files.

## Virtual Environment Management

### Activating Virtual Environment

#### Windows - Command Prompt (cmd)
```cmd
cd backend
venv\Scripts\activate
```

#### Windows - PowerShell
```powershell
cd backend
.\venv\Scripts\Activate.ps1
```

#### Linux/macOS
```bash
cd backend
source venv/bin/activate
```

### Deactivating Virtual Environment
```bash
deactivate
```

### Recreating Virtual Environment
If you need to recreate the virtual environment:

1. **Delete the existing environment**:
   ```cmd
   # Windows (cmd)
   rmdir /s /q venv
   ```
   ```powershell
   # Windows (PowerShell)
   Remove-Item -Recurse -Force venv
   ```
   ```bash
   # Linux/macOS
   rm -rf venv
   ```

2. **Create new environment**:
   ```cmd
   # Windows (cmd)
   python -m venv venv
   venv\Scripts\activate
   ```
   ```powershell
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
   ```bash
   # Linux/macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Reinstall dependencies**:
   ```bash
   pip install -r requirements/base.txt
   ```

## Development Workflow

1. **Backend changes**: Django will auto-reload on file changes
2. **Frontend changes**: Angular CLI will auto-reload on file changes
3. **Database changes**: Run `python manage.py makemigrations && python manage.py migrate`
4. **New dependencies**: 
   - Backend: `pip install <package>` then update `requirements/base.txt`
   - Frontend: `npm install <package>`

## Email Testing in Development

Since the development environment uses the console email backend, all emails are printed to the console instead of being sent. This includes:

### Email Verification Links
When a user registers or requests email verification, you'll see output like:
```
📧 Email verification would be sent to user@example.com
🔗 Verification link: http://localhost:4200/auth/verify-email/MTE/abc123token
📝 Email subject: [Recipe Sharing] Please verify your email
================================================================================
```

### Password Reset Links
When a user requests a password reset, you'll see output like:
```
📧 Password reset email would be sent to user@example.com
🔗 Reset link: http://localhost:4200/auth/reset-password/MTE/abc123token
📝 Email subject: [Recipe Sharing] Password Reset Request
================================================================================
```

### Testing Email Functionality
1. **Register a new user** - Check the console for verification link
2. **Request password reset** - Check the console for reset link
3. **Resend verification email** - Check the console for new verification link
4. **Copy the links** from console output and test them in your browser

This makes it easy to test email-related functionality without setting up an email server.

## Testing

### Backend Tests
```cmd
cd backend
venv\Scripts\activate
python manage.py test
```
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py test
```
```bash
cd backend
source venv/bin/activate
python3 manage.py test
```

### Frontend Tests
```cmd
cd frontend
npm test
```
```powershell
cd frontend
npm test
```
```bash
cd frontend
npm test
```

## Production Deployment

This setup is for development only.