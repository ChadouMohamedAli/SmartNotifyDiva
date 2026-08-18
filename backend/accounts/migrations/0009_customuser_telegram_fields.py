from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_remove_module_field'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='telegram_chat_id',
            field=models.CharField(blank=True, max_length=32, null=True, verbose_name='telegram chat id'),
        ),
        migrations.AddField(
            model_name='customuser',
            name='telegram_user_id',
            field=models.CharField(blank=True, max_length=32, null=True, unique=True, verbose_name='telegram user id'),
        ),
        migrations.AddField(
            model_name='customuser',
            name='telegram_username',
            field=models.CharField(blank=True, max_length=150, null=True, verbose_name='telegram username'),
        ),
    ]
