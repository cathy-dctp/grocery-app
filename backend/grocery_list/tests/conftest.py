import pytest
from django.contrib.auth.models import User
from django.test import Client
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token


@pytest.fixture(scope='session')
def django_db_setup():
    """
    Configure the test database.
    """
    pass


@pytest.fixture
def api_client():
    """
    Return an APIClient instance.
    """
    return APIClient()


@pytest.fixture
def client():
    """
    Return a Django test client instance.
    """
    return Client()


@pytest.fixture
def user(db):
    """
    Create a test user.
    """
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )


@pytest.fixture
def admin_user(db):
    """
    Create a test admin user.
    """
    return User.objects.create_superuser(
        username='test_admin',
        email='testadmin@example.com',
        password='adminpass123'
    )


@pytest.fixture
def authenticated_user(db):
    """
    Create a test user with authentication token.
    """
    user = User.objects.create_user(
        username='authuser',
        email='auth@example.com',
        password='authpass123'
    )
    token, created = Token.objects.get_or_create(user=user)
    user.token = token.key
    return user


@pytest.fixture
def authenticated_api_client(authenticated_user):
    """
    Return an authenticated APIClient instance.
    """
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Token {authenticated_user.token}')
    return client