from django.db import transaction
from rest_framework import status
from rest_framework.response import Response

from api.models import (
    Business,
    Counter,
    Customer,
    Order,
    OrderItem,
    OrderItemStatus,
    OrderStatus,
    Product,
)
from api.serializers import OrderSerializer
from orderCart.models import OrderCart


def get_order(order_id, business_id):
    try:
        if not business_id:
            raise ValueError("Business ID is required to fetch orders.")

        if order_id:
            orders = Order.objects.filter(
                id=order_id, business_id=business_id).all()
            serializer = OrderSerializer(orders, many=True)
            return serializer.data

        if business_id:
            orders = Order.objects.filter(business_id=business_id).all()
            serializer = OrderSerializer(orders, many=True)
            return serializer.data

    except Exception as e:
        raise Exception(f"Error fetching order(s): {str(e)}")


def create_order(data, business_id, counter_id=None, customer_id=None):
    try:
        if not isinstance(data, dict):
            return Response(
                {'error': 'Invalid payload format. Expected a JSON object.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = dict(data)

        if business_id is not None:
            data['business_id'] = business_id
        if customer_id is not None:
            data['customer_id'] = customer_id
        if counter_id is not None:
            data['counter_id'] = counter_id

        required_fields = ['business_id', 'customer_id', 'total_amount']
        missing_fields = [
            f for f in required_fields if data.get(f) in (None, '')]
        if missing_fields:
            return Response(
                {'error': f'Missing required fields: {missing_fields}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        numeric_fields = ['tax', 'discount', 'total_amount']
        for field in numeric_fields:
            try:
                data[field] = float(data.get(field, 0))
            except (ValueError, TypeError):
                return Response(
                    {'error': f'Invalid value for {field}. Must be a number.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        business_id = data['business_id']
        customer_id = data['customer_id']
        counter_id = data.get('counter_id')

        if not Business.objects.filter(id=business_id).exists():
            return Response({'error': 'Business does not exist.'}, status=status.HTTP_404_NOT_FOUND)

        if counter_id and not Counter.objects.filter(id=counter_id, business_id=business_id).exists():
            return Response(
                {'error': 'Counter does not exist for this business.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not Customer.objects.filter(id=customer_id, business_id=business_id).exists():
            return Response(
                {'error': 'Customer does not exist for this business.'},
                status=status.HTTP_404_NOT_FOUND
            )

        items_data = data.pop('items', []) or []

        # If nested items are not sent, fallback to existing cart items.
        cart_items = []
        if not items_data:
            cart_items = list(
                OrderCart.objects.filter(
                    business_id=business_id, customer=customer_id)
                .select_related('product')
            )
            if not cart_items:
                return Response(
                    {'error': 'No order items provided and cart is empty.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        product_ids = list({
            item.get('product_id') for item in items_data if item.get('product_id')
        })
        product_map = {
            p.id: p for p in Product.objects.filter(id__in=product_ids)
        } if product_ids else {}

        status_ids = list({
            item.get('status_id') for item in items_data if item.get('status_id')
        })
        item_status_map = {
            s.id: s for s in OrderItemStatus.objects.filter(id__in=status_ids)
        } if status_ids else {}

        pending_item_status = OrderItemStatus.objects.filter(
            name__iexact='Pending').first()

        order_item_objects = []
        if items_data:
            for idx, item in enumerate(items_data):
                item_missing = [
                    f for f in ['product_id', 'quantity']
                    if item.get(f) in (None, '')
                ]
                if item_missing:
                    return Response(
                        {'error': f'Item #{idx + 1} missing fields: {item_missing}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                product_obj = product_map.get(item['product_id'])
                if not product_obj:
                    return Response(
                        {'error': 'Product not found.',
                            'item_id': item['product_id']},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                try:
                    quantity = int(item['quantity'])
                    if quantity <= 0:
                        raise ValueError()
                except (TypeError, ValueError):
                    return Response(
                        {'error': f'Invalid quantity for item #{idx + 1}. Must be a positive integer.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                item_status_id = item.get('status_id')
                if item_status_id and item_status_id not in item_status_map:
                    return Response(
                        {'error': f'Invalid status_id for item #{idx + 1}.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                unit_price = float(product_obj.unit_price)
                order_item_objects.append(
                    OrderItem(
                        product_id=product_obj,
                        quantity=quantity,
                        unit_price=unit_price,
                        total_price=unit_price * quantity,
                        status=item_status_map.get(
                            item_status_id) or pending_item_status,
                    )
                )
        else:
            for cart_item in cart_items:
                unit_price = float(cart_item.unit_price)
                quantity = int(cart_item.quantity)
                order_item_objects.append(
                    OrderItem(
                        product_id=cart_item.product,
                        quantity=quantity,
                        unit_price=unit_price,
                        total_price=unit_price * quantity,
                        status=pending_item_status,
                    )
                )

        with transaction.atomic():
            pending_order_status, _ = OrderStatus.objects.get_or_create(
                name='Pending')

            order_obj = Order.objects.create(
                customer_id_id=customer_id,
                business_id_id=business_id,
                counter_id=counter_id,
                order_status=pending_order_status,
                tax=data.get('tax', 0),
                discount=data.get('discount', 0),
                total_amount=data['total_amount'],
            )

            for obj in order_item_objects:
                obj.order = order_obj

            created_items = OrderItem.objects.bulk_create(
                order_item_objects) if order_item_objects else []

            OrderCart.objects.filter(
                business_id=business_id, customer=str(customer_id)).delete()

        response_data = OrderSerializer(order_obj).data

        return Response({
            'message': 'Order created successfully.',
            'order': response_data,
            'counter_id': order_obj.counter_id,
            'items_created': len(created_items),
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {'error': f'C0INSERR: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
