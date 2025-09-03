# Grocery App - Development Progress

## Project Overview
A full-stack grocery list management application built with:
- **Backend**: Django + PostgreSQL + Django REST Framework
- **Frontend**: Angular 18+ with standalone components
- **Authentication**: Token-based authentication system
- **Deployment**: Docker containers

## Current Status ✅ 

### Backend (Django) - COMPLETED ✅
- ✅ **Models Created**: Category, Item, GroceryList, GroceryListItem
- ✅ **Database**: PostgreSQL (production), SQLite (development)
- ✅ **API Endpoints**: Full REST API with Django REST Framework
- ✅ **Authentication**: Token-based authentication with user filtering
- ✅ **CORS**: Configured for Angular frontend
- ✅ **Seed Data**: Test users and sample grocery data
- ✅ **Docker**: Single container serving both API and frontend

### Frontend (Angular) - COMPLETED ✅
- ✅ **Authentication**: Complete login/logout system with guards
- ✅ **Components**: Grocery lists, list details, login interface
- ✅ **Services**: API communication with automatic token handling
- ✅ **Routing**: Protected routes with authentication guards
- ✅ **Responsive Design**: Mobile-friendly UI with SCSS styling
- ✅ **TypeScript**: Proper interfaces and type safety

### API Endpoints Available
```
# Authentication
POST   /api/auth/login/      # Login with username/password
POST   /api/auth/logout/     # Logout and invalidate token
GET    /api/auth/me/         # Get current user info

# Grocery Management (All require authentication)
GET/POST   /api/categories/
GET/PUT/DELETE /api/categories/{id}/

GET/POST   /api/items/
GET/PUT/DELETE /api/items/{id}/

GET/POST   /api/grocery-lists/
GET/PUT/DELETE /api/grocery-lists/{id}/
POST       /api/grocery-lists/{id}/add_item/
POST       /api/grocery-lists/{id}/share_with/

GET/POST   /api/grocery-list-items/
GET/PUT/DELETE /api/grocery-list-items/{id}/
POST       /api/grocery-list-items/{id}/toggle_checked/
```

### Test Users Created
- **admin/admin123** (superuser)
- **john_doe/password123** (regular user with seed data)
- **jane_smith/password123** (regular user with seed data)


## Next Steps 🎯
- **Testing**: Write unit/integration tests for current features 

### Possible Enhancements/Features To Consider 
- **User Registration**: Allow new users to sign up (currently uses pre-seeded users)
- **Categories/Items Management**: Let users create/edit custom categories/items

### Not high priority 
- **Recipe Integration**: Generate grocery lists from saved recipes
- **Smart Suggestions**: Suggest items based on shopping history
- **Shopping Assignment**: Assign specific items to family members/show who adds what 

## Commands Reference

### Backend (Django)
```bash
# Run migrations
docker exec grocery-app python manage.py migrate

# Create superuser
docker exec grocery-app python manage.py createsuperuser

# Access Django shell
docker exec -it grocery-app python manage.py shell

# Restart containers
docker-compose down && docker-compose up --build
```

### Frontend (Angular)
```bash
# Development server
cd frontend && npm start
```

### Testing API
```bash
# 1. Login and get token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "password123"}'

# Response: {"user": {...}, "token": "abc123xyz..."}

# 2. Test authenticated endpoints (replace TOKEN with actual token)
TOKEN="your_token_here"

# Get user profile
curl -H "Authorization: Token $TOKEN" \
  http://localhost:8000/api/auth/me/

# Get grocery lists (user-filtered)
curl -H "Authorization: Token $TOKEN" \
  http://localhost:8000/api/grocery-lists/

# Get categories
curl -H "Authorization: Token $TOKEN" \
  http://localhost:8000/api/categories/

# Get items
curl -H "Authorization: Token $TOKEN" \
  http://localhost:8000/api/items/

# Create new grocery list
curl -X POST http://localhost:8000/api/grocery-lists/ \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My New List"}'

# Toggle item as checked/unchecked
curl -X POST http://localhost:8000/api/grocery-list-items/1/toggle_checked/ \
  -H "Authorization: Token $TOKEN"

# Logout (invalidates token)
curl -X POST http://localhost:8000/api/auth/logout/ \
  -H "Authorization: Token $TOKEN"

# 3. Test unauthenticated access (should fail)
curl http://localhost:8000/api/grocery-lists/
# Response: {"detail": "Authentication credentials were not provided."}
```

