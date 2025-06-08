from rest_framework import permissions


class IsManager(permissions.BasePermission):
    """
    Custom permission to only allow users with 'manager' role to access a view.
    """

    def has_permission(self, request, view):
        """
        Checks if the requesting user is authenticated and has the 'manager' role.
        :param request: The HTTP request object.
        :param view: The view being accessed.
        :return: True if the user is an authenticated manager, False otherwise.
        """

        return request.user and request.user.is_authenticated and request.user.role == 'manager'

    def has_object_permission(self, request, view, obj):
        """
        Checks if the requesting user has the 'manager' role for object-level permissions.
        (Might not be strictly necessary for User management, but good practice).
        :param request: The HTTP request object.
        :param view: The view being accessed.
        :param obj: The object being accessed.
        :return: True if the user is an authenticated manager, False otherwise.
        """

        return request.user and request.user.is_authenticated and request.user.role == 'manager'
