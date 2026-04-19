from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import OrderCartSerializer
from api.models import Customer, Product
from .models import OrderCart



# Create your views here.
class OrderCartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, business_id=None, customer_id=None):
        try:
            if not business_id:
                return Response({"error": "Business ID is required in the url"}, status=status.HTTP_400_BAD_REQUEST)
            if not customer_id:
                return Response({"error": "Customer ID is required in the url"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if the customer exists
            if not Customer.objects.filter(id=customer_id).exists():
                return Response({"error": "Customer does not exist"}, status=status.HTTP_404_NOT_FOUND)

            order_carts = OrderCart.objects.filter(business_id=business_id, customer_id=customer_id)
            serializer = OrderCartSerializer(order_carts, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    def post(self, request, business_id=None, customer_id=None):
        try:
            data = request.data
            if not business_id:
                return Response({"error": "Business ID is required in the url"}, status=status.HTTP_400_BAD_REQUEST)
            if not customer_id:
                return Response({"error": "Customer ID is required in the url"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if the customer exists
            if not Customer.objects.filter(id=customer_id).exists():
                return Response({"error": "Customer does not exist"}, status=status.HTTP_404_NOT_FOUND)

            if not isinstance(data, list):
                return Response({"error": "Invalid data format. Expected a list of items."}, status=status.HTTP_400_BAD_REQUEST)
            
            required_fields = ['unit_price', 'quantity', 'Product_id']

            for item in data:
                for field in required_fields:
                    if field not in item:
                        return Response({"error": f"{field} is required for each item."}, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if the product exists
                if not Product.objects.filter(id=item['Product_id']).exists():
                    return Response({"error": f"Product with ID {item['Product_id']} does not exist."}, status=status.HTTP_404_NOT_FOUND)
                
                item['business_id'] = business_id
                item['customer'] = customer_id
                item['total_amount'] = float(item['unit_price']) * float(item['quantity'])

            serializer = OrderCartSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response({"message": "Items added to cart successfully", "data": serializer.data}, status=status.HTTP_201_CREATED)
            else:
                return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    def update(self, request, business_id=None, customer_id=None, cart_id=None):
        try:
            if not business_id:
                return Response({"error": "Business ID is required in the url"}, status=status.HTTP_400_BAD_REQUEST)
            if not customer_id:
                return Response({"error": "Customer ID is required in the url"}, status=status.HTTP_400_BAD_REQUEST)
            if not cart_id:
                return Response({"error": "Cart ID is required in the url"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if the customer exists
            if not Customer.objects.filter(id=customer_id).exists():
                return Response({"error": "Customer does not exist"}, status=status.HTTP_404_NOT_FOUND)

            order_cart = OrderCart.objects.filter(id=cart_id, business_id=business_id, customer_id=customer_id).first()
            if not order_cart:
                return Response({"error": "Order cart item not found"}, status=status.HTTP_404_NOT_FOUND)

            serializer = OrderCartSerializer(order_cart, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"message": "Order cart item updated successfully", "data": serializer.data}, status=status.HTTP_200_OK)
            else:
                return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    def delete(self, request, business_id=None, customer_id=None, cart_id=None):
        try:
            if not business_id:
                return Response({"error": "Business ID is required in the url"}, status=status.HTTP_400_BAD_REQUEST)
            if not customer_id:
                return Response({"error": "Customer ID is required in the url"}, status=status.HTTP_400_BAD_REQUEST)
            if not cart_id:
                return Response({"error": "Cart ID is required in the url"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if the customer exists
            if not Customer.objects.filter(id=customer_id).exists():
                return Response({"error": "Customer does not exist"}, status=status.HTTP_404_NOT_FOUND)

            order_cart = OrderCart.objects.filter(id=cart_id, business_id=business_id, customer_id=customer_id).first()
            if not order_cart:
                return Response({"error": "Order cart item not found"}, status=status.HTTP_404_NOT_FOUND)

            order_cart.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)