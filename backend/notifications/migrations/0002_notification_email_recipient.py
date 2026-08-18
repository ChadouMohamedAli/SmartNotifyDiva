from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='NotificationEmailRecipient',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(max_length=254)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notification_recipients', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Notification Email Recipient',
                'verbose_name_plural': 'Notification Email Recipients',
                'ordering': ['email'],
                'unique_together': {('user', 'email')},
            },
        ),
    ]
