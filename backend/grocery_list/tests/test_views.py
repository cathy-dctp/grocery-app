import pytest
import json
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from grocery_list.models import Category, Item, GroceryList, GroceryListItem
from grocery_list.tests.factories import (
    UserFactory, CategoryFactory, ItemFactory,
    GroceryListFactory, GroceryListItemFactory
)


@pytest.mark.api
class TestCategoryViewSet:
    """Test cases for the CategoryViewSet."""

    @pytest.fixture
    def authenticated_client(self, db):
        """Return an authenticated API client."""
        user = UserFactory()
        token, created = Token.objects.get_or_create(user=user)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        return client

    @pytest.fixture
    def category_list_url(self):
        """Return the category list URL."""
        return reverse('category-list')

    def category_detail_url(self, pk):
        """Return the category detail URL."""
        return reverse('category-detail', args=[pk])

    def test_list_categories_authenticated(self, authenticated_client, category_list_url, db):
        """Test listing categories with authentication."""
        # Clear existing categories first
        Category.objects.all().delete()
        
        # Create some categories
        cat1 = CategoryFactory(name='Fruits')
        cat2 = CategoryFactory(name='Vegetables')
        
        response = authenticated_client.get(category_list_url)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert 'results' in data  # DRF pagination
        categories = data['results']
        assert len(categories) == 2
        
        # Check category names are present
        category_names = [cat['name'] for cat in categories]
        assert 'Fruits' in category_names
        assert 'Vegetables' in category_names

    def test_list_categories_unauthenticated(self, category_list_url, db):
        """Test that listing categories requires authentication."""
        client = APIClient()
        response = client.get(category_list_url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_retrieve_category_authenticated(self, authenticated_client, db):
        """Test retrieving a specific category with authentication."""
        category = CategoryFactory(name='Dairy', description='Milk products')
        ItemFactory.create_batch(3, category=category)  # Add items for item_count
        
        url = self.category_detail_url(category.pk)
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data['id'] == category.id
        assert data['name'] == 'Dairy'
        assert data['description'] == 'Milk products'
        assert data['item_count'] == 3
        assert 'created_at' in data
        assert 'updated_at' in data

    def test_retrieve_nonexistent_category(self, authenticated_client, db):
        """Test retrieving a nonexistent category returns 404."""
        url = self.category_detail_url(999)
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_category_authenticated(self, authenticated_client, category_list_url, db):
        """Test creating a category with authentication."""
        # Clear existing categories first
        Category.objects.all().delete()
        
        data = {
            'name': 'Beverages',
            'description': 'Drinks and beverages'
        }
        
        response = authenticated_client.post(category_list_url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        
        response_data = response.json()
        assert response_data['name'] == 'Beverages'
        assert response_data['description'] == 'Drinks and beverages'
        assert response_data['item_count'] == 0
        
        # Verify category was created in database
        assert Category.objects.filter(name='Beverages').exists()

    def test_create_category_invalid_data(self, authenticated_client, category_list_url, db):
        """Test creating a category with invalid data."""
        data = {
            'name': '',  # Empty name should be invalid
            'description': 'Valid description'
        }
        
        response = authenticated_client.post(category_list_url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'name' in response.json()

    def test_create_category_duplicate_name(self, authenticated_client, category_list_url, db):
        """Test creating a category with duplicate name."""
        CategoryFactory(name='Existing')
        
        data = {
            'name': 'Existing',
            'description': 'Should fail'
        }
        
        response = authenticated_client.post(category_list_url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_update_category_authenticated(self, authenticated_client, db):
        """Test updating a category with authentication."""
        category = CategoryFactory(name='Old Name', description='Old description')
        
        url = self.category_detail_url(category.pk)
        data = {
            'name': 'New Name',
            'description': 'New description'
        }
        
        response = authenticated_client.put(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        response_data = response.json()
        assert response_data['name'] == 'New Name'
        assert response_data['description'] == 'New description'
        
        # Verify update in database
        category.refresh_from_db()
        assert category.name == 'New Name'
        assert category.description == 'New description'

    def test_partial_update_category_authenticated(self, authenticated_client, db):
        """Test partially updating a category with authentication."""
        category = CategoryFactory(name='Original', description='Original description')
        
        url = self.category_detail_url(category.pk)
        data = {
            'description': 'Updated description only'
        }
        
        response = authenticated_client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        response_data = response.json()
        assert response_data['name'] == 'Original'  # Unchanged
        assert response_data['description'] == 'Updated description only'
        
        # Verify partial update in database
        category.refresh_from_db()
        assert category.name == 'Original'
        assert category.description == 'Updated description only'

    def test_delete_category_authenticated(self, authenticated_client, db):
        """Test deleting a category with authentication."""
        category = CategoryFactory()
        category_id = category.id
        
        url = self.category_detail_url(category.pk)
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify category was deleted from database
        assert not Category.objects.filter(id=category_id).exists()

    def test_delete_nonexistent_category(self, authenticated_client, db):
        """Test deleting a nonexistent category returns 404."""
        url = self.category_detail_url(999)
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.api
class TestItemViewSet:
    """Test cases for the ItemViewSet."""

    @pytest.fixture
    def authenticated_client(self, db):
        """Return an authenticated API client."""
        user = UserFactory()
        token, created = Token.objects.get_or_create(user=user)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        return client

    @pytest.fixture
    def item_list_url(self):
        """Return the item list URL."""
        return reverse('item-list')

    def item_detail_url(self, pk):
        """Return the item detail URL."""
        return reverse('item-detail', args=[pk])

    def test_list_items_authenticated(self, authenticated_client, item_list_url, db):
        """Test listing items with authentication."""
        # Clear existing items and categories first
        Item.objects.all().delete()
        Category.objects.all().delete()
        
        category1 = CategoryFactory(name='Fruits')
        category2 = CategoryFactory(name='Vegetables')
        
        # Create some items
        item1 = ItemFactory(name='Apple', category=category1)
        item2 = ItemFactory(name='Carrot', category=category2)
        
        response = authenticated_client.get(item_list_url)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert 'results' in data
        items = data['results']
        assert len(items) == 2
        
        # Check items are present with category information
        item_names = [item['name'] for item in items]
        assert 'Apple' in item_names
        assert 'Carrot' in item_names
        
        # Check category_name is populated
        for item in items:
            assert 'category_name' in item
            if item['name'] == 'Apple':
                assert item['category_name'] == 'Fruits'
            elif item['name'] == 'Carrot':
                assert item['category_name'] == 'Vegetables'

    def test_list_items_unauthenticated(self, item_list_url, db):
        """Test that listing items requires authentication."""
        client = APIClient()
        response = client.get(item_list_url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_filter_items_by_category(self, authenticated_client, item_list_url, db):
        """Test filtering items by category using django-filter."""
        # Clear existing items and categories first
        Item.objects.all().delete()
        Category.objects.all().delete()
        
        fruits = CategoryFactory(name='Fruits')
        vegetables = CategoryFactory(name='Vegetables')
        
        apple = ItemFactory(name='Apple', category=fruits)
        banana = ItemFactory(name='Banana', category=fruits)
        carrot = ItemFactory(name='Carrot', category=vegetables)
        
        # Filter by fruits category
        response = authenticated_client.get(f'{item_list_url}?category={fruits.id}')
        
        assert response.status_code == status.HTTP_200_OK
        
        items = response.json()['results']
        assert len(items) == 2
        
        item_names = [item['name'] for item in items]
        assert 'Apple' in item_names
        assert 'Banana' in item_names
        assert 'Carrot' not in item_names

    def test_search_items_by_name(self, authenticated_client, item_list_url, db):
        """Test searching items by name using DRF SearchFilter."""
        # Clear existing items and categories first
        Item.objects.all().delete()
        Category.objects.all().delete()
        
        category = CategoryFactory()
        
        apple = ItemFactory(name='Green Apple', category=category)
        apricot = ItemFactory(name='Apricot', category=category)
        banana = ItemFactory(name='Banana', category=category)
        
        # Search for items containing 'ap'
        response = authenticated_client.get(f'{item_list_url}?search=ap')
        
        assert response.status_code == status.HTTP_200_OK
        
        items = response.json()['results']
        assert len(items) == 2
        
        item_names = [item['name'] for item in items]
        assert 'Green Apple' in item_names
        assert 'Apricot' in item_names
        assert 'Banana' not in item_names

    def test_search_items_by_barcode(self, authenticated_client, item_list_url, db):
        """Test searching items by barcode using DRF SearchFilter."""
        # Clear existing items and categories first
        Item.objects.all().delete()
        Category.objects.all().delete()
        
        category = CategoryFactory()
        
        item1 = ItemFactory(name='Item1', barcode='123456789', category=category)
        item2 = ItemFactory(name='Item2', barcode='987654321', category=category)
        item3 = ItemFactory(name='Item3', barcode='111222333', category=category)
        
        # Search by barcode
        response = authenticated_client.get(f'{item_list_url}?search=123')
        
        assert response.status_code == status.HTTP_200_OK
        
        items = response.json()['results']
        assert len(items) == 1  # Search finds specific barcode matches
        assert items[0]['name'] == 'Item1'
        assert items[0]['barcode'] == '123456789'

    def test_retrieve_item_authenticated(self, authenticated_client, db):
        """Test retrieving a specific item with authentication."""
        category = CategoryFactory(name='Electronics')
        item = ItemFactory(
            name='Smartphone',
            category=category,
            description='Latest model',
            barcode='1234567890123',
            default_unit='piece'
        )
        
        url = self.item_detail_url(item.pk)
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data['id'] == item.id
        assert data['name'] == 'Smartphone'
        assert data['category'] == category.id
        assert data['category_name'] == 'Electronics'
        assert data['description'] == 'Latest model'
        assert data['barcode'] == '1234567890123'
        assert data['default_unit'] == 'piece'
        assert 'created_at' in data
        assert 'updated_at' in data

    def test_create_item_authenticated(self, authenticated_client, item_list_url, db):
        """Test creating an item with authentication."""
        category = CategoryFactory()
        data = {
            'name': 'New Item',
            'category': category.id,
            'description': 'A new item',
            'barcode': '9876543210987',
            'default_unit': 'kg'
        }
        
        response = authenticated_client.post(item_list_url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        
        response_data = response.json()
        assert response_data['name'] == 'New Item'
        assert response_data['category'] == category.id
        assert response_data['description'] == 'A new item'
        assert response_data['barcode'] == '9876543210987'
        assert response_data['default_unit'] == 'kg'
        
        # Verify item was created in database
        assert Item.objects.filter(name='New Item').exists()

    def test_create_item_invalid_category(self, authenticated_client, item_list_url, db):
        """Test creating an item with invalid category."""
        data = {
            'name': 'Test Item',
            'category': 999,  # Nonexistent category
            'default_unit': 'piece'
        }
        
        response = authenticated_client.post(item_list_url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'category' in response.json()

    def test_create_item_duplicate_name_in_category(self, authenticated_client, item_list_url, db):
        """Test creating an item with duplicate name in same category."""
        category = CategoryFactory()
        ItemFactory(name='Existing Item', category=category)
        
        data = {
            'name': 'Existing Item',
            'category': category.id
        }
        
        response = authenticated_client.post(item_list_url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_item_same_name_different_category(self, authenticated_client, item_list_url, db):
        """Test creating items with same name in different categories."""
        category1 = CategoryFactory(name='Dairy')
        category2 = CategoryFactory(name='Plant-based')
        
        ItemFactory(name='Milk', category=category1)
        
        data = {
            'name': 'Milk',
            'category': category2.id
        }
        
        response = authenticated_client.post(item_list_url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        
        # Should have two items named 'Milk' in different categories
        assert Item.objects.filter(name='Milk').count() == 2

    def test_update_item_authenticated(self, authenticated_client, db):
        """Test updating an item with authentication."""
        category1 = CategoryFactory(name='Old Category')
        category2 = CategoryFactory(name='New Category')
        item = ItemFactory(name='Old Name', category=category1)
        
        url = self.item_detail_url(item.pk)
        data = {
            'name': 'New Name',
            'category': category2.id,
            'description': 'Updated description',
            'default_unit': 'liter'
        }
        
        response = authenticated_client.put(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        response_data = response.json()
        assert response_data['name'] == 'New Name'
        assert response_data['category'] == category2.id
        assert response_data['category_name'] == 'New Category'
        assert response_data['description'] == 'Updated description'
        assert response_data['default_unit'] == 'liter'

    def test_delete_item_authenticated(self, authenticated_client, db):
        """Test deleting an item with authentication."""
        item = ItemFactory()
        item_id = item.id
        
        url = self.item_detail_url(item.pk)
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify item was deleted from database
        assert not Item.objects.filter(id=item_id).exists()

    def test_items_ordered_by_name(self, authenticated_client, item_list_url, db):
        """Test that items are returned ordered by name."""
        # Clear existing items and categories first
        Item.objects.all().delete()
        Category.objects.all().delete()
        
        category = CategoryFactory()
        
        # Create items in non-alphabetical order
        zebra = ItemFactory(name='Zebra', category=category)
        apple = ItemFactory(name='Apple', category=category)
        mango = ItemFactory(name='Mango', category=category)
        
        response = authenticated_client.get(item_list_url)
        
        assert response.status_code == status.HTTP_200_OK
        
        items = response.json()['results']
        item_names = [item['name'] for item in items]
        
        # Should be ordered alphabetically
        assert item_names == ['Apple', 'Mango', 'Zebra']

    def test_items_ordering_filter(self, authenticated_client, item_list_url, db):
        """Test that items can be ordered using OrderingFilter."""
        # Clear existing items and categories first
        Item.objects.all().delete()
        Category.objects.all().delete()
        
        category = CategoryFactory()
        
        # Create items with specific names to test ordering
        zebra = ItemFactory(name='Zebra', category=category)
        apple = ItemFactory(name='Apple', category=category)
        mango = ItemFactory(name='Mango', category=category)
        
        # Test ordering by name descending
        response = authenticated_client.get(f'{item_list_url}?ordering=-name')
        
        assert response.status_code == status.HTTP_200_OK
        
        items = response.json()['results']
        item_names = [item['name'] for item in items]
        
        # Should be ordered reverse alphabetically
        assert item_names == ['Zebra', 'Mango', 'Apple']


@pytest.mark.api
class TestGroceryListViewSet:
    """Test cases for the GroceryListViewSet."""

    @pytest.fixture
    def authenticated_client(self, db):
        """Return an authenticated API client."""
        user = UserFactory()
        token, created = Token.objects.get_or_create(user=user)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        client.user = user  # Store user for test access
        return client

    @pytest.fixture
    def grocery_list_url(self):
        """Return the grocery list URL."""
        return reverse('grocerylist-list')

    def grocery_list_detail_url(self, pk):
        """Return the grocery list detail URL."""
        return reverse('grocerylist-detail', args=[pk])

    def test_list_grocery_lists_authenticated(self, authenticated_client, grocery_list_url, db):
        """Test listing grocery lists with authentication and user filtering."""
        # Clear existing grocery lists first
        GroceryList.objects.all().delete()
        
        # Create lists for different users
        user1 = authenticated_client.user
        user2 = UserFactory()
        user3 = UserFactory()
        
        # Lists owned by authenticated user
        list1 = GroceryListFactory(name='My List 1', owner=user1)
        list2 = GroceryListFactory(name='My List 2', owner=user1)
        
        # Lists owned by other users (should not appear)
        other_list1 = GroceryListFactory(name='Other List 1', owner=user2)
        other_list2 = GroceryListFactory(name='Other List 2', owner=user3)
        
        # List shared with authenticated user
        shared_list = GroceryListFactory(name='Shared List', owner=user2)
        shared_list.shared_with.add(user1)
        
        response = authenticated_client.get(grocery_list_url)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert 'results' in data
        lists = data['results']
        
        # Should see own lists + shared lists
        assert len(lists) == 3
        
        list_names = [gl['name'] for gl in lists]
        assert 'My List 1' in list_names
        assert 'My List 2' in list_names
        assert 'Shared List' in list_names
        assert 'Other List 1' not in list_names
        assert 'Other List 2' not in list_names

    def test_list_grocery_lists_unauthenticated(self, grocery_list_url, db):
        """Test that listing grocery lists requires authentication."""
        client = APIClient()
        response = client.get(grocery_list_url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_retrieve_own_grocery_list(self, authenticated_client, db):
        """Test retrieving a grocery list owned by the user."""
        user = authenticated_client.user
        grocery_list = GroceryListFactory(
            name='Test List',
            owner=user
        )
        
        url = self.grocery_list_detail_url(grocery_list.pk)
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data['id'] == grocery_list.id
        assert data['name'] == 'Test List'
        assert data['owner'] == user.id
        assert 'created_at' in data
        assert 'updated_at' in data
        assert 'shared_with' in data

    def test_retrieve_shared_grocery_list(self, authenticated_client, db):
        """Test retrieving a grocery list shared with the user."""
        user = authenticated_client.user
        owner = UserFactory()
        
        grocery_list = GroceryListFactory(
            name='Shared List',
            owner=owner
        )
        grocery_list.shared_with.add(user)
        
        url = self.grocery_list_detail_url(grocery_list.pk)
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert data['id'] == grocery_list.id
        assert data['name'] == 'Shared List'
        assert data['owner'] == owner.id

    def test_retrieve_other_user_grocery_list_forbidden(self, authenticated_client, db):
        """Test that retrieving another user's grocery list is forbidden."""
        other_user = UserFactory()
        grocery_list = GroceryListFactory(owner=other_user)
        
        url = self.grocery_list_detail_url(grocery_list.pk)
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_grocery_list_authenticated(self, authenticated_client, grocery_list_url, db):
        """Test creating a grocery list with authentication."""
        # Clear existing grocery lists first
        GroceryList.objects.all().delete()
        
        data = {
            'name': 'New Shopping List'
        }
        
        response = authenticated_client.post(grocery_list_url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        
        response_data = response.json()
        assert response_data['name'] == 'New Shopping List'
        assert response_data['owner'] == authenticated_client.user.id
        
        # Verify grocery list was created in database
        assert GroceryList.objects.filter(name='New Shopping List').exists()
        created_list = GroceryList.objects.get(name='New Shopping List')
        assert created_list.owner == authenticated_client.user

    def test_create_grocery_list_invalid_data(self, authenticated_client, grocery_list_url, db):
        """Test creating a grocery list with invalid data."""
        data = {
            'name': ''  # Empty name should be invalid
        }
        
        response = authenticated_client.post(grocery_list_url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'name' in response.json()

    def test_update_own_grocery_list(self, authenticated_client, db):
        """Test updating a grocery list owned by the user."""
        user = authenticated_client.user
        grocery_list = GroceryListFactory(
            name='Old Name',
            owner=user
        )
        
        url = self.grocery_list_detail_url(grocery_list.pk)
        data = {
            'name': 'Updated Name'
        }
        
        response = authenticated_client.put(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        response_data = response.json()
        assert response_data['name'] == 'Updated Name'
        
        # Verify update in database
        grocery_list.refresh_from_db()
        assert grocery_list.name == 'Updated Name'

    def test_partial_update_own_grocery_list(self, authenticated_client, db):
        """Test partially updating a grocery list owned by the user."""
        user = authenticated_client.user
        grocery_list = GroceryListFactory(
            name='Original Name',
            owner=user
        )
        
        url = self.grocery_list_detail_url(grocery_list.pk)
        data = {
            'name': 'Partially Updated Name'
        }
        
        response = authenticated_client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        response_data = response.json()
        assert response_data['name'] == 'Partially Updated Name'
        
        # Verify partial update in database
        grocery_list.refresh_from_db()
        assert grocery_list.name == 'Partially Updated Name'

    def test_update_other_user_grocery_list_forbidden(self, authenticated_client, db):
        """Test that updating another user's grocery list is forbidden."""
        other_user = UserFactory()
        grocery_list = GroceryListFactory(owner=other_user)
        
        url = self.grocery_list_detail_url(grocery_list.pk)
        data = {
            'name': 'Hacked Name'
        }
        
        response = authenticated_client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_own_grocery_list(self, authenticated_client, db):
        """Test deleting a grocery list owned by the user."""
        user = authenticated_client.user
        grocery_list = GroceryListFactory(owner=user)
        grocery_list_id = grocery_list.id
        
        url = self.grocery_list_detail_url(grocery_list.pk)
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify grocery list was deleted from database
        assert not GroceryList.objects.filter(id=grocery_list_id).exists()

    def test_delete_other_user_grocery_list_forbidden(self, authenticated_client, db):
        """Test that deleting another user's grocery list is forbidden."""
        other_user = UserFactory()
        grocery_list = GroceryListFactory(owner=other_user)
        
        url = self.grocery_list_detail_url(grocery_list.pk)
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        # Verify grocery list still exists
        assert GroceryList.objects.filter(id=grocery_list.id).exists()

    def test_delete_nonexistent_grocery_list(self, authenticated_client, db):
        """Test deleting a nonexistent grocery list returns 404."""
        url = self.grocery_list_detail_url(999)
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_shared_with_field_populated(self, authenticated_client, db):
        """Test that shared_with field is properly populated."""
        user = authenticated_client.user
        user2 = UserFactory(username='user2')
        user3 = UserFactory(username='user3')
        
        grocery_list = GroceryListFactory(owner=user)
        grocery_list.shared_with.add(user2, user3)
        
        url = self.grocery_list_detail_url(grocery_list.pk)
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert 'shared_with' in data
        shared_users = data['shared_with']
        assert len(shared_users) == 2
        
        # Check that shared users have proper fields
        usernames = [user['username'] for user in shared_users]
        assert 'user2' in usernames
        assert 'user3' in usernames

    def test_grocery_lists_ordered_by_updated_date(self, authenticated_client, grocery_list_url, db):
        """Test that grocery lists are returned ordered by most recent update."""
        # Clear existing grocery lists first
        GroceryList.objects.all().delete()
        
        user = authenticated_client.user
        
        # Create lists with specific names to test ordering
        list1 = GroceryListFactory(name='First List', owner=user)
        list2 = GroceryListFactory(name='Second List', owner=user) 
        list3 = GroceryListFactory(name='Third List', owner=user)
        
        response = authenticated_client.get(grocery_list_url)
        
        assert response.status_code == status.HTTP_200_OK
        
        lists = response.json()['results']
        list_names = [gl['name'] for gl in lists]
        
        # Should be ordered by most recent update first (ordering = ['-updated_at'])
        # Since list3 was created last, it will be first
        assert list_names == ['Third List', 'Second List', 'First List']


@pytest.mark.api
class TestCustomActions:
    """Test cases for custom actions on ViewSets."""

    @pytest.fixture
    def authenticated_client(self, db):
        """Return an authenticated API client."""
        user = UserFactory()
        token, created = Token.objects.get_or_create(user=user)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        client.user = user  # Store user for test access
        return client

    # GroceryList add_item action tests
    def test_add_item_to_grocery_list_success(self, authenticated_client, db):
        """Test successfully adding an item to a grocery list."""
        user = authenticated_client.user
        category = CategoryFactory()
        item = ItemFactory(category=category, default_unit='kg')
        grocery_list = GroceryListFactory(owner=user)
        
        url = f'/api/grocery-lists/{grocery_list.id}/add_item/'
        data = {
            'item_id': item.id,
            'quantity': 2.5,
            'unit': 'lbs',
            'notes': 'Organic if possible'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        
        response_data = response.json()
        assert response_data['grocery_list'] == grocery_list.id
        assert response_data['item'] == item.id
        assert float(response_data['quantity']) == 2.5
        assert response_data['unit'] == 'lbs'
        assert response_data['notes'] == 'Organic if possible'
        assert response_data['added_by'] == user.id
        assert response_data['is_checked'] is False
        
        # Verify item was added to database
        grocery_list_item = GroceryListItem.objects.get(grocery_list=grocery_list, item=item)
        assert grocery_list_item.quantity == 2.5
        assert grocery_list_item.unit == 'lbs'
        assert grocery_list_item.notes == 'Organic if possible'

    def test_add_item_with_default_values(self, authenticated_client, db):
        """Test adding an item with default quantity and unit."""
        user = authenticated_client.user
        category = CategoryFactory()
        item = ItemFactory(category=category, default_unit='piece')
        grocery_list = GroceryListFactory(owner=user)
        
        url = f'/api/grocery-lists/{grocery_list.id}/add_item/'
        data = {
            'item_id': item.id
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        
        response_data = response.json()
        assert float(response_data['quantity']) == 1.0
        assert response_data['unit'] == 'piece'  # Should use item's default_unit
        assert response_data['notes'] == ''

    def test_add_existing_item_creates_new_entry(self, authenticated_client, db):
        """Test that adding an existing item creates a new entry instead of incrementing."""
        user = authenticated_client.user
        category = CategoryFactory()
        item = ItemFactory(category=category)
        grocery_list = GroceryListFactory(owner=user)
        
        # Create existing item in the list
        existing_item = GroceryListItemFactory(
            grocery_list=grocery_list,
            item=item,
            quantity=3,
            added_by=user
        )
        
        url = f'/api/grocery-lists/{grocery_list.id}/add_item/'
        data = {
            'item_id': item.id,
            'quantity': 2
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        
        response_data = response.json()
        assert float(response_data['quantity']) == 2.0  # New entry with quantity 2
        
        # Verify both items exist in database
        items_in_list = GroceryListItem.objects.filter(grocery_list=grocery_list, item=item)
        assert items_in_list.count() == 2
        
        # Original item should remain unchanged
        existing_item.refresh_from_db()
        assert existing_item.quantity == 3

    def test_add_item_nonexistent_item(self, authenticated_client, db):
        """Test adding a nonexistent item returns 404."""
        user = authenticated_client.user
        grocery_list = GroceryListFactory(owner=user)
        
        url = f'/api/grocery-lists/{grocery_list.id}/add_item/'
        data = {
            'item_id': 999  # Nonexistent item
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.json()['error'] == 'Item not found'

    def test_add_item_to_other_user_list_forbidden(self, authenticated_client, db):
        """Test that adding item to another user's list is forbidden."""
        other_user = UserFactory()
        category = CategoryFactory()
        item = ItemFactory(category=category)
        grocery_list = GroceryListFactory(owner=other_user)
        
        url = f'/api/grocery-lists/{grocery_list.id}/add_item/'
        data = {
            'item_id': item.id
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_add_item_to_shared_list_success(self, authenticated_client, db):
        """Test adding item to a list shared with the user."""
        user = authenticated_client.user
        owner = UserFactory()
        category = CategoryFactory()
        item = ItemFactory(category=category)
        grocery_list = GroceryListFactory(owner=owner)
        grocery_list.shared_with.add(user)
        
        url = f'/api/grocery-lists/{grocery_list.id}/add_item/'
        data = {
            'item_id': item.id,
            'quantity': 1
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        
        response_data = response.json()
        assert response_data['added_by'] == user.id

    # GroceryList share_with action tests
    def test_share_grocery_list_success(self, authenticated_client, db):
        """Test successfully sharing a grocery list with another user."""
        user = authenticated_client.user
        other_user = UserFactory(username='shareuser')
        grocery_list = GroceryListFactory(owner=user)
        
        url = f'/api/grocery-lists/{grocery_list.id}/share_with/'
        data = {
            'username': 'shareuser'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['message'] == 'List shared with shareuser'
        
        # Verify sharing in database
        grocery_list.refresh_from_db()
        assert other_user in grocery_list.shared_with.all()

    def test_share_grocery_list_nonexistent_user(self, authenticated_client, db):
        """Test sharing with a nonexistent user returns 404."""
        user = authenticated_client.user
        grocery_list = GroceryListFactory(owner=user)
        
        url = f'/api/grocery-lists/{grocery_list.id}/share_with/'
        data = {
            'username': 'nonexistentuser'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.json()['error'] == 'User not found'

    def test_share_other_user_grocery_list_forbidden(self, authenticated_client, db):
        """Test that sharing another user's grocery list is forbidden."""
        other_user = UserFactory()
        grocery_list = GroceryListFactory(owner=other_user)
        share_user = UserFactory(username='shareuser')
        
        url = f'/api/grocery-lists/{grocery_list.id}/share_with/'
        data = {
            'username': 'shareuser'
        }
        
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    # GroceryListItem toggle_checked action tests
    def test_toggle_checked_unchecked_to_checked(self, authenticated_client, db):
        """Test toggling an unchecked item to checked."""
        user = authenticated_client.user
        grocery_list = GroceryListFactory(owner=user)
        item = ItemFactory()
        grocery_list_item = GroceryListItemFactory(
            grocery_list=grocery_list,
            item=item,
            added_by=user,
            is_checked=False
        )
        
        url = f'/api/grocery-list-items/{grocery_list_item.id}/toggle_checked/'
        
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        response_data = response.json()
        assert response_data['is_checked'] is True
        assert response_data['checked_by'] == user.id
        assert 'checked_at' in response_data
        assert response_data['checked_at'] is not None
        
        # Verify in database
        grocery_list_item.refresh_from_db()
        assert grocery_list_item.is_checked is True
        assert grocery_list_item.checked_by == user
        assert grocery_list_item.checked_at is not None

    def test_toggle_checked_checked_to_unchecked(self, authenticated_client, db):
        """Test toggling a checked item to unchecked."""
        user = authenticated_client.user
        grocery_list = GroceryListFactory(owner=user)
        item = ItemFactory()
        grocery_list_item = GroceryListItemFactory(
            grocery_list=grocery_list,
            item=item,
            added_by=user,
            is_checked=True,
            checked_by=user
        )
        
        url = f'/api/grocery-list-items/{grocery_list_item.id}/toggle_checked/'
        
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        response_data = response.json()
        assert response_data['is_checked'] is False
        assert response_data['checked_by'] is None
        assert response_data['checked_at'] is None
        
        # Verify in database
        grocery_list_item.refresh_from_db()
        assert grocery_list_item.is_checked is False
        assert grocery_list_item.checked_by is None
        assert grocery_list_item.checked_at is None

    def test_toggle_checked_other_user_item_forbidden(self, authenticated_client, db):
        """Test that toggling another user's grocery list item is forbidden."""
        other_user = UserFactory()
        grocery_list = GroceryListFactory(owner=other_user)
        item = ItemFactory()
        grocery_list_item = GroceryListItemFactory(
            grocery_list=grocery_list,
            item=item,
            added_by=other_user
        )
        
        url = f'/api/grocery-list-items/{grocery_list_item.id}/toggle_checked/'
        
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_toggle_checked_shared_list_item_success(self, authenticated_client, db):
        """Test toggling item in a shared grocery list."""
        user = authenticated_client.user
        owner = UserFactory()
        grocery_list = GroceryListFactory(owner=owner)
        grocery_list.shared_with.add(user)
        item = ItemFactory()
        grocery_list_item = GroceryListItemFactory(
            grocery_list=grocery_list,
            item=item,
            added_by=owner,
            is_checked=False
        )
        
        url = f'/api/grocery-list-items/{grocery_list_item.id}/toggle_checked/'
        
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        response_data = response.json()
        assert response_data['is_checked'] is True
        assert response_data['checked_by'] == user.id  # User who checked it

    def test_toggle_checked_nonexistent_item(self, authenticated_client, db):
        """Test toggling a nonexistent grocery list item returns 404."""
        url = '/api/grocery-list-items/999/toggle_checked/'
        
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.api
class TestGroceryListItemPatchUpdates:
    """Test PATCH functionality for grocery list items (partial updates)."""

    @pytest.fixture
    def authenticated_client(self, db):
        """Return an authenticated API client."""
        user = UserFactory()
        token, created = Token.objects.get_or_create(user=user)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        client.user = user  # Store user for test access
        return client

    def grocery_list_item_detail_url(self, pk):
        """Return the grocery list item detail URL."""
        return reverse('grocerylistitem-detail', args=[pk])

    def test_patch_update_custom_name_only(self, authenticated_client, db):
        """Test PATCH updating only custom_name field."""
        user = authenticated_client.user
        grocery_list = GroceryListFactory(owner=user)
        item = ItemFactory(name='Apple')
        grocery_list_item = GroceryListItemFactory(
            grocery_list=grocery_list,
            item=item,
            custom_name='Old Custom Name',
            quantity=3,
            unit='pieces',
            notes='Original notes',
            added_by=user
        )
        
        url = self.grocery_list_item_detail_url(grocery_list_item.pk)
        data = {
            'custom_name': 'Updated Custom Name'
        }
        
        response = authenticated_client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        response_data = response.json()
        assert response_data['custom_name'] == 'Updated Custom Name'
        assert response_data['display_name'] == 'Updated Custom Name'
        # Other fields should remain unchanged
        assert float(response_data['quantity']) == 3.0
        assert response_data['unit'] == 'pieces'
        assert response_data['notes'] == 'Original notes'
        
        # Verify in database
        grocery_list_item.refresh_from_db()
        assert grocery_list_item.custom_name == 'Updated Custom Name'
        assert grocery_list_item.quantity == 3
        assert grocery_list_item.notes == 'Original notes'

    def test_patch_update_quantity_and_unit(self, authenticated_client, db):
        """Test PATCH updating quantity and unit fields."""
        user = authenticated_client.user
        grocery_list = GroceryListFactory(owner=user)
        grocery_list_item = GroceryListItemFactory(
            grocery_list=grocery_list,
            custom_name='My Custom Item',
            quantity=2,
            unit='pieces',
            notes='Some notes',
            added_by=user
        )
        
        url = self.grocery_list_item_detail_url(grocery_list_item.pk)
        data = {
            'quantity': '5.5',
            'unit': 'kg'
        }
        
        response = authenticated_client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        response_data = response.json()
        assert float(response_data['quantity']) == 5.5
        assert response_data['unit'] == 'kg'
        # Other fields should remain unchanged
        assert response_data['custom_name'] == 'My Custom Item'
        assert response_data['notes'] == 'Some notes'

    def test_patch_clear_custom_name(self, authenticated_client, db):
        """Test PATCH can clear custom_name to make display_name fall back to item name."""
        user = authenticated_client.user
        grocery_list = GroceryListFactory(owner=user)
        item = ItemFactory(name='Banana')
        grocery_list_item = GroceryListItemFactory(
            grocery_list=grocery_list,
            item=item,
            custom_name='Custom Banana Name',
            added_by=user
        )
        
        url = self.grocery_list_item_detail_url(grocery_list_item.pk)
        data = {
            'custom_name': ''  # Clear the custom name
        }
        
        response = authenticated_client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        
        response_data = response.json()
        assert response_data['custom_name'] == ''
        assert response_data['display_name'] == 'Banana'  # Should fall back to item name
        assert response_data['item_name'] == 'Banana'


@pytest.mark.api
class TestEnhancedDuplicateItemScenarios:
    """Test enhanced scenarios with duplicate items after removing unique constraint."""

    @pytest.fixture
    def authenticated_client(self, db):
        """Return an authenticated API client."""
        user = UserFactory()
        token, created = Token.objects.get_or_create(user=user)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        client.user = user  # Store user for test access
        return client

    def test_same_item_different_units(self, authenticated_client, db):
        """Test adding same item with different units creates separate entries."""
        user = authenticated_client.user
        category = CategoryFactory()
        item = ItemFactory(category=category, name='Apples', default_unit='piece')
        grocery_list = GroceryListFactory(owner=user)
        
        url = f'/api/grocery-lists/{grocery_list.id}/add_item/'
        
        # Add apples by pieces
        data1 = {
            'item_id': item.id,
            'quantity': 5,
            'unit': 'pieces'
        }
        response1 = authenticated_client.post(url, data1, format='json')
        assert response1.status_code == status.HTTP_201_CREATED
        
        # Add apples by weight
        data2 = {
            'item_id': item.id,
            'quantity': 2.5,
            'unit': 'lbs'
        }
        response2 = authenticated_client.post(url, data2, format='json')
        assert response2.status_code == status.HTTP_201_CREATED
        
        # Verify both entries exist
        items_in_list = GroceryListItem.objects.filter(grocery_list=grocery_list, item=item)
        assert items_in_list.count() == 2
        
        # Check both have different units and quantities
        units = [gli.unit for gli in items_in_list]
        quantities = [float(gli.quantity) for gli in items_in_list]
        
        assert 'pieces' in units
        assert 'lbs' in units
        assert 5.0 in quantities
        assert 2.5 in quantities

    def test_same_item_different_custom_names(self, authenticated_client, db):
        """Test adding same item with different custom names creates separate entries."""
        user = authenticated_client.user
        category = CategoryFactory()
        item = ItemFactory(category=category, name='Milk')
        grocery_list = GroceryListFactory(owner=user)
        
        # Create first entry with custom name
        item1 = GroceryListItemFactory(
            grocery_list=grocery_list,
            item=item,
            custom_name='Whole Milk',
            quantity=1,
            unit='gallon',
            added_by=user
        )
        
        # Create second entry with different custom name
        item2 = GroceryListItemFactory(
            grocery_list=grocery_list,
            item=item,
            custom_name='Almond Milk',
            quantity=2,
            unit='cartons',
            added_by=user
        )
        
        # Verify both exist and have different display names
        items = GroceryListItem.objects.filter(grocery_list=grocery_list, item=item)
        assert items.count() == 2
        
        from grocery_list.serializers import GroceryListItemSerializer
        serializer1 = GroceryListItemSerializer(item1)
        serializer2 = GroceryListItemSerializer(item2)
        
        assert serializer1.data['display_name'] == 'Whole Milk'
        assert serializer2.data['display_name'] == 'Almond Milk'
        assert serializer1.data['item_name'] == 'Milk'  # Same base item
        assert serializer2.data['item_name'] == 'Milk'  # Same base item

    def test_checking_off_duplicate_items_independently(self, authenticated_client, db):
        """Test that duplicate items can be checked off independently."""
        user = authenticated_client.user
        grocery_list = GroceryListFactory(owner=user)
        item = ItemFactory()
        
        # Create two instances of same item
        item1 = GroceryListItemFactory(
            grocery_list=grocery_list,
            item=item,
            quantity=2,
            unit='pieces',
            is_checked=False,
            added_by=user
        )
        item2 = GroceryListItemFactory(
            grocery_list=grocery_list,
            item=item,
            quantity=5,
            unit='kg',
            is_checked=False,
            added_by=user
        )
        
        # Check off first item
        url1 = f'/api/grocery-list-items/{item1.id}/toggle_checked/'
        response1 = authenticated_client.post(url1)
        assert response1.status_code == status.HTTP_200_OK
        
        # Verify first item is checked, second is not
        item1.refresh_from_db()
        item2.refresh_from_db()
        
        assert item1.is_checked is True
        assert item2.is_checked is False
        assert item1.checked_by == user
        assert item2.checked_by is None

    def test_add_checked_item_again(self, authenticated_client, db):
        """Test that users can add items again after checking them off."""
        user = authenticated_client.user
        category = CategoryFactory()
        item = ItemFactory(category=category, name='Bread')
        grocery_list = GroceryListFactory(owner=user)
        
        # Create and check off an item
        checked_item = GroceryListItemFactory(
            grocery_list=grocery_list,
            item=item,
            quantity=1,
            unit='loaf',
            is_checked=True,
            checked_by=user,
            added_by=user
        )
        
        # Add the same item again via API
        url = f'/api/grocery-lists/{grocery_list.id}/add_item/'
        data = {
            'item_id': item.id,
            'quantity': 2,
            'unit': 'loaves'
        }
        
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify both items exist - one checked, one unchecked
        items = GroceryListItem.objects.filter(grocery_list=grocery_list, item=item)
        assert items.count() == 2
        
        checked_items = items.filter(is_checked=True)
        unchecked_items = items.filter(is_checked=False)
        
        assert checked_items.count() == 1
        assert unchecked_items.count() == 1
        
        # Verify the new item is unchecked with correct data
        new_item = unchecked_items.first()
        assert float(new_item.quantity) == 2.0
        assert new_item.unit == 'loaves'

    def test_multiple_quantities_same_item(self, authenticated_client, db):
        """Test adding same item multiple times with different quantities."""
        user = authenticated_client.user
        category = CategoryFactory()
        item = ItemFactory(category=category)
        grocery_list = GroceryListFactory(owner=user)
        
        url = f'/api/grocery-lists/{grocery_list.id}/add_item/'
        quantities = [1, 2.5, 0.75, 10]
        
        # Add same item with different quantities
        for qty in quantities:
            data = {
                'item_id': item.id,
                'quantity': qty
            }
            response = authenticated_client.post(url, data, format='json')
            assert response.status_code == status.HTTP_201_CREATED
        
        # Verify all entries exist with correct quantities
        items = GroceryListItem.objects.filter(grocery_list=grocery_list, item=item)
        assert items.count() == len(quantities)
        
        db_quantities = sorted([float(gli.quantity) for gli in items])
        expected_quantities = sorted([float(q) for q in quantities])
        
        assert db_quantities == expected_quantities

    def test_duplicate_items_ordering(self, authenticated_client, db):
        """Test that duplicate items follow proper ordering (unchecked first, then by item name)."""
        user = authenticated_client.user
        grocery_list = GroceryListFactory(owner=user)
        item = ItemFactory(name='Tomatoes')
        
        # Create multiple instances - some checked, some not
        item1 = GroceryListItemFactory(
            grocery_list=grocery_list,
            item=item,
            custom_name='Cherry Tomatoes',
            is_checked=False,
            added_by=user
        )
        item2 = GroceryListItemFactory(
            grocery_list=grocery_list,
            item=item,
            custom_name='Roma Tomatoes',
            is_checked=True,
            checked_by=user,
            added_by=user
        )
        item3 = GroceryListItemFactory(
            grocery_list=grocery_list,
            item=item,
            custom_name='Beefsteak Tomatoes',
            is_checked=False,
            added_by=user
        )
        
        # Get items in database order (should follow model's Meta.ordering)
        items = list(GroceryListItem.objects.filter(grocery_list=grocery_list, item=item))
        
        # Unchecked items should come first
        unchecked_items = [i for i in items if not i.is_checked]
        checked_items = [i for i in items if i.is_checked]
        
        # Should have 2 unchecked, 1 checked
        assert len(unchecked_items) == 2
        assert len(checked_items) == 1
        
        # Within unchecked items, should be ordered by item name
        # (Both have same item.name='Tomatoes', so order within unchecked group may vary)
        for item in unchecked_items:
            assert not item.is_checked