from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0019_product_is_low_stock_product_reorder_level_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="counter",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="orders",
                to="api.counter",
            ),
        ),
    ]
