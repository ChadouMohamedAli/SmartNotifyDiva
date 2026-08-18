from django.core.management.base import BaseCommand
import base64
from cryptography.hazmat.primitives.asymmetric.ec import generate_private_key, SECP256R1
from cryptography.hazmat.primitives import serialization

class Command(BaseCommand):
    help = 'Generates VAPID keys for web push notifications'

    def handle(self, *args, **options):
        private_key = generate_private_key(curve=SECP256R1())
        public_key_bytes = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint
        )
        public_key_b64 = base64.urlsafe_b64encode(public_key_bytes).decode('utf8').rstrip('=')
        private_key_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf8')
        
        self.stdout.write(
            self.style.SUCCESS(f'VAPID_PUBLIC_KEY={public_key_b64}')
        )
        self.stdout.write(
            self.style.SUCCESS(f'VAPID_PRIVATE_KEY={private_key_pem}')
        )

