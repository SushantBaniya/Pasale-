from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, F, Q
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from api.models import Order, Expense, Product, OrderItem, Business, Party, Billing, BillingItem
from api.serializers import OrderSerializer

class BusinessSummaryView(APIView):
    def get(self, request, business_id=None):
        if not business_id:
            return Response({"error": "Business ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Get date range from query params
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        try:
            business = Business.objects.get(id=business_id)
            now = timezone.now()
            current_month = now.month
            current_year = now.year

            # ── Party Balances (To Receive / To Give) ──
            parties = Party.objects.filter(business_id=business_id)
            
            # To Receive = sum of open_balance for customers with positive balance
            to_receive = parties.filter(
                Category_type='Customer', open_balance__gt=0
            ).aggregate(total=Sum('open_balance'))['total'] or Decimal('0.00')
            
            # To Give = sum of open_balance for suppliers with positive balance
            to_give = parties.filter(
                Category_type='Supplier', open_balance__gt=0
            ).aggregate(total=Sum('open_balance'))['total'] or Decimal('0.00')

            # ── Billing-based Sales & Purchase (current month) ──
            billings = Billing.objects.filter(business_id=business_id)
            
            monthly_sales = billings.filter(
                transaction_type='Sales',
                invoice_date__month=current_month,
                invoice_date__year=current_year
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            
            monthly_purchase = billings.filter(
                transaction_type='Purchase',
                invoice_date__month=current_month,
                invoice_date__year=current_year
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')

            # ── Inventory Value ──
            products = Product.objects.filter(business_id=business_id)
            inventory_value = sum(
                (p.unit_price * p.quantity) for p in products
            )

            # ── Cashflow Trends (last 7 days) ──
            seven_days_ago = now.date() - timedelta(days=6)
            
            daily_sales_billing = billings.filter(
                transaction_type='Sales',
                invoice_date__gte=seven_days_ago
            ).annotate(
                day=TruncDate('invoice_date')
            ).values('day').annotate(
                total=Sum('total_amount')
            ).order_by('day')
            
            daily_purchase_billing = billings.filter(
                transaction_type='Purchase',
                invoice_date__gte=seven_days_ago
            ).annotate(
                day=TruncDate('invoice_date')
            ).values('day').annotate(
                total=Sum('total_amount')
            ).order_by('day')

            # Build 7-day cashflow data
            sales_by_day = {str(item['day']): float(item['total'] or 0) for item in daily_sales_billing}
            purchase_by_day = {str(item['day']): float(item['total'] or 0) for item in daily_purchase_billing}
            
            cashflow_daily = []
            for i in range(7):
                day = seven_days_ago + timedelta(days=i)
                day_str = str(day)
                cashflow_daily.append({
                    'date': day_str,
                    'label': day.strftime('%b %d'),
                    'inflow': sales_by_day.get(day_str, 0),
                    'outflow': purchase_by_day.get(day_str, 0),
                })

            # ── Weekly cashflow (last 4 weeks) ──
            four_weeks_ago = now.date() - timedelta(weeks=4)
            cashflow_weekly = []
            for i in range(4):
                week_start = four_weeks_ago + timedelta(weeks=i)
                week_end = week_start + timedelta(days=6)
                week_sales = billings.filter(
                    transaction_type='Sales',
                    invoice_date__gte=week_start,
                    invoice_date__lte=week_end
                ).aggregate(total=Sum('total_amount'))['total'] or 0
                week_purchases = billings.filter(
                    transaction_type='Purchase',
                    invoice_date__gte=week_start,
                    invoice_date__lte=week_end
                ).aggregate(total=Sum('total_amount'))['total'] or 0
                cashflow_weekly.append({
                    'label': f'Week {i+1}',
                    'inflow': float(week_sales),
                    'outflow': float(week_purchases),
                })

            # ── Monthly cashflow (last 6 months) ──
            cashflow_monthly = []
            for i in range(6):
                month_offset = 5 - i
                m = now.month - month_offset
                y = now.year
                while m <= 0:
                    m += 12
                    y -= 1
                month_sales = billings.filter(
                    transaction_type='Sales',
                    invoice_date__month=m,
                    invoice_date__year=y
                ).aggregate(total=Sum('total_amount'))['total'] or 0
                month_purchases = billings.filter(
                    transaction_type='Purchase',
                    invoice_date__month=m,
                    invoice_date__year=y
                ).aggregate(total=Sum('total_amount'))['total'] or 0
                import calendar
                month_name = calendar.month_abbr[m]
                cashflow_monthly.append({
                    'label': month_name,
                    'inflow': float(month_sales),
                    'outflow': float(month_purchases),
                })

            # ── Sales Summary from Orders (legacy) ──
            orders = Order.objects.filter(business_id=business_id)
            if start_date_str:
                orders = orders.filter(created_at__date__gte=start_date_str)
            if end_date_str:
                orders = orders.filter(created_at__date__lte=end_date_str)

            total_sales = orders.aggregate(total=Sum('total_amount'))['total'] or 0
            order_count = orders.count()

            # Expenses Summary
            expenses = Expense.objects.filter(user=business.user)
            if start_date_str:
                expenses = expenses.filter(date__gte=start_date_str)
            if end_date_str:
                expenses = expenses.filter(date__lte=end_date_str)

            total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or 0

            # Low stock count
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

            # All-time billing totals
            total_billing_sales = billings.filter(
                transaction_type='Sales'
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            total_billing_purchases = billings.filter(
                transaction_type='Purchase'
            ).aggregate(total=Sum('total_amount'))['total'] or 0

            return Response({
                "dashboard": {
                    "to_receive": float(to_receive),
                    "to_give": float(to_give),
                    "monthly_sales": float(monthly_sales),
                    "monthly_purchase": float(monthly_purchase),
                    "inventory_value": float(inventory_value),
                    "total_billing_sales": float(total_billing_sales),
                    "total_billing_purchases": float(total_billing_purchases),
                    "current_month": now.strftime('%B'),
                    "current_month_short": now.strftime('%b').upper(),
                },
                "cashflow": {
                    "daily": cashflow_daily,
                    "weekly": cashflow_weekly,
                    "monthly": cashflow_monthly,
                },
                "summary": {
                    "total_sales": float(total_sales or 0),
                    "order_count": order_count,
                    "total_expenses": float(total_expenses or 0),
                    "net_profit": float(total_sales or 0) - float(total_expenses or 0),
                    "total_stock_value": float(inventory_value or 0),
                    "low_stock_count": low_stock_count,
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

        except Business.DoesNotExist:
            return Response({"error": "Business not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
