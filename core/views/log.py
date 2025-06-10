from rest_framework.generics import GenericAPIView
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated

from core.permissions import IsManager
from core.serializers.log import *


class LogListView(ListModelMixin, GenericAPIView):
    """
    API endpoint for listing all system logs.
    Accessible only by authenticated managers.
    Supports filtering by user_id and action type.
    """
    queryset = Log.objects.all().order_by('-timestamp')
    serializer_class = LogSerializer
    permission_classes = [IsAuthenticated, IsManager]

    def get_queryset(self):
        """
        Filters the queryset of logs based on query parameters.
        Allows filtering by user_id and action.
        :return: Filtered queryset of Log objects.
        """
        queryset = super().get_queryset()
        user_id = self.request.query_params.get('user_id')
        action = self.request.query_params.get('action')

        if user_id:
            try:
                queryset = queryset.filter(user__id=user_id)
            except ValueError: # If user_id is not a valid integer
                return Log.objects.none() # Return empty queryset

        if action:
            queryset = queryset.filter(action__iexact=action) # Case-insensitive action filter

        return queryset

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to list logs.
        :param request: The HTTP request object.
        :return: Response containing a list of Log objects.
        """
        return self.list(request, *args, **kwargs)


class LogDetailView(RetrieveModelMixin, GenericAPIView):
    """
    API endpoint for retrieving details of a single log entry.
    Accessible only by authenticated managers.
    """
    queryset = Log.objects.all()
    serializer_class = LogSerializer
    permission_classes = [IsAuthenticated, IsManager]
    lookup_field = 'pk'

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve a single log entry's details.
        :param request: The HTTP request object.
        :return: Response containing the specific Log object.
        """
        return self.retrieve(request, *args, **kwargs)