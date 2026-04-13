from sys import exception
from urllib import request
from urllib3 import request
from api.models import Product, Business
from cache.keys import productkey, productkeys
from cache.services import get_or_set_product_cache
from api.serializers import ProductSerializer
from rest_framework.pagination import PageNumberPagination

def ProductService(user_id=None, product_id=None, business_id=None, page=1, page_size=10):
    try:
        if product_id:
            return get_or_set_product_cache(productkey(product_id), lambda: Product.objects.filter(id=product_id, business__user_id=user_id).first())
        
        if business_id:
            products = Product.objects.filter(business_id=business_id, business__user_id=user_id)

            if not products.exists():
                return {'message': 'No products found for this business.'}
            
            
            
            paginator = PageNumberPagination()
            paginator.page_size = page_size
            paginated_products = paginator.paginate_queryset(products, request=None)
            serializer = ProductSerializer(paginated_products, many=True)
            return {
                'products': serializer.data,
                'total': products.count(),
                'page': page,
                'page_size': page_size
            }
        
        return {'message': 'Product ID or Business ID is required.'}
    
    except Exception as e:
        raise Exception(f"Error fetching products: {str(e)}")
    
     
     
     
     
     
     
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


