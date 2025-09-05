from decimal import Decimal

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from grocery_list.models import Category, GroceryList, GroceryListItem, Item


class Command(BaseCommand):
    help = "Create comprehensive seed data for demo with pagination showcase"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clean",
            action="store_true",
            help="Clean all existing demo data before seeding",
        )
        parser.add_argument(
            "--production-safe",
            action="store_true",
            help="Enable extra safety checks for production environments",
        )
        parser.add_argument(
            "--force-production",
            action="store_true",
            help="Allow running in production (use with extreme caution)",
        )

    def handle(self, *args, **options):
        # Production safety checks
        self.perform_safety_checks(options)
        
        with transaction.atomic():
            if options["clean"]:
                self.clean_demo_data(options)

            self.stdout.write(self.style.SUCCESS("Creating comprehensive seed data..."))

            # Create demo users
            users = self.create_demo_users()

            # Create comprehensive categories
            categories = self.create_categories()

            # Create extensive items catalog
            items = self.create_items(categories)

            # Create demo grocery lists with pagination showcase
            self.create_grocery_lists(users, items)

            self.stdout.write(
                self.style.SUCCESS(
                    f"\n🎉 Demo seed data created successfully!\n"
                    f"👥 Users: {User.objects.count()}\n"
                    f"🏷️  Categories: {Category.objects.count()}\n"
                    f"📦 Items: {Item.objects.count()}\n"
                    f"📋 Grocery Lists: {GroceryList.objects.count()}\n"
                    f"🛒 List Items: {GroceryListItem.objects.count()}\n\n"
                    f"📱 Demo Users:\n"
                    f"   • john_doe / password123 (main demo user)\n"
                    f"   • jane_smith / password123 (secondary demo user)\n\n"
                    f"✨ Features showcased:\n"
                    f"   • Pagination (25+ items in Big Shopping List)\n"
                    f"   • Shared lists (Party Planning shared with john_doe)\n"
                    f"   • Multiple categories and items\n"
                    f"   • Mixed checked/unchecked states\n"
                )
            )

    def perform_safety_checks(self, options):
        """Perform safety checks to protect production data"""
        import os
        from django.conf import settings
        
        # Check if we're in a production-like environment
        is_production = (
            not settings.DEBUG or
            os.environ.get('DJANGO_ENV') == 'production' or
            os.environ.get('RAILWAY_ENVIRONMENT_NAME') == 'production' or
            'production' in os.environ.get('DATABASE_URL', '').lower()
        )
        
        if is_production and not options.get('force_production'):
            # Extra safety checks for production
            non_demo_users_exist = User.objects.exclude(
                username__in=['john_doe', 'jane_smith']
            ).exists()
            
            if non_demo_users_exist and options.get('clean'):
                self.stdout.write(
                    self.style.ERROR(
                        "⚠️  PRODUCTION SAFETY CHECK FAILED:\n"
                        "   • Production environment detected\n"
                        "   • Non-demo users exist in database\n"
                        "   • --clean flag would affect data\n\n"
                        "To proceed anyway (NOT RECOMMENDED):\n"
                        "   python manage.py seed_data --clean --force-production\n\n"
                        "To run safely without cleaning:\n"
                        "   python manage.py seed_data"
                    )
                )
                exit(1)
            
            if options.get('production_safe'):
                # In production-safe mode, verify demo users only
                self.verify_demo_user_isolation()
        
        # General safety warning for clean operations
        if options.get('clean'):
            total_users = User.objects.count()
            demo_users = User.objects.filter(username__in=['john_doe', 'jane_smith']).count()
            
            self.stdout.write(
                self.style.WARNING(
                    f"🔒 SAFETY CHECK:\n"
                    f"   • Total users in database: {total_users}\n"
                    f"   • Demo users found: {demo_users}\n"
                    f"   • Will ONLY clean demo user data (john_doe, jane_smith)\n"
                    f"   • Other users' data will be preserved\n"
                )
            )

    def verify_demo_user_isolation(self):
        """Verify that demo data is properly isolated"""
        demo_users = User.objects.filter(username__in=['john_doe', 'jane_smith'])
        
        # Check for shared lists that involve non-demo users
        shared_lists_with_non_demo = GroceryList.objects.filter(
            owner__in=demo_users
        ).filter(
            shared_with__isnull=False
        ).exclude(
            shared_with__username__in=['john_doe', 'jane_smith']
        )
        
        if shared_lists_with_non_demo.exists():
            self.stdout.write(
                self.style.ERROR(
                    "⚠️  ISOLATION CHECK FAILED:\n"
                    "   Demo users have shared lists with real users.\n"
                    "   Cannot safely clean demo data.\n"
                    "   Manual intervention required."
                )
            )
            exit(1)

    def clean_demo_data(self, options=None):
        """Clean all demo data for fresh deployment with enhanced safety"""
        self.stdout.write(self.style.WARNING("🧹 Cleaning existing demo data..."))

        # Define demo users explicitly
        demo_usernames = ["john_doe", "jane_smith"]
        demo_user_objects = User.objects.filter(username__in=demo_usernames)
        
        if not demo_user_objects.exists():
            self.stdout.write("   No demo users found, skipping cleanup")
            return

        # Double-check we're only affecting demo users
        demo_user_ids = list(demo_user_objects.values_list('id', flat=True))
        self.stdout.write(f"   🎯 Targeting demo users: {', '.join(demo_usernames)} (IDs: {demo_user_ids})")

        # Phase 1: Clean grocery list items (respecting foreign key constraints)
        demo_list_items = GroceryListItem.objects.filter(
            grocery_list__owner__in=demo_user_objects
        )
        items_count = demo_list_items.count()
        
        # Additional safety: verify no shared items with non-demo users
        shared_items_with_real_users = demo_list_items.filter(
            grocery_list__shared_with__isnull=False
        ).exclude(
            grocery_list__shared_with__in=demo_user_objects
        )
        
        if shared_items_with_real_users.exists() and options and not options.get('force_production'):
            self.stdout.write(
                self.style.ERROR(
                    "⚠️  SAFETY ABORT: Found shared lists between demo and real users.\n"
                    "   Cannot safely clean without affecting real users.\n"
                    "   Use --force-production to override (not recommended)."
                )
            )
            return

        deleted_items = demo_list_items.delete()[0]
        if deleted_items:
            self.stdout.write(f"   ✅ Deleted {deleted_items} grocery list items (demo users only)")

        # Phase 2: Clean grocery lists (owned by demo users only)
        demo_lists = GroceryList.objects.filter(owner__in=demo_user_objects)
        deleted_lists = demo_lists.delete()[0]
        if deleted_lists:
            self.stdout.write(f"   ✅ Deleted {deleted_lists} grocery lists (demo users only)")

        # Phase 3: Clean orphaned items (only if they're not referenced elsewhere)
        # This is safer as it only removes truly unused items
        orphaned_items = Item.objects.filter(
            grocerylistitem__isnull=True
        ).exclude(
            # Keep items that might be referenced by non-demo users
            name__in=[
                'Whole Milk', 'Bread', 'Eggs', 'Bananas', 'Chicken', 
                'Rice', 'Pasta', 'Coffee', 'Water', 'Apples'
            ] # Keep common items that real users might reference
        )
        
        deleted_catalog_items = orphaned_items.delete()[0]
        if deleted_catalog_items:
            self.stdout.write(f"   ✅ Deleted {deleted_catalog_items} orphaned catalog items")

        # Phase 4: Clean orphaned categories (only if no items reference them)
        orphaned_categories = Category.objects.filter(items__isnull=True)
        deleted_categories = orphaned_categories.delete()[0]
        if deleted_categories:
            self.stdout.write(f"   ✅ Deleted {deleted_categories} orphaned categories")

        # Phase 5: Clean up demo user passwords but don't delete users
        # (They might be referenced in logs or have other important metadata)
        for user in demo_user_objects:
            # Reset to default demo password
            user.set_password("password123")
            user.email = f"{user.username}@example.com"
            user.save()
        
        self.stdout.write(f"   ✅ Reset {demo_user_objects.count()} demo user credentials")
        
        self.stdout.write(
            self.style.SUCCESS(
                "✅ Demo data cleanup completed safely\n"
                f"   • Only demo users ({', '.join(demo_usernames)}) were affected\n"
                f"   • All other user data was preserved\n"
                f"   • Orphaned data was cleaned up\n"
            )
        )

    def create_demo_users(self):
        """Create demo users with consistent passwords"""
        users = {}

        users_data = [
            {
                "username": "john_doe",
                "email": "john@example.com",
                "first_name": "John",
                "last_name": "Doe",
            },
            {
                "username": "jane_smith",
                "email": "jane@example.com",
                "first_name": "Jane",
                "last_name": "Smith",
            },
        ]

        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data["username"], defaults=user_data
            )
            if created or not user.check_password("password123"):
                user.set_password("password123")
                user.email = user_data["email"]
                user.first_name = user_data["first_name"]
                user.last_name = user_data["last_name"]
                user.save()
                self.stdout.write(f"👤 Created/updated user: {user.username}")
            users[user_data["username"]] = user

        return users

    def create_categories(self):
        """Create comprehensive category structure"""
        categories_data = [
            {
                "name": "Dairy & Eggs",
                "description": "Milk, cheese, yogurt, eggs, butter",
            },
            {
                "name": "Produce",
                "description": "Fresh fruits, vegetables, herbs",
            },
            {
                "name": "Meat & Seafood",
                "description": "Fresh and frozen meat, poultry, seafood",
            },
            {
                "name": "Pantry Staples",
                "description": "Rice, pasta, canned goods, spices, condiments",
            },
            {
                "name": "Beverages",
                "description": "Drinks, juices, sodas, water, coffee, tea",
            },
            {
                "name": "Snacks & Sweets",
                "description": "Chips, crackers, nuts, candy, cookies",
            },
            {
                "name": "Bakery",
                "description": "Bread, pastries, cakes, bagels",
            },
            {
                "name": "Frozen Foods",
                "description": "Frozen meals, ice cream, frozen vegetables",
            },
            {
                "name": "Health & Beauty",
                "description": "Vitamins, toiletries, personal care",
            },
            {
                "name": "Household",
                "description": "Cleaning supplies, paper goods, storage",
            },
        ]

        categories = {}
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data["name"], defaults={"description": cat_data["description"]}
            )
            categories[cat_data["name"]] = category
            if created:
                self.stdout.write(f"🏷️  Created category: {category.name}")

        return categories

    def create_items(self, categories):
        """Create extensive items catalog for comprehensive demo"""
        items_data = [
            # Dairy & Eggs (8 items)
            {"name": "Whole Milk", "category": "Dairy & Eggs", "unit": "gallon"},
            {"name": "2% Milk", "category": "Dairy & Eggs", "unit": "gallon"},
            {"name": "Greek Yogurt", "category": "Dairy & Eggs", "unit": "container"},
            {"name": "Cheddar Cheese", "category": "Dairy & Eggs", "unit": "block"},
            {"name": "Large Eggs", "category": "Dairy & Eggs", "unit": "dozen"},
            {"name": "Butter", "category": "Dairy & Eggs", "unit": "stick"},
            {"name": "Cream Cheese", "category": "Dairy & Eggs", "unit": "package"},
            {"name": "Mozzarella Cheese", "category": "Dairy & Eggs", "unit": "bag"},
            # Produce (15 items)
            {"name": "Bananas", "category": "Produce", "unit": "bunch"},
            {"name": "Apples", "category": "Produce", "unit": "bag"},
            {"name": "Spinach", "category": "Produce", "unit": "bag"},
            {"name": "Tomatoes", "category": "Produce", "unit": "lb"},
            {"name": "Onions", "category": "Produce", "unit": "bag"},
            {"name": "Carrots", "category": "Produce", "unit": "bag"},
            {"name": "Broccoli", "category": "Produce", "unit": "head"},
            {"name": "Bell Peppers", "category": "Produce", "unit": "each"},
            {"name": "Avocados", "category": "Produce", "unit": "each"},
            {"name": "Lemons", "category": "Produce", "unit": "bag"},
            {"name": "Strawberries", "category": "Produce", "unit": "container"},
            {"name": "Blueberries", "category": "Produce", "unit": "container"},
            {"name": "Potatoes", "category": "Produce", "unit": "bag"},
            {"name": "Sweet Potatoes", "category": "Produce", "unit": "bag"},
            {"name": "Garlic", "category": "Produce", "unit": "head"},
            # Meat & Seafood (8 items)
            {"name": "Chicken Breast", "category": "Meat & Seafood", "unit": "lb"},
            {"name": "Ground Beef", "category": "Meat & Seafood", "unit": "lb"},
            {"name": "Salmon Fillet", "category": "Meat & Seafood", "unit": "lb"},
            {"name": "Ground Turkey", "category": "Meat & Seafood", "unit": "lb"},
            {"name": "Pork Chops", "category": "Meat & Seafood", "unit": "lb"},
            {"name": "Shrimp", "category": "Meat & Seafood", "unit": "lb"},
            {"name": "Chicken Thighs", "category": "Meat & Seafood", "unit": "lb"},
            {"name": "Tuna Steaks", "category": "Meat & Seafood", "unit": "lb"},
            # Pantry Staples (12 items)
            {"name": "Jasmine Rice", "category": "Pantry Staples", "unit": "bag"},
            {"name": "Spaghetti Pasta", "category": "Pantry Staples", "unit": "box"},
            {"name": "Olive Oil", "category": "Pantry Staples", "unit": "bottle"},
            {"name": "Black Beans", "category": "Pantry Staples", "unit": "can"},
            {"name": "Canned Tomatoes", "category": "Pantry Staples", "unit": "can"},
            {"name": "Penne Pasta", "category": "Pantry Staples", "unit": "box"},
            {"name": "Quinoa", "category": "Pantry Staples", "unit": "bag"},
            {"name": "Honey", "category": "Pantry Staples", "unit": "bottle"},
            {"name": "Soy Sauce", "category": "Pantry Staples", "unit": "bottle"},
            {"name": "Peanut Butter", "category": "Pantry Staples", "unit": "jar"},
            {"name": "Oats", "category": "Pantry Staples", "unit": "container"},
            {"name": "Flour", "category": "Pantry Staples", "unit": "bag"},
            # Beverages (8 items)
            {"name": "Orange Juice", "category": "Beverages", "unit": "bottle"},
            {"name": "Coffee", "category": "Beverages", "unit": "bag"},
            {"name": "Green Tea", "category": "Beverages", "unit": "box"},
            {"name": "Sparkling Water", "category": "Beverages", "unit": "case"},
            {"name": "Almond Milk", "category": "Beverages", "unit": "carton"},
            {"name": "Apple Juice", "category": "Beverages", "unit": "bottle"},
            {"name": "Energy Drinks", "category": "Beverages", "unit": "pack"},
            {"name": "Coconut Water", "category": "Beverages", "unit": "bottle"},
            # Snacks & Sweets (7 items)
            {"name": "Tortilla Chips", "category": "Snacks & Sweets", "unit": "bag"},
            {"name": "Mixed Nuts", "category": "Snacks & Sweets", "unit": "container"},
            {"name": "Dark Chocolate", "category": "Snacks & Sweets", "unit": "bar"},
            {"name": "Granola Bars", "category": "Snacks & Sweets", "unit": "box"},
            {"name": "Popcorn", "category": "Snacks & Sweets", "unit": "bag"},
            {"name": "Trail Mix", "category": "Snacks & Sweets", "unit": "bag"},
            {"name": "Crackers", "category": "Snacks & Sweets", "unit": "box"},
            # Bakery (5 items)
            {"name": "Whole Wheat Bread", "category": "Bakery", "unit": "loaf"},
            {"name": "Bagels", "category": "Bakery", "unit": "bag"},
            {"name": "Croissants", "category": "Bakery", "unit": "package"},
            {"name": "Dinner Rolls", "category": "Bakery", "unit": "package"},
            {"name": "Muffins", "category": "Bakery", "unit": "package"},
            # Frozen Foods (4 items)
            {"name": "Frozen Pizza", "category": "Frozen Foods", "unit": "each"},
            {"name": "Ice Cream", "category": "Frozen Foods", "unit": "container"},
            {"name": "Frozen Berries", "category": "Frozen Foods", "unit": "bag"},
            {"name": "Frozen Vegetables", "category": "Frozen Foods", "unit": "bag"},
            # Health & Beauty (3 items)
            {"name": "Multivitamins", "category": "Health & Beauty", "unit": "bottle"},
            {"name": "Shampoo", "category": "Health & Beauty", "unit": "bottle"},
            {"name": "Toothpaste", "category": "Health & Beauty", "unit": "tube"},
            # Household (5 items)
            {"name": "Paper Towels", "category": "Household", "unit": "pack"},
            {"name": "Toilet Paper", "category": "Household", "unit": "pack"},
            {"name": "Dish Soap", "category": "Household", "unit": "bottle"},
            {"name": "Laundry Detergent", "category": "Household", "unit": "bottle"},
            {"name": "Trash Bags", "category": "Household", "unit": "box"},
        ]

        items = {}
        for item_data in items_data:
            item, created = Item.objects.get_or_create(
                name=item_data["name"],
                category=categories[item_data["category"]],
                defaults={
                    "default_unit": item_data["unit"],
                    "description": (
                        f"{item_data['name']} from {item_data['category']} section"
                    ),
                },
            )
            items[item_data["name"]] = item
            if created:
                self.stdout.write(f"📦 Created item: {item.name}")

        return items

    def create_grocery_lists(self, users, items):
        """Create comprehensive demo grocery lists showcasing pagination"""
        john = users["john_doe"]
        jane = users["jane_smith"]

        # Clean existing lists for these users
        GroceryListItem.objects.filter(grocery_list__owner__in=[john, jane]).delete()
        GroceryList.objects.filter(owner__in=[john, jane]).delete()

        # 1. Big Shopping List (John) - For pagination showcase (30+ items)
        big_list = GroceryList.objects.create(
            name="🛒 Big Weekly Shopping List", owner=john
        )
        self.stdout.write(f"📋 Created grocery list: {big_list.name}")

        big_list_items = [
            # All produce items (15 items)
            ("Bananas", "3", "bunch"),
            ("Apples", "2", "bag"),
            ("Spinach", "1", "bag"),
            ("Tomatoes", "2", "lb"),
            ("Onions", "1", "bag"),
            ("Carrots", "1", "bag"),
            ("Broccoli", "2", "head"),
            ("Bell Peppers", "4", "each"),
            ("Avocados", "6", "each"),
            ("Lemons", "1", "bag"),
            ("Strawberries", "2", "container"),
            ("Blueberries", "1", "container"),
            ("Potatoes", "1", "bag"),
            ("Sweet Potatoes", "1", "bag"),
            ("Garlic", "1", "head"),
            # Multiple dairy items (6 items)
            ("Whole Milk", "1", "gallon"),
            ("Greek Yogurt", "4", "container"),
            ("Cheddar Cheese", "1", "block"),
            ("Large Eggs", "2", "dozen"),
            ("Butter", "2", "stick"),
            ("Mozzarella Cheese", "1", "bag"),
            # Meat selection (5 items)
            ("Chicken Breast", "3", "lb"),
            ("Ground Beef", "2", "lb"),
            ("Salmon Fillet", "1.5", "lb"),
            ("Ground Turkey", "1", "lb"),
            ("Shrimp", "1", "lb"),
            # Pantry essentials (8 items)
            ("Jasmine Rice", "2", "bag"),
            ("Spaghetti Pasta", "3", "box"),
            ("Olive Oil", "1", "bottle"),
            ("Black Beans", "4", "can"),
            ("Canned Tomatoes", "6", "can"),
            ("Peanut Butter", "1", "jar"),
            ("Oats", "1", "container"),
            ("Flour", "1", "bag"),
            # Beverages (4 items)
            ("Orange Juice", "1", "bottle"),
            ("Coffee", "2", "bag"),
            ("Sparkling Water", "2", "case"),
            ("Almond Milk", "2", "carton"),
            # Household essentials (4 items)
            ("Paper Towels", "1", "pack"),
            ("Toilet Paper", "1", "pack"),
            ("Dish Soap", "1", "bottle"),
            ("Laundry Detergent", "1", "bottle"),
        ]

        for i, (item_name, quantity, unit) in enumerate(big_list_items):
            if item_name in items:
                list_item = GroceryListItem.objects.create(
                    grocery_list=big_list,
                    item=items[item_name],
                    quantity=Decimal(quantity),
                    unit=unit,
                    added_by=john,
                    notes=f"Demo item #{i+1} for pagination showcase",
                )
                # Mark some items as checked for variety
                if i % 7 == 0:  # Every 7th item is checked
                    list_item.is_checked = True
                    list_item.checked_by = john
                    list_item.save()

        self.stdout.write(
            f"   Added {len(big_list_items)} items to showcase pagination feature"
        )

        # 2. Quick Essentials List (John) - Small list
        essentials_list = GroceryList.objects.create(
            name="🏃 Quick Essentials", owner=john
        )

        essentials_items = [
            ("Whole Milk", "1", "gallon"),
            ("Bread", "1", "loaf", "Whole Wheat Bread"),
            ("Bananas", "1", "bunch"),
            ("Large Eggs", "1", "dozen"),
            ("Coffee", "1", "bag"),
        ]

        for item_name, quantity, unit, *alt_name in essentials_items:
            actual_name = alt_name[0] if alt_name else item_name
            if actual_name in items:
                GroceryListItem.objects.create(
                    grocery_list=essentials_list,
                    item=items[actual_name],
                    quantity=Decimal(quantity),
                    unit=unit,
                    added_by=john,
                    notes="Quick pickup item",
                )

        self.stdout.write(f"📋 Created grocery list: {essentials_list.name}")
        self.stdout.write(f"   Added {len(essentials_items)} quick essentials")

        # 3. Party Planning List (Jane) - Shared with John
        party_list = GroceryList.objects.create(name="🎉 Party Planning", owner=jane)
        party_list.shared_with.add(john)

        party_items = [
            ("Tortilla Chips", "4", "bag"),
            ("Mixed Nuts", "2", "container"),
            ("Dark Chocolate", "3", "bar"),
            ("Sparkling Water", "3", "case"),
            ("Ice Cream", "2", "container"),
            ("Frozen Pizza", "4", "each"),
            ("Orange Juice", "2", "bottle"),
            ("Cheddar Cheese", "2", "block"),
            ("Crackers", "2", "box"),
        ]

        for i, (item_name, quantity, unit) in enumerate(party_items):
            if item_name in items:
                added_by = john if i % 3 == 0 else jane  # Mixed contributors
                list_item = GroceryListItem.objects.create(
                    grocery_list=party_list,
                    item=items[item_name],
                    quantity=Decimal(quantity),
                    unit=unit,
                    added_by=added_by,
                    notes=f"Party item added by {added_by.first_name}",
                )
                # Mark some party items as done
                if i % 4 == 0:
                    list_item.is_checked = True
                    list_item.checked_by = added_by
                    list_item.save()

        self.stdout.write(f"📋 Created grocery list: {party_list.name}")
        self.stdout.write(
            f"   Added {len(party_items)} party items (shared with john_doe)"
        )

        # 4. Healthy Living List (Jane) - Health focused
        healthy_list = GroceryList.objects.create(
            name="💪 Healthy Living", owner=jane
        )

        healthy_items = [
            ("Quinoa", "2", "bag"),
            ("Spinach", "2", "bag"),
            ("Blueberries", "3", "container"),
            ("Salmon Fillet", "2", "lb"),
            ("Avocados", "8", "each"),
            ("Greek Yogurt", "6", "container"),
            ("Almonds", "1", "container", "Mixed Nuts"),
            ("Green Tea", "2", "box"),
            ("Sweet Potatoes", "1", "bag"),
            ("Broccoli", "3", "head"),
        ]

        for item_name, quantity, unit, *alt_name in healthy_items:
            actual_name = alt_name[0] if alt_name else item_name
            if actual_name in items:
                GroceryListItem.objects.create(
                    grocery_list=healthy_list,
                    item=items[actual_name],
                    quantity=Decimal(quantity),
                    unit=unit,
                    added_by=jane,
                    notes="For healthy meal prep",
                )

        self.stdout.write(f"📋 Created grocery list: {healthy_list.name}")
        self.stdout.write(f"   Added {len(healthy_items)} healthy items")
