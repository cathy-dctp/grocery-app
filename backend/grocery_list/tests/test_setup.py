import pytest


@pytest.mark.unit
def test_pytest_setup():
    """
    Test that pytest is configured correctly.
    """
    assert True


@pytest.mark.unit
def test_user_fixture(user):
    """
    Test that user fixture works correctly.
    """
    assert user.username == "testuser"
    assert user.email == "test@example.com"
    assert user.is_active is True
    assert user.is_superuser is False


@pytest.mark.unit
def test_authenticated_user_fixture(authenticated_user):
    """
    Test that authenticated user fixture works correctly.
    """
    assert authenticated_user.username == "authuser"
    assert hasattr(authenticated_user, "token")
    assert authenticated_user.token is not None


@pytest.mark.unit
def test_admin_user_fixture(admin_user):
    """
    Test that admin user fixture works correctly.
    """
    assert admin_user.is_superuser is True
    assert admin_user.is_staff is True


@pytest.mark.api
def test_api_client_fixture(api_client):
    """
    Test that API client fixture works correctly.
    """
    assert hasattr(api_client, "get")
    assert hasattr(api_client, "post")
    assert hasattr(api_client, "put")
    assert hasattr(api_client, "delete")


@pytest.mark.api
def test_authenticated_api_client_fixture(authenticated_api_client):
    """
    Test that authenticated API client fixture works correctly.
    """
    assert hasattr(authenticated_api_client, "credentials")
    # Check that credentials were set (internal to APIClient)
    assert hasattr(authenticated_api_client, "_credentials")
    # Should have HTTP_AUTHORIZATION in credentials
    assert "HTTP_AUTHORIZATION" in authenticated_api_client._credentials
    auth_header = authenticated_api_client._credentials["HTTP_AUTHORIZATION"]
    assert "Token" in auth_header
