from api.models import Business, Order, OrderStatus
from api.serializers import OrderSerializer

def get_order(order_id, business_id):
    try: 
        if not business_id:
            raise ValueError("Business ID is required to fetch orders.")
        
        if order_id:
            orders = Order.objects.filter(id=order_id, business_id=business_id).all()
            serializer = OrderSerializer(orders, many=True)
            return serializer.data
        
        if business_id:
            orders = Order.objects.filter(business_id=business_id).all()
            serializer = OrderSerializer(orders, many=True)
            return serializer.data
        
    except Exception as e:
        raise Exception(f"Error fetching order(s): {str(e)}")
    
def create_order(data):
    try:
        data = dict(data)

        required_fields = ['business_id', 'customer', 'order_date', 'total_amount']
        for field in required_fields:
            if field not in data:
                raise Exception(f"{field} is required.")

        if not Business.objects.filter(id=data['business_id'], user_id=data['user_id']).exists():
            raise Exception("Business does not exist or does not belong to the user.")
        
        # Set default status to "Pending"
        pending_status, created = OrderStatus.objects.get_or_create(name="Pending")
        data['status_id'] = pending_status.id

        order_serializer = OrderSerializer(data=data)
        if order_serializer.is_valid():
            order_serializer.save()
            return order_serializer.data
        else:
            raise Exception(f"Invalid data: {order_serializer.errors}")
    except Exception as e:
        raise Exception(f"Error creating order: {str(e)}")