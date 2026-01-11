from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ServiceViewSet,
    BookingViewSet,
    MeAPIView,
    StatisticsView
)

router = DefaultRouter()
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('', include(router.urls)),
    path('me/', MeAPIView.as_view(), name='me'),
    path('statistics/', StatisticsView.as_view(), name='statistics'),
]