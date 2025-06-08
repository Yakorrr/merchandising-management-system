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
from core.serializers.order import *


class OrderListView(ListModelMixin, GenericAPIView):
    """
    API endpoint for listing all orders.
    Managers can see all orders. Merchandisers can only see their own orders.
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filters the queryset based on user role.
        Managers see all orders. Merchandisers see only orders they placed.
        :return: Filtered queryset of Order objects.
        """
        user = self.request.user
        if user.role == 'manager':
            return Order.objects.all().order_by('-order_date')
        else:
            return Order.objects.filter(merchandiser=user).order_by('-order_date')

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to list orders.
        :param request: The HTTP request object.
        :return: Response containing a list of order objects.
        """
        return self.list(request, *args, **kwargs)


class OrderCreateView(CreateModelMixin, GenericAPIView):
    """
    API endpoint for creating a new order.
    Accessible only by authenticated merchandisers. Managers can also create orders.
    The merchandiser placing the order is automatically assigned.
    """
    queryset = Order.objects.all()  # Keep queryset defined
    serializer_class = OrderCreateSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Performs the order creation. Automatically assigns the current user as merchandiser.
        Logs the creation action.
        :param request: The HTTP request object containing order data.
        :return: Response with the created order data.
        """

        response = self.create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            order = Order.objects.get(id=response.data['id'])
            Log.objects.create(user=self.request.user, action='order_created',
                               details={'order_id': order.id,
                                        'store_name': order.store.name,
                                        'created_by': self.request.user.username})
            # Ensure calculate_total_amount is called on the created instance
            order.calculate_total_amount()
        return response

    def get_serializer_context(self):
        """
        Ensures the request object is available in the serializer context.
        :return: Context dictionary including the request.
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class OrderDetailView(RetrieveModelMixin, GenericAPIView):
    """
    API endpoint for retrieving a single order's details.
    Managers can see any order. Merchandisers can only see their own orders.
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        """
        Filters the queryset to ensure users can only access allowed orders.
        Managers can view any order. Merchandisers can only view their own orders.
        :return: Filtered queryset of Order objects.
        """
        user = self.request.user
        if user.role == 'manager':
            return Order.objects.all()
        else:
            return Order.objects.filter(merchandiser=user)

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve a single order's details.
        :param request: The HTTP request object.
        :return: Response containing the specific order's data.
        """
        return self.retrieve(request, *args, **kwargs)


class OrderUpdateView(UpdateModelMixin, GenericAPIView):
    """
    API endpoint for updating a single order's details.
    Accessible only by authenticated managers, or the merchandiser who placed the order.
    Supports PATCH (partial update) method.
    """
    serializer_class = OrderUpdateSerializer  # Assign OrderUpdateSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        """
        Filters the queryset to ensure users can only update allowed orders.
        Managers can update any order. Merchandisers can only update their own orders.
        :return: Filtered queryset of Order objects.
        """
        user = self.request.user
        if user.role == 'manager':
            return Order.objects.all()
        else:
            return Order.objects.filter(merchandiser=user)

    def patch(self, request, *args, **kwargs):
        """
        Handles PATCH requests to partially update an order.
        Logs the update action.
        :param request: The HTTP request object containing partial order data.
        :return: Response with the updated order data.
        """
        order_before_update = OrderSerializer(self.get_object()).data
        response = self.partial_update(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            updated_order_instance = self.get_object()
            Log.objects.create(user=request.user, action='order_updated',
                               details={'order_id': updated_order_instance.id,
                                        'store_name': updated_order_instance.store.name,
                                        'updated_by': request.user.username,
                                        'old_data': order_before_update})
        return response


class OrderDeleteView(DestroyModelMixin, GenericAPIView):
    """
    API endpoint for deleting a single order.
    Accessible only by authenticated managers.
    """
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsManager]
    lookup_field = 'pk'

    def delete(self, request, *args, **kwargs):
        """
        Handles DELETE requests to delete an order.
        Logs the deletion action.
        :param request: The HTTP request object.
        :return: Response indicating successful deletion.
        """
        instance = self.get_object()
        Log.objects.create(user=request.user, action='order_deleted',
                           details={'order_id': instance.id, 'store_name': instance.store.name,
                                    'deleted_by': self.request.user.username})
        return self.destroy(request, *args, **kwargs)
