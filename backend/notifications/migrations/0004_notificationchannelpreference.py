from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0003_alter_notification_message_alter_notification_title'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='NotificationChannelPreference',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email_enabled', models.BooleanField(default=True)),
                ('in_app_enabled', models.BooleanField(default=True)),
                ('telegram_enabled', models.BooleanField(default=False)),
                ('schedule', models.CharField(choices=[('immediate', 'Temps reel'), ('hourly', 'Toutes les heures'), ('daily', 'Quotidien'), ('weekly', 'Hebdomadaire'), ('monthly', 'Mensuel')], default='immediate', max_length=20)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='notification_channel_preferences', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Notification Channel Preference',
                'verbose_name_plural': 'Notification Channel Preferences',
            },
        ),
    ]
