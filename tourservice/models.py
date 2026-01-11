# models.py
from django.db import models
from django.contrib.auth.models import User
from ckeditor.fields import RichTextField  # Gợi ý dùng cái này cho mô tả đẹp hơn nếu muốn


class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('PROVIDER', 'Provider'),
        ('CUSTOMER', 'Customer'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CUSTOMER')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)  # [Yêu cầu đề tài]

    # Trường này để Admin duyệt Provider. Nếu là Customer thì mặc định True.
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.role}"


class Service(models.Model):
    SERVICE_TYPES = (
        ('HOTEL', 'Hotel'),
        ('TOUR', 'Tour'),
        ('VEHICLE', 'Vehicle'),
    )

    provider = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)

    # Dùng ImageField để lưu ảnh minh họa [Yêu cầu đề tài]
    image = models.ImageField(upload_to='services/%Y/%m', null=True, blank=True)

    description = models.TextField()  # Hoặc dùng RichTextField
    price = models.DecimalField(max_digits=12, decimal_places=0)  # VND thường không dùng số lẻ
    location = models.CharField(max_length=255)
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPES)

    # Thêm các trường cần thiết cho so sánh/tìm kiếm
    capacity = models.IntegerField(default=1)  # Số chỗ trống
    departure_time = models.DateTimeField(null=True, blank=True)  # Thời gian khởi hành

    created_at = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)  # Để Provider có thể ẩn/hiện dịch vụ

    def __str__(self):
        return self.name


class Review(models.Model):
    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveIntegerField(default=5) # 1 đến 5 sao
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer.username} review {self.service.name}"

# models.py (tiếp theo)

class Payment(models.Model):
    PAYMENT_METHODS = (
        ('CASH', 'Tiền mặt'),
        ('MOMO', 'MoMo'),
        ('ZALOPAY', 'ZaloPay'),
        ('STRIPE', 'Stripe'),
    )

    booking = models.OneToOneField('Booking', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=0)
    provider_name = models.CharField(max_length=50, choices=PAYMENT_METHODS)
    transaction_id = models.CharField(max_length=100, null=True, blank=True) # Mã giao dịch từ MoMo/Stripe
    status = models.BooleanField(default=False) # True = Đã thanh toán
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment for Booking #{self.booking.id}"


class Booking(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
    )

    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bookings'
    )

    service = models.ForeignKey(
        'Service',
        on_delete=models.CASCADE,
        related_name='bookings'
    )

    quantity = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer.username} - {self.service.name}"
