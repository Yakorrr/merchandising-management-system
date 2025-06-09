from rest_framework import serializers

from core.models import StoreMetrics


class StoreMetricsSerializer(serializers.ModelSerializer):
    """
    Serializer for StoreMetrics model.
    Used to display pre-calculated store metrics.
    """
    store_name = serializers.CharField(source='store.name', read_only=True)

    class Meta:
        model = StoreMetrics
        fields = '__all__'  # Includes all fields for display
        read_only_fields = ['id', 'store', 'store_name', 'date',
                            'total_orders_count', 'total_quantity_ordered',
                            'average_order_amount', 'created_at', 'updated_at']


class CalculatedStoreMetricsSerializer(serializers.Serializer):
    """
    Serializer for displaying calculated store metrics for a given period.
    This serializer does not directly map to a model but formats aggregated data.
    """
    store_id = serializers.IntegerField()
    store_name = serializers.CharField()
    total_orders_count = serializers.IntegerField()
    total_quantity_ordered = serializers.IntegerField()
    average_order_amount = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True)
    start_date = serializers.DateField(allow_null=True, required=False)
    end_date = serializers.DateField(allow_null=True, required=False)
