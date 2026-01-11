from rest_framework import serializers
from .models import Service, UserProfile, Booking, Review, Payment
from django.contrib.auth.models import User
from django.db.models import Avg

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['username', 'email', 'role', 'avatar', 'avatar_url', 'is_verified']

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None

class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.username')
    customer_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'customer_name', 'customer_avatar', 'rating', 'comment', 'created_at']

    def get_customer_avatar(self, obj):
        # Lấy avatar của người review để hiển thị lên App cho đẹp
        try:
            profile = obj.customer.userprofile
            request = self.context.get('request')
            if profile.avatar and request:
                return request.build_absolute_uri(profile.avatar.url)
        except:
            return None
        return None

class ServiceSerializer(serializers.ModelSerializer):
    provider_name = serializers.ReadOnlyField(source='provider.username')
    image_url = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField() # [Yêu cầu: sắp xếp theo đánh giá]

    class Meta:
        model = Service
        fields = '__all__'
        read_only_fields = ['provider', 'created_at', 'active']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None

    def get_avg_rating(self, obj):
        # Tính điểm trung bình cộng các review
        avg = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0

class BookingSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.username')
    service_name = serializers.ReadOnlyField(source='service.name')

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['customer', 'total_price', 'status', 'created_at']