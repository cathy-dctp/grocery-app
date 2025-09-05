from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from grocery_list.models import Category, GroceryList, GroceryListItem, Item


class Command(BaseCommand):
    help = "Create seed data for testing grocery app models"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Creating seed data..."))

        # Create users
        user1, created = User.objects.get_or_create(
            username="john_doe",
            defaults={
                "email": "john@example.com",
                "first_name": "John",
                "last_name": "Doe",
            },
        )
        if created:
            user1.set_password("password123")
            user1.save()
            self.stdout.write(f"Created user: {user1.username}")

        user2, created = User.objects.get_or_create(
            username="jane_smith",
            defaults={
                "email": "jane@example.com",
                "first_name": "Jane",
                "last_name": "Smith",
            },
        )
        if created:
            user2.set_password("password123")
            user2.save()
            self.stdout.write(f"Created user: {user2.username}")

        # Create categories
        categories_data = [
            {"name": "Dairy & Eggs", "description": "Milk, cheese, yogurt, eggs"},
            {"name": "Produce", "description": "Fresh fruits and vegetables"},
            {
                "name": "Meat & Seafood",
                "description": "Fresh and frozen meat, poultry, seafood",
            },
            {
                "name": "Pantry Staples",
                "description": "Rice, pasta, canned goods, spices",
            },
            {"name": "Beverages", "description": "Drinks, juices, sodas"},
            {"name": "Snacks", "description": "Chips, crackers, nuts, candy"},
        ]

        categories = {}
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data["name"], defaults={"description": cat_data["description"]}
            )
            categories[cat_data["name"]] = category
            if created:
                self.stdout.write(f"Created category: {category.name}")

        # Create items
        items_data = [
            # Dairy & Eggs
            {
                "name": "Whole Milk",
                "category": "Dairy & Eggs",
                "unit": "gallon",
                "barcode": "123456789",
            },
            {"name": "Greek Yogurt", "category": "Dairy & Eggs", "unit": "container"},
            {"name": "Cheddar Cheese", "category": "Dairy & Eggs", "unit": "block"},
            {"name": "Large Eggs", "category": "Dairy & Eggs", "unit": "dozen"},
            # Produce
            {"name": "Bananas", "category": "Produce", "unit": "bunch"},
            {"name": "Apples", "category": "Produce", "unit": "bag"},
            {"name": "Spinach", "category": "Produce", "unit": "bag"},
            {"name": "Tomatoes", "category": "Produce", "unit": "lb"},
            {"name": "Onions", "category": "Produce", "unit": "bag"},
            # Meat & Seafood
            {"name": "Chicken Breast", "category": "Meat & Seafood", "unit": "lb"},
            {"name": "Ground Beef", "category": "Meat & Seafood", "unit": "lb"},
            {"name": "Salmon Fillet", "category": "Meat & Seafood", "unit": "lb"},
            # Pantry Staples
            {"name": "Jasmine Rice", "category": "Pantry Staples", "unit": "bag"},
            {"name": "Spaghetti Pasta", "category": "Pantry Staples", "unit": "box"},
            {"name": "Olive Oil", "category": "Pantry Staples", "unit": "bottle"},
            {"name": "Black Beans", "category": "Pantry Staples", "unit": "can"},
            # Beverages
            {"name": "Orange Juice", "category": "Beverages", "unit": "bottle"},
            {"name": "Coffee", "category": "Beverages", "unit": "bag"},
            # Snacks
            {"name": "Tortilla Chips", "category": "Snacks", "unit": "bag"},
            {"name": "Mixed Nuts", "category": "Snacks", "unit": "container"},
        ]

        items = {}
        for item_data in items_data:
            item, created = Item.objects.get_or_create(
                name=item_data["name"],
                category=categories[item_data["category"]],
                defaults={
                    "default_unit": item_data["unit"],
                    "barcode": item_data.get("barcode", ""),
                    "description": (
                        f"{item_data['name']} from {item_data['category']} section"
                    ),
                },
            )
            items[item_data["name"]] = item
            if created:
                self.stdout.write(f"Created item: {item.name}")

        # Create grocery lists
        list1, created = GroceryList.objects.get_or_create(
            name="Weekly Grocery Run", owner=user1, defaults={"is_active": True}
        )
        if created:
            self.stdout.write(f"Created grocery list: {list1.name}")

        list2, created = GroceryList.objects.get_or_create(
            name="Party Supplies", owner=user2, defaults={"is_active": True}
        )
        if created:
            list2.shared_with.add(user1)
            self.stdout.write(f"Created grocery list: {list2.name}")

        # Add items to grocery lists
        list_items_data = [
            # Weekly Grocery Run (John's list)
            {"list": list1, "item": "Whole Milk", "quantity": 1, "added_by": user1},
            {"list": list1, "item": "Bananas", "quantity": 2, "added_by": user1},
            {"list": list1, "item": "Chicken Breast", "quantity": 2, "added_by": user1},
            {"list": list1, "item": "Spinach", "quantity": 1, "added_by": user1},
            {"list": list1, "item": "Jasmine Rice", "quantity": 1, "added_by": user1},
            {"list": list1, "item": "Large Eggs", "quantity": 1, "added_by": user1},
            # Party Supplies (Jane's list, shared with John)
            {"list": list2, "item": "Tortilla Chips", "quantity": 3, "added_by": user2},
            {"list": list2, "item": "Mixed Nuts", "quantity": 2, "added_by": user2},
            {"list": list2, "item": "Orange Juice", "quantity": 2, "added_by": user1},
            {"list": list2, "item": "Cheddar Cheese", "quantity": 1, "added_by": user2},
        ]

        for list_item_data in list_items_data:
            # Always create new items since we removed uniqueness constraint
            list_item = GroceryListItem.objects.create(
                grocery_list=list_item_data["list"],
                item=items[list_item_data["item"]],
                quantity=list_item_data["quantity"],
                added_by=list_item_data["added_by"],
                notes=f"Added to {list_item_data['list'].name}",
            )
            self.stdout.write(
                f"Added {list_item.item.name} to {list_item.grocery_list.name}"
            )

        # Mark some items as checked
        checked_items = GroceryListItem.objects.filter(
            grocery_list=list1, item__name__in=["Spinach", "Jasmine Rice"]
        )
        for item in checked_items:
            item.is_checked = True
            item.checked_by = user1
            item.save()
            self.stdout.write(f"Marked {item.item.name} as checked")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSeed data created successfully!\n"
                f"Users: {User.objects.count()}\n"
                f"Categories: {Category.objects.count()}\n"
                f"Items: {Item.objects.count()}\n"
                f"Grocery Lists: {GroceryList.objects.count()}\n"
                f"List Items: {GroceryListItem.objects.count()}"
            )
        )
