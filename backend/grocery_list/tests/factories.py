import factory
from django.contrib.auth.models import User
from grocery_list.models import Category, Item, GroceryList, GroceryListItem


class UserFactory(factory.django.DjangoModelFactory):
    """Factory for creating test users."""
    
    class Meta:
        model = User
        django_get_or_create = ('username',)
    
    username = factory.Sequence(lambda n: f'testuser{n}')
    email = factory.LazyAttribute(lambda obj: f'{obj.username}@example.com')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    is_active = True


class CategoryFactory(factory.django.DjangoModelFactory):
    """Factory for creating test categories."""
    
    class Meta:
        model = Category
    
    name = factory.Sequence(lambda n: f'category{n}')
    description = factory.Faker('text', max_nb_chars=200)


class ItemFactory(factory.django.DjangoModelFactory):
    """Factory for creating test items."""
    
    class Meta:
        model = Item
    
    name = factory.Faker('word')
    category = factory.SubFactory(CategoryFactory)
    description = factory.Faker('text', max_nb_chars=100)
    barcode = factory.Faker('ean13')
    default_unit = factory.Faker('random_element', elements=('piece', 'kg', 'lb', 'liter', 'gallon'))


class GroceryListFactory(factory.django.DjangoModelFactory):
    """Factory for creating test grocery lists."""
    
    class Meta:
        model = GroceryList
    
    name = factory.Faker('sentence', nb_words=3)
    owner = factory.SubFactory(UserFactory)
    is_active = True


class GroceryListItemFactory(factory.django.DjangoModelFactory):
    """Factory for creating test grocery list items."""
    
    class Meta:
        model = GroceryListItem
    
    grocery_list = factory.SubFactory(GroceryListFactory)
    item = factory.SubFactory(ItemFactory)
    quantity = factory.Faker('pydecimal', left_digits=2, right_digits=2, positive=True, min_value=0.01, max_value=99.99)
    unit = factory.LazyAttribute(lambda obj: obj.item.default_unit)
    notes = factory.Faker('text', max_nb_chars=50)
    is_checked = False
    added_by = factory.SubFactory(UserFactory)