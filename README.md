# Grocery List Manager

A full-stack web application for managing family grocery lists with sharing features.

![Tech Stack](https://img.shields.io/badge/Frontend-Angular%2020-red)
![Backend](https://img.shields.io/badge/Backend-Django%204.2-green)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Deployment](https://img.shields.io/badge/Deployed-Railway-purple)
![Tests](https://img.shields.io/badge/Tests-147%2B-brightgreen)
![Coverage](https://img.shields.io/badge/Coverage-98%25-brightgreen)

## Live Demo

**Production App**: [https://grocery-app-production-bc43.up.railway.app/](https://grocery-app-production-bc43.up.railway.app/)

**Test Credentials:**
- Username: `john_doe` | Password: `password123`
- Username: `jane_smith` | Password: `password123` 
- Username: `admin` | Password: `admin123` (admin access)

## Quick Start

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

### Example API calls

```bash
# Test API endpoints
TOKEN="your_token_here"

# Authentication
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "password123"}'

# Get grocery lists
curl -H "Authorization: Token $TOKEN" \
  http://localhost:8000/api/grocery-lists/

# Create new list
curl -X POST http://localhost:8000/api/grocery-lists/ \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Weekly Shopping"}'
```

## Core Features

**Essential grocery management** with user authentication, multiple lists, and family collaboration.

### User Authentication
- Signup/Login/Logout with token-based authentication
- User-specific data filtering and route protection

### List Management  
- Create and manage multiple grocery lists
- Autocomplete suggestions from existing items database
- Custom item names (e.g., "Organic Bananas" instead of just "Bananas")
- Flexible quantities and units per item

### Family Collaboration
- Share lists with other family members
- Collaboration on shared grocery lists

### User Experience
- Working interface on both desktop and mobile web 

## Technical Stack

### Frontend
- **Angular 20** with TypeScript for type safety
- **Tailwind CSS** for responsive styling
- **Standalone Components** architecture
- **RxJS** for reactive programming
- **Authentication Guards** and HTTP interceptors

### Backend
- **Django 4.2** with Django REST Framework
- **PostgreSQL** database with proper relationships
- **Token-based authentication**
- **WhiteNoise** for static file serving

### DevOps & Deployment
- **Docker** containerization with multi-stage builds
- **Railway** cloud deployment
- **Automated testing** with comprehensive test suite

## Development Approach 

### Technology Stack Selection
I chose Django + Angular + PostgreSQL specifically to align with RideCo's technology stack and demonstrate my ability to rapidly learn and implement solutions with technologies that were new to me. 

### Disclaimer: AI-Assisted Development
This project was built with the help of generated AI as a learning accelerator and coding companion but I make sure that I understand the generated code and guide the AI so that the code is robust and well-tested. I make sure all the app ideas are from my own and only use AI to prototype and understand best practices in Django and Angular. Particularly for the extensive test suite (147+ tests) I designed and reviewed but had AI implement to ensure full coverage within project timelines.

## Testing

- CI/CD pipeline setup on Github https://github.com/cathy-dctp/grocery-app/actions

**Backend Testing** (Django TestCase, Factory Boy)

```bash
# Run all backend tests
make test
```
**Frontend Testing** (Jasmine/Karma for unit tests)

```bash
# Run all frontend tests
cd frontend && npm install && npm test 
```

**EndToEnd Testing** (Cypress)

Note: Cypress is not working fully due to time constraint

```bash
cd frontend && npm run e2e 
```

## Future Enhancements

### User Experience Features
- **Smart Categories**: Auto-categorize items by store sections (produce, dairy, frozen)
- **Shopping History**: "You usually buy this every 2 weeks" suggestions
- **Voice Input**: "Add bananas to grocery list" voice commands
- **Recipe Integration**: Generate grocery lists from saved recipes
- **Price Tracking**: Track item costs over time, set budget alerts
- **Store Maps**: Show aisle numbers and store layouts for efficient shopping

### Family & Social Features
- **Advanced Sharing**: Role-based permissions (view, edit, admin)
- **Shopping Assignment**: Assign specific items to family members
- **Real-time Updates**: Live synchronization when family members modify lists
- **Shopping Mode**: Coordinate shopping trips with family members
- **Meal Planning**: Weekly meal plans that auto-generate grocery needs
- **Shopping Lists Templates**: Reusable lists for recurring shopping patterns

### Mobile & Accessibility
- **Mobile Responsiveness**: Optimize interface for phones and tablets
- **Progressive Web App**: Offline functionality for poor connectivity
- **Native Mobile App**: iOS/Android apps for better mobile experience
- **Accessibility**: Screen reader support, keyboard navigation, high contrast modes
- **Location Services**: Reminder notifications when near grocery stores
- **Barcode Scanning**: Quick item addition via camera

### Smart Features
- **Intelligent Suggestions**: ML-powered recommendations based on shopping history
- **Seasonal Items**: Suggest seasonal produce and holiday-specific items
- **Budget Management**: Track spending patterns and suggest cost-saving alternatives
- **Nutritional Info**: Display nutritional information and dietary restriction warnings
- **Expiration Tracking**: Remind users of perishable item expiration dates

### Technical Improvements
- **Advanced Search**: Filter by category, price range, dietary restrictions
- **Performance Optimization**: Image lazy loading, API caching, database indexing
- **Third-party Integrations**: Connect with grocery delivery services (Instacart, Amazon Fresh)
- **Data Analytics**: Shopping pattern insights and spending analysis
- **Multi-language Support**: Internationalization for global users

### Scaling Considerations
- **Caching Layer**: Redis for improved API performance
- **CDN Integration**: Global content delivery for static assets
- **Database Optimization**: Read replicas and query optimization
- **Microservices**: Break into smaller services as user base grows
- **Mobile API**: Optimized endpoints for mobile app consumption

---
