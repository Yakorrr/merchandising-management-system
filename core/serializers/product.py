from rest_framework import serializers
from core.models import Product


class ProductSerializer(serializers.ModelSerializer):
    """
    General purpose serializer for Product model.
    Used for displaying product information (read-only contexts).
    """

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new Product instances.
    """

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price']
        read_only_fields = ['id']


class ProductUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing Product instances.
    All fields are optional for partial updates (PATCH).
    """

    class Meta:
        model = Product
        fields = ['name', 'description', 'price']  # Fields that can be updated
        extra_kwargs = {
            'name': {'required': False},
            'description': {'required': False},
            'price': {'required': False},
        }

    def update(self, instance, validated_data):
        """
        Update an existing Product instance.
        :param instance: The Product instance to update.
        :param validated_data: Dictionary of validated data for product update.
        :return: Updated Product instance.
        """
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
