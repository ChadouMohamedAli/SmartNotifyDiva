# orders/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from orders.models import OrderItem
from alerts.services import evaluate_stock_alerts_for_product
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=OrderItem)
def reduce_product_stock_on_order(sender, instance, created, **kwargs):
    """
    Déclenché après la création ou modification d'un article de commande.
    Le stock est déjà mis à jour dans le serializer de création de commande.
    Ici on se limite aux alertes pour éviter une double décrémentation.
    """
    order_item = instance
    product = order_item.product

    if not created:
        logger.info(f"OrderItem modifié: {product.name}")
        return

    logger.info(f"🛒 Nouvelle commande détectée: {product.name} x{order_item.quantity}")

    result = evaluate_stock_alerts_for_product(product)
    if result['triggered'] > 0:
        logger.info(f" {result['triggered']} alerte(s) déclenchée(s) suite à la commande de {product.name}")
