from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('core.urls')),  # Custom auth views (register, login, logout)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),  # Get access and refresh tokens
    # Get new access token using refresh token
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),  # Verify an access token
]
