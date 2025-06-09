from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import (
    ListModelMixin,
    CreateModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
    DestroyModelMixin
)
from rest_framework.permissions import IsAuthenticated

from core.models import Log
from core.permissions import IsManager
from core.serializers.daily_plan import *


class DailyPlanListView(ListModelMixin, GenericAPIView):
    """
    API endpoint for listing all daily plans.
    Managers can see all plans. Merchandisers can only see their own plans.
    """
    serializer_class = DailyPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filters the queryset based on user role.
        Managers see all plans. Merchandisers see only plans assigned to them.
        :return: Filtered queryset of DailyPlan objects.
        """
        user = self.request.user
        if user.role == 'manager':
            return DailyPlan.objects.all().order_by('-plan_date')
        else:
            return DailyPlan.objects.filter(merchandiser=user).order_by('-plan_date')

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to list daily plans.
        :param request: The HTTP request object.
        :return: Response containing a list of daily plan objects.
        """
        return self.list(request, *args, **kwargs)


class DailyPlanCreateView(CreateModelMixin, GenericAPIView):
    """
    API endpoint for creating a new daily plan.
    Accessible only by authenticated managers.
    The merchandiser for the plan must be specified in the request.
    """
    queryset = DailyPlan.objects.all()
    serializer_class = DailyPlanCreateSerializer
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, *args, **kwargs):
        """
        Handles POST requests to create a new daily plan.
        Logs the creation action.
        :param request: The HTTP request object containing plan data.
        :return: Response with the created daily plan data.
        """

        response = self.create(request, *args, **kwargs)

        if response.status_code == status.HTTP_201_CREATED:
            created_daily_plan_instance = DailyPlan.objects.get(id=response.data['id'])
            Log.objects.create(user=self.request.user, action='daily_plan_created',
                               details={'plan_id': created_daily_plan_instance.id,
                                        'plan_date': str(created_daily_plan_instance.plan_date),
                                        'merchandiser': created_daily_plan_instance.merchandiser.username,
                                        'created_by': self.request.user.username})
        return response


class DailyPlanDetailView(RetrieveModelMixin, GenericAPIView):
    """
    API endpoint for retrieving a single daily plan's details.
    Managers can see any plan. Merchandisers can only see their own plans.
    """
    serializer_class = DailyPlanSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        """
        Filters the queryset to ensure users can only access allowed daily plans.
        Managers can view any plan. Merchandisers can only view their own plans.
        :return: Filtered queryset of DailyPlan objects.
        """
        user = self.request.user
        if user.role == 'manager':
            return DailyPlan.objects.all()
        else:
            return DailyPlan.objects.filter(merchandiser=user)

    def get(self, request, *args, **kwargs):
        """
        Handles GET requests to retrieve a single daily plan's details.
        :param request: The HTTP request object.
        :return: Response containing the specific daily plan's data.
        """
        return self.retrieve(request, *args, **kwargs)


class DailyPlanUpdateView(UpdateModelMixin, GenericAPIView):
    """
    API endpoint for updating a single daily plan's details.
    Accessible only by authenticated managers.
    Supports PATCH (partial update) method.
    """
    queryset = DailyPlan.objects.all()
    serializer_class = DailyPlanUpdateSerializer
    permission_classes = [IsAuthenticated, IsManager]
    lookup_field = 'pk'

    def patch(self, request, *args, **kwargs):
        """
        Handles PATCH requests to partially update a daily plan.
        Logs the update action.
        :param request: The HTTP request object containing partial plan data.
        :return: Response with the updated daily plan data.
        """
        plan_before_update = DailyPlanSerializer(self.get_object()).data
        response = self.partial_update(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            updated_plan_instance = self.get_object()
            Log.objects.create(user=self.request.user, action='daily_plan_updated',
                               details={'plan_id': updated_plan_instance.id,
                                        'plan_date': str(updated_plan_instance.plan_date),
                                        'merchandiser': updated_plan_instance.merchandiser.username,
                                        'updated_by': self.request.user.username,
                                        'old_data': plan_before_update})
        return response


class DailyPlanDeleteView(DestroyModelMixin, GenericAPIView):
    """
    API endpoint for deleting a single daily plan.
    Accessible only by authenticated managers.
    """
    queryset = DailyPlan.objects.all()
    serializer_class = DailyPlanSerializer
    permission_classes = [IsAuthenticated, IsManager]
    lookup_field = 'pk'

    def delete(self, request, *args, **kwargs):
        """
        Handles DELETE requests to delete a daily plan.
        Logs the deletion action.
        :param request: The HTTP request object.
        :return: Response indicating successful deletion.
        """
        instance = self.get_object()
        Log.objects.create(user=self.request.user, action='daily_plan_deleted',
                           details={'plan_id': instance.id,
                                    'plan_date': str(instance.plan_date),
                                    'merchandiser': instance.merchandiser.username,
                                    'deleted_by': self.request.user.username})
        return self.destroy(request, *args, **kwargs)
