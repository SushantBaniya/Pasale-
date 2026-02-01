from decimal import Decimal
from django.contrib.auth.models import User
from django.db import models

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_no = models.CharField(max_length=15, blank=True, null=True)
    business_name = models.CharField(max_length=255, blank=True, null=True)
    otp = models.CharField(max_length=6, null=True, blank=True)
    otp_created_at = models.DateTimeField(null=True, blank=True)
    is_verify = models.BooleanField(default=False)
    
    def __str__(self):
        return self.user.username
    
class Category(models.Model):
    id = models.AutoField(primary_key=True)  # Explicit primary key
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)

    def __str__(self):
        return self.name
    
class PaymentMethod(models.Model):
    id = models.AutoField(primary_key=True)  # Explicit primary key
    method_choices = [
        ('Cash', 'Cash'),
        ('Credit Card', 'Credit Card'),
        ('Bank Transfer', 'Bank Transfer'),
        ('UPI', 'UPI'),]
    method_name = models.CharField(max_length=20, choices=method_choices, unique=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.method_name

class Product(models.Model):
    id = models.AutoField(primary_key=True)  # Explicit primary key
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    product_name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    sku = models.CharField(max_length=50, unique=True, default='')
    product_Img = models.CharField(max_length=255, blank=True, null=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    description = models.TextField(blank=True, null=True)
    is_created_at=models.DateTimeField(auto_now_add=True, null=True)
    is_updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.product_name
    
class Party(models.Model):
    id=models.AutoField(primary_key=True)  # Explicit primary key
    CATEGORY_TYPE_CHOICES = [
        ('Customer', 'Individual'),
        ('Supplier', 'Company'),
    ]
    Category_type=models.CharField(max_length=20,choices=CATEGORY_TYPE_CHOICES)
    is_active=models.BooleanField(default=True)
    
    is_updated_at=models.DateTimeField(auto_now=True)
   
   #meta class for ordering and plural name(settings)
    class Meta:
        verbose_name_plural = 'Parties'
       

    def __str__(self):
        if hasattr(self, 'Customer'):
            return f"Customer: {self.Customer.name}"
        elif hasattr(self, 'Supplier'):
            return f"Supplier: {self.Supplier.name}"
       
class Customer(models.Model):
    id = models.AutoField(primary_key=True)  # Explicit primary key
    party = models.OneToOneField(Party, on_delete=models.CASCADE, related_name='Customer')
    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    phone_no = models.CharField(max_length=15, blank=True, null=True)
    Customer_code= models.CharField(max_length=50, unique=True,null=True)
    address = models.TextField(blank=True, null=True)
    #financial details
    open_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    credit_limmit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.SET_NULL, null=True, blank=True, related_name='customers')

    loyalty_points = models.IntegerField(default=0)
    #additional info
    referred_by = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name
    
class Supplier(models.Model):
    id = models.AutoField(primary_key=True)  # Explicit primary key
    party = models.OneToOneField(Party, on_delete=models.CASCADE, related_name='Supplier')
    name = models.CharField(max_length=100)
    code= models.CharField(max_length=50, unique=True)
   
    def __str__(self):
        return self.name
    
class SupplierInfo(models.Model):
    id = models.AutoField(primary_key=True)  # Explicit primary key
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='supplier_infos')
    phone_no = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    pan_number = models.CharField(max_length=20, blank=True, null=True)
    # bank details
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    ifsc_code = models.CharField(max_length=20, blank=True, null=True)
    # balance info
    open_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    credit_limmit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    notes= models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.supplier.name}"
    

class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('Rent', 'Rent'),
        ('Utilities', 'Utilities'),
        ('Salary', 'Salary'),
        ('Inventory', 'Inventory'),
        ('Transport', 'Transport'),
        ('Food', 'Food'),
        ('Office Supplies', 'Office Supplies'),
        ('Phone', 'Phone'),
        ('Marketing', 'Marketing'),
        ('Other', 'Other'),
    ]
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    date = models.DateField()
    is_necessary = models.BooleanField(default=True)
   

    def __str__(self):
        return self.user.username

class Billing(models.Model):
    id = models.AutoField(primary_key=True)  # Explicit primary key
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='billings')
    
    # Invoice details
    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
 
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.SET_NULL, null=True)
    invoice_choices = [
        ('Paid', 'Paid'),
        ('Unpaid', 'Unpaid'),
        ('Pending', 'Pending'),
        ('Draft', 'Draft'),
    ]
    invoice_status = models.CharField(max_length=20, choices=invoice_choices, default='Draft')
    # Customer details
    party= models.ForeignKey(Party, on_delete=models.CASCADE, related_name='billings', null=True, blank=True)
    phone= models.CharField(max_length=15, blank=True, null=True)
    VAt_number= models.CharField(max_length=50, blank=True, null=True)
    address= models.TextField(blank=True, null=True)
    # Items and amounts
    
    #Summary
    notes= models.TextField(blank=True, null=True)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    due_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    sub_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def calculate_totals(self):
        """Calculate subtotal from all invoice items"""
        self.subtotal = sum(item.total_price for item in self.items.all())
        self.total = self.subtotal - self.discount + self.tax_vat
        self.save()

    def __str__(self):
        return self.user.username
    
class BillingItem(models.Model):
    id = models.AutoField(primary_key=True)  # Explicit primary key
    billing = models.ForeignKey(Billing, on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='billing_items')
    quantity = models.PositiveIntegerField()
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percentage = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax_percentage = models.DecimalField(max_digits=10, decimal_places=2, default=13.00)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    def save(self, *args, **kwargs):
        """Auto-calculate total_price before saving"""
        self.total_price = self.quantity * self.rate
        super().save(*args, **kwargs)
        self.billing.calculate_totals()
        
    def __str__(self):
        return f"Item {self.id} for Billing {self.billing.id}"
    
class ForgetPasswordOTP(models.Model):
    id = models.AutoField(primary_key=True)  # Explicit primary key
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forget_password_otps')
    otp = models.CharField(max_length=6, null=True, blank=True)
    otp_created_at = models.DateTimeField(null=True, blank=True)
    is_verify = models.BooleanField(default=False)

    def __str__(self):
        return f"OTP for {self.user.username}"
        
class example(models.Model):
    id = models.AutoField(primary_key=True)  # Explicit primary key
    paragraph = models.TextField()
    product_name = models.CharField(max_length=100)
    example_2 = models.CharField(max_length=100)
    example_1 = models.CharField(max_length=255, blank=True, null=True)
    
    