from django.utils import timezone
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import ListModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import DailyPlanStore, DailyPlan
from core.serializers.map import *


class MapDataListView(ListModelMixin, GenericAPIView):
    """
    API endpoint for listing store data optimized for map display.
    Accessible by any authenticated user (merchandisers or managers).
    Supports filtering by merchandiser (to see stores in their plans) and plan_date.
    """
    queryset = Store.objects.filter(latitude__isnull=False, longitude__isnull=False).order_by('name')
    serializer_class = StoreMapSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filters the queryset based on query parameters for map data.
        Allows filtering by merchandiser (ID) and plan_date.
        Only managers can filter by any merchandiser ID.
        Merchandisers can only filter by their own ID.
        :return: Filtered queryset of Store objects.
        """
        queryset = super().get_queryset()
        request_user = self.request.user

        merchandiser_id = self.request.query_params.get('merchandiser_id')
        plan_date_str = self.request.query_params.get('plan_date')

        if merchandiser_id:
            if request_user.role == 'merchandiser' and str(request_user.id) != merchandiser_id:
                return Store.objects.none()

            daily_plan_filters = {'merchandiser__id': merchandiser_id}

            if plan_date_str:
                try:
                    plan_date_obj = timezone.datetime.strptime(plan_date_str, '%Y-%m-%d').date()
                    daily_plan_filters['plan_date__date'] = plan_date_obj
                except ValueError:
                    return Store.objects.none()

            queryset = queryset.filter(
                id__in=DailyPlanStore.objects.filter(
                    daily_plan__in=DailyPlan.objects.filter(**daily_plan_filters)
                ).values_list('store_id', flat=True)
            ).distinct()

        return queryset

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to list store data for map display.
        :param request: The HTTP request object.
        :return: Response containing a list of store objects.
        """
        return self.list(request, *args, **kwargs)


class DailyPlanStoresListView(ListModelMixin, GenericAPIView):
    """
    API endpoint for listing stores associated with a specific daily plan.
    Accessed via daily_plan_id from URL.
    Managers can view stores for any plan. Merchandisers can only view stores for their own plans.
    """
    serializer_class = StoreMapSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'daily_plan_id'

    def get_queryset(self):
        """
        Retrieves the DailyPlan and then filters its associated stores.
        Ensures proper permissions: managers can view any plan, merchandisers only their own.
        :return: Queryset of Store objects for the specified DailyPlan.
        :raises Http404: If the daily plan does not exist or user doesn't have permission.
        """
        daily_plan_id = self.kwargs.get(self.lookup_field)
        request_user = self.request.user

        try:
            if request_user.role == 'manager':
                daily_plan = DailyPlan.objects.get(id=daily_plan_id)
            else:  # Merchandiser
                daily_plan = DailyPlan.objects.get(id=daily_plan_id, merchandiser=request_user)
        except DailyPlan.DoesNotExist:
            return Response({"detail": "Daily Plan not found or you do not have permission to access it."},
                            status=status.HTTP_400_BAD_REQUEST)

        return Store.objects.filter(
            id__in=daily_plan.stores.filter(store__latitude__isnull=False, store__longitude__isnull=False)
            .order_by('visit_order')
            .values_list('store_id', flat=True)
        )

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to list stores for a specific daily plan.
        :param request: The HTTP request object.
        :return: Response containing a list of store objects.
        """
        return self.list(request, *args, **kwargs)
