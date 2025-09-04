# Grocery App Testing Makefile

.PHONY: test test-local test-docker test-coverage test-clean help

# Default target
help:
	@echo "Grocery App Test Commands:"
	@echo "  test          - Run tests in Docker (default)"
	@echo "  test-local    - Run tests locally"
	@echo "  test-docker   - Run tests in Docker containers"
	@echo "  test-coverage - Run tests with coverage report"
	@echo "  test-clean    - Clean up test containers and volumes"
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