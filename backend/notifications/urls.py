from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NotificationViewSet,
    RegisterTelegramChatView,
    SendOTPEmailView,
    SendOTPTelegramView,
    VerifyOTPEmailView,
    VerifyOTPTelegramView,
    SendOTPLoginView,
    VerifyOTPLoginView,
)

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('register_telegram/', RegisterTelegramChatView.as_view(), name='register_telegram'),
    path('send_otp_email/', SendOTPEmailView.as_view(), name='send_otp_email'),
    path('send_otp_telegram/', SendOTPTelegramView.as_view(), name='send_otp_telegram'),
    path('verify_otp_email/', VerifyOTPEmailView.as_view(), name='verify_otp_email'),
    path('verify_otp_telegram/', VerifyOTPTelegramView.as_view(), name='verify_otp_telegram'),
    path('send_otp_login/', SendOTPLoginView.as_view(), name='send_otp_login'),
    path('verify_otp_login/', VerifyOTPLoginView.as_view(), name='verify_otp_login'),
    path('', include(router.urls)),
]
