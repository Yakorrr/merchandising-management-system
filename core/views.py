from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Log
from .serializers import UserRegisterSerializer, UserLoginSerializer, UserSerializer


class UserRegisterAPIView(APIView):
    """
    API endpoint for user registration.
    Allows any user to register.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Handles POST requests for user registration.
        Serializes and validates input data. Creates a new user if validation passes.
        :param request: The HTTP request object.
        :return: Response with user data on success, or errors on failure.
        """
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Log the registration action
            Log.objects.create(user=user, action='user_registered',
                               details={'username': user.username, 'role': user.role})
            # Optionally return tokens directly upon registration
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginAPIView(APIView):
    """
    API endpoint for user login.
    Allows any user to log in and receive JWT tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Handles POST requests for user login.
        Authenticates user credentials and returns JWT tokens if successful.
        :param request: The HTTP request object.
        :return: Response with user data and JWT tokens on success, or errors on failure.
        """
        serializer = UserLoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid(raise_exception=True):  # raise_exception=True will return 400 for invalid data
            user = serializer.validated_data['user']
            # Log the login action
            Log.objects.create(user=user, action='user_logged_in', details={'username': user.username})

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        # This part will not be reached if raise_exception=True, as errors are handled by serializer
        # return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLogoutAPIView(APIView):
    """
    API endpoint for user logout.
    Requires authenticated user (via JWT access token in Authorization header) to log out.
    Blacklists the refresh token to invalidate it.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Handles POST requests for user logout.
        Blacklists the user's refresh token to invalidate future use.
        :param request: The HTTP request object.
        :return: Response indicating successful logout.
        """
        try:
            # Log the logout action
            # request.user is available here because IsAuthenticated permission_class ensures authentication
            Log.objects.create(user=request.user, action='user_logged_out', details={'username': request.user.username})

            # Get the refresh token from the request body
            # This 'refresh' key must be present in the JSON body
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()  # Blacklist the refresh token

            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        except KeyError: # Catch if "refresh" key is missing from request.data
            return Response({"detail": "Refresh token not provided in request body."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e: # Catch other potential errors during token processing
            return Response({"detail": f"An error occurred during logout: {e}"},
                            status=status.HTTP_400_BAD_REQUEST)