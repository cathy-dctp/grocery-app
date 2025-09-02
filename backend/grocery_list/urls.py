from django.urls import path, include, re_path
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ItemViewSet, GroceryListViewSet, GroceryListItemViewSet
from . import auth_views

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'items', ItemViewSet)
router.register(r'grocery-lists', GroceryListViewSet, basename='grocerylist')
router.register(r'grocery-list-items', GroceryListItemViewSet, basename='grocerylistitem')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/auth/login/', auth_views.login, name='login'),
    path('api/auth/logout/', auth_views.logout, name='logout'),
    path('api/auth/me/', auth_views.me, name='me'),
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    # Catch-all for Angular routes
    re_path(r'^.*/$', TemplateView.as_view(template_name='index.html'), name='angular_routes'),
]