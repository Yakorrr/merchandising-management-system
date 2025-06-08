from rest_framework import serializers

from core.models import Store


class StoreSerializer(serializers.ModelSerializer):
    """
    General purpose serializer for Store model.
    Used for displaying store information (read-only contexts).
    """

    class Meta:
        model = Store
        fields = '__all__'  # Include all fields for display
        read_only_fields = ['id', 'created_at', 'updated_at']  # These fields are read-only


class StoreCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new Store instances.
    """

    class Meta:
        model = Store
        # Fields required for creating a new store
        fields = ['id', 'name', 'address', 'latitude', 'longitude', 'contact_person_name', 'contact_person_phone']
        read_only_fields = ['id']


class StoreUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing Store instances.
    All fields are optional for partial updates (PATCH).
    """

    class Meta:
        model = Store
        # Fields that can be updated. 'id' is read-only implicitly.
        fields = ['name', 'address', 'latitude', 'longitude', 'contact_person_name', 'contact_person_phone']
        extra_kwargs = {
            'name': {'required': False},
            'address': {'required': False},
            'latitude': {'required': False},
            'longitude': {'required': False},
            'contact_person_name': {'required': False},
            'contact_person_phone': {'required': False},
        }
