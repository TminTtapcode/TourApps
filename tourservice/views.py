from rest_framework.views import APIView
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, F
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404

from .models import Service, Booking, Review, UserProfile, Payment
from .serializers import ServiceSerializer, BookingSerializer, ReviewSerializer, UserProfileSerializer
from .permissions import IsAdminOrProvider, IsCustomer, BookingPermission
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated



class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.filter(active=True)
    serializer_class = ServiceSerializer
    # Cấu hình bộ lọc và tìm kiếm [Yêu cầu đề tài]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    # Cho phép lọc chính xác theo các trường này
    filterset_fields = ['service_type', 'location', 'provider__id']

    # Cho phép tìm kiếm tương đối (LIKE %...%) theo tên và mô tả
    search_fields = ['name', 'description', 'location']

    # Cho phép sắp xếp theo giá và ngày tạo
    ordering_fields = ['price', 'created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]

        elif self.action == 'add_review':
            permission_classes = [permissions.IsAuthenticated, IsCustomer]

        else:
            permission_classes = [permissions.IsAuthenticated, IsAdminOrProvider]

        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        # [QUAN TRỌNG] Kiểm tra xem Provider đã được Admin duyệt chưa
        user_profile = self.request.user.userprofile
        if not user_profile.is_verified and user_profile.role != 'ADMIN':
            raise permissions.PermissionDenied("Tài khoản nhà cung cấp của bạn chưa được Admin phê duyệt.")

        serializer.save(provider=self.request.user)

    # API để thêm Review cho Service (POST /api/services/{id}/add_review/)
    @action(methods=['post'], detail=True)
    def add_review(self, request, pk=None):
        service = self.get_object()
        user = request.user

        has_booking = Booking.objects.filter(
            customer=user,
            service=service,
            status='CONFIRMED'
        ).exists()

        if not has_booking:
            return Response(
                {'error': 'Bạn chưa sử dụng dịch vụ này'},
                status=403
            )

        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(customer=user, service=service)

        return Response(serializer.data, status=status.HTTP_201_CREATED)



class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        profile = get_object_or_404(UserProfile, user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)


class BookingViewSet(ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated, BookingPermission]

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated, IsAdminOrProvider])
    def approve(self, request, pk=None):
        if request.user.userprofile.role != 'ADMIN':
            return Response({'error': 'Chỉ Admin được duyệt booking'}, status=403)

        booking = self.get_object()
        booking.status = 'CONFIRMED'
        booking.save()
        return Response({'status': 'CONFIRMED'})

    def get_queryset(self):
        user = self.request.user
        role = user.userprofile.role

        if role == 'ADMIN':
            return Booking.objects.all()

        if role == 'PROVIDER':
            return Booking.objects.filter(service__provider=user)

        return Booking.objects.filter(customer=user)

    def perform_create(self, serializer):
        service = serializer.validated_data['service']
        quantity = serializer.validated_data.get('quantity', 1)
        total_price = service.price * quantity

        serializer.save(
            customer=self.request.user,
            total_price=total_price
        )

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        booking = self.get_object()
        if booking.status == 'CONFIRMED':
            return Response({'error': 'Booking đã được thanh toán'}, status=400)
        if booking.customer != request.user:
            return Response({'error': 'Không có quyền thanh toán booking này'}, status=403)

        Payment.objects.create(
            booking=booking,
            amount=booking.total_price,
            status='PAID'
        )

        booking.status = 'CONFIRMED'
        booking.save()

        return Response({'payment': 'PAID'})




class StatisticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.userprofile.role

        if role == 'PROVIDER':
            # Thống kê cho Nhà cung cấp
            revenue = Booking.objects.filter(service__provider=user, status='CONFIRMED').aggregate(
                total_revenue=Sum('total_price'),
                total_bookings=Count('id')
            )
            # Thống kê theo từng dịch vụ
            service_stats = Booking.objects.filter(service__provider=user, status='CONFIRMED').values(
                'service__name'
            ).annotate(
                revenue=Sum('total_price'),
                count=Count('id')
            )
            return Response({
                "summary": revenue,
                "detail": service_stats
            })

        elif role == 'ADMIN':
            # Thống kê toàn hệ thống cho Admin
            total_users = UserProfile.objects.count()
            total_services = Service.objects.count()
            revenue = Booking.objects.filter(status='CONFIRMED').aggregate(
                total_revenue=Sum('total_price'),
                total_bookings=Count('id')
            )
            return Response({
                "total_users": total_users,
                "total_services": total_services,
                "revenue_summary": revenue
            })

        return Response({"message": "Không có quyền truy cập thống kê"}, status=403)