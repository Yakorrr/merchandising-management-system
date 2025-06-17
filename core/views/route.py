import requests
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Log
from core.serializers.route import *


class CalculateRouteAPIView(APIView):
    """
    API endpoint for calculating the shortest route between a set of stores.
    Integrates with an external routing service (e.g., OSRM).
    Accessible only by authenticated managers.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Calculates the shortest route based on a list of store IDs.
        Supports optional route optimization.
        :param request: The HTTP request object with points and optimize_order.
        :return: Response with route details, including total distance, duration, and ordered points.
        """
        serializer = RouteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        points_data = serializer.validated_data['points']
        optimize_order = serializer.validated_data['optimize_order']

        coords = []
        for store_obj in points_data:
            coords.append(f"{store_obj.longitude},{store_obj.latitude}")

        # This check is also handled by RouteRequestSerializer.validate_points() (at least two points)
        if len(coords) < 2:
            return Response({"detail": "At least two valid store coordinates are required for routing."},
                            status=status.HTTP_400_BAD_REQUEST)

        routing_url = settings.OSRM_SERVICE_URL
        response_key = 'routes'

        # Adjust URL parameters based on optimize_order
        osrm_params = "?overview=full&alternatives=false&steps=false"  # Default for /route/
        if optimize_order:
            routing_url = settings.OSRM_OPTIMIZE_URL
            response_key = 'trips'
            osrm_params = "?overview=full"

        osrm_url = f"{routing_url}{';'.join(coords)}{osrm_params}"

        try:
            osrm_response = requests.get(osrm_url, timeout=10)
            osrm_response.raise_for_status()
            osrm_data = osrm_response.json()

            if osrm_data.get('code') != 'Ok':
                error_detail = osrm_data.get('message', 'No specific message provided by routing service.')
                return Response({"detail": f"Routing service error: {osrm_data.get('code', 'Unknown Error')}",
                                 "message": error_detail,
                                 "osrm_url_called": osrm_url},
                                status=status.HTTP_503_SERVICE_UNAVAILABLE)

            if not osrm_data.get(response_key) or not osrm_data[response_key]:
                return Response({"detail": "No route or trip found by routing service for the given points."},
                                status=status.HTTP_404_NOT_FOUND)

            best_route = osrm_data[response_key][0]

            total_distance_km = round(best_route.get('distance', 0) / 1000, 2)
            total_duration_min = round(best_route.get('duration', 0) / 60, 2)
            route_geometry = best_route.get('geometry')

            ordered_points_output = []
            if optimize_order:
                # For /trip/ (TSP), best_route['waypoints'] contains the original point index
                for waypoint_info in best_route.get('waypoints', []):
                    original_point_index = waypoint_info.get('waypoint_index')
                    if original_point_index is not None and 0 <= original_point_index < len(points_data):
                        original_store_obj = points_data[original_point_index]
                        ordered_points_output.append({
                            'store_id': original_store_obj.id,
                            'store_name': original_store_obj.name,
                            'store_address': original_store_obj.address,
                            'latitude': original_store_obj.latitude,
                            'longitude': original_store_obj.longitude,
                        })
            else:
                # For /route/, points are already in the order they were provided
                for store_obj in points_data:
                    ordered_points_output.append({
                        'store_id': store_obj.id,
                        'store_name': store_obj.name,
                        'store_address': store_obj.address,
                        'latitude': store_obj.latitude,
                        'longitude': store_obj.longitude,
                    })

            response_data = {
                'total_distance_km': total_distance_km,
                'total_duration_min': total_duration_min,
                'ordered_points': ordered_points_output,
                'route_geometry': route_geometry,
                'optimized': optimize_order,
            }

            Log.objects.create(user=request.user, action='route_calculated',
                               details={
                                   'optimized': optimize_order,
                                   'total_distance_km': total_distance_km,
                                   'total_duration_min': total_duration_min,
                                   'points_count': len(points_data),
                                   'requested_store_ids': [s.id for s in points_data],
                                   'calculated_by': request.user.username
                               })

            return Response(RouteResponseSerializer(response_data).data, status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as e:
            print(f"OSRM Request Exception for URL: {osrm_url} - Error: {e}")
            return Response(
                {"detail": f"Failed to connect to routing service or received an invalid response from OSRM: {e}",
                 "osrm_url_called": osrm_url},
                status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            print(f"Unexpected error during routing for URL: {osrm_url} - Error: {e}")
            return Response({"detail": f"An unexpected error occurred during routing: {e}",
                             "osrm_url_called": osrm_url},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
