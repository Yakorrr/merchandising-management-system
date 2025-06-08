from django.urls import path
from core.views import (
    UserRegisterAPIView,
    UserLoginAPIView,
    UserLogoutAPIView,
    UserListView,
    UserCreateView,
    UserDetailView,
    UserUpdateView,
    UserDeleteView,
)

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
]
