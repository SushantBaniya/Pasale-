from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Billing, BillingItem, Employee, Order, OrderItem,  UserProfile, Product, Party, Customer, Supplier, SupplierInfo, Expense, Skill, EmployeeSkill, Shift, EmployeeSchedule


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone_no', 'name']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'profile']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        profile_data = validated_data.pop('profile')
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user, **profile_data)
        return user


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'user', 'product_name', 'category',
                  'product_Img', 'unit_price', 'quantity', 'description']


class PartySerializer(serializers.ModelSerializer):
    class Meta:
        model = Party
        fields = "__all__"


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = "__all__"


class SupplierInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierInfo
        fields = ['id', 'name', 'email', 'phone_no', 'address',
                  'company_name',  'pan_number', 'open_balance']


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'user', 'amount', 'description',
                  'date', 'category', 'is_necessary']


class BillingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Billing
        fields = "__all__"


class BillingItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingItem
        fields = "__all__"


class EmployeeSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(
        source='business_id.business_name', read_only=True)
    department_name = serializers.CharField(
        source='department.name', read_only=True, required=False)
    manager_name = serializers.CharField(
        source='manager.name', read_only=True, required=False)
    status = serializers.CharField(source='status.name', read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'user', 'name', 'email', 'phone_no', 'position', 'salary', 'hire_date',
                  'status', 'department', 'department_name', 'manager', 'manager_name', 'business_id', 'business_name']


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'description', 'business_id']


class EmployeeSkillSerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    employee_name = serializers.CharField(
        source='employee.name', read_only=True)

    class Meta:
        model = EmployeeSkill
        fields = ['id', 'employee', 'employee_name',
                  'skill', 'skill_name', 'proficiency_level']


class ShiftSerializer(serializers.ModelSerializer):
    required_skill_name = serializers.CharField(
        source='required_skill.name', read_only=True, allow_null=True)
    assigned_employee_name = serializers.CharField(
        source='assigned_employee.name', read_only=True, allow_null=True)

    class Meta:
        model = Shift
        fields = ['id', 'business_id', 'shift_date', 'start_time', 'end_time',
                  'required_skill', 'required_skill_name', 'required_employees',
                  'assigned_employee', 'assigned_employee_name', 'is_scheduled', 'created_at', 'updated_at']


class EmployeeScheduleSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(
        source='employee.name', read_only=True)

    class Meta:
        model = EmployeeSchedule
        fields = ['id', 'employee', 'employee_name',
                  'date', 'start_time', 'end_time']


class SchedulerRequestSerializer(serializers.Serializer):
    """Serializer for staff scheduling request"""
    business_id = serializers.IntegerField()
    shift_ids = serializers.ListField(child=serializers.IntegerField())
    max_hours_per_week = serializers.IntegerField(default=40, required=False)
    apply_schedule = serializers.BooleanField(default=False, required=False)


class SchedulerResponseSerializer(serializers.Serializer):
    """Serializer for scheduler response"""
    scheduled_count = serializers.IntegerField()
    unscheduled_count = serializers.IntegerField()
    total_shifts = serializers.IntegerField()
    success_rate = serializers.CharField()
    schedule_summary = serializers.DictField(required=False)

class OrderItemSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source='status.name', read_only=True)
    product_name = serializers.CharField(source='product_id.product_name', read_only=True)
    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'product_id', 'product_name', 'quantity', 'unit_price', 'total_price', 'status', 'status_id']
        read_only_fields = ['status']

class OrderSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source='status.name', read_only=True)
    customer_name = serializers.CharField(source='customer_id.name', read_only=True)
    business_name = serializers.CharField(source='business_id.business_name', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'business_id','business_name', 'customer_id', 'customer_name', 'order_date', 
                  'updated_at', 'created_at', 'total_amount', 'status', 'status_id', 'items']
        
        read_only_fields = ['status', 'customer_name', 'business_name', 'items', 'created_at', 'updated_at']



