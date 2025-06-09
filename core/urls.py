from django.urls import path

from core.views import *

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

    # Product Management Endpoints
    path('products/', ProductListView.as_view(), name='product-list'),  # GET for list (authenticated users)
    path('products/create/', ProductCreateView.as_view(), name='product-create'),  # POST for create (managers only)
    # GET for detail (authenticated users)
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    # PATCH for update (managers only)
    path('products/<int:pk>/update/', ProductUpdateView.as_view(), name='product-update'),
    # DELETE for delete (managers only)
    path('products/<int:pk>/delete/', ProductDeleteView.as_view(), name='product-delete'),

    # Order Management Endpoints
    path('orders/', OrderListView.as_view(), name='order-list'),  # GET for list (filtered by role)
    path('orders/create/', OrderCreateView.as_view(), name='order-create'),  # POST for create (merchandisers/managers)
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),  # GET for detail (filtered by role)
    # PATCH for update (filtered by role)
    path('orders/<int:pk>/update/', OrderUpdateView.as_view(), name='order-update'),
    # DELETE for delete (managers only)
    path('orders/<int:pk>/delete/', OrderDeleteView.as_view(), name='order-delete'),

    # Daily Plan Management Endpoints
    path('daily_plans/', DailyPlanListView.as_view(), name='daily-plan-list'),  # GET list (filtered by role)
    path('daily_plans/create/', DailyPlanCreateView.as_view(), name='daily-plan-create'),  # POST create (managers only)
    # GET detail (filtered by role)
    path('daily_plans/<int:pk>/', DailyPlanDetailView.as_view(), name='daily-plan-detail'),
    # PATCH update (managers only)
    path('daily_plans/<int:pk>/update/', DailyPlanUpdateView.as_view(), name='daily-plan-update'),
    # DELETE (managers only)
    path('daily_plans/<int:pk>/delete/', DailyPlanDeleteView.as_view(), name='daily-plan-delete'),

    # Metrics Endpoints
    # GET pre-calculated metrics (managers only)
    path('metrics/pre_calculated/', StoreMetricsListView.as_view(), name='pre-calculated-metrics-list'),
    # GET pre-calculated metrics detail (managers only)
    path('metrics/pre_calculated/<int:pk>/', StoreMetricsDetailView.as_view(), name='pre-calculated-metrics-detail'),
    # GET calculated metrics (managers only)
    path('metrics/calculate/', CalculateStoreMetricsAPIView.as_view(), name='calculate-metrics'),
    path('metrics/save/', SaveStoreMetricsAPIView.as_view(), name='save-metrics'),
]
