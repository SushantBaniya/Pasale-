from sys import exception
from urllib import request
from urllib3 import request
from api.models import Product, Business
from cache.keys import productkey, productkeys
from cache.services import get_or_set_product_cache
from api.serializers import ProductSerializer
from rest_framework.pagination import PageNumberPagination

def ProductService(user_id=None, product_id=None):
    if product_id:
        try:
            if product_id:
                key = productkey(user_id, product_id)
                product = Product.objects.get(id=product_id, user_id=user_id)
                def fetch_one():
                    serializer = ProductSerializer(product)
                    return serializer.data
                if key:
                    return get_or_set_product_cache(key, fetch_one)
            
            else:
                key = productkeys(user_id)
                paginator = PageNumberPagination()
                paginator.page_size = 10
                products = Product.objects.filter(user_id=user_id)
                result_page = paginator.paginate_queryset(products, request)
                serializer = ProductSerializer(result_page, many=True)
                return get_or_set_product_cache(key, lambda: paginator.get_paginated_response(serializer.data))
            
        except Exception as e:
            raise Exception(f"Error fetching product: {str(e)}")
 
def create_product(data):
    try:
        data = dict(data)
        
        required_fields = ['product_name', 'category', 'unit_price', 'quantity', 'business_id']
        for field in required_fields:
            if field not in data:
                raise Exception(f"{field} is required.")
            
        if not Business.objects.filter(id=data['business_id'], user_id=data['user_id']).exists():
            raise Exception("Business does not exist or does not belong to the user.")
        
        serializer = ProductSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return {'message': 'Product created successfully!', 'product': serializer.data}
    
    except Exception as e:
        raise Exception(f"Error creating product: {str(e)}")


