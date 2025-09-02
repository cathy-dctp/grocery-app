from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ItemViewSet, GroceryListViewSet, GroceryListItemViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'items', ItemViewSet)
router.register(r'grocery-lists', GroceryListViewSet, basename='grocerylist')
router.register(r'grocery-list-items', GroceryListItemViewSet, basename='grocerylistitem')

urlpatterns = [
    path('api/', include(router.urls)),
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
]