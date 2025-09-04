import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory
from grocery_list.models import Category, Item, GroceryList, GroceryListItem
from grocery_list.serializers import (
    UserSerializer, CategorySerializer, ItemSerializer, 
    GroceryListItemSerializer, GroceryListSimpleSerializer
)
from grocery_list.tests.factories import (
    UserFactory, CategoryFactory, ItemFactory,
    GroceryListFactory, GroceryListItemFactory
)


@pytest.mark.unit
class TestUserSerializer:
    """Test cases for the UserSerializer."""

    def test_user_serialization(self, db):
        """Test that user data is serialized correctly."""
        user = UserFactory(
            username='johndoe',
            email='john@example.com',
            first_name='John',
            last_name='Doe'
        )
        
        serializer = UserSerializer(user)
        data = serializer.data
        
        assert data['id'] == user.id
        assert data['username'] == 'johndoe'
        assert data['email'] == 'john@example.com'
        assert data['first_name'] == 'John'
        assert data['last_name'] == 'Doe'

    def test_user_serializer_fields(self, db):
        """Test that only expected fields are included."""
        user = UserFactory()
        serializer = UserSerializer(user)
        
        expected_fields = {'id', 'username', 'email', 'first_name', 'last_name'}
        assert set(serializer.data.keys()) == expected_fields

    def test_user_deserialization(self, db):
        """Test creating user from valid data."""
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'first_name': 'New',
            'last_name': 'User'
        }
        
        serializer = UserSerializer(data=data)
        assert serializer.is_valid()
        
        user = serializer.save()
        assert user.username == 'newuser'
        assert user.email == 'new@example.com'
        assert user.first_name == 'New'
        assert user.last_name == 'User'


@pytest.mark.unit
class TestCategorySerializer:
    """Test cases for the CategorySerializer."""

    def test_category_serialization(self, db):
        """Test that category data is serialized correctly."""
        category = CategoryFactory(name='Fruits', description='Fresh fruits')
        # Create some items to test item_count
        ItemFactory.create_batch(3, category=category)
        
        serializer = CategorySerializer(category)
        data = serializer.data
        
        assert data['id'] == category.id
        assert data['name'] == 'Fruits'
        assert data['description'] == 'Fresh fruits'
        assert data['item_count'] == 3
        assert 'created_at' in data
        assert 'updated_at' in data

    def test_category_item_count_method_field(self, db):
        """Test that item_count calculates correctly."""
        category = CategoryFactory()
        
        # Initially no items
        serializer = CategorySerializer(category)
        assert serializer.data['item_count'] == 0
        
        # Add items
        ItemFactory.create_batch(5, category=category)
        
        # Refresh and check count
        serializer = CategorySerializer(category)
        assert serializer.data['item_count'] == 5

    def test_category_serializer_fields(self, db):
        """Test that only expected fields are included."""
        category = CategoryFactory()
        serializer = CategorySerializer(category)
        
        expected_fields = {
            'id', 'name', 'description', 'item_count', 'created_at', 'updated_at'
        }
        assert set(serializer.data.keys()) == expected_fields

    def test_category_deserialization(self, db):
        """Test creating category from valid data."""
        data = {
            'name': 'Vegetables',
            'description': 'Fresh vegetables and greens'
        }
        
        serializer = CategorySerializer(data=data)
        assert serializer.is_valid()
        
        category = serializer.save()
        assert category.name == 'Vegetables'
        assert category.description == 'Fresh vegetables and greens'

    def test_category_invalid_data(self, db):
        """Test validation with invalid data."""
        data = {
            'name': '',  # Empty name should be invalid
            'description': 'Valid description'
        }
        
        serializer = CategorySerializer(data=data)
        assert not serializer.is_valid()
        assert 'name' in serializer.errors


@pytest.mark.unit
class TestItemSerializer:
    """Test cases for the ItemSerializer."""

    def test_item_serialization(self, db):
        """Test that item data is serialized correctly."""
        category = CategoryFactory(name='Dairy')
        item = ItemFactory(
            name='Milk',
            category=category,
            description='Fresh milk',
            barcode='1234567890123',
            default_unit='liter'
        )
        
        serializer = ItemSerializer(item)
        data = serializer.data
        
        assert data['id'] == item.id
        assert data['name'] == 'Milk'
        assert data['category'] == category.id
        assert data['category_name'] == 'Dairy'  # Read-only field
        assert data['description'] == 'Fresh milk'
        assert data['barcode'] == '1234567890123'
        assert data['default_unit'] == 'liter'
        assert 'created_at' in data
        assert 'updated_at' in data

    def test_item_category_name_read_only(self, db):
        """Test that category_name is read-only and populated from category."""
        category = Category.objects.create(name='BeveragesTest', description='Drinks')
        item = ItemFactory(category=category)
        
        serializer = ItemSerializer(item)
        assert serializer.data['category_name'] == 'BeveragesTest'

    def test_item_serializer_fields(self, db):
        """Test that only expected fields are included."""
        item = ItemFactory()
        serializer = ItemSerializer(item)
        
        expected_fields = {
            'id', 'name', 'category', 'category_name', 'description', 
            'barcode', 'default_unit', 'created_at', 'updated_at'
        }
        assert set(serializer.data.keys()) == expected_fields

    def test_item_deserialization(self, db):
        """Test creating item from valid data."""
        category = CategoryFactory()
        data = {
            'name': 'Apple',
            'category': category.id,
            'description': 'Red apple',
            'barcode': '9876543210987',
            'default_unit': 'piece'
        }
        
        serializer = ItemSerializer(data=data)
        assert serializer.is_valid()
        
        item = serializer.save()
        assert item.name == 'Apple'
        assert item.category == category
        assert item.description == 'Red apple'
        assert item.barcode == '9876543210987'
        assert item.default_unit == 'piece'

    def test_item_invalid_data(self, db):
        """Test validation with invalid data."""
        data = {
            'name': '',  # Empty name
            'category': 999,  # Non-existent category
        }
        
        serializer = ItemSerializer(data=data)
        assert not serializer.is_valid()
        assert 'name' in serializer.errors
        assert 'category' in serializer.errors


