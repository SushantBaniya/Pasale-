from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import timedelta
from api.models import Order, Expense, Product, OrderItem, Business
from api.serializers import OrderSerializer

class BusinessSummaryView(APIView):
    def get(self, request, business_id=None):
        if not business_id:
            return Response({"error": "Business ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Get date range from query params
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        try:
            # Sales Summary
            orders = Order.objects.filter(business_id=business_id)
            if start_date_str:
                orders = orders.filter(created_at__date__gte=start_date_str)
            if end_date_str:
                orders = orders.filter(created_at__date__lte=end_date_str)

            total_sales = orders.aggregate(total=Sum('total_amount'))['total'] or 0
            order_count = orders.count()

            # Expenses Summary
            # Note: Expense model has 'user' not 'business_id' in current models.py
            # But the Business model belongs to the User.
            # We filter expenses by the user who owns the business.
            business = Business.objects.get(id=business_id)
            expenses = Expense.objects.filter(user=business.user)
            if start_date_str:
                expenses = expenses.filter(date__gte=start_date_str)
            if end_date_str:
                expenses = expenses.filter(date__lte=end_date_str)

            total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or 0

            # Inventory Summary
            products = Product.objects.filter(business_id=business_id)
            total_stock_value = sum((p.unit_price * p.quantity) for p in products)
            low_stock_count = products.filter(is_low_stock=True).count()

            # Top Selling Products
            top_products = OrderItem.objects.filter(order__business_id=business_id) \
                .values('product_id__product_name') \
                .annotate(total_qty=Sum('quantity'), total_revenue=Sum('total_price')) \
                .order_by('-total_qty')[:5]

            # Sales by Category
            sales_by_category = OrderItem.objects.filter(order__business_id=business_id) \
                .values('product_id__category__name') \
                .annotate(value=Sum('total_price')) \
                .order_by('-value')

            # Top Customers
            top_customers = Order.objects.filter(business_id=business_id, customer_id__isnull=False) \
                .values('customer_id__name') \
                .annotate(total_spent=Sum('total_amount'), order_count=Count('id')) \
                .order_by('-total_spent')[:5]

            # Daily Trends (last 30 days)
            thirty_days_ago = timezone.now().date() - timedelta(days=30)
            daily_sales = orders.filter(created_at__date__gte=thirty_days_ago) \
                .annotate(date=TruncDate('created_at')) \
                .values('date') \
                .annotate(sales=Sum('total_amount')) \
                .order_by('date')

            daily_expenses = expenses.filter(date__gte=thirty_days_ago) \
                .values('date') \
                .annotate(expenses=Sum('amount')) \
                .order_by('date')

            return Response({
                "summary": {
                    "total_sales": float(total_sales or 0),
                    "order_count": order_count,
                    "total_expenses": float(total_expenses or 0),
                    "net_profit": float(total_sales or 0) - float(total_expenses or 0),
                    "total_stock_value": float(total_stock_value or 0),
                    "low_stock_count": low_stock_count,
                },
                "trends": {
                    "daily_sales": [
                        {"date": str(item['date']), "sales": float(item['sales'] or 0)} 
                        for item in daily_sales
                    ],
                    "daily_expenses": [
                        {"date": str(item['date']), "expenses": float(item['expenses'] or 0)} 
                        for item in daily_expenses
                    ],
                },
                "top_products": [
                    {
                        "name": item['product_id__product_name'], 
                        "quantity": item['total_qty'], 
                        "revenue": float(item['total_revenue'] or 0)
                    } for item in top_products
                ],
                "category_distribution": [
                    {
                        "name": item['product_id__category__name'] or "Uncategorized", 
                        "value": float(item['value'] or 0)
                    } for item in sales_by_category
                ],
                "top_customers": [
                    {
                        "name": item['customer_id__name'],
                        "spent": float(item['total_spent'] or 0),
                        "orders": item['order_count']
                    } for item in top_customers
                ]
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
