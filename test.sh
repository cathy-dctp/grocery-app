#!/bin/bash

# Test runner script for grocery app
# Usage: ./test.sh [options]
#   --local     Run tests locally (requires local setup)
#   --docker    Run tests in Docker containers (default)
#   --coverage  Generate coverage report
#   --clean     Clean up test containers and volumes

set -e

# Detect docker-compose command (legacy vs plugin)
if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    echo "Error: Neither docker-compose nor docker compose plugin found"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default options
RUN_MODE="docker"
WITH_COVERAGE=false
CLEAN_UP=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --local)
            RUN_MODE="local"
            shift
            ;;
        --docker)
            RUN_MODE="docker"
            shift
            ;;
        --coverage)
            WITH_COVERAGE=true
            shift
            ;;
        --clean)
            CLEAN_UP=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--local|--docker] [--coverage] [--clean]"
            exit 1
            ;;
    esac
done

# Clean up function
cleanup_docker() {
    print_status "Cleaning up test containers and volumes..."
    $DOCKER_COMPOSE -f docker-compose.test.yml down -v --remove-orphans 2>/dev/null || true
    docker volume rm grocery-app_test_postgres_data 2>/dev/null || true
    print_success "Cleanup completed"
}

# Handle cleanup option
if [[ $CLEAN_UP == true ]]; then
    cleanup_docker
    exit 0
fi

# Run tests locally
run_local_tests() {
    print_status "Running tests locally..."
    
    if [[ ! -d "backend/venv" ]]; then
        print_error "Virtual environment not found. Please set up the development environment first."
        exit 1
    fi
    
    cd backend
    
    # Activate virtual environment and run tests
    if [[ $WITH_COVERAGE == true ]]; then
        print_status "Running tests with coverage..."
        source venv/bin/activate && \
        DJANGO_SETTINGS_MODULE=grocery_backend.settings python -m pytest \
            --tb=short --disable-warnings -v \
            --cov=grocery_list --cov-report=html --cov-report=term
    else
        print_status "Running tests without coverage..."
        source venv/bin/activate && \
        DJANGO_SETTINGS_MODULE=grocery_backend.settings python -m pytest \
            --tb=short --disable-warnings -v
    fi
    
    cd ..
}

# Run tests in Docker
run_docker_tests() {
    print_status "Running tests in Docker containers..."
    
    # Clean up any existing containers
    cleanup_docker
    
    # Build and run tests
    if [[ $WITH_COVERAGE == true ]]; then
        print_status "Running tests with coverage in Docker..."
        $DOCKER_COMPOSE -f docker-compose.test.yml up --build --abort-on-container-exit
    else
        print_status "Running tests without coverage in Docker..."
        # Modify the command to exclude coverage
        $DOCKER_COMPOSE -f docker-compose.test.yml run --rm test-runner \
            sh -c "
                echo 'Waiting for database...' &&
                python manage.py migrate --run-syncdb &&
                echo 'Running tests...' &&
                python -m pytest --tb=short --disable-warnings -v
            "
    fi
    
    # Check test results
    if [[ $? -eq 0 ]]; then
        print_success "All tests passed!"
        
        if [[ $WITH_COVERAGE == true ]]; then
            print_status "Coverage report generated in backend/htmlcov/"
        fi
    else
        print_error "Some tests failed!"
        exit 1
    fi
    
    # Clean up
    cleanup_docker
}

# Main execution
print_status "Starting grocery app test suite..."
print_status "Mode: $RUN_MODE"
print_status "Coverage: $WITH_COVERAGE"

case $RUN_MODE in
    "local")
        run_local_tests
        ;;
    "docker")
        run_docker_tests
        ;;
    *)
        print_error "Invalid run mode: $RUN_MODE"
        exit 1
        ;;
esac

print_success "Test execution completed!"