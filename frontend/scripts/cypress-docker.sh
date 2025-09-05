#!/bin/bash

# Cypress Docker Environment Manager
# Usage: ./scripts/cypress-docker.sh [start|stop|run|open|clean]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

case "$1" in
  "start")
    echo "🏗️ Building frontend for Docker..."
    cd "$PROJECT_ROOT/frontend"
    npm run build
    
    echo "🚀 Starting Docker services for Cypress..."
    cd "$PROJECT_ROOT"
    CYPRESS_INSTALL_BINARY=0 docker-compose up -d --build
    
    echo "⏳ Waiting for services to be ready..."
    sleep 20
    
    echo "🗄️ Running database migrations..."
    docker exec grocery-app python manage.py migrate
    
    echo "🌱 Seeding test data..."
    docker exec grocery-app python manage.py seed_data
    
    echo "🔍 Testing service health..."
    # Test backend API
    for i in {1..30}; do
      if curl -f http://localhost:8000/api/auth/login/ -X POST -H "Content-Type: application/json" -d "{\"username\":\"john_doe\",\"password\":\"password123\"}" > /dev/null 2>&1; then
        echo "✅ Backend API is ready!"
        break
      fi
      echo "Waiting for backend API... ($i/30)"
      sleep 2
    done
    
    # Test frontend
    for i in {1..15}; do
      if curl -f http://localhost:8000 > /dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
      fi
      echo "Waiting for frontend... ($i/15)"
      sleep 2
    done
    
    echo "✅ Services are ready! Backend: http://localhost:8000"
    ;;
    
  "stop")
    echo "🛑 Stopping Docker services..."
    docker-compose down
    echo "✅ Services stopped"
    ;;
    
  "clean")
    echo "🧹 Cleaning up Docker services and volumes..."
    docker-compose down -v
    echo "✅ Services cleaned"
    ;;
    
  "run")
    echo "🤖 Running Cypress tests with Docker..."
    "$SCRIPT_DIR/cypress-docker.sh" start
    
    cd "$PROJECT_ROOT/frontend"
    if [ "$2" == "fast" ]; then
      cypress run --headless --browser electron --spec cypress/e2e/01-authentication.cy.ts
    elif [ "$2" == "open" ]; then
      cypress open
    else
      cypress run
    fi
    CYPRESS_EXIT_CODE=$?
    
    cd "$PROJECT_ROOT"
    "$SCRIPT_DIR/cypress-docker.sh" stop
    
    exit $CYPRESS_EXIT_CODE
    ;;
    
  *)
    echo "Usage: $0 [start|stop|run|clean]"
    echo ""
    echo "Commands:"
    echo "  start  - Start Docker services and wait for readiness"
    echo "  stop   - Stop Docker services" 
    echo "  clean  - Stop services and remove volumes"
    echo "  run    - Full cycle: start services, run Cypress, stop services"
    echo "  run fast - Run only authentication tests"
    echo "  run open - Open Cypress UI"
    echo ""
    echo "Examples:"
    echo "  $0 run          # Run all tests"
    echo "  $0 run fast     # Run authentication tests only"
    echo "  $0 run open     # Open Cypress UI"
    exit 1
    ;;
esac