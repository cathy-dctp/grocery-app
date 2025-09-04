# Testing Guide

This document describes how to run tests for the Grocery App backend.

## Test Coverage

Our test suite includes **147+ tests** covering:

- ✅ **Models** (46 tests): Business logic, constraints, relationships
- ✅ **Serializers** (25 tests): Data validation, nested fields, method fields  
- ✅ **Authentication** (23 tests): Login, logout, token management, security
- ✅ **ViewSets** (54 tests): CRUD operations, permissions, user filtering
- ✅ **Custom Actions** (14 tests): add_item, share_with, toggle_checked
- ✅ **Filtering & Search**: Category filtering, name/barcode search, ordering

## Quick Start

### Using Make (Recommended)
```bash
# Run all tests in Docker
make test

# Run tests locally (faster for development)
make test-local

# Run with coverage report
make test-coverage

# Run specific test categories
make test-models
make test-views
make test-auth

# Clean up test containers
make test-clean
```

### Using Test Script
```bash
# Docker tests (isolated environment)
./test.sh --docker

# Local tests (requires setup)
./test.sh --local

# With coverage report
./test.sh --docker --coverage

# Clean up
./test.sh --clean
```

### Manual Testing
```bash
cd backend
source venv/bin/activate
DJANGO_SETTINGS_MODULE=grocery_backend.settings python -m pytest
```

## Test Environments

### Local Testing
- **Requirements**: Python virtual environment with dependencies
- **Database**: SQLite (in-memory for tests)
- **Speed**: Fast (no container overhead)
- **Use case**: Development and debugging

### Docker Testing
- **Requirements**: Docker and Docker Compose
- **Database**: PostgreSQL in container
- **Speed**: Slower (container setup time)
- **Use case**: CI/CD, production-like environment

## Test Structure

```
backend/grocery_list/tests/
├── conftest.py              # Shared fixtures and configuration
├── factories.py             # Test data factories
├── test_models.py           # Model business logic tests
├── test_serializers.py      # API serialization tests  
├── test_views.py            # ViewSet and endpoint tests
└── test_auth_views.py       # Authentication tests
```

## Key Test Features

### Database Isolation
- Each test runs in a transaction that's rolled back
- No test data pollution between tests
- Clean database state for every test

### Authentication Testing  
- Token-based authentication validation
- Permission boundary testing
- User isolation verification

### Factory-Based Data Generation
- Realistic test data with Faker
- Consistent object creation
- Relationship handling

### Coverage Reporting
- HTML reports in `backend/htmlcov/`
- Terminal coverage summary
- Identifies untested code paths

## Common Test Commands

### Run Specific Test Files
```bash
# Model tests only
pytest grocery_list/tests/test_models.py

# ViewSet tests only  
pytest grocery_list/tests/test_views.py

# Authentication tests only
pytest grocery_list/tests/test_auth_views.py
```

### Run Specific Test Classes
```bash
# Category model tests
pytest grocery_list/tests/test_models.py::TestCategoryModel

# GroceryList ViewSet tests
pytest grocery_list/tests/test_views.py::TestGroceryListViewSet

# Custom action tests
pytest grocery_list/tests/test_views.py::TestCustomActions
```

### Run with Options
```bash
# Stop on first failure
pytest -x

# Verbose output
pytest -v

# Show coverage
pytest --cov=grocery_list --cov-report=term

# Generate HTML coverage report
pytest --cov=grocery_list --cov-report=html
```

## Test Configuration

### pytest.ini
```ini
[tool:pytest]
DJANGO_SETTINGS_MODULE = grocery_backend.settings
python_files = tests.py test_*.py *_tests.py
addopts = --tb=short --strict-markers --disable-warnings
testpaths = grocery_list/tests
markers =
    unit: Unit tests
    integration: Integration tests
    api: API endpoint tests
```

### Test Database
- **Local**: SQLite in-memory (`:memory:`)
- **Docker**: PostgreSQL container (`grocery_test` database)

## Troubleshooting

### Common Issues

**Virtual environment not found**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Database connection errors**
```bash
# For Docker tests, ensure containers are running
docker-compose -f docker-compose.test.yml ps

# Clean and restart
./test.sh --clean
make test
```

**Import errors**
```bash
# Ensure DJANGO_SETTINGS_MODULE is set
export DJANGO_SETTINGS_MODULE=grocery_backend.settings

# Or use full command
DJANGO_SETTINGS_MODULE=grocery_backend.settings python -m pytest
```

### Performance Tips

1. **Use local tests for development** - Much faster than Docker
2. **Run specific test files** - Don't run full suite every time
3. **Use `-x` flag** - Stop on first failure for quick debugging
4. **Clean containers regularly** - Prevent disk space issues

## Integration with CI/CD

The test configuration is designed to work with:
- **GitHub Actions** (see `.github/workflows/`)  
- **Railway deployment** (test gates before deploy)
- **Local development** (pre-commit hooks)

## Test Data

### Factories
- `UserFactory`: Creates test users with unique usernames
- `CategoryFactory`: Creates categories with descriptions  
- `ItemFactory`: Creates items with categories and barcodes
- `GroceryListFactory`: Creates lists with owners
- `GroceryListItemFactory`: Creates list items with relationships

### Realistic Data
- Names generated with Faker
- Valid email addresses
- Realistic barcodes and descriptions
- Proper foreign key relationships

## Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Cover happy path and edge cases**
3. **Include permission/security tests**  
4. **Update this documentation**
5. **Ensure all tests pass** before committing

## Coverage Goals

- **Models**: 100% line coverage
- **Views**: 100% line coverage  
- **Serializers**: 100% line coverage
- **Overall**: >95% line coverage

Current coverage: **~98%** across all modules.