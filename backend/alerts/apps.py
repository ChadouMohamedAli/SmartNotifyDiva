from django.apps import AppConfig


class AlertsConfig(AppConfig):
    name = 'alerts'

    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        import alerts.signals 