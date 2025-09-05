# Development Guide

Complete setup and development instructions for the Grocery List Manager application.

## Quick Start Options

### Option 1: Docker Setup (Recommended)

**Prerequisites**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

**Setup**
```bash
# Clone the repository
git clone https://github.com/cathy-dctp/grocery-app.git
cd grocery-app

# Start all services
docker-compose up
```

The app will be running at [http://localhost:8000](http://localhost:8000)

- Frontend and backend served from single container
- PostgreSQL database automatically configured
- Test data pre-loaded with sample grocery lists
- Production-ready deployment configuration

### Option 2: Local Development Setup

**Prerequisites**
- **Node.js 18+** and npm - [Download here](https://nodejs.org/)
- **Python 3.11+** - [Download here](https://www.python.org/downloads/)

**Backend Setup**
```bash
# Clone repository
git clone https://github.com/cathy-dctp/grocery-app.git
cd grocery-app

# Run Docker for database
docker-compose up db -d

# Set up Python virtual environment
cd backend
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Migrate if any new migrations
python manage.py migrate

# Start backend server
python manage.py runserver 0.0.0.0:8000
```

**Frontend Setup** (in a new terminal)
```bash
cd grocery-app/frontend

# Install dependencies
npm install

# Start development server
npm start
```

**Access the application:**
- Frontend: [http://localhost:4200](http://localhost:4200)
- Backend API: [http://localhost:8000/api](http://localhost:8000/api)

## Testing

### Backend Testing (Django TestCase, Factory Boy)

```bash
# Run all backend tests
make test

# Or with virtual environment
cd backend && source venv/bin/activate
python manage.py test
```

### Frontend Testing (Jasmine/Karma for unit tests)

```bash
# Run all frontend tests
cd frontend && npm install && npm test
```

### End-to-End Testing (Cypress)

Note: Cypress is not working fully due to time constraint

```bash
cd frontend && npm run e2e
```

## Code Quality & Linting

### Frontend (ESLint + Prettier)

```bash
# Check linting
cd frontend && npm run lint

# Fix auto-fixable linting issues
cd frontend && npm run lint:fix

# Check code formatting
cd frontend && npm run format:check

# Fix code formatting
cd frontend && npm run format
```

### Backend (Flake8 + Black + isort)

```bash
# Activate virtual environment
cd backend && source venv/bin/activate

# Check all linting (Flake8, Black, isort)
python -m flake8 .
python -m black --check .
python -m isort --check-only .

# Fix formatting
python -m black .
python -m isort .
```

## Development Workflow

### Backend Development

1. **Activate Virtual Environment**
   ```bash
   cd backend && source venv/bin/activate
   ```

2. **Database Migrations**
   ```bash
   # Create migrations after model changes
   python manage.py makemigrations

   # Apply migrations
   python manage.py migrate

   # Check migration status
   python manage.py showmigrations
   ```

3. **Django Management Commands**
   ```bash
   # Create superuser
   python manage.py createsuperuser

   # Access Django shell
   python manage.py shell

   # Collect static files (production)
   python manage.py collectstatic
   ```

### Frontend Development

1. **Development Server**
   ```bash
   cd frontend && npm start
   ```

2. **Building for Production**
   ```bash
   npm run build
   ```

3. **Running Tests**
   ```bash
   # Unit tests
   npm test

   # Unit tests with coverage
   npm test -- --code-coverage

   # E2E tests
   npm run e2e
   ```

### Docker Development

1. **Container Management**
   ```bash
   # Start services
   docker-compose up

   # Start services in background
   docker-compose up -d

   # Stop services
   docker-compose down

   # Rebuild containers
   docker-compose up --build

   # View logs
   docker-compose logs

   # Access running container
   docker exec -it grocery-app bash
   ```

2. **Database Operations in Docker**
   ```bash
   # Run migrations
   docker exec grocery-app python manage.py migrate

   # Create superuser
   docker exec grocery-app python manage.py createsuperuser

   # Access Django shell
   docker exec -it grocery-app python manage.py shell
   ```

## API Testing

### Authentication Flow

```bash
# 1. Login and get token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "password123"}'

# Response: {"user": {...}, "token": "abc123xyz..."}

# 2. Use token for authenticated requests
TOKEN="your_token_here"
curl -H "Authorization: Token $TOKEN" \
  http://localhost:8000/api/grocery-lists/
```

### Common API Operations

```bash
# Get grocery lists
curl -H "Authorization: Token $TOKEN" \
  http://localhost:8000/api/grocery-lists/

# Create new list
curl -X POST http://localhost:8000/api/grocery-lists/ \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Weekly Shopping"}'

# Add item to list
curl -X POST http://localhost:8000/api/grocery-lists/1/add_item/ \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"item_id": 5, "quantity": 2, "unit": "lbs"}'
```

For complete API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :8000
   lsof -i :4200

   # Kill process
   kill -9 <PID>
   ```

2. **Database Connection Issues**
   ```bash
   # Ensure PostgreSQL container is running
   docker-compose ps

   # Restart database
   docker-compose restart db
   ```

3. **Node Modules Issues**
   ```bash
   # Clear npm cache and reinstall
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Python Virtual Environment Issues**
   ```bash
   # Recreate virtual environment
   cd backend
   rm -rf venv
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

## CI/CD Pipeline
View pipeline status: [GitHub Actions](https://github.com/cathy-dctp/grocery-app/actions)