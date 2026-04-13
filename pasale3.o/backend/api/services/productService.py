from sys import exception
from urllib import request
from urllib3 import request
from api.models import Product, Business, StockAlert
from cache.keys import productkey, productkeys
from cache.services import get_or_set_product_cache
from api.serializers import ProductSerializer
from rest_framework.pagination import PageNumberPagination


def check_low_stock_and_alert(product_id):
    try:
        product = Product.objects.get(id=product_id)

        if product.quantity <= product.reorder_level:
            if not product.is_low_stock:
                # Update product status
                product.is_low_stock = True
                product.save(update_fields=['is_low_stock'])

                # Create the unread alert notification
                StockAlert.objects.get_or_create(
                    product=product,
                    business_id=product.business_id,
                    is_resolved=False,
                    defaults={
                        'message': f"Low Stock Alert: {product.product_name} only has {product.quantity} left!"}
                )
        else:
            # If stock is now above threshold, resolve automatically
            if product.is_low_stock:
                product.is_low_stock = False
                product.save(update_fields=['is_low_stock'])
                StockAlert.objects.filter(
                    product=product, is_resolved=False).update(is_resolved=True)

    except Product.DoesNotExist:
        pass


def ProductService(user_id=None, product_id=None, business_id=None, page=1, page_size=10):
    try:
        if product_id:
            return get_or_set_product_cache(productkey(product_id), lambda: Product.objects.filter(id=product_id, business__user_id=user_id).first())

        if business_id:
            products = Product.objects.filter(
                business_id=business_id, business__user_id=user_id)

            if not products.exists():
                return {'message': 'No products found for this business.'}

            paginator = PageNumberPagination()
            paginator.page_size = page_size
            paginated_products = paginator.paginate_queryset(
                products, request=None)
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

        required_fields = ['product_name', 'category',
                           'unit_price', 'quantity', 'business_id']
        for field in required_fields:
            if field not in data:
                raise Exception(f"{field} is required.")

        if not Business.objects.filter(id=data['business_id'], user_id=data['user_id']).exists():
            raise Exception(
                "Business does not exist or does not belong to the user.")

        serializer = ProductSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return {'message': 'Product created successfully!', 'product': serializer.data}

    except Exception as e:
        raise Exception(f"Error creating product: {str(e)}")
