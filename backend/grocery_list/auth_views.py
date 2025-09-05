from django.contrib.auth import authenticate

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
