from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stock_movements', '0003_stockexit_order'),
    ]

    operations = [
        migrations.AddField(
            model_name='stockmovement',
            name='recipient_name',
            field=models.CharField(blank=True, max_length=200),
        ),
    ]