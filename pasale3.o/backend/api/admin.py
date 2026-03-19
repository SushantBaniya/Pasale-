from django.contrib import admin
from .models import UserProfile, Category, Product, Party, Employee, Department

# admin.site.register(UserProfile)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'product_name', 'user',
                    'category', 'unit_price', 'quantity')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug')


@admin.register(UserProfile)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'phone_no', 'business_name', 'is_verify')


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'position', 'status',
                    'department', 'manager', 'hire_date')
    list_filter = ('status', 'department')
    search_fields = ('name', 'email')


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'business_id')

# admin.site.register(Party)


