from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("stock", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="RawMaterial",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=150, unique=True)),
                (
                    "unit",
                    models.CharField(
                        choices=[("kg", "Kg"), ("l", "Litre"), ("piece", "Pièce")],
                        default="kg",
                        max_length=20,
                    ),
                ),
                ("available_stock", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("reorder_level", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="ProductionOrder",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=30, unique=True)),
                ("planned_quantity", models.PositiveIntegerField(default=1)),
                ("produced_quantity", models.PositiveIntegerField(default=0)),
                (
                    "status",
                    models.CharField(
                        choices=[("in_progress", "En cours"), ("completed", "Terminé"), ("delayed", "Retard")],
                        default="in_progress",
                        max_length=20,
                    ),
                ),
                ("start_date", models.DateField()),
                ("due_date", models.DateField()),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("issue_description", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_production_orders",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="production_orders",
                        to="stock.product",
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="ProductionAlert",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("alert_type", models.CharField(choices=[("delay", "Retard"), ("issue", "Problème")], max_length=20)),
                (
                    "severity",
                    models.CharField(
                        choices=[("high", "Haute"), ("medium", "Moyenne"), ("low", "Basse")],
                        default="medium",
                        max_length=20,
                    ),
                ),
                ("message", models.TextField()),
                ("is_resolved", models.BooleanField(default=False)),
                ("resolved_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "order",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="alerts",
                        to="production.productionorder",
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="ProductionOrderMaterial",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("planned_quantity", models.DecimalField(decimal_places=2, max_digits=12)),
                ("consumed_quantity", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                (
                    "material",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="order_usages",
                        to="production.rawmaterial",
                    ),
                ),
                (
                    "order",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="materials",
                        to="production.productionorder",
                    ),
                ),
            ],
            options={"ordering": ["id"], "unique_together": {("order", "material")}},
        ),
    ]
