from django.db import transaction
from django.db.models import Subquery, OuterRef, DecimalField, Sum, Count, Avg
from django.db.models.functions import Coalesce, Round
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Store, Log, Order, OrderItem
from core.permissions import IsManager
from core.serializers.metrics import *


class StoreMetricsListView(ListModelMixin, GenericAPIView):
    """
    API endpoint for listing pre-calculated store metrics from the database.
    Accessible only by authenticated managers.
    """
    queryset = StoreMetrics.objects.all().order_by('-date', 'store__name')
    serializer_class = StoreMetricsSerializer
    permission_classes = [IsAuthenticated, IsManager]

    def get_queryset(self):
        """
        Filters the queryset of pre-calculated store metrics based on query parameters.
        Allows filtering by store_id and date.
        :return: Filtered queryset of StoreMetrics objects.
        """
        queryset = super().get_queryset()

        store_name = self.request.query_params.get('store')
        date = self.request.query_params.get('date')

        if store_name:
            print(store_name)
            queryset = queryset.filter(store__name__icontains=store_name)

        if date:
            try:
                target_date = timezone.datetime.strptime(date, '%Y-%m-%d').date()
                queryset = queryset.filter(date=target_date)
            except ValueError:
                return StoreMetrics.objects.none()

        return queryset

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to list all pre-calculated store metrics.
        :param request: The HTTP request object.
        :return: Response containing a list of StoreMetrics objects.
        """
        return self.list(request, *args, **kwargs)


class StoreMetricsDetailView(RetrieveModelMixin, GenericAPIView):
    """
    API endpoint for retrieving pre-calculated metrics for a single store.
    Accessible only by authenticated managers.
    """
    queryset = StoreMetrics.objects.all()
    serializer_class = StoreMetricsSerializer
    permission_classes = [IsAuthenticated, IsManager]
    lookup_field = 'pk'

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve details of a specific pre-calculated store metric.
        :param request: The HTTP request object.
        :return: Response containing the specific StoreMetrics object.
        """
        return self.retrieve(request, *args, **kwargs)


class CalculateStoreMetricsAPIView(APIView):
    """
    API endpoint for calculating and returning store metrics on demand for a specified period.
    Accessible only by authenticated managers.
    """
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request, *args, **kwargs):
        """
        Calculates and returns aggregated metrics for stores based on orders within a date range.
        Query parameters: 'start_date' (YYYY-MM-DD), 'end_date' (YYYY-MM-DD).
        :param request: The HTTP request object.
        :return: Response containing calculated metrics for stores.
        """
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        queryset = Store.objects.all()

        if start_date and start_date != '':
            try:
                start_datetime = timezone.make_aware(
                    timezone.datetime.strptime(start_date, '%Y-%m-%d')
                    .replace(
                        hour=0, minute=0, second=0, microsecond=0
                    ))
            except ValueError:
                return Response({"detail": "Invalid start_date format. Use YYYY-MM-DD."},
                                status=status.HTTP_400_BAD_REQUEST)
        else:
            start_datetime = timezone.make_aware(
                timezone.datetime(2025, 6, 1, 0, 0, 0, 0)
            )

        if end_date and end_date != '':
            try:
                end_datetime = timezone.make_aware(
                    timezone.datetime.strptime(end_date, '%Y-%m-%d')
                    .replace(
                        hour=23, minute=59, second=59, microsecond=999999
                    ))
            except ValueError:
                return Response({"detail": "Invalid end_date format. Use YYYY-MM-DD."},
                                status=status.HTTP_400_BAD_REQUEST)
        else:
            end_datetime = timezone.now()

        orders_in_range = Order.objects.filter(
            store=OuterRef("pk"), order_date__range=(start_datetime, end_datetime)
        )

        # Annotate the Store queryset with the required metrics using Subqueries
        metrics_data = queryset.annotate(
            # Metric 1: Total number of orders for the store
            total_orders_count=Coalesce(
                Subquery(
                    orders_in_range.values("store")
                    .annotate(count=Count("pk"))
                    .values("count")
                ),
                0,
            ),

            # Metric 2: Total quantity of all items sold in the store's orders
            total_quantity_ordered=Coalesce(
                Subquery(
                    OrderItem.objects.filter(
                        order__store=OuterRef("pk"),
                        order__order_date__range=(start_datetime, end_datetime),
                    )
                    .values("order__store")
                    .annotate(total=Sum("quantity"))
                    .values("total")
                ),
                0,
            ),

            # Metric 3: Average order amount for the store
            average_order_amount=Coalesce(
                Subquery(
                    orders_in_range.values("store")
                    .annotate(avg=Round(Avg("total_amount"), 2))
                    .values("avg")
                ),
                0.0,
                output_field=DecimalField(),
            ),
        ).values(
            'id',
            'name',
            'total_orders_count',
            'total_quantity_ordered',
            'average_order_amount'
        ).order_by('name')

        results = []
        for item in metrics_data:
            results.append({
                'store_id': item['id'],
                'store_name': item['name'],
                'total_orders_count': item['total_orders_count'],
                'total_quantity_ordered': item['total_quantity_ordered'],
                'average_order_amount': item['average_order_amount'],
                'start_date': start_datetime.isoformat(),
                'end_date': end_datetime.isoformat(),
            })

        serializer = CalculatedStoreMetricsSerializer(results, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SaveStoreMetricsAPIView(APIView):
    """
    API endpoint to manually trigger saving calculated store metrics for a specific date.
    This would typically be run by a scheduled job (e.g., cron).
    Accessible only by authenticated managers.
    """
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, *args, **kwargs):
        """
        Calculates metrics for all stores for a given date (or today if not specified)
        and saves them into the StoreMetrics model.
        Optional query parameter: 'date' (YYYY-MM-DD).
        :param request: The HTTP request object.
        :return: Response indicating success and number of metrics saved.
        """
        target_date = request.data.get('target_date')

        queryset = Store.objects.all()

        if target_date and target_date != '':
            try:
                target_datetime = timezone.make_aware(
                    timezone.datetime.strptime(target_date, '%Y-%m-%d')
                    .replace(
                        hour=23, minute=59, second=59, microsecond=999999
                    ))
            except ValueError:
                return Response({"detail": "Invalid end_date format. Use YYYY-MM-DD."},
                                status=status.HTTP_400_BAD_REQUEST)
        else:
            target_datetime = timezone.now()

        order_filters = Order.objects.filter(
            store=OuterRef("pk"), order_date=target_datetime
        )

        metrics_data = queryset.annotate(
            # Metric 1: Total number of orders for the store
            total_orders_count=Coalesce(
                Subquery(
                    order_filters.values("store")
                    .annotate(count=Count("pk"))
                    .values("count")
                ),
                0,
            ),

            # Metric 2: Total quantity of all items sold in the store's orders
            total_quantity_ordered=Coalesce(
                Subquery(
                    OrderItem.objects.filter(
                        order__store=OuterRef("pk"),
                        order__order_date=target_datetime,
                    )
                    .values("order__store")
                    .annotate(total=Sum("quantity"))
                    .values("total")
                ),
                0,
            ),

            # Metric 3: Average order amount for the store
            average_order_amount=Coalesce(
                Subquery(
                    order_filters.values("store")
                    .annotate(avg=Round(Avg("total_amount"), 2))
                    .values("avg")
                ),
                0.0,
                output_field=DecimalField(),
            ),
        ).order_by('name')

        saved_count = 0
        with transaction.atomic():
            for store_obj in metrics_data:
                StoreMetrics.objects.update_or_create(
                    store=store_obj,
                    date=timezone.datetime.strptime(target_date, '%Y-%m-%d').date(),
                    defaults={
                        'total_orders_count': store_obj.total_orders_count,
                        'total_quantity_ordered': store_obj.total_quantity_ordered,
                        'average_order_amount': store_obj.average_order_amount,
                    }
                )
                saved_count += 1

        Log.objects.create(
            user=request.user,
            action='metrics_saved',
            details={
                'date_saved_for': str(target_date),
                'number_of_stores': saved_count,
                'saved_by': request.user.username
            }
        )

        return Response(
            {"detail": f"Successfully calculated and saved metrics for {saved_count} "
                       f"stores for date range {target_date}."}, status=status.HTTP_200_OK)
