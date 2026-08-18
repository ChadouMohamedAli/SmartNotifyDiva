from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0011_telegramauthsession_otp'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='is_email_verified',
            field=models.BooleanField(default=False, help_text='Indique si l email a ete verifie via code OTP.', verbose_name='email verified'),
        ),
        migrations.AddField(
            model_name='customuser',
            name='two_factor_enabled',
            field=models.BooleanField(default=True, help_text='Active la verification OTP par email a la connexion.', verbose_name='two factor enabled'),
        ),
        migrations.CreateModel(
            name='EmailOTPChallenge',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('challenge_id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True)),
                ('otp_code', models.CharField(max_length=6)),
                ('purpose', models.CharField(choices=[('register', 'Inscription'), ('login', 'Connexion')], max_length=20)),
                ('expires_at', models.DateTimeField()),
                ('attempts', models.PositiveSmallIntegerField(default=0)),
                ('max_attempts', models.PositiveSmallIntegerField(default=5)),
                ('is_consumed', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='email_otp_challenges', to='accounts.customuser')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
