# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('activity', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='activitylog',
            name='action_type',
            field=models.CharField(
                max_length=50,
                choices=[
                    ('product_created', 'Product created'),
                    ('user_created', 'User created'),
                    ('category_created', 'Category created'),
                    ('alert_created', 'Alert created'),
                ]
            ),
        ),
    ]
