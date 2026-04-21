from django.contrib import admin
from .models import (
    Billing,
    BillingItem,
    Business,
    Business_Status,
    Business_Type,
    Category,
    Counter,
    Customer,
    Department,
    Employee,
    EmployeeSchedule,
    EmployeeSkill,
    EmployeeStatus,
    Expense,
    ForgetPasswordOTP,
    Order,
    OrderItem,
    OrderItemStatus,
    OrderStatus,
    Party,
    PaymentMethod,
    Product,
    Shift,
    Skill,
    StockAlert,
    Supplier,
    SupplierInfo,
)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'product_name', 'user',
                    'category', 'unit_price', 'quantity')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug')


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'position', 'status',
                    'department', 'manager', 'hire_date')
    list_filter = ('status', 'department')
    search_fields = ('name', 'email')


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'business_id')


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'business_name', 'user', 'business_type',
        'business_status', 'business_phone_no', 'created_at'
    )


@admin.register(Business_Type)
class BusinessTypeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')


@admin.register(Business_Status)
class BusinessStatusAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')


@admin.register(EmployeeStatus)
class EmployeeStatusAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')


@admin.register(EmployeeSchedule)
class EmployeeScheduleAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee', 'date', 'start_time', 'end_time')


@admin.register(EmployeeSkill)
class EmployeeSkillAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee', 'skill', 'proficiency_level')


@admin.register(Party)
class PartyAdmin(admin.ModelAdmin):
    list_display = ('id', 'Category_type', 'is_active', 'is_updated_at')


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'name', 'business_id', 'email',
        'phone_no', 'Customer_code', 'payment_method'
    )


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'code', 'business_id', 'party')


@admin.register(SupplierInfo)
class SupplierInfoAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'supplier', 'phone_no', 'email',
        'open_balance', 'credit_limmit'
    )


@admin.register(Counter)
class CounterAdmin(admin.ModelAdmin):
    list_display = ('id', 'business_id', 'counter_number', 'location')


@admin.register(OrderStatus)
class OrderStatusAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')


@admin.register(OrderItemStatus)
class OrderItemStatusAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'business_id', 'customer_id', 'counter',
        'order_status', 'total_amount', 'created_at'
    )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'order', 'product_id', 'quantity',
        'unit_price', 'total_price', 'status'
    )


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('id', 'method_name', 'is_active')


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'category', 'amount', 'date', 'is_necessary')


@admin.register(Billing)
class BillingAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'invoice_number', 'user', 'business_id', 'order',
        'invoice_status', 'total_amount', 'due_amount'
    )


@admin.register(BillingItem)
class BillingItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'billing', 'item', 'quantity', 'rate', 'total_price')


@admin.register(ForgetPasswordOTP)
class ForgetPasswordOTPAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'otp', 'is_verify', 'otp_created_at')


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'business_id', 'description')


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'business_id', 'shift_date', 'start_time',
        'end_time', 'required_skill', 'assigned_employee', 'is_scheduled'
    )


@admin.register(StockAlert)
class StockAlertAdmin(admin.ModelAdmin):
    list_display = ('id', 'business_id', 'product',
                    'message', 'is_resolved', 'created_at')
