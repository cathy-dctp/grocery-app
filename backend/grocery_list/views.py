from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from django.db import models
from decimal import Decimal
from .models import Category, Item, GroceryList, GroceryListItem
from .serializers import (
    UserSerializer, CategorySerializer, ItemSerializer,
    GroceryListSimpleSerializer, GroceryListItemSerializer
)
from django.utils import timezone



class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all().select_related('category')
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['category']
    search_fields = ['name', 'barcode']


# TODO:  Understand custom actions
class GroceryListViewSet(viewsets.ModelViewSet):
    serializer_class = GroceryListSimpleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return GroceryList.objects.filter(
            models.Q(owner=user) | models.Q(shared_with=user)
        ).distinct().prefetch_related('shared_with')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        grocery_list = self.get_object()
        item_id = request.data.get('item_id')
        quantity = request.data.get('quantity', 1)
        unit = request.data.get('unit', '')
        notes = request.data.get('notes', '')

        try:
            item = Item.objects.get(id=item_id)
            grocery_list_item, created = GroceryListItem.objects.get_or_create(
                grocery_list=grocery_list,
                item=item,
                defaults={
                    'quantity': quantity,
                    'unit': unit or item.default_unit,
                    'notes': notes,
                    'added_by': request.user
                }
            )
            
            if not created:
                grocery_list_item.quantity += Decimal(quantity)
                grocery_list_item.save()

            serializer = GroceryListItemSerializer(grocery_list_item)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Item.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def share_with(self, request, pk=None):
        grocery_list = self.get_object()
        username = request.data.get('username')
        
        try:
            user = User.objects.get(username=username)
            grocery_list.shared_with.add(user)
            return Response({'message': f'List shared with {username}'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class GroceryListItemViewSet(viewsets.ModelViewSet):
    serializer_class = GroceryListItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = GroceryListItem.objects.filter(
            models.Q(grocery_list__owner=user) | models.Q(grocery_list__shared_with=user)
        ).distinct().select_related('item', 'grocery_list', 'added_by', 'checked_by')
        
        # Filter by grocery_list query parameter if provided
        grocery_list_id = self.request.query_params.get('grocery_list')
        print(f"DEBUG: grocery_list query param = {grocery_list_id}")  # Debug line
        if grocery_list_id:
            print(f"DEBUG: Filtering by grocery_list = {grocery_list_id}")  # Debug line
            queryset = queryset.filter(grocery_list=grocery_list_id)
            
        return queryset

    @action(detail=True, methods=['post'])
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
