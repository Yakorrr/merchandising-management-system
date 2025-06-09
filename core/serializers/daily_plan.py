from django.db import transaction
from rest_framework import serializers

from core.models import DailyPlan, DailyPlanStore, Store


class DailyPlanStoreSerializer(serializers.ModelSerializer):
    """
    Serializer for DailyPlanStore.
    Manages individual store visits within a daily plan.
    """
    store_name = serializers.CharField(source='store.name', read_only=True)

    class Meta:
        model = DailyPlanStore
        fields = ['id', 'store', 'store_name', 'visit_order', 'visited_at', 'completed']
        read_only_fields = ['id', 'store_name']

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
        daily_plan = DailyPlan.objects.create(merchandiser=merchandiser_instance, **validated_data)
        self._create_daily_plan_stores(daily_plan, stores_data)
        return daily_plan

    def _create_daily_plan_stores(self, daily_plan, stores_data):
        """
        Helper method to create DailyPlanStore instances for a given DailyPlan.
        :param daily_plan: The DailyPlan instance to associate visits with.
        :param stores_data: List of dictionaries containing store visit data.
        """
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

        if stores_data is not None:
            # FIX: Call the updated _update_daily_plan_stores method
            self._update_daily_plan_stores(instance, stores_data)
        return instance

    def _update_daily_plan_stores(self, daily_plan, stores_data):
        """
        Helper method to update DailyPlanStore instances for a given DailyPlan.
        This method handles creating new visits, updating existing ones, and deleting removed ones.
        It also validates that visit_order is unique within the provided data.
        :param daily_plan: The DailyPlan instance to update visits for.
        :param stores_data: List of dictionaries containing new and updated store visit data.
        :raises serializers.ValidationError: If visit_order is not unique in the input data.
        """
        # Validate uniqueness of visit_order within the incoming data itself
        visit_orders_in_data = [item.get('visit_order') for item in stores_data if item.get('visit_order') is not None]
        if len(visit_orders_in_data) != len(set(visit_orders_in_data)):
            raise serializers.ValidationError({"stores": "Duplicate visit_order found in the provided list of stores."})

        # Use a transaction for atomicity
        with transaction.atomic():
            # Get existing DailyPlanStore IDs for this DailyPlan
            existing_daily_plan_store_ids = set(daily_plan.stores.values_list('id', flat=True))

            # Keep track of IDs provided in the request
            requested_daily_plan_store_ids = set()

            for visit_data in stores_data:
                visit_id = visit_data.get('id')
                store = visit_data.pop('store')  # This will be a Store instance from validation

                if visit_id:
                    # Case 1: ID provided, try to update existing DailyPlanStore
                    try:
                        visit_instance = DailyPlanStore.objects.get(id=visit_id, daily_plan=daily_plan)
                        # Perform update
                        for attr, value in visit_data.items():
                            setattr(visit_instance, attr, value)
                        visit_instance.store = store  # Update store in case it changed (less common but possible)
                        visit_instance.save()
                        requested_daily_plan_store_ids.add(visit_id)
                    except DailyPlanStore.DoesNotExist:
                        # Case 1.1: ID provided but object not found for this plan
                        raise serializers.ValidationError({
                            "stores": f"DailyPlanStore with ID {visit_id} not found for this plan. Cannot update non-existent item."})
                else:
                    # Case 2: No ID provided, create a new DailyPlanStore
                    if DailyPlanStore.objects.filter(daily_plan=daily_plan,
                                                     visit_order=visit_data.get('visit_order')).exists():
                        raise serializers.ValidationError({
                            "stores": f"Visit order {visit_data.get('visit_order')} already exists for this plan. Cannot create duplicate."})

                    new_visit = DailyPlanStore.objects.create(daily_plan=daily_plan, store=store, **visit_data)
                    requested_daily_plan_store_ids.add(new_visit.id)

            # Case 3: Delete DailyPlanStore objects that were not in the request list
            daily_plan.stores.filter(id__in=existing_daily_plan_store_ids).exclude(
                id__in=requested_daily_plan_store_ids).delete()
