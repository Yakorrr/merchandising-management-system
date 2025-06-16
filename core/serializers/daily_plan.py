from django.db import transaction
from django.db.utils import IntegrityError
from rest_framework import serializers

from core.models import DailyPlan, DailyPlanStore, Store
from core.serializers import StoreSerializer


class DailyPlanStoreSerializer(serializers.ModelSerializer):
    """
    Serializer for DailyPlanStore.
    Manages individual store visits within a daily plan.
    """
    store_name = serializers.CharField(source='store.name', read_only=True)
    store_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DailyPlanStore
        fields = ['id', 'store', 'store_name', 'store_details', 'visit_order', 'visited_at', 'completed']
        read_only_fields = ['id', 'store_name', 'store_details']

    def validate_store(self, store_id):
        """
        Validates that the store exists.
        :param store_id: The ID of the store.
        :return: The Store instance.
        :raises serializers.ValidationError: If store does not exist.
        """
        try:
            if isinstance(store_id, Store):
                store_id = store_id.id
            return Store.objects.get(id=store_id)
        except Store.DoesNotExist:
            raise serializers.ValidationError(f"Store with ID {store_id} does not exist.")

    def validate(self, data):
        """
        Validates visit_order is positive.
        :param data: The validated data for the daily plan store.
        :return: The validated data.
        """
        if data.get('visit_order') is not None and data['visit_order'] <= 0:
            raise serializers.ValidationError({"visit_order": "Visit order must be a positive integer."})
        return data

    def get_store_details(self, obj):
        """
        Returns the full serialized Store object for store_details field.
        This will include latitude and longitude if they are in StoreSerializer's fields.
        :param obj: The DailyPlanStore instance.
        :return: Serialized Store data.
        """

        return StoreSerializer(obj.store).data


class DailyPlanSerializer(serializers.ModelSerializer):
    """
    Serializer for DailyPlan.
    Used for displaying daily plan details, including nested store visits.
    """
    stores = DailyPlanStoreSerializer(many=True, read_only=True)
    merchandiser_username = serializers.CharField(source='merchandiser.username', read_only=True)

    class Meta:
        model = DailyPlan
        fields = ['id', 'merchandiser', 'merchandiser_username', 'plan_date', 'notes', 'stores', 'created_at',
                  'updated_at']
        read_only_fields = ['id', 'merchandiser', 'merchandiser_username', 'stores', 'created_at', 'updated_at']


class DailyPlanCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new DailyPlan instances.
    Allows specifying associated store visits.
    """
    stores = DailyPlanStoreSerializer(many=True)

    class Meta:
        model = DailyPlan
        fields = ['id', 'merchandiser', 'plan_date', 'notes', 'stores']
        read_only_fields = ['id']

    def create(self, validated_data):
        """
        Create a new DailyPlan instance and its associated DailyPlanStores.
        :param validated_data: Dictionary of validated data for daily plan creation.
        :return: Created DailyPlan instance.
        """
        stores_data = validated_data.pop('stores')
        merchandiser_instance = validated_data.pop('merchandiser')

        try:
            with transaction.atomic():  # Ensure atomicity for DailyPlan creation and nested stores
                daily_plan = DailyPlan.objects.create(merchandiser=merchandiser_instance, **validated_data)
                self._create_daily_plan_stores(daily_plan, stores_data)
            return daily_plan
        except IntegrityError as e:
            # Catch IntegrityError (unique constraint violation) and re-raise as ValidationError
            if "daily_plan_id_visit_order" in str(e):
                raise serializers.ValidationError({"stores": "Duplicate visit order found for this daily plan."})
            if "daily_plan_id_store_id" in str(e):
                raise serializers.ValidationError({"stores": "Duplicate store in daily plan."})
            raise e  # Re-raise if not a known integrity error

    def _create_daily_plan_stores(self, daily_plan, stores_data):
        """
        Helper method to create DailyPlanStore instances for a given DailyPlan.
        :param daily_plan: The DailyPlan instance to associate visits with.
        :param stores_data: List of dictionaries containing store visit data.
        """

        # Validate uniqueness of visit_order and store in data BEFORE creation loop
        visit_orders_in_data = [item.get('visit_order') for item in stores_data if item.get('visit_order') is not None]
        store_ids_in_data = [item.get('store').id if isinstance(item.get('store'), Store) else item.get('store') for
                             item in stores_data if item.get('store') is not None]

        if len(store_ids_in_data) != len(set(store_ids_in_data)):
            raise serializers.ValidationError({"stores": "Duplicate store found in the provided list for this plan."})
        if len(visit_orders_in_data) != len(set(visit_orders_in_data)):
            raise serializers.ValidationError(
                {"stores": "Duplicate visit order found in the provided list for this plan."})

        for store_data in stores_data:
            store = store_data.pop('store')
            DailyPlanStore.objects.create(daily_plan=daily_plan, store=store, **store_data)


class DailyPlanUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing DailyPlan instances.
    Allows updating plan details and associated store visits.
    """
    stores = DailyPlanStoreSerializer(many=True, required=False)

    class Meta:
        model = DailyPlan
        fields = ['id', 'plan_date', 'notes', 'stores']
        read_only_fields = ['id']

    def update(self, instance, validated_data):
        """
        Update an existing DailyPlan instance and its associated DailyPlanStores.
        :param instance: The DailyPlan instance to update.
        :param validated_data: Dictionary of validated data for daily plan update.
        :return: Updated DailyPlan instance.
        """
        stores_data = validated_data.pop('stores', None)

        # Update direct fields on the DailyPlan instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Completely replace DailyPlanStore objects by deleting old and creating new
        if stores_data is not None:
            # Validate uniqueness of visit_order and store in data BEFORE creation loop
            visit_orders_in_data = []
            store_ids_in_data = []
            for item in stores_data:
                if item.get('visit_order') is not None:
                    visit_orders_in_data.append(item['visit_order'])
                if item.get('store') is not None:
                    store_ids_in_data.append(item['store'].id if isinstance(item['store'], Store) else item['store'])

            if len(store_ids_in_data) != len(set(store_ids_in_data)):
                raise serializers.ValidationError(
                    {"stores": "Duplicate store found in the provided list for this plan."})
            if len(visit_orders_in_data) != len(set(visit_orders_in_data)):
                raise serializers.ValidationError(
                    {"stores": "Duplicate visit order found in the provided list for this plan."})

            with transaction.atomic():  # Ensure atomicity of delete and create
                # 1. Delete all existing DailyPlanStore objects for this plan
                instance.stores.all().delete()
                # 2. Create new DailyPlanStore objects based on the provided data
                for visit_data in stores_data:
                    store_instance = visit_data.pop('store')  # This will be a Store instance
                    DailyPlanStore.objects.create(daily_plan=instance, store=store_instance, **visit_data)

        return instance
