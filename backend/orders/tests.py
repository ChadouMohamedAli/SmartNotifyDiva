from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Order


User = get_user_model()


class OrderConfirmationPermissionsTests(APITestCase):
    def test_responsable_appro_can_confirm_pending_order(self):
        appro_user = User.objects.create_user(
            username="appro",
            email="appro@example.com",
            password="testpass123",
            role="responsable_appro",
        )
        customer = User.objects.create_user(
            username="employee",
            email="employee@example.com",
            password="testpass123",
            role="employe",
        )
        order = Order.objects.create(
            customer=customer,
            status="pending",
            total_amount=Decimal("150.00"),
        )

        self.client.force_authenticate(user=appro_user)
        response = self.client.post(f"/api/orders/orders/{order.id}/confirm/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, "confirmed")
        self.assertIsNotNone(order.confirmed_at)
