# Development Setup - Hot Reload

## Prerequisites
- Python 3.10+ installed
- Node.js 18+ installed
- Docker & Docker Compose

## Setup Instructions

### 1. Start Database
```bash
# Start only the database container
docker-compose up db -d
```

### 2. Setup Backend (Django)

**⚠️ IMPORTANT: You MUST use the virtual environment to avoid dependency conflicts**

```bash
# From wherever you are, go to project root
cd /Users/cathyp/projects/grocery-app/backend

# Create virtual environment (first time only)
python3 -m venv venv

# 🔴 CRITICAL: Activate virtual environment (EVERY TIME)
source venv/bin/activate  # On Windows: venv\Scripts\activate
# Your prompt should now show: (venv) user@machine:~/path$

# Install dependencies (first time only)
pip install -r requirements.txt

# Run migrations (first time only)
python manage.py migrate

# Seed test data (first time only)
python manage.py seed_data

# Start Django dev server
python manage.py runserver 0.0.0.0:8000
```

**🔍 How to verify virtual environment is active:**
- Your terminal prompt shows `(venv)` at the beginning
- `which python` should show: `/Users/cathyp/projects/grocery-app/backend/venv/bin/python`
- If you don't see `(venv)`, run `source venv/bin/activate` again

### 3. Setup Frontend (Angular) - New Terminal
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start Angular dev server with hot reload
npm start
```

## Access Points
- **Frontend**: http://localhost:4200 (with hot reload)
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin

## Test Users
- **admin/admin123** (superuser)
- **john_doe/password123** (regular user)
- **jane_smith/password123** (regular user)

## Development Workflow
1. **Always activate venv first**: `cd backend && source venv/bin/activate`
2. Make frontend changes → automatic reload at localhost:4200  
3. Make backend changes → restart Django server (keep venv active)
4. Database persists in Docker container

## Quick Commands Reference
```bash
# Terminal 1: Backend (run these in order)
cd /Users/cathyp/projects/grocery-app
docker-compose up db -d
python manage.py migrate # Apply migrations if any
cd backend
source venv/bin/activate  # Look for (venv) in prompt!
python manage.py runserver 0.0.0.0:8000

# Terminal 2: Frontend  
cd /Users/cathyp/projects/grocery-app/frontend
npm start
```

## Troubleshooting
- If API calls fail, ensure Django is running on port 8000
- If database connection fails, ensure `docker-compose up db -d` is running
- Frontend proxy is configured to forward `/api/*` to `localhost:8000`

## Return to Docker
```bash
# Stop services
# Ctrl+C both Django and Angular servers
# Stop database
docker-compose down

# Resume normal Docker development
docker-compose up
```