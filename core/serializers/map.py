from rest_framework import serializers
from core.models import Store


class StoreMapSerializer(serializers.ModelSerializer):
    """
    Serializer for Store model, specifically tailored for map display.
    Includes essential fields like ID, name, coordinates, and address.
    """

    class Meta:
        model = Store
        fields = ['id', 'name', 'address', 'latitude', 'longitude']
        read_only_fields = ['id', 'name', 'address', 'latitude', 'longitude']