## Key Architecture Decisions

### Models Design
- **User-based filtering**: Users only see their own lists or shared lists
- **No priority field**: Simplified GroceryListItem (priority removed)
- **Flexible units**: Items have default units, can be overridden per list
- **Audit trail**: Created/updated timestamps, added_by/checked_by tracking

### API Design
- **Authentication required**: All endpoints need login with token
- **Pagination enabled**: 20 items per page default
- **Custom actions**: Special endpoints for add_item, share_with, toggle_checked
- **CORS configured**: Frontend served from same domain (localhost:8000)
- **User filtering**: All data filtered by authenticated user

### Development Environment
- **Docker setup**: Single container serving Angular + Django + PostgreSQL
- **Volume mounts**: Backend code mounted for hot reload development
- **Simplified architecture**: No nginx needed, WhiteNoise serves static files

## File Structure
```
grocery-app/
├── backend/
│   ├── grocery_list/
│   │   ├── models.py (User-based data models)
│   │   ├── serializers.py (API data formatting)  
│   │   ├── views.py (Authentication required endpoints)
│   │   ├── urls.py (API + auth routes)
│   │   ├── auth_views.py (Login/logout/me endpoints)
│   │   └── management/commands/seed_data.py (Test users & data)
│   ├── grocery_backend/
│   │   ├── settings.py (Token auth + CORS configured)
│   │   └── urls.py (API routes included)
│   └── requirements.txt 
├── frontend/
│   ├── src/app/
│   │   ├── components/
│   │   │   ├── login/ (Authentication UI)
│   │   │   ├── grocery-lists/ (Main list view with logout)
│   │   │   └── grocery-list-detail/ (Individual list management)
│   │   ├── services/
│   │   │   ├── auth.service.ts (Authentication logic management)
│   │   │   ├── auth.interceptor.ts (Auto token injection)
│   │   │   ├── auth.guard.ts (Route protection)
│   │   │   └── grocery.service.ts (API for grocery)
│   │   ├── models/
│   │   │   └── api.models.ts (TypeScript interfaces)
│   │   ├── app.ts (Root component)
│   │   ├── app.config.ts (HTTP interceptor setup)
│   │   ├── app.html (Router outlet template)
│   │   └── app.routes.ts (Protected routing with guards)
│   └── Dockerfile 
└── docker-compose.yml (Single container setup)
```

## Debug Info

### If API Returns 403 Forbidden
- Must login first at `localhost:8000/login`
- Or use curl with token 

### If Grocery Lists Empty
- API filters by user - only shows user's own lists
- Admin user needs data created specifically for them
- Use Django shell to create test data for current user

### If Frontend Can't Connect
- Check CORS settings in Django settings.py
- Verify frontend URL in CORS_ALLOWED_ORIGINS
- Restart Docker containers after settings changes

## Current Working Setup

### ✅ **Local Development** (`docker-compose up`)
- **Single Container**: `http://localhost:8000` - Combined Angular + Django app
- **Database**: PostgreSQL in separate container
- **Architecture**: WhiteNoise serves Angular static files from Django

### ✅ **Railway Production** 
- **URL**: `https://grocery-app-production-bc43.up.railway.app/`
- **Database**: Railway PostgreSQL (connected via DATABASE_URL)
- **Architecture**: Same single container as local development

### 🏗️ **Simplified Architecture Benefits**
- ✅ **Single Dockerfile** works for both local and production
- ✅ **WhiteNoise** serves Angular files (no nginx needed) 
- ✅ **Environment-aware API URLs** (localhost vs production)
- ✅ **Same setup** eliminates dev/prod differences

### 🔧 **Commands**
```bash
# Local development
docker-compose up --build
```

Last Updated: September 2025