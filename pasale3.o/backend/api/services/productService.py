from sys import exception
from urllib import request
from urllib3 import request
from api.models import Product
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
                serializer = ProductSerializer(product)
                return get_or_set_product_cache(key, lambda: serializer.data)
            
            else:
                key = productkeys(user_id)
                paginator = PageNumberPagination()
                paginator.page_size = 10
                products = Product.objects.filter(user=request.user)
                result_page = paginator.paginate_queryset(products, request)
                serializer = ProductSerializer(result_page, many=True)
                return get_or_set_product_cache(key, lambda: paginator.get_paginated_response(serializer.data))
            
        except Exception as e:
            raise Exception(f"Error fetching product: {str(e)}")
 


