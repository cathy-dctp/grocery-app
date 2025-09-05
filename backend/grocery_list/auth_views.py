from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .serializers import UserSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"error": "Username and password required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(username=username, password=password)
    if user:
        token, created = Token.objects.get_or_create(user=user)
        user_data = UserSerializer(user).data
        return Response({"user": user_data, "token": token.key})
    else:
        return Response(
            {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(["POST"])
def logout(request):
    try:
        request.user.auth_token.delete()
        return Response({"message": "Logged out successfully"})
    except Exception:
        return Response(
            {"error": "Error logging out"}, status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["GET"])
def me(request):
    user_data = UserSerializer(request.user).data
    return Response({"user": user_data})


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    first_name = request.data.get("first_name", "")
    last_name = request.data.get("last_name", "")

    # Validate required fields
    if not username or not password:
        return Response(
            {"error": "Username and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate username format and length
    if len(username) < 3:
        return Response(
            {"error": "Username must be at least 3 characters long"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(username) > 150:
        return Response(
            {"error": "Username must be 150 characters or fewer"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate email format if provided
    if email:
        from django.core.validators import validate_email

        try:
            validate_email(email)
        except ValidationError:
            return Response(
                {"error": "Enter a valid email address"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Validate password is not empty
    if len(password.strip()) == 0:
        return Response(
            {"error": "Password cannot be empty"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        # Generate token for immediate login
        token, created = Token.objects.get_or_create(user=user)
        user_data = UserSerializer(user).data

        return Response(
            {"user": user_data, "token": token.key},
            status=status.HTTP_201_CREATED,
        )

    except IntegrityError:
        return Response(
            {"error": "Username already exists"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {"error": "Registration failed. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
