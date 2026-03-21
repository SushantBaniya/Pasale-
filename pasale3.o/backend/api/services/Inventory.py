from api.models import Inventory

def get_inventory(business_id):
    """Get inventory for a business"""
    return Inventory.objects.filter(business_id=business_id)

def update_inventory(business_id, item_name, quantity):
    """Update inventory for a business"""
    inventory_item, created = Inventory.objects.get_or_create(
        business_id=business_id,
        item_name=item_name,
        defaults={'quantity': quantity}
    )
    if not created:
        inventory_item.quantity = quantity
        inventory_item.save()
    return inventory_item