# yourapp/utils/apriori_utils.py

from api.models import Order, OrderItem
from mlxtend.frequent_patterns import apriori, association_rules
from mlxtend.preprocessing import TransactionEncoder
import pandas as pd


def get_transactions(business_id, days=180):
    """
    Extract basket transactions the POS orders.
    Each order becomes one transaction (basket of products).
    """
    from django.utils import timezone
    from datetime import timedelta

    since = timezone.now() - timedelta(days=days)

    # Get all completed orders for this business
    orders = Order.objects.filter(
        business_id=business_id,
        created_at__gte=since,
        order_status__name='Completed'   # adjust to your status name
    ).prefetch_related('items__product_id')

    transactions = []

    for order in orders:
        # Get product names in this order
        items = [
            item.product_id.product_name
            for item in order.items.all()
            if item.product_id is not None
        ]
        if len(items) >= 2:   # only baskets with 2+ items are useful
            transactions.append(items)

    return transactions


def run_apriori(business_id, min_support=0.2, min_confidence=0.5, min_lift=1.2):
    """
    Run Apriori algorithm on business transaction data.
    Returns association rules.
    """
    transactions = get_transactions(business_id)

    if len(transactions) < 10:
        return None, "Not enough transaction data yet (need at least 10 orders)"

    # Encode transactions into one-hot matrix
    te = TransactionEncoder()
    te_array = te.fit_transform(transactions)
    df = pd.DataFrame(te_array, columns=te.columns_)

    # Mine frequent itemsets
    frequent_itemsets = apriori(
        df,
        min_support=min_support,
        use_colnames=True
    )

    if frequent_itemsets.empty:
        return None, "No frequent patterns found. Try lowering min_support."

    # Generate association rules
    rules = association_rules(
        frequent_itemsets,
        metric="lift",
        min_threshold=min_lift
    )

    # Filter by confidence
    rules = rules[rules['confidence'] >= min_confidence]
    rules = rules.sort_values('confidence', ascending=False)

    return rules, f"{len(rules)} rules found from {len(transactions)} transactions"



from api.models import Product, StockAlert

def get_reorder_suggestions(business_id):
    """
    Check low stock products and suggest related items to reorder
    using Apriori rules. Integrates with your existing StockAlert model.
    """
    rules, message = run_apriori(business_id)

    if rules is None:
        return {"error": message}

    # Get currently low stock products using your existing model
    low_stock_products = Product.objects.filter(
        business_id=business_id,
        is_low_stock=True
    )

    suggestions = []

    for product in low_stock_products:
        product_name = product.product_name

        # Find rules where this product is in the antecedent
        matched_rules = rules[
            rules['antecedents'].apply(lambda x: product_name in x)
        ]

        related_items = []
        for _, rule in matched_rules.iterrows():
            consequents = list(rule['consequents'])
            related_items.append({
                'items': consequents,
                'confidence': round(rule['confidence'], 2),
                'lift': round(rule['lift'], 2)
            })

        if related_items:
            suggestions.append({
                'low_stock_product': product_name,
                'also_reorder': related_items
            })

    return {
        "message": message,
        "suggestions": suggestions
    }

