# Grocery App Testing and Linting Makefile

.PHONY: test test-local test-docker test-coverage test-clean lint-backend format-backend lint-frontend format-frontend help

# Default target
help:
	@echo "Grocery App Test and Linting Commands:"
	@echo "  test          - Run tests in Docker (default)"
	@echo "  test-local    - Run tests locally"
	@echo "  test-docker   - Run tests in Docker containers"
	@echo "  test-coverage - Run tests with coverage report"
	@echo "  test-clean    - Clean up test containers and volumes"
	@echo "  lint-backend  - Run backend linting (Black, Flake8, isort)"
	@echo "  format-backend- Auto-format backend code (Black, isort)"
	@echo "  lint-frontend - Run frontend linting (ESLint, Prettier)"
	@echo "  format-frontend- Auto-format frontend code (ESLint, Prettier)"
	@echo "  help          - Show this help message"

# Run tests in Docker (default)
test: test-docker

# Run tests locally
test-local:
	@echo "Running tests locally..."
	@./test.sh --local

# Run tests in Docker
test-docker:
	@echo "Running tests in Docker..."
	@./test.sh --docker

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	@./test.sh --docker --coverage

# Clean up test environment
test-clean:
	@echo "Cleaning up test environment..."
	@./test.sh --clean

# Quick local test (for development)
test-quick:
	@echo "Running quick local tests..."
	@cd backend && source venv/bin/activate && DJANGO_SETTINGS_MODULE=grocery_backend.settings python -m pytest --tb=short -x

# Run specific test file
test-models:
	@cd backend && source venv/bin/activate && DJANGO_SETTINGS_MODULE=grocery_backend.settings python -m pytest grocery_list/tests/test_models.py -v

test-views:
	@cd backend && source venv/bin/activate && DJANGO_SETTINGS_MODULE=grocery_backend.settings python -m pytest grocery_list/tests/test_views.py -v

test-serializers:
	@cd backend && source venv/bin/activate && DJANGO_SETTINGS_MODULE=grocery_backend.settings python -m pytest grocery_list/tests/test_serializers.py -v

test-auth:
	@cd backend && source venv/bin/activate && DJANGO_SETTINGS_MODULE=grocery_backend.settings python -m pytest grocery_list/tests/test_auth_views.py -v

# Backend Linting and Formatting
lint-backend:
	@echo "Running backend linting checks..."
	@echo "Checking code formatting with Black..."
	@cd backend && python -m black --check --diff .
	@echo "Checking import sorting with isort..."
	@cd backend && python -m isort --check-only --diff .
	@echo "Running Flake8 linting..."
	@cd backend && python -m flake8 .
	@echo "All backend linting checks passed!"

format-backend:
	@echo "Auto-formatting backend code..."
	@echo "Formatting code with Black..."
	@cd backend && python -m black .
	@echo "Sorting imports with isort..."
	@cd backend && python -m isort .
	@echo "Backend code formatted successfully!"

# Frontend Linting and Formatting
lint-frontend:
	@echo "Running frontend linting checks..."
	@echo "Checking TypeScript and HTML with ESLint..."
	@cd frontend && npm run lint
	@echo "Checking code formatting with Prettier..."
	@cd frontend && npm run format:check
	@echo "All frontend linting checks passed!"

format-frontend:
	@echo "Auto-formatting frontend code..."
	@echo "Fixing code issues with ESLint..."
	@cd frontend && npm run lint:fix
	@echo "Formatting code with Prettier..."
	@cd frontend && npm run format
	@echo "Frontend code formatted successfully!"