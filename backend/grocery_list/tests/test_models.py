import pytest
from django.db import IntegrityError
from django.core.exceptions import ValidationError
from grocery_list.models import Category, Item, GroceryList, GroceryListItem
from grocery_list.tests.factories import (
    UserFactory, CategoryFactory, ItemFactory, 
    GroceryListFactory, GroceryListItemFactory
)


@pytest.mark.unit
class TestCategoryModel:
    """Test cases for the Category model."""

    def test_category_creation(self, db):
        """Test basic category creation."""
        category = CategoryFactory(name='Fruits', description='Fresh fruits')
        
        assert category.name == 'Fruits'
        assert category.description == 'Fresh fruits'
        assert category.created_at is not None
        assert category.updated_at is not None

    def test_category_str_representation(self, db):
        """Test category string representation."""
        category = CategoryFactory(name='Vegetables')
        
        assert str(category) == 'Vegetables'

    def test_category_unique_name_constraint(self, db):
        """Test that category names must be unique."""
        Category.objects.create(name='Dairy')
        
        with pytest.raises(IntegrityError):
            Category.objects.create(name='Dairy')

    def test_category_name_max_length(self, db):
        """Test category name maximum length constraint."""
        long_name = 'a' * 101  # Exceeds max_length=100
        
        with pytest.raises(ValidationError):
            category = Category(name=long_name)
            category.full_clean()

    def test_category_description_can_be_blank(self, db):
        """Test that category description can be empty."""
        category = CategoryFactory(description='')
        
        assert category.description == ''
        
    def test_category_ordering(self, db):
        """Test that categories are ordered by name."""
        # Clear any existing categories and create fresh ones
        Category.objects.all().delete()
        
        cat_z = Category.objects.create(name='Zebra')
        cat_a = Category.objects.create(name='Apple')
        cat_m = Category.objects.create(name='Mango')
        
        categories = Category.objects.all()
        
        assert list(categories) == [cat_a, cat_m, cat_z]

    def test_category_verbose_name_plural(self, db):
        """Test category verbose name plural is set correctly."""
        assert Category._meta.verbose_name_plural == 'Categories'


@pytest.mark.unit
class TestItemModel:
    """Test cases for the Item model."""

    def test_item_creation(self, db):
        """Test basic item creation."""
        category = CategoryFactory(name='Fruits')
        item = ItemFactory(
            name='Apple',
            category=category,
            description='Red apples',
            barcode='1234567890123',
            default_unit='piece'
        )
        
        assert item.name == 'Apple'
        assert item.category == category
        assert item.description == 'Red apples'
        assert item.barcode == '1234567890123'
        assert item.default_unit == 'piece'
        assert item.created_at is not None
        assert item.updated_at is not None

    def test_item_str_representation(self, db):
        """Test item string representation."""
        category = CategoryFactory(name='Vegetables')
        item = ItemFactory(name='Carrot', category=category)
        
        assert str(item) == 'Carrot (Vegetables)'

    def test_item_category_relationship(self, db):
        """Test item belongs to category (foreign key)."""
        category = CategoryFactory(name='Dairy')
        item = ItemFactory(category=category)
        
        assert item.category == category
        assert item in category.items.all()

    def test_item_category_cascade_delete(self, db):
        """Test that deleting category deletes associated items."""
        category = CategoryFactory()
        item = ItemFactory(category=category)
        item_id = item.id
        
        category.delete()
        
        assert not Item.objects.filter(id=item_id).exists()

    def test_item_unique_together_constraint(self, db):
        """Test that item name must be unique within a category."""
        category = CategoryFactory()
        ItemFactory(name='Milk', category=category)
        
        with pytest.raises(IntegrityError):
            ItemFactory(name='Milk', category=category)

    def test_item_same_name_different_categories(self, db):
        """Test that items can have same name in different categories."""
        cat1 = CategoryFactory(name='Dairy')
        cat2 = CategoryFactory(name='Plant-based')
        
        item1 = ItemFactory(name='Milk', category=cat1)
        item2 = ItemFactory(name='Milk', category=cat2)
        
        assert item1.name == item2.name
        assert item1.category != item2.category

    def test_item_name_max_length(self, db):
        """Test item name maximum length constraint."""
        long_name = 'a' * 201  # Exceeds max_length=200
        
        with pytest.raises(ValidationError):
            item = Item(name=long_name, category=CategoryFactory())
            item.full_clean()

    def test_item_barcode_can_be_null(self, db):
        """Test that item barcode can be null."""
        item = ItemFactory(barcode=None)
        
        assert item.barcode is None

    def test_item_barcode_can_be_blank(self, db):
        """Test that item barcode can be blank."""
        item = ItemFactory(barcode='')
        
        assert item.barcode == ''

    def test_item_description_can_be_blank(self, db):
        """Test that item description can be blank."""
        item = ItemFactory(description='')
        
        assert item.description == ''

    def test_item_default_unit_default_value(self, db):
        """Test that item default_unit has correct default value."""
        category = CategoryFactory()
        item = Item.objects.create(name='Test Item', category=category)
        
        assert item.default_unit == 'piece'

    def test_item_ordering(self, db):
        """Test that items are ordered by name."""
        category = Category.objects.create(name='TestCategory')
        
        item_z = Item.objects.create(name='Zucchini', category=category)
        item_a = Item.objects.create(name='Apple', category=category)
        item_m = Item.objects.create(name='Mango', category=category)
        
        items = Item.objects.filter(category=category)
        
        assert list(items) == [item_a, item_m, item_z]

    def test_item_timestamps_auto_set(self, db):
        """Test that created_at and updated_at are automatically set."""
        item = ItemFactory()
        original_updated_at = item.updated_at
        
        # Update the item
        item.description = 'Updated description'
        item.save()
        
        assert item.created_at is not None
        assert item.updated_at > original_updated_at