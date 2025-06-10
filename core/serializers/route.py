from rest_framework import serializers
from core.models import Store


class RoutePointSerializer(serializers.Serializer):
    """
    Serializer for a single point (Store ID) in a route calculation request.
    """
    store_id = serializers.IntegerField(help_text="ID of the store for this point.")

    def to_internal_value(self, data):
        """
        Converts the incoming raw data (store_id) into a validated Store object.
        This is where validation and object retrieval happens for nested fields.
        :param data: The raw data for the point (e.g., {'store_id': 1}).
        :return: The validated Store instance.
        :raises serializers.ValidationError: If store_id is invalid or store lacks coordinates.
        """
        if not isinstance(data, dict) or 'store_id' not in data:
            raise serializers.ValidationError("Each point must be an object with 'store_id'.")

        store_id = data['store_id']
        if not isinstance(store_id, int):
            raise serializers.ValidationError("Store ID must be an integer.")

        try:
            store = Store.objects.get(id=store_id)
            if store.latitude is None or store.longitude is None:
                raise serializers.ValidationError(
                    f"Store with ID {store_id} must have defined latitude and longitude for routing.")
            return store  # Return the Store instance as the internal value
        except Store.DoesNotExist:
            raise serializers.ValidationError(f"Store with ID {store_id} does not exist.")

    def to_representation(self, instance):
        """
        Converts the internal Store object back into a dictionary for representation (if needed for output).
        :param instance: The Store instance.
        :return: Dictionary representation.
        """
        return {'store_id': instance.id}  # Only return ID for request input


class RouteRequestSerializer(serializers.Serializer):
    """
    Serializer for the request body to calculate a route.
    Includes a list of store IDs for the route and an optional optimize_order flag.
    """
    points = RoutePointSerializer(many=True, help_text="List of store IDs in desired order.")
    optimize_order = serializers.BooleanField(default=False, help_text="Attempt to optimize the order of visits.")

    def validate_points(self, value):
        """
        Validates that at least two points are provided for routing.
        :param value: List of validated Store objects.
        :return: The validated list of Store objects.
        :raises serializers.ValidationError: If fewer than two points are provided.
        """
        if len(value) < 2:
            raise serializers.ValidationError("At least two stores are required to calculate a route.")
        return value


class RouteResponseSegmentSerializer(serializers.Serializer):
    """
    Serializer for a single segment of the calculated route (e.g., store details, distance/duration).
    """
    store_id = serializers.IntegerField()
    store_name = serializers.CharField()
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    distance_to_next_km = serializers.DecimalField(max_digits=10, decimal_places=2,
                                                   help_text="Distance to next point in kilometers.", required=False)
    duration_to_next_min = serializers.DecimalField(max_digits=10, decimal_places=2,
                                                    help_text="Duration to next point in minutes.", required=False)


class RouteResponseSerializer(serializers.Serializer):
    """
    Serializer for the overall route calculation response.
    Includes total distance, duration, and ordered list of visited points.
    """
    total_distance_km = serializers.DecimalField(max_digits=10, decimal_places=2,
                                                 help_text="Total route distance in kilometers.")
    total_duration_min = serializers.DecimalField(max_digits=10, decimal_places=2,
                                                  help_text="Total route duration in minutes.")
    ordered_points = RouteResponseSegmentSerializer(many=True, help_text="Stores in the calculated order.")
    route_geometry = serializers.CharField(help_text="Overview polyline geometry of the route.", required=False)
    optimized = serializers.BooleanField(help_text="Indicates if the order of points was optimized.", default=False)
