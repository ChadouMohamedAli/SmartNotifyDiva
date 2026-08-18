from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # ==================== AUTHENTIFICATION ====================
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('email-otp/verify/', views.email_otp_verify_view, name='email_otp_verify'),
    path('email-otp/resend/', views.email_otp_resend_view, name='email_otp_resend'),
    path('logout/', views.logout_view, name='logout'),
    path('google-auth/', views.google_auth_view, name='google_auth'),
    path('google-oauth-callback/', views.google_oauth_callback_view, name='google_oauth_callback'),
    path('telegram-auth/', views.telegram_auth_view, name='telegram_auth'),
    path('telegram-login-init/', views.telegram_login_init, name='telegram_login_init'),
    path('telegram-login-status/', views.telegram_login_status, name='telegram_login_status'),
    path('telegram-send-code/', views.telegram_send_code, name='telegram_send_code'),
    path('telegram-verify-otp/', views.telegram_verify_otp, name='telegram_verify_otp'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # ==================== PROFIL UTILISATEUR ====================
    path('user/', views.user_profile_view, name='user_profile'),
    path('change-password/', views.change_password_view, name='change_password'),
    path('password-reset/', views.password_reset_request_view, name='password_reset_request'),
    path('password-reset-confirm/', views.password_reset_confirm_view, name='password_reset_confirm'),
    
    # ==================== ADMIN - GESTION UTILISATEURS ====================
    path('users/', views.UserListCreateView.as_view(), name='user_list_create'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    path('users/<int:pk>/approve/', views.approve_user_view, name='approve_user'),
    path('users/<int:pk>/reject/', views.reject_user_view, name='reject_user'),
    path('users/stats/', views.user_stats_view, name='user_stats'),
    path('users/online/', views.online_users, name='online_users'),
    
    # ==================== UTILITAIRES ====================
    path('check-email/', views.check_email_exists, name='check_email'),
    path('resend-welcome-email/', views.resend_welcome_email_view, name='resend-welcome-email'),
    
]
