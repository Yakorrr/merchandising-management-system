from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import (
    ListModelMixin,
    CreateModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
    DestroyModelMixin
)
from rest_framework.permissions import IsAuthenticated

from core.models import Log
from core.permissions import IsManager
from core.serializers.store import *


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
