from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ItemViewSet, GroceryListViewSet, GroceryListItemViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'items', ItemViewSet)
router.register(r'grocery-lists', GroceryListViewSet, basename='grocerylist')
router.register(r'grocery-list-items', GroceryListItemViewSet, basename='grocerylistitem')

urlpatterns = [
    path('api/', include(router.urls)),
]