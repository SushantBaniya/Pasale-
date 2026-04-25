from django.contrib.auth.models import User
from rest_framework import serializers
from .models import AprioriRule, Billing, BillingItem, Counter, Employee, Order, OrderItem, OrderItemStatus, OrderStatus, StockAlert, Product, Party, Customer, Supplier, SupplierInfo, Expense, Skill, EmployeeSkill, Shift, EmployeeSchedule


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'user', 'product_name', 'category',
                  'unit_price', 'quantity', 'description']


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
        fields = ['id',  'name', 'email', 'phone_no', 'position', 'salary', 'hire_date',
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

    weights = serializers.DictField(
        child=serializers.FloatField(),
        required=False,
        default={
            "availability": 0.30,
            "skill_match":  0.25,
            "fairness":     0.20,
            "skill_level":  0.15,
            "cost":         0.10,   
        }
    )


class SchedulerResponseSerializer(serializers.Serializer):
    """Serializer for scheduler response"""
    scheduled_count = serializers.IntegerField()
    unscheduled_count = serializers.IntegerField()
    total_shifts = serializers.IntegerField()
    success_rate = serializers.CharField()
    schedule_summary = serializers.DictField(required=False)


class OrderItemSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source='status.name', read_only=True)
    status_id = serializers.PrimaryKeyRelatedField(
        source='status', queryset=OrderItemStatus.objects.all(), write_only=True, required=False, allow_null=True)
    product_name = serializers.CharField(
        source='product_id.product_name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'product_id', 'product_name',
                  'quantity', 'unit_price', 'total_price', 'status', 'status_id']
        read_only_fields = ['status']


class OrderSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source='order_status.name', read_only=True)
    status_id = serializers.PrimaryKeyRelatedField(
        source='order_status', queryset=OrderStatus.objects.all(), write_only=True, required=False, allow_null=True)
    order_date = serializers.DateTimeField(source='created_at', read_only=True)
    customer_name = serializers.CharField(
        source='customer_id.name', read_only=True)
    business_name = serializers.CharField(
        source='business_id.business_name', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    counter_id = serializers.IntegerField(source='counter.id', read_only=True)
    counter_number = serializers.CharField(
        source='counter.counter_number', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'business_id', 'business_name', 'customer_id', 'customer_name', 'order_date',
                  'updated_at', 'created_at', 'total_amount', 'status', 'status_id', 'counter_id', 'counter_number', 'items']

        read_only_fields = ['status', 'customer_name',
                            'business_name', 'items', 'created_at', 'updated_at']


class CounterSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(
        source='business_id.business_name', read_only=True)

    class Meta:
        model = Counter
        fields = ['id', 'business_id', 'business_name',
                  'counter_number', 'location']
        read_only_fields = ['business_name']


class AprioriRuleSerializer(serializers.ModelSerializer):
    confidence_percent = serializers.SerializerMethodField()

    class Meta:
        model = AprioriRule
        fields = [
            'id',
            'antecedent',
            'consequent',
            'support',
            'confidence',
            'confidence_percent',
            'lift',
            'updated_at'
        ]

    def get_confidence_percent(self, obj):
        return f"{obj.confidence:.0%}"


class StockAlertSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name')
    product_quantity = serializers.IntegerField(source='product.quantity')
    reorder_level = serializers.IntegerField(source='product.reorder_level')

    class Meta:
        model = StockAlert
        fields = [
            'id',
            'product_name',
            'product_quantity',
            'reorder_level',
            'message',
            'is_resolved',
            'created_at'
        ]


class ReorderSuggestionSerializer(serializers.Serializer):
    low_stock_product = serializers.CharField()
    current_quantity = serializers.IntegerField()
    reorder_level = serializers.IntegerField()
    also_reorder = serializers.ListField()
