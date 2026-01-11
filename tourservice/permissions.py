from rest_framework.permissions import BasePermission

from django.core.exceptions import ObjectDoesNotExist

def get_role(user):
    if not user.is_authenticated:
        return None
    try:
        return user.userprofile.role
    except ObjectDoesNotExist:
        return None



class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return get_role(request.user) == 'ADMIN'


class IsProvider(BasePermission):
    def has_permission(self, request, view):
        return get_role(request.user) == 'PROVIDER'


class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        return get_role(request.user) == 'CUSTOMER'


class IsAdminOrProvider(BasePermission):
    def has_permission(self, request, view):
        return get_role(request.user) in ['ADMIN', 'PROVIDER']

class BookingPermission(BasePermission):

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        role = request.user.userprofile.role

        if view.action == 'create':
            return role == 'CUSTOMER'

        if view.action in ['update', 'partial_update', 'destroy']:
            return role == 'ADMIN'

        return True

    def has_object_permission(self, request, view, obj):
        role = request.user.userprofile.role

        if role == 'ADMIN':
            return True

        if role == 'PROVIDER':
            return obj.service.provider == request.user

        if role == 'CUSTOMER':
            return obj.customer == request.user

        return False

