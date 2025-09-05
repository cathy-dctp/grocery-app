from django.contrib.auth.models import User
from django.db import models
from django.db.models import Q
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Category, GroceryList, GroceryListItem, Item
from .serializers import (
    CategorySerializer,
    GroceryListItemSerializer,
    GroceryListSimpleSerializer,
    ItemSerializer,
    UserSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all().select_related("category")
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["category"]
    search_fields = ["name", "barcode"]


# TODO:  Understand custom actions
class GroceryListViewSet(viewsets.ModelViewSet):
    serializer_class = GroceryListSimpleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (
            GroceryList.objects.filter(
                models.Q(owner=user) | models.Q(shared_with=user)
            )
            .distinct()
            .prefetch_related("shared_with")
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["post"])
    def add_item(self, request, pk=None):
        grocery_list = self.get_object()
        item_id = request.data.get("item_id")
        quantity = request.data.get("quantity", 1)
        unit = request.data.get("unit", "")
        notes = request.data.get("notes", "")

        try:
            item = Item.objects.get(id=item_id)
            # Always create new grocery list item, even if same item exists
            grocery_list_item = GroceryListItem.objects.create(
                grocery_list=grocery_list,
                item=item,
                quantity=quantity,
                unit=unit or item.default_unit,
                notes=notes,
                added_by=request.user,
            )

            serializer = GroceryListItemSerializer(grocery_list_item)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Item.DoesNotExist:
            return Response(
                {"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=["post"])
    def share_with(self, request, pk=None):
        grocery_list = self.get_object()
        username = request.data.get("username")

        if not username:
            return Response(
                {"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent sharing with self
        if username == request.user.username:
            return Response(
                {"error": "Cannot share list with yourself"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(username=username)

            # Check if already shared
            if grocery_list.shared_with.filter(id=user.id).exists():
                return Response(
                    {"error": f"List is already shared with {username}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            grocery_list.shared_with.add(user)
            return Response(
                {
                    "message": f"List shared with {username}",
                    "shared_user": {
                        "id": user.id,
                        "username": user.username,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                    },
                }
            )
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=["post"])
    def remove_user(self, request, pk=None):
        grocery_list = self.get_object()
        username = request.data.get("username")

        if not username:
            return Response(
                {"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(username=username)

            # Check if user is actually shared with this list
            if not grocery_list.shared_with.filter(id=user.id).exists():
                return Response(
                    {"error": f"List is not shared with {username}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            grocery_list.shared_with.remove(user)
            return Response({"message": f"Removed {username} from shared list"})
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )


class GroceryListItemViewSet(viewsets.ModelViewSet):
    serializer_class = GroceryListItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = (
            GroceryListItem.objects.filter(
                models.Q(grocery_list__owner=user)
                | models.Q(grocery_list__shared_with=user)
            )
            .distinct()
            .select_related("item", "grocery_list", "added_by", "checked_by")
        )

        # Filter by grocery_list query parameter if provided
        grocery_list_id = self.request.query_params.get("grocery_list")
        print(f"DEBUG: grocery_list query param = {grocery_list_id}")  # Debug line
        if grocery_list_id:
            print(f"DEBUG: Filtering by grocery_list = {grocery_list_id}")  # Debug line
            queryset = queryset.filter(grocery_list=grocery_list_id)

        return queryset

    @action(detail=True, methods=["post"])
    def toggle_checked(self, request, pk=None):
        item = self.get_object()
        item.is_checked = not item.is_checked
        if item.is_checked:
            item.checked_by = request.user
            item.checked_at = timezone.now()
        else:
            item.checked_by = None
            item.checked_at = None
        item.save()

        serializer = self.get_serializer(item)
        return Response(serializer.data)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Exclude the current user from search results
        queryset = User.objects.exclude(id=self.request.user.id).filter(is_active=True)

        # Support search parameter
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )

        return queryset.order_by("username")

    def list(self, request, *args, **kwargs):
        """Override list to limit results to 10."""
        queryset = self.filter_queryset(self.get_queryset())[:10]
        serializer = self.get_serializer(queryset, many=True)
        return Response({"results": serializer.data})
