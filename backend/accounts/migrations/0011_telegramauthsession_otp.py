from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0010_telegramauthsession'),
    ]

    operations = [
        migrations.AddField(
            model_name='telegramauthsession',
            name='otp',
            field=models.CharField(blank=True, max_length=6, null=True),
        ),
    ]
