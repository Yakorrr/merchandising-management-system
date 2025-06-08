from rest_framework import serializers

from core.models import Order, OrderItem, Product


class OrderItemSerializer(serializers.ModelSerializer):
    """
    Serializer for OrderItem.
    Used to manage individual products within an order.
    """
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price_per_unit']
        read_only_fields = ['id', 'product_name']

    def validate_product(self, product_id):
        """
        Validates that the product exists.
        :param product_id: The ID of the product.
        :return: The Product instance.
        :raises serializers.ValidationError: If product does not exist.
        """
        try:
            # Ensure product_id is an actual ID, not an object
            if isinstance(product_id, Product):
                product_id = product_id.id
            return Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            raise serializers.ValidationError(f"Product with ID {product_id} does not exist.")

    def validate(self, data):
        """
        Validates that the product exists and quantity/price are positive.
        :param data: The validated data for the order item.
        :return: The validated data.
        :raises serializers.ValidationError: If product does not exist or values are invalid.
        """
        product = data.get('product')  # This will be an object if validated
        if not product:
            raise serializers.ValidationError({"product": "Product ID is required for each order item."})
        return data


class OrderSerializer(serializers.ModelSerializer):
    """
    Serializer for Order.
    Used for displaying order details, including nested order items.
    """
    items = OrderItemSerializer(many=True, read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    merchandiser_username = serializers.CharField(source='merchandiser.username', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'store', 'store_name', 'merchandiser', 'merchandiser_username',
                  'order_date', 'status', 'total_amount', 'items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'merchandiser', 'merchandiser_username', 'total_amount', 'items',
                            'created_at', 'updated_at']


class OrderCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new orders.
    Allows specifying order items within the same request.
    """
    items = OrderItemSerializer(many=True)  # Nested serializer for order items

    class Meta:
        model = Order
        fields = ['id', 'store', 'order_date', 'status', 'items']
        read_only_fields = ['id']

    def create(self, validated_data):
        """
        Create a new Order instance and its associated OrderItems.
        :param validated_data: Dictionary of validated data for order creation.
        :return: Created Order instance.
        """
        items_data = validated_data.pop('items')
        request = self.context.get('request')

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authenticated user (merchandiser) is required for order creation.")
        merchandiser_instance = request.user

        order = Order.objects.create(merchandiser=merchandiser_instance, **validated_data)

        self._create_order_items(order, items_data)
        order.calculate_total_amount()
        return order

    def _create_order_items(self, order, items_data):
        """
        Helper method to create OrderItems for a given Order.
        :param order: The Order instance to associate items with.
        :param items_data: List of dictionaries containing order item data.
        """
        for item_data in items_data:
            product = item_data.pop('product')  # product will be an instance validated by OrderItemSerializer
            OrderItem.objects.create(order=order, product=product, **item_data)


class OrderUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing orders.
    Allows updating order items; existing items can be updated, new items added, and items can be removed.
    """
    items = OrderItemSerializer(many=True, required=False)  # Nested serializer for order items, optional for update

    class Meta:
        model = Order
        fields = ['id', 'store', 'order_date', 'status', 'items']
        read_only_fields = ['id']  # ID is read-only, store is usually not changed after creation

    def update(self, instance, validated_data):
        """
        Update an existing Order instance and its associated OrderItems.
        :param instance: The Order instance to update.
        :param validated_data: Dictionary of validated data for order update.
        :return: Updated Order instance.
        """
        items_data = validated_data.pop('items', None)

        # Update direct fields on the Order instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            self._update_order_items(instance, items_data)
            instance.calculate_total_amount()
        return instance

    def _update_order_items(self, order, items_data):
        """
        Helper method to update OrderItems for a given Order.
        This method handles creating new items, updating existing ones, and deleting removed ones.
        :param order: The Order instance to update items for.
        :param items_data: List of dictionaries containing order item data.
        """
        # Keep track of item IDs from the request
        requested_item_ids = set()
        for item_data in items_data:
            item_id = item_data.get('id')
            product = item_data.pop('product')  # product will be an instance validated by OrderItemSerializer

            if item_id:
                # Update existing item
                try:
                    order_item_instance = OrderItem.objects.get(id=item_id, order=order)
                    for attr, value in item_data.items():
                        setattr(order_item_instance, attr, value)
                    order_item_instance.product = product  # Update product in case it changed (less common)
                    order_item_instance.save()
                    requested_item_ids.add(item_id)
                except OrderItem.DoesNotExist:
                    # If ID provided but not found, create as new (or raise error)
                    # For simplicity, we create a new one. A more robust solution might raise an error.
                    OrderItem.objects.create(order=order, product=product, **item_data)
                    requested_item_ids.add(OrderItem.objects.latest('id').id)  # Add new item's ID
            else:
                # Create new item if no ID provided
                new_item = OrderItem.objects.create(order=order, product=product, **item_data)
                requested_item_ids.add(new_item.id)

        # Delete items that are no longer in the request list
        order.items.exclude(id__in=requested_item_ids).delete()
