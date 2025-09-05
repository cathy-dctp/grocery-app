import pytest
import json
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from grocery_list.tests.factories import UserFactory


@pytest.mark.api
class TestLoginEndpoint:
    """Test cases for the login endpoint."""

    def test_successful_login(self, db):
        """Test successful login with valid credentials."""
        # Create a user with known password
        user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com',
            first_name='Test',
            last_name='User'
        )
        
        client = APIClient()
        url = reverse('login')  # Assuming URL name is 'login'
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        response_data = response.json()
        assert 'user' in response_data
        assert 'token' in response_data
        
        # Verify user data
        user_data = response_data['user']
        assert user_data['id'] == user.id
        assert user_data['username'] == 'testuser'
        assert user_data['email'] == 'test@example.com'
        assert user_data['first_name'] == 'Test'
        assert user_data['last_name'] == 'User'
        
        # Verify token is created and valid
        token = response_data['token']
        assert token is not None
        assert len(token) > 0
        
        # Verify token exists in database
        db_token = Token.objects.get(user=user)
        assert db_token.key == token

    def test_login_creates_token_if_not_exists(self, db):
        """Test that login creates a token if one doesn't exist."""
        user = User.objects.create_user(
            username='newuser',
            password='password123'
        )
        
        # Ensure no token exists initially
        assert not Token.objects.filter(user=user).exists()
        
        client = APIClient()
        url = reverse('login')
        data = {
            'username': 'newuser',
            'password': 'password123'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Token should now exist
        assert Token.objects.filter(user=user).exists()
        token = Token.objects.get(user=user)
        assert response.json()['token'] == token.key

    def test_login_returns_existing_token(self, db):
        """Test that login returns existing token instead of creating new one."""
        user = User.objects.create_user(
            username='existinguser',
            password='password123'
        )
        
        # Create a token beforehand
        existing_token = Token.objects.create(user=user)
        
        client = APIClient()
        url = reverse('login')
        data = {
            'username': 'existinguser',
            'password': 'password123'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['token'] == existing_token.key
        
        # Should still only have one token
        assert Token.objects.filter(user=user).count() == 1

    def test_login_invalid_credentials(self, db):
        """Test login with invalid credentials."""
        user = User.objects.create_user(
            username='testuser',
            password='correctpass'
        )
        
        client = APIClient()
        url = reverse('login')
        data = {
            'username': 'testuser',
            'password': 'wrongpass'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json()['error'] == 'Invalid credentials'

    def test_login_nonexistent_user(self, db):
        """Test login with nonexistent username."""
        client = APIClient()
        url = reverse('login')
        data = {
            'username': 'nonexistent',
            'password': 'anypass'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json()['error'] == 'Invalid credentials'

    def test_login_missing_username(self, db):
        """Test login with missing username."""
        client = APIClient()
        url = reverse('login')
        data = {
            'password': 'somepass'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()['error'] == 'Username and password required'

    def test_login_missing_password(self, db):
        """Test login with missing password."""
        client = APIClient()
        url = reverse('login')
        data = {
            'username': 'someuser'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()['error'] == 'Username and password required'

    def test_login_empty_username(self, db):
        """Test login with empty username."""
        client = APIClient()
        url = reverse('login')
        data = {
            'username': '',
            'password': 'somepass'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()['error'] == 'Username and password required'

    def test_login_empty_password(self, db):
        """Test login with empty password."""
        client = APIClient()
        url = reverse('login')
        data = {
            'username': 'someuser',
            'password': ''
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()['error'] == 'Username and password required'

    def test_login_inactive_user(self, db):
        """Test login with inactive user."""
        user = User.objects.create_user(
            username='inactiveuser',
            password='password123',
            is_active=False
        )
        
        client = APIClient()
        url = reverse('login')
        data = {
            'username': 'inactiveuser',
            'password': 'password123'
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json()['error'] == 'Invalid credentials'

    def test_login_only_accepts_post(self, db):
        """Test that login endpoint only accepts POST requests."""
        client = APIClient()
        url = reverse('login')
        
        # Test GET
        response = client.get(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        
        # Test PUT
        response = client.put(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        
        # Test DELETE
        response = client.delete(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED


@pytest.mark.api
class TestLogoutEndpoint:
    """Test cases for the logout endpoint."""

    def test_successful_logout(self, db):
        """Test successful logout with valid token."""
        user = UserFactory()
        token, created = Token.objects.get_or_create(user=user)
        
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        url = reverse('logout')
        
        response = client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['message'] == 'Logged out successfully'
        
        # Verify token is deleted from database
        assert not Token.objects.filter(user=user).exists()

    def test_logout_without_authentication(self, db):
        """Test logout without authentication token."""
        client = APIClient()
        url = reverse('logout')
        
        response = client.post(url)
        
        # Should require authentication
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout_with_invalid_token(self, db):
        """Test logout with invalid token."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION='Token invalidtoken123')
        url = reverse('logout')
        
        response = client.post(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout_user_without_token(self, db):
        """Test logout for authenticated user who has no token."""
        user = UserFactory()
        
        client = APIClient()
        client.force_authenticate(user=user)  # Authenticate without token
        url = reverse('logout')
        
        response = client.post(url)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()['error'] == 'Error logging out'

    def test_logout_only_accepts_post(self, db):
        """Test that logout endpoint only accepts POST requests."""
        user = UserFactory()
        token = Token.objects.create(user=user)
        
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        url = reverse('logout')
        
        # Test GET
        response = client.get(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        
        # Test PUT
        response = client.put(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        
        # Test DELETE
        response = client.delete(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED


@pytest.mark.api
class TestMeEndpoint:
    """Test cases for the me (user profile) endpoint."""

    def test_successful_get_user_profile(self, db):
        """Test getting user profile with valid token."""
        user = UserFactory(
            username='profileuser',
            email='profile@example.com',
            first_name='Profile',
            last_name='User'
        )
        token = Token.objects.create(user=user)
        
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        url = reverse('me')
        
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        response_data = response.json()
        assert 'user' in response_data
        
        user_data = response_data['user']
        assert user_data['id'] == user.id
        assert user_data['username'] == 'profileuser'
        assert user_data['email'] == 'profile@example.com'
        assert user_data['first_name'] == 'Profile'
        assert user_data['last_name'] == 'User'

    def test_me_without_authentication(self, db):
        """Test me endpoint without authentication token."""
        client = APIClient()
        url = reverse('me')
        
        response = client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_with_invalid_token(self, db):
        """Test me endpoint with invalid token."""
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION='Token invalidtoken123')
        url = reverse('me')
        
        response = client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_only_accepts_get(self, db):
        """Test that me endpoint only accepts GET requests."""
        user = UserFactory()
        token = Token.objects.create(user=user)
        
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        url = reverse('me')
        
        # Test POST
        response = client.post(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        
        # Test PUT
        response = client.put(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        
        # Test DELETE
        response = client.delete(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    def test_me_returns_current_user_data(self, db):
        """Test that me endpoint returns data for the authenticated user only."""
        user1 = UserFactory(username='user1')
        user2 = UserFactory(username='user2')
        token1 = Token.objects.create(user=user1)
        
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {token1.key}')
        url = reverse('me')
        
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        user_data = response.json()['user']
        assert user_data['username'] == 'user1'
        assert user_data['id'] == user1.id
        # Should not return user2 data
        assert user_data['id'] != user2.id


@pytest.mark.api 
class TestAuthenticationIntegration:
    """Integration tests for authentication flow."""

    def test_complete_auth_flow(self, db):
        """Test complete authentication flow: login -> access protected resource -> logout."""
        # Create user
        user = User.objects.create_user(
            username='flowuser',
            password='flowpass123',
            email='flow@example.com'
        )
        
        client = APIClient()
        
        # Step 1: Login
        login_url = reverse('login')
        login_data = {
            'username': 'flowuser',
            'password': 'flowpass123'
        }
        
        login_response = client.post(login_url, login_data, format='json')
        assert login_response.status_code == status.HTTP_200_OK
        
        token = login_response.json()['token']
        assert token is not None
        
        # Step 2: Access protected resource with token
        client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        me_url = reverse('me')
        
        me_response = client.get(me_url)
        assert me_response.status_code == status.HTTP_200_OK
        assert me_response.json()['user']['username'] == 'flowuser'
        
        # Step 3: Logout
        logout_url = reverse('logout')
        logout_response = client.post(logout_url)
        assert logout_response.status_code == status.HTTP_200_OK
        
        # Step 4: Verify token is invalidated
        me_response_after_logout = client.get(me_url)
        assert me_response_after_logout.status_code == status.HTTP_401_UNAUTHORIZED
        
        # Verify token no longer exists in database
        assert not Token.objects.filter(user=user).exists()

    def test_token_persists_across_requests(self, db):
        """Test that token persists and can be used across multiple requests."""
        user = User.objects.create_user(
            username='persistuser',
            password='persistpass123'
        )
        
        client = APIClient()
        
        # Login to get token
        login_url = reverse('login')
        login_data = {
            'username': 'persistuser',
            'password': 'persistpass123'
        }
        
        login_response = client.post(login_url, login_data, format='json')
        token = login_response.json()['token']
        
        # Use token for multiple requests
        client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        me_url = reverse('me')
        
        # First request
        response1 = client.get(me_url)
        assert response1.status_code == status.HTTP_200_OK
        
        # Second request with same token
        response2 = client.get(me_url)
        assert response2.status_code == status.HTTP_200_OK
        
        # Both should return same user data
        assert response1.json()['user']['id'] == response2.json()['user']['id']