from django.db import models, transaction
from django.db.models import DecimalField
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Store, Log
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
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')

        queryset = Store.objects.all()

        order_filters = {}
        if start_date:
            try:
                start_date = timezone.datetime.strptime(start_date, '%Y-%m-%d').date()
            except ValueError:
                return Response({"detail": "Invalid start_date format. Use YYYY-MM-DD."},
                                status=status.HTTP_400_BAD_REQUEST)
        else:
            start_date = timezone.datetime(2020, 1, 1).date()

        if end_date:
            try:
                end_date = timezone.datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                return Response({"detail": "Invalid end_date format. Use YYYY-MM-DD."},
                                status=status.HTTP_400_BAD_REQUEST)
        else:
            end_date = timezone.now().date()

        order_filters['orders__order_date__gte'] = start_date
        order_filters['orders__order_date__lte'] = end_date

        metrics_data = queryset.annotate(
            total_orders_count=models.Count('orders', distinct=True, filter=models.Q(**order_filters)),
            total_quantity_ordered=Coalesce(models.Sum('orders__items__quantity',
                                                       filter=models.Q(**order_filters)), 0),
            total_order_amount=Coalesce(
                models.Sum('orders__total_amount', filter=models.Q(**order_filters)), 0.00,
                output_field=DecimalField()
            )
        ).annotate(
            average_order_amount=Coalesce(models.Avg('orders__total_amount',
                                                     filter=models.Q(**order_filters)), 0.00,
                                          output_field=DecimalField())
        ).values('id', 'name', 'total_orders_count', 'total_quantity_ordered', 'average_order_amount')

        results = []
        for item in metrics_data:
            results.append({
                'store_id': item['id'],
                'store_name': item['name'],
                'total_orders_count': item['total_orders_count'],
                'total_quantity_ordered': item['total_quantity_ordered'],
                'average_order_amount': item['average_order_amount'],
                'start_date': start_date,
                'end_date': end_date,
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
        date = request.data.get('date')

        queryset = Store.objects.all()

        if date:
            try:
                target_date = timezone.datetime.strptime(date, '%Y-%m-%d').date()
            except ValueError:
                return Response({"detail": "Invalid date format. Use YYYY-MM-DD."},
                                status=status.HTTP_400_BAD_REQUEST)
        else:
            target_date = timezone.now().date()

        order_filters = {
            'orders__order_date__date': target_date
        }

        metrics_data = queryset.annotate(
            total_orders_count=models.Count('orders', distinct=True, filter=models.Q(**order_filters)),
            total_quantity_ordered=Coalesce(models.Sum('orders__items__quantity',
                                                       filter=models.Q(**order_filters)), 0),
            total_order_amount=Coalesce(
                models.Sum('orders__total_amount', filter=models.Q(**order_filters)), 0.00,
                output_field=DecimalField()
            )
        ).annotate(
            average_order_amount=Coalesce(models.Avg('orders__total_amount',
                                                     filter=models.Q(**order_filters)), 0.00,
                                          output_field=DecimalField())
        )

        saved_count = 0
        with transaction.atomic():
            for store_obj in metrics_data:
                StoreMetrics.objects.update_or_create(
                    store=store_obj,
                    date=target_date,
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
                       f"stores for date {target_date}."}, status=status.HTTP_200_OK)
