from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0020_order_counter"),
    ]

    operations = [
        migrations.AddField(
            model_name="billing",
            name="business_id",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.CASCADE,
                related_name="billings",
                to="api.business",
            ),
        ),
        migrations.AddField(
            model_name="billing",
            name="order",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="billing",
                to="api.order",
            ),
        ),
    ]
