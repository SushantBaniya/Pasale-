from django.urls import path
from .views import CounterView, EmployeeView, OrderView, SignupView, VerifySignupOtpView, VerifyLoginOtpView, ApiProductView, LoginView, ApiPartyView, ApiExpenseView, ApiBillingView, ForgetPasswordView, VerifyForgetPasswordOtpView, ResetPasswordView, StaffSchedulerView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('signup/', SignupView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify-signup-otp/', VerifySignupOtpView.as_view(),
         name='verify-signup-otp'),
    path('verify-login-otp/', VerifyLoginOtpView.as_view(), name='verify-login-otp'),

    path('products/b<int:business_id>/', ApiProductView.as_view(), name='ApiProductView'),
    path('products/b<int:business_id>/p<int:product_id>/', ApiProductView.as_view(), name='ApiProductView'),

    path('parties/b<int:business_id>/', ApiPartyView.as_view(), name='ApiPartyView'),
    path('parties/b<int:business_id>/p<int:party_id>/', ApiPartyView.as_view(), name='ApiPartyView'),

    path('expenses/b<int:business_id>/', ApiExpenseView.as_view(), name='ApiExpenseView'),
    path('expenses/b<int:business_id>/e<int:expense_id>/', ApiExpenseView.as_view(), name='ApiExpenseView'),

    path('billing/b<int:business_id>/', ApiBillingView.as_view(), name='ApiBillingView'),
    path('billing/b<int:business_id>/b<int:billing_id>/', ApiBillingView.as_view(), name='ApiBillingView'),

    path('forget-password/', ForgetPasswordView.as_view(), name='forget-password'),
    path('verify-forget-password-otp/', VerifyForgetPasswordOtpView.as_view(),
         name='verify-forget-password-otp'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),

    path('employee/b<int:business_id>/',
         EmployeeView.as_view(), name='Employee-list-create'),
    path('employee/b<int:business_id>/e<int:employee_id>/',
         EmployeeView.as_view(), name='Employee-list-detail'),

    path('scheduler/schedule/', StaffSchedulerView.as_view(),
         name='scheduler-schedule'),
    path('scheduler/b<int:business_id>/',
         StaffSchedulerView.as_view(), name='scheduler-get-shifts'),

    path('counters/b<int:business_id>/', CounterView.as_view(), name='counter-list-create'),
    path('counters/b<int:business_id>/c<int:counter_id>/', CounterView.as_view(), name='counter-detail'),

    path('orders/b<int:business_id>/', OrderView.as_view(), name='order-list-create'),
    path('orders/b<int:business_id>/c<int:customer_id>/', OrderView.as_view(), name='order-list-create'),
    path('orders/b<int:business_id>/c<int:counter_id>/', OrderView.as_view(), name='order-detail'),


]
