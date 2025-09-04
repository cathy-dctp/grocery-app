from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Item, GroceryList, GroceryListItem


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class CategorySerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'item_count', 'created_at', 'updated_at']
    
    def get_item_count(self, obj):
        return obj.items.count()


class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Item
        fields = ['id', 'name', 'category', 'category_name', 'description', 'barcode', 
                 'default_unit', 'created_at', 'updated_at']


class GroceryListItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_category = serializers.CharField(source='item.category.name', read_only=True)
    added_by_username = serializers.CharField(source='added_by.username', read_only=True)
    checked_by_username = serializers.CharField(source='checked_by.username', read_only=True)
    
    class Meta:
        model = GroceryListItem
        fields = ['id', 'grocery_list', 'item', 'item_name', 'item_category', 
                 'quantity', 'unit', 'notes', 'is_checked', 'checked_at', 
                 'checked_by', 'checked_by_username', 'added_by', 'added_by_username',
                 'created_at', 'updated_at']

# Simplified serializers for list views (without nested data)
class GroceryListSimpleSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    shared_with = UserSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = GroceryList
        fields = ['id', 'name', 'owner', 'owner_username', 'shared_with', 'is_active', 
                 'item_count', 'created_at', 'updated_at']
    
    def get_item_count(self, obj):
        return obj.items.count()