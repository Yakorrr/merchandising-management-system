from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import (
    ListModelMixin,
    CreateModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
    DestroyModelMixin
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import Log, User, Store
from core.permissions import IsManager
from core.serializers import (
    UserRegisterSerializer,
    UserLoginSerializer,
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    StoreSerializer,
    StoreCreateSerializer,
    StoreUpdateSerializer,
)


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
            Log.objects.create(user=user, action='user_registered',
                               details={'username': user.username, 'role': user.role})
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
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        Log.objects.create(user=user, action='user_logged_in', details={'username': user.username})
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)


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
            Log.objects.create(user=request.user, action='user_logged_out', details={'username': request.user.username})
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        except KeyError:
            return Response({"detail": "Refresh token not provided in request body."},
                            status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": f"An error occurred during logout: {e}"},
                            status=status.HTTP_400_BAD_REQUEST)


class UserListView(ListModelMixin, GenericAPIView):
    """
    API endpoint for listing all users.
    Accessible only by authenticated users with 'manager' role.
    """
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer  # Use UserSerializer for listing, as it's read-only
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to list all users.
        :param request: The HTTP request object.
        :return: Response containing a list of user objects.
        """
        return self.list(request, *args, **kwargs)


class UserCreateView(CreateModelMixin, GenericAPIView):
    """
    API endpoint for creating a new user.
    Accessible only by authenticated users with 'manager' role.
    """
    queryset = User.objects.all()  # Needed for serializer create method, though not used for GET
    serializer_class = UserCreateSerializer
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to create a new user.
        Logs the creation action.
        :param request: The HTTP request object containing user data.
        :return: Response with the created user data.
        """
        response = self.create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            user = User.objects.get(id=response.data['id'])  # Retrieve the created user for logging
            Log.objects.create(user=request.user, action='user_created',
                               details={'created_username': user.username, 'created_by': request.user.username})
        return response


class UserDetailView(RetrieveModelMixin, GenericAPIView):
    """
    API endpoint for retrieving a single user's details.
    Accessible only by authenticated users with 'manager' role.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer  # Use UserSerializer for displaying details
    permission_classes = [IsAuthenticated, IsManager]
    lookup_field = 'pk'

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve a single user's details.
        :param request: The HTTP request object.
        :return: Response containing the specific user's data.
        """
        return self.retrieve(request, *args, **kwargs)


class UserUpdateView(UpdateModelMixin, GenericAPIView):
    """
    API endpoint for updating a single user's details.
    Accessible only by authenticated users with 'manager' role.
    Supports PATCH (partial update) method.
    """
    queryset = User.objects.all()
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAuthenticated, IsManager]
    lookup_field = 'pk'

    def patch(self, request, *args, **kwargs):
        """
        Handles PATCH requests to partially update a user.
        Logs the update action.
        :param request: The HTTP request object containing partial user data.
        :return: Response with the updated user data.
        """
        user_before_update = UserSerializer(self.get_object()).data
        response = self.partial_update(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            updated_user_instance = self.get_object()
            Log.objects.create(user=request.user, action='user_updated',
                               details={'updated_username': updated_user_instance.username,
                                        'updated_by': request.user.username,
                                        'old_data': user_before_update})
        return response


class UserDeleteView(DestroyModelMixin, GenericAPIView):
    """
    API endpoint for deleting a single user.
    Accessible only by authenticated users with 'manager' role.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer  # Serializer is not strictly needed for deletion, but good practice
    permission_classes = [IsAuthenticated, IsManager]
    lookup_field = 'pk'

    def delete(self, request, *args, **kwargs):
        """
        Handles DELETE requests to delete a user.
        Logs the deletion action.
        :param request: The HTTP request object.
        :return: Response indicating successful deletion.
        """
        instance = self.get_object()  # Get the user object before deleting for logging
        Log.objects.create(user=request.user, action='user_deleted',
                           details={'deleted_username': instance.username, 'deleted_by': request.user.username})
        return self.destroy(request, *args, **kwargs)


class StoreListView(ListModelMixin, GenericAPIView):
    """
    API endpoint for listing all stores.
    Accessible by authenticated users with 'manager' or 'merchandiser' role.
    """
    queryset = Store.objects.all().order_by('name')
    serializer_class = StoreSerializer
    permission_classes = [IsAuthenticated]  # Any authenticated user can list stores

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to list all stores.
        :param request: The HTTP request object.
        :return: Response containing a list of store objects.
        """
        return self.list(request, *args, **kwargs)


class StoreCreateView(CreateModelMixin, GenericAPIView):
    """
    API endpoint for creating a new store.
    Accessible only by authenticated users with 'manager' role.
    """
    queryset = Store.objects.all()
    serializer_class = StoreCreateSerializer
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to create a new store.
        Logs the creation action.
        :param request: The HTTP request object containing store data.
        :return: Response with the created store data.
        """
        response = self.create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            store = Store.objects.get(id=response.data['id'])
            Log.objects.create(user=request.user, action='store_created',
                               details={'store_name': store.name,
                                        'created_by': request.user.username})
        return response


class StoreDetailView(RetrieveModelMixin, GenericAPIView):
    """
    API endpoint for retrieving a single store's details.
    Accessible by authenticated users with 'manager' or 'merchandiser' role.
    """
    queryset = Store.objects.all()
    serializer_class = StoreSerializer
    permission_classes = [IsAuthenticated]  # Any authenticated user can view store details
    lookup_field = 'pk'

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve a single store's details.
        :param request: The HTTP request object.
        :return: Response containing the specific store's data.
        """
        return self.retrieve(request, *args, **kwargs)


class StoreUpdateView(UpdateModelMixin, GenericAPIView):
    """
    API endpoint for updating a single store's details.
    Accessible only by authenticated users with 'manager' role.
    Supports PATCH (partial update) method.
    """
    queryset = Store.objects.all()
    serializer_class = StoreUpdateSerializer
    permission_classes = [IsAuthenticated, IsManager]  # Only managers can update stores
    lookup_field = 'pk'

    def patch(self, request, *args, **kwargs):
        """
        Handles PATCH requests to partially update a store.
        Logs the update action.
        :param request: The HTTP request object containing partial store data.
        :return: Response with the updated store data.
        """
        store_before_update = StoreSerializer(self.get_object()).data
        response = self.partial_update(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            updated_store_instance = self.get_object()
            Log.objects.create(user=request.user, action='store_updated',
                               details={'store_name': updated_store_instance.name,
                                        'updated_by': request.user.username,
                                        'old_data': store_before_update})
        return response


class StoreDeleteView(DestroyModelMixin, GenericAPIView):
    """
    API endpoint for deleting a single store.
    Accessible only by authenticated users with 'manager' role.
    """
    queryset = Store.objects.all()
    serializer_class = StoreSerializer  # Not strictly needed for deletion
    permission_classes = [IsAuthenticated, IsManager]  # Only managers can delete stores
    lookup_field = 'pk'

    def delete(self, request, *args, **kwargs):
        """
        Handles DELETE requests to delete a store.
        Logs the deletion action.
        :param request: The HTTP request object.
        :return: Response indicating successful deletion.
        """
        instance = self.get_object()
        Log.objects.create(user=request.user, action='store_deleted',
                           details={'store_name': instance.name, 'deleted_by': request.user.username})
        return self.destroy(request, *args, **kwargs)
