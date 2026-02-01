from django.contrib import admin
from .models import UserProfile, Category, Product, Party, example

# admin.site.register(UserProfile)
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'product_name', 'user', 'category', 'unit_price', 'quantity')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug')

@admin.register(UserProfile)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'phone_no', 'business_name', 'is_verify')

# admin.site.register(Party)
@admin.register(example)
class exampleAdmin(admin.ModelAdmin):
    list_display = ('id', 'paragraph', 'product_name', 'example_2', 'example_1')