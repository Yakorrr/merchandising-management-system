from django.urls import path
from core.views.user import *
from core.views.store import *

app_name = 'core'

urlpatterns = [
    # Authentication Endpoints
    path('register/', UserRegisterAPIView.as_view(), name='register'),
    path('login/', UserLoginAPIView.as_view(), name='login'),
    path('logout/', UserLogoutAPIView.as_view(), name='logout'),

    # User Management Endpoints (accessible only by managers)
    path('users/', UserListView.as_view(), name='user-list'),  # GET for list
    path('users/create/', UserCreateView.as_view(), name='user-create'),  # POST for create
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),  # GET for specific user
    path('users/<int:pk>/update/', UserUpdateView.as_view(), name='user-update'),  # PATCH for update
    path('users/<int:pk>/delete/', UserDeleteView.as_view(), name='user-delete'),  # DELETE for delete

    # Store Management Endpoints
    path('stores/', StoreListView.as_view(), name='store-list'),  # GET for list (authenticated users)
    path('stores/create/', StoreCreateView.as_view(), name='store-create'),  # POST for create (managers only)
    path('stores/<int:pk>/', StoreDetailView.as_view(), name='store-detail'),  # GET for detail (authenticated users)
    path('stores/<int:pk>/update/', StoreUpdateView.as_view(), name='store-update'),  # PATCH for update (managers only)
    # DELETE for delete (managers only)
    path('stores/<int:pk>/delete/', StoreDeleteView.as_view(), name='store-delete'),
]
