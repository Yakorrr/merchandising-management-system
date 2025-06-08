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
from core.serializers.product import *


class ProductListView(ListModelMixin, GenericAPIView):
    """
    API endpoint for listing all products.
    Accessible by any authenticated user (merchandisers or managers).
    """
    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to list all products.
        :param request: The HTTP request object.
        :return: Response containing a list of product objects.
        """
        return self.list(request, *args, **kwargs)


class ProductCreateView(CreateModelMixin, GenericAPIView):
    """
    API endpoint for creating a new product.
    Accessible only by authenticated users with 'manager' role.
    """
    queryset = Product.objects.all()
    serializer_class = ProductCreateSerializer
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to create a new product.
        Logs the creation action.
        :param request: The HTTP request object containing product data.
        :return: Response with the created product data.
        """
        response = self.create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            created_product_instance = Product.objects.get(id=response.data['id'])
            Log.objects.create(user=self.request.user, action='product_created',
                               details={'product_name': created_product_instance.name,
                                        'created_by': self.request.user.username,
                                        'product_id': created_product_instance.id})
        return response


class ProductDetailView(RetrieveModelMixin, GenericAPIView):
    """
    API endpoint for retrieving a single product's details.
    Accessible by any authenticated user (merchandisers or managers).
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve a single product's details.
        :param request: The HTTP request object.
        :return: Response containing the specific product's data.
        """
        return self.retrieve(request, *args, **kwargs)


class ProductUpdateView(UpdateModelMixin, GenericAPIView):
    """
    API endpoint for updating a single product's details.
    Accessible only by authenticated users with 'manager' role.
    Supports PATCH (partial update) method.
    """
    queryset = Product.objects.all()
    serializer_class = ProductUpdateSerializer
    permission_classes = [IsAuthenticated, IsManager]
    lookup_field = 'pk'

    def patch(self, request, *args, **kwargs):
        """
        Handles PATCH requests to partially update a product.
        Logs the update action.
        :param request: The HTTP request object containing partial product data.
        :return: Response with the updated product data.
        """
        product_before_update = ProductSerializer(self.get_object()).data
        response = self.partial_update(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            updated_product_instance = self.get_object()
            Log.objects.create(user=self.request.user, action='product_updated',
                               details={'product_name': updated_product_instance.name,
                                        'updated_by': self.request.user.username,
                                        'old_data': product_before_update})
        return response


class ProductDeleteView(DestroyModelMixin, GenericAPIView):
    """
    API endpoint for deleting a single product.
    Accessible only by authenticated users with 'manager' role.
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsManager]
    lookup_field = 'pk'

    def delete(self, request, *args, **kwargs):
        """
        Handles DELETE requests to delete a product.
        Logs the deletion action.
        :param request: The HTTP request object.
        :return: Response indicating successful deletion.
        """
        instance = self.get_object()
        Log.objects.create(user=self.request.user, action='product_deleted',
                           details={'product_name': instance.name, 'deleted_by': self.request.user.username})
        return self.destroy(request, *args, **kwargs)