@pytest.mark.unit
class TestGroceryListItemSerializer:
    """Test cases for the GroceryListItemSerializer."""

    def test_grocery_list_item_serialization(self, db):
        """Test that grocery list item data is serialized correctly."""
        owner = UserFactory(username='owner')
        checker = UserFactory(username='checker')
        category = CategoryFactory(name='Fruits')
        item = ItemFactory(name='Apple', category=category)
        grocery_list = GroceryListFactory(owner=owner)
        
        grocery_list_item = GroceryListItemFactory(
            grocery_list=grocery_list,
            item=item,
            quantity=2.5,
            unit='kg',
            notes='Organic apples',
            is_checked=True,
            added_by=owner,
            checked_by=checker
        )
        
        serializer = GroceryListItemSerializer(grocery_list_item)
        data = serializer.data
        
        assert data['id'] == grocery_list_item.id
        assert data['grocery_list'] == grocery_list.id
        assert data['item'] == item.id
        assert data['item_name'] == 'Apple'  # Read-only field
        assert data['item_category'] == 'Fruits'  # Read-only field
        assert data['quantity'] == '2.50'  # Decimal serialization
        assert data['unit'] == 'kg'
        assert data['notes'] == 'Organic apples'
        assert data['is_checked'] is True
        assert data['added_by'] == owner.id
        assert data['added_by_username'] == 'owner'  # Read-only field
        assert data['checked_by'] == checker.id
        assert data['checked_by_username'] == 'checker'  # Read-only field
        assert 'created_at' in data
        assert 'updated_at' in data
        assert 'checked_at' in data

    def test_grocery_list_item_nested_read_only_fields(self, db):
        """Test that nested read-only fields are populated correctly."""
        category = Category.objects.create(name='BeveragesCoffee', description='Coffee drinks')
        item = ItemFactory(name='Coffee', category=category)
        adder = UserFactory(username='adder')
        
        grocery_list_item = GroceryListItemFactory(
            item=item,
            added_by=adder,
            checked_by=None  # Not checked yet
        )
        
        serializer = GroceryListItemSerializer(grocery_list_item)
        data = serializer.data
        
        assert data['item_name'] == 'Coffee'
        assert data['item_category'] == 'BeveragesCoffee'
        assert data['added_by_username'] == 'adder'
        # When checked_by is None, checked_by_username field might not appear
        assert data.get('checked_by_username') is None

    def test_grocery_list_item_serializer_fields(self, db):
        """Test that only expected fields are included."""
        checker = UserFactory()
        grocery_list_item = GroceryListItemFactory(checked_by=checker)
        serializer = GroceryListItemSerializer(grocery_list_item)
        
        expected_fields = {
            'id', 'grocery_list', 'item', 'item_name', 'item_category',
            'quantity', 'unit', 'notes', 'is_checked', 'checked_at',
            'checked_by', 'checked_by_username', 'added_by', 'added_by_username',
            'created_at', 'updated_at'
        }
        assert set(serializer.data.keys()) == expected_fields

    def test_grocery_list_item_deserialization(self, db):
        """Test creating grocery list item from valid data."""
        grocery_list = GroceryListFactory()
        item = ItemFactory()
        user = UserFactory()
        
        data = {
            'grocery_list': grocery_list.id,
            'item': item.id,
            'quantity': '1.50',
            'unit': 'kg',
            'notes': 'Test notes',
            'added_by': user.id
        }
        
        serializer = GroceryListItemSerializer(data=data)
        assert serializer.is_valid()
        
        grocery_list_item = serializer.save()
        assert grocery_list_item.grocery_list == grocery_list
        assert grocery_list_item.item == item
        assert grocery_list_item.quantity == 1.50
        assert grocery_list_item.unit == 'kg'
        assert grocery_list_item.notes == 'Test notes'
        assert grocery_list_item.added_by == user

    def test_grocery_list_item_invalid_data(self, db):
        """Test validation with invalid data."""
        data = {
            'grocery_list': 999,  # Non-existent grocery list
            'item': 888,  # Non-existent item
            'quantity': 'invalid',  # Invalid decimal
            'added_by': 777  # Non-existent user
        }
        
        serializer = GroceryListItemSerializer(data=data)
        assert not serializer.is_valid()
        assert 'grocery_list' in serializer.errors
        assert 'item' in serializer.errors
        assert 'quantity' in serializer.errors
        assert 'added_by' in serializer.errors


@pytest.mark.unit
class TestGroceryListSimpleSerializer:
    """Test cases for the GroceryListSimpleSerializer."""

    def test_grocery_list_simple_serialization(self, db):
        """Test that grocery list data is serialized correctly."""
        owner = UserFactory(username='listowner')
        shared_user1 = UserFactory(username='shared1')
        shared_user2 = UserFactory(username='shared2')
        
        grocery_list = GroceryListFactory(
            name='Weekly Shopping',
            owner=owner,
            is_active=True
        )
        grocery_list.shared_with.add(shared_user1, shared_user2)
        
        # Add some items to test item_count
        GroceryListItemFactory.create_batch(3, grocery_list=grocery_list)
        
        serializer = GroceryListSimpleSerializer(grocery_list)
        data = serializer.data
        
        assert data['id'] == grocery_list.id
        assert data['name'] == 'Weekly Shopping'
        assert data['owner'] == owner.id
        assert data['owner_username'] == 'listowner'  # Read-only field
        assert data['is_active'] is True
        assert data['item_count'] == 3  # Method field
        assert 'created_at' in data
        assert 'updated_at' in data
        
        # Check shared_with nested serialization
        assert len(data['shared_with']) == 2
        shared_usernames = [user['username'] for user in data['shared_with']]
        assert 'shared1' in shared_usernames
        assert 'shared2' in shared_usernames

    def test_grocery_list_shared_with_nested_serialization(self, db):
        """Test that shared_with users are nested properly."""
        owner = UserFactory()
        shared_user = UserFactory(
            username='collaborator',
            email='collab@example.com',
            first_name='Collab',
            last_name='User'
        )
        
        grocery_list = GroceryListFactory(owner=owner)
        grocery_list.shared_with.add(shared_user)
        
        serializer = GroceryListSimpleSerializer(grocery_list)
        data = serializer.data
        
        assert len(data['shared_with']) == 1
        shared_data = data['shared_with'][0]
        
        # Should include all UserSerializer fields
        assert shared_data['id'] == shared_user.id
        assert shared_data['username'] == 'collaborator'
        assert shared_data['email'] == 'collab@example.com'
        assert shared_data['first_name'] == 'Collab'
        assert shared_data['last_name'] == 'User'

    def test_grocery_list_item_count_method_field(self, db):
        """Test that item_count calculates correctly."""
        grocery_list = GroceryListFactory()
        
        # Initially no items
        serializer = GroceryListSimpleSerializer(grocery_list)
        assert serializer.data['item_count'] == 0
        
        # Add items
        GroceryListItemFactory.create_batch(7, grocery_list=grocery_list)
        
        # Refresh and check count
        serializer = GroceryListSimpleSerializer(grocery_list)
        assert serializer.data['item_count'] == 7

    def test_grocery_list_simple_serializer_fields(self, db):
        """Test that only expected fields are included."""
        grocery_list = GroceryListFactory()
        serializer = GroceryListSimpleSerializer(grocery_list)
        
        expected_fields = {
            'id', 'name', 'owner', 'owner_username', 'shared_with', 
            'is_active', 'item_count', 'created_at', 'updated_at'
        }
        assert set(serializer.data.keys()) == expected_fields

    def test_grocery_list_deserialization(self, db):
        """Test creating grocery list from valid data."""
        owner = UserFactory()
        data = {
            'name': 'New List',
            'is_active': True
        }
        
        serializer = GroceryListSimpleSerializer(data=data)
        assert serializer.is_valid()
        
        # Since owner is read-only, we need to set it manually
        grocery_list = serializer.save(owner=owner)
        assert grocery_list.name == 'New List'
        assert grocery_list.owner == owner
        assert grocery_list.is_active is True

    def test_grocery_list_invalid_data(self, db):
        """Test validation with invalid data."""
        data = {
            'name': '',  # Empty name
        }
        
        serializer = GroceryListSimpleSerializer(data=data)
        assert not serializer.is_valid()
        assert 'name' in serializer.errors
        # owner field is read-only, so it won't generate validation errors

    def test_grocery_list_read_only_fields_not_updated(self, db):
        """Test that read-only fields are not updated during deserialization."""
        grocery_list = GroceryListFactory()
        original_item_count = grocery_list.items.count()
        
        data = {
            'name': 'Updated Name',
            'owner_username': 'should_be_ignored',  # Read-only field
            'item_count': 999,  # Read-only field
        }
        
        serializer = GroceryListSimpleSerializer(grocery_list, data=data, partial=True)
        assert serializer.is_valid()
        
        updated_list = serializer.save()
        assert updated_list.name == 'Updated Name'
        # Read-only fields should not be affected
        assert updated_list.owner.username != 'should_be_ignored'
        assert updated_list.items.count() == original_item_count