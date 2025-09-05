from django.core.exceptions import ValidationError
from django.db import IntegrityError

import pytest

from grocery_list.models import Category, GroceryList, GroceryListItem, Item
from grocery_list.tests.factories import (
    CategoryFactory,
    GroceryListFactory,
    GroceryListItemFactory,
    ItemFactory,
    UserFactory,
)


@pytest.mark.unit
class TestCategoryModel:
    """Test cases for the Category model."""

    def test_category_creation(self, db):
        """Test basic category creation."""
        category = CategoryFactory(name="Fruits", description="Fresh fruits")

        assert category.name == "Fruits"
        assert category.description == "Fresh fruits"
        assert category.created_at is not None
        assert category.updated_at is not None

    def test_category_str_representation(self, db):
        """Test category string representation."""
        category = CategoryFactory(name="Vegetables")

        assert str(category) == "Vegetables"

    def test_category_unique_name_constraint(self, db):
        """Test that category names must be unique."""
        Category.objects.create(name="Dairy")

        with pytest.raises(IntegrityError):
            Category.objects.create(name="Dairy")

    def test_category_name_max_length(self, db):
        """Test category name maximum length constraint."""
        long_name = "a" * 101  # Exceeds max_length=100

        with pytest.raises(ValidationError):
            category = Category(name=long_name)
            category.full_clean()

    def test_category_description_can_be_blank(self, db):
        """Test that category description can be empty."""
        category = CategoryFactory(description="")

        assert category.description == ""

    def test_category_ordering(self, db):
        """Test that categories are ordered by name."""
        # Clear any existing categories and create fresh ones
        Category.objects.all().delete()

        cat_z = Category.objects.create(name="Zebra")
        cat_a = Category.objects.create(name="Apple")
        cat_m = Category.objects.create(name="Mango")

        categories = Category.objects.all()

        assert list(categories) == [cat_a, cat_m, cat_z]

    def test_category_verbose_name_plural(self, db):
        """Test category verbose name plural is set correctly."""
        assert Category._meta.verbose_name_plural == "Categories"


@pytest.mark.unit
class TestItemModel:
    """Test cases for the Item model."""

    def test_item_creation(self, db):
        """Test basic item creation."""
        category = CategoryFactory(name="Fruits")
        item = ItemFactory(
            name="Apple",
            category=category,
            description="Red apples",
            barcode="1234567890123",
            default_unit="piece",
        )

        assert item.name == "Apple"
        assert item.category == category
        assert item.description == "Red apples"
        assert item.barcode == "1234567890123"
        assert item.default_unit == "piece"
        assert item.created_at is not None
        assert item.updated_at is not None

    def test_item_str_representation(self, db):
        """Test item string representation."""
        category = CategoryFactory(name="Vegetables")
        item = ItemFactory(name="Carrot", category=category)

        assert str(item) == "Carrot (Vegetables)"

    def test_item_category_relationship(self, db):
        """Test item belongs to category (foreign key)."""
        category = CategoryFactory(name="Dairy")
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
        ItemFactory(name="Milk", category=category)

        with pytest.raises(IntegrityError):
            ItemFactory(name="Milk", category=category)

    def test_item_same_name_different_categories(self, db):
        """Test that items can have same name in different categories."""
        cat1 = CategoryFactory(name="Dairy")
        cat2 = CategoryFactory(name="Plant-based")

        item1 = ItemFactory(name="Milk", category=cat1)
        item2 = ItemFactory(name="Milk", category=cat2)

        assert item1.name == item2.name
        assert item1.category != item2.category

    def test_item_name_max_length(self, db):
        """Test item name maximum length constraint."""
        long_name = "a" * 201  # Exceeds max_length=200

        with pytest.raises(ValidationError):
            item = Item(name=long_name, category=CategoryFactory())
            item.full_clean()

    def test_item_barcode_can_be_null(self, db):
        """Test that item barcode can be null."""
        item = ItemFactory(barcode=None)

        assert item.barcode is None

    def test_item_barcode_can_be_blank(self, db):
        """Test that item barcode can be blank."""
        item = ItemFactory(barcode="")

        assert item.barcode == ""

    def test_item_description_can_be_blank(self, db):
        """Test that item description can be blank."""
        item = ItemFactory(description="")

        assert item.description == ""

    def test_item_default_unit_default_value(self, db):
        """Test that item default_unit has correct default value."""
        category = CategoryFactory()
        item = Item.objects.create(name="Test Item", category=category)

        assert item.default_unit == "piece"

    def test_item_ordering(self, db):
        """Test that items are ordered by name."""
        category = Category.objects.create(name="TestCategory")

        item_z = Item.objects.create(name="Zucchini", category=category)
        item_a = Item.objects.create(name="Apple", category=category)
        item_m = Item.objects.create(name="Mango", category=category)

        items = Item.objects.filter(category=category)

        assert list(items) == [item_a, item_m, item_z]

    def test_item_timestamps_auto_set(self, db):
        """Test that created_at and updated_at are automatically set."""
        item = ItemFactory()
        original_updated_at = item.updated_at

        # Update the item
        item.description = "Updated description"
        item.save()

        assert item.created_at is not None
        assert item.updated_at > original_updated_at


@pytest.mark.unit
class TestGroceryListModel:
    """Test cases for the GroceryList model."""

    def test_grocery_list_creation(self, db):
        """Test basic grocery list creation."""
        user = UserFactory(username="testowner")
        grocery_list = GroceryListFactory(
            name="Weekly Shopping", owner=user, is_active=True
        )

        assert grocery_list.name == "Weekly Shopping"
        assert grocery_list.owner == user
        assert grocery_list.is_active is True
        assert grocery_list.created_at is not None
        assert grocery_list.updated_at is not None

    def test_grocery_list_str_representation(self, db):
        """Test grocery list string representation."""
        user = UserFactory(username="john")
        grocery_list = GroceryListFactory(name="My List", owner=user)

        assert str(grocery_list) == "My List (by john)"

    def test_grocery_list_owner_relationship(self, db):
        """Test grocery list belongs to owner (foreign key)."""
        user = UserFactory()
        grocery_list = GroceryListFactory(owner=user)

        assert grocery_list.owner == user
        assert grocery_list in user.grocery_lists.all()

    def test_grocery_list_owner_cascade_delete(self, db):
        """Test that deleting owner deletes associated grocery lists."""
        user = UserFactory()
        grocery_list = GroceryListFactory(owner=user)
        grocery_list_id = grocery_list.id

        user.delete()

        assert not GroceryList.objects.filter(id=grocery_list_id).exists()

    def test_grocery_list_shared_with_relationship(self, db):
        """Test grocery list can be shared with multiple users."""
        owner = UserFactory(username="owner")
        user1 = UserFactory(username="user1")
        user2 = UserFactory(username="user2")

        grocery_list = GroceryListFactory(owner=owner)
        grocery_list.shared_with.add(user1, user2)

        assert user1 in grocery_list.shared_with.all()
        assert user2 in grocery_list.shared_with.all()
        assert grocery_list in user1.shared_grocery_lists.all()
        assert grocery_list in user2.shared_grocery_lists.all()

    def test_grocery_list_shared_with_can_be_empty(self, db):
        """Test that shared_with can be empty."""
        grocery_list = GroceryListFactory()

        assert grocery_list.shared_with.count() == 0

    def test_grocery_list_is_active_default(self, db):
        """Test that is_active defaults to True."""
        user = UserFactory()
        grocery_list = GroceryList.objects.create(name="Test List", owner=user)

        assert grocery_list.is_active is True

    def test_grocery_list_ordering(self, db):
        """Test that grocery lists are ordered by updated_at descending."""
        user = UserFactory()

        # Create lists in specific order
        list1 = GroceryListFactory(name="First", owner=user)
        list2 = GroceryListFactory(name="Second", owner=user)
        list3 = GroceryListFactory(name="Third", owner=user)

        # Update list1 to make it most recent
        list1.name = "Updated First"
        list1.save()

        lists = GroceryList.objects.filter(owner=user)

        # Should be ordered by most recently updated first
        assert lists[0] == list1  # Most recently updated
        assert lists[1] == list3  # Next most recent
        assert lists[2] == list2  # Oldest

    def test_grocery_list_name_max_length(self, db):
        """Test grocery list name maximum length constraint."""
        long_name = "a" * 201  # Exceeds max_length=200

        with pytest.raises(ValidationError):
            grocery_list = GroceryList(name=long_name, owner=UserFactory())
            grocery_list.full_clean()


@pytest.mark.unit
class TestGroceryListItemModel:
    """Test cases for the GroceryListItem model."""

    def test_grocery_list_item_creation(self, db):
        """Test basic grocery list item creation."""
        grocery_list = GroceryListFactory()
        item = ItemFactory(name="Bananas", default_unit="bunch")
        user = UserFactory()

        grocery_list_item = GroceryListItemFactory(
            grocery_list=grocery_list,
            item=item,
            quantity=2.5,
            unit="bunch",
            notes="Organic if available",
            is_checked=False,
            added_by=user,
        )

        assert grocery_list_item.grocery_list == grocery_list
        assert grocery_list_item.item == item
        assert grocery_list_item.quantity == 2.5
        assert grocery_list_item.unit == "bunch"
        assert grocery_list_item.notes == "Organic if available"
        assert grocery_list_item.is_checked is False
        assert grocery_list_item.added_by == user

    def test_grocery_list_item_str_representation(self, db):
        """Test grocery list item string representation."""
        item = ItemFactory(name="Apples", default_unit="kg")
        grocery_list_item = GroceryListItemFactory(item=item, quantity=1.5, unit="kg")

        assert str(grocery_list_item) == "1.5 kg of Apples"

    def test_grocery_list_item_str_with_default_unit(self, db):
        """Test string representation uses item's default unit when unit is empty."""
        item = ItemFactory(name="Bread", default_unit="loaf")
        grocery_list_item = GroceryListItemFactory(
            item=item, quantity=2, unit=""  # Empty unit should use default
        )

        assert str(grocery_list_item) == "2 loaf of Bread"

    def test_grocery_list_item_relationships(self, db):
        """Test grocery list item foreign key relationships."""
        grocery_list = GroceryListFactory()
        item = ItemFactory()
        user = UserFactory()

        grocery_list_item = GroceryListItemFactory(
            grocery_list=grocery_list, item=item, added_by=user
        )

        assert grocery_list_item.grocery_list == grocery_list
        assert grocery_list_item.item == item
        assert grocery_list_item.added_by == user
        assert grocery_list_item in grocery_list.items.all()
        assert grocery_list_item in user.added_items.all()

    def test_grocery_list_item_allows_duplicate_items(self, db):
        """Test that same item can be added multiple times to same grocery list."""
        grocery_list = GroceryListFactory()
        item = ItemFactory()
        user = UserFactory()

        # Create first item
        item1 = GroceryListItemFactory(
            grocery_list=grocery_list, item=item, quantity=2, added_by=user
        )

        # Should be able to create another instance of same item
        item2 = GroceryListItemFactory(
            grocery_list=grocery_list, item=item, quantity=3, added_by=user
        )

        # Both should exist in the database
        assert (
            GroceryListItem.objects.filter(grocery_list=grocery_list, item=item).count()
            == 2
        )
        assert item1.quantity == 2
        assert item2.quantity == 3

    def test_grocery_list_item_same_item_different_lists(self, db):
        """Test that same item can be in different grocery lists."""
        list1 = GroceryListFactory()
        list2 = GroceryListFactory()
        item = ItemFactory()
        user = UserFactory()

        item1 = GroceryListItemFactory(grocery_list=list1, item=item, added_by=user)
        item2 = GroceryListItemFactory(grocery_list=list2, item=item, added_by=user)

        assert item1.item == item2.item
        assert item1.grocery_list != item2.grocery_list

    def test_grocery_list_item_quantity_decimal_field(self, db):
        """Test that quantity handles decimal values correctly."""
        grocery_list_item = GroceryListItemFactory(quantity=1.25)

        assert grocery_list_item.quantity == 1.25
        assert isinstance(grocery_list_item.quantity, type(grocery_list_item.quantity))

    def test_grocery_list_item_quantity_default_value(self, db):
        """Test that quantity defaults to 1."""
        grocery_list = GroceryListFactory()
        item = ItemFactory()
        user = UserFactory()

        grocery_list_item = GroceryListItem.objects.create(
            grocery_list=grocery_list, item=item, added_by=user
        )

        assert grocery_list_item.quantity == 1

    def test_grocery_list_item_unit_inherits_from_item_default(self, db):
        """Test that unit inherits from item's default_unit when saved."""
        item = ItemFactory(default_unit="pieces")
        grocery_list = GroceryListFactory()
        user = UserFactory()

        grocery_list_item = GroceryListItem.objects.create(
            grocery_list=grocery_list, item=item, added_by=user, unit=""  # Empty unit
        )

        # After save, unit should be set to item's default_unit
        assert grocery_list_item.unit == "pieces"

    def test_grocery_list_item_unit_can_override_default(self, db):
        """Test that unit can override item's default_unit."""
        item = ItemFactory(default_unit="pieces")
        grocery_list_item = GroceryListItemFactory(
            item=item, unit="kg"  # Override default
        )

        assert grocery_list_item.unit == "kg"
        assert item.default_unit == "pieces"

    def test_grocery_list_item_is_checked_default(self, db):
        """Test that is_checked defaults to False."""
        grocery_list_item = GroceryListItemFactory()

        assert grocery_list_item.is_checked is False

    def test_grocery_list_item_checked_by_can_be_null(self, db):
        """Test that checked_by can be null."""
        grocery_list_item = GroceryListItemFactory(checked_by=None)

        assert grocery_list_item.checked_by is None

    def test_grocery_list_item_checked_at_can_be_null(self, db):
        """Test that checked_at can be null."""
        grocery_list_item = GroceryListItemFactory(checked_at=None)

        assert grocery_list_item.checked_at is None

    def test_grocery_list_item_notes_can_be_blank(self, db):
        """Test that notes can be blank."""
        grocery_list_item = GroceryListItemFactory(notes="")

        assert grocery_list_item.notes == ""

    def test_grocery_list_item_ordering(self, db):
        """Test that items are ordered by is_checked, then by item name."""
        grocery_list = GroceryListFactory()
        user = UserFactory()

        # Create items in specific order
        item_z = ItemFactory(name="Zucchini")
        item_a = ItemFactory(name="Apple")
        item_m = ItemFactory(name="Milk")

        # Create grocery list items
        gli_z_checked = GroceryListItemFactory(
            grocery_list=grocery_list, item=item_z, is_checked=True, added_by=user
        )
        gli_a_unchecked = GroceryListItemFactory(
            grocery_list=grocery_list, item=item_a, is_checked=False, added_by=user
        )
        gli_m_unchecked = GroceryListItemFactory(
            grocery_list=grocery_list, item=item_m, is_checked=False, added_by=user
        )

        items = GroceryListItem.objects.filter(grocery_list=grocery_list)

        # Should be: unchecked items first (Apple, Milk), then checked items (Zucchini)
        expected_order = [gli_a_unchecked, gli_m_unchecked, gli_z_checked]
        assert list(items) == expected_order

    def test_grocery_list_cascade_delete(self, db):
        """Test that deleting grocery list deletes associated items."""
        grocery_list = GroceryListFactory()
        grocery_list_item = GroceryListItemFactory(grocery_list=grocery_list)
        item_id = grocery_list_item.id

        grocery_list.delete()

        assert not GroceryListItem.objects.filter(id=item_id).exists()

    def test_grocery_list_item_timestamps_auto_set(self, db):
        """Test that created_at and updated_at are automatically set."""
        grocery_list_item = GroceryListItemFactory()
        original_updated_at = grocery_list_item.updated_at

        # Update the item
        grocery_list_item.notes = "Updated notes"
        grocery_list_item.save()

        assert grocery_list_item.created_at is not None
        assert grocery_list_item.updated_at > original_updated_at

    def test_grocery_list_item_custom_name_can_be_blank(self, db):
        """Test that custom_name can be blank."""
        grocery_list_item = GroceryListItemFactory(custom_name="")

        assert grocery_list_item.custom_name == ""

    def test_grocery_list_item_custom_name_can_be_set(self, db):
        """Test that custom_name can be set and retrieved."""
        grocery_list_item = GroceryListItemFactory(custom_name="My Custom Apple")

        assert grocery_list_item.custom_name == "My Custom Apple"

    def test_grocery_list_item_custom_name_max_length(self, db):
        """Test custom_name maximum length constraint."""
        long_name = "a" * 201  # Exceeds max_length=200

        with pytest.raises(ValidationError):
            grocery_list_item = GroceryListItem(
                grocery_list=GroceryListFactory(),
                item=ItemFactory(),
                custom_name=long_name,
                added_by=UserFactory(),
            )
            grocery_list_item.full_clean()

    def test_grocery_list_item_str_with_custom_name(self, db):
        """Test string representation uses custom_name in display."""
        item = ItemFactory(name="Apple", default_unit="piece")
        grocery_list_item = GroceryListItemFactory(
            item=item, custom_name="Organic Apples", quantity=3, unit="kg"
        )

        # Note: __str__ uses item.name, display_name field uses custom_name
        assert str(grocery_list_item) == "3 kg of Apple"
