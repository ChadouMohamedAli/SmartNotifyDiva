from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Sum
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils.html import escape
from datetime import timedelta
from django.http import HttpResponse  # AJOUTER CET IMPORT

from .models import Order, OrderItem
from notifications.models import Notification
from facturation.models import Invoice, InvoiceItem
from production.models import ProductionOrder
from .serializers import (
    OrderDetailSerializer,
    OrderListSerializer,
    OrderCreateSerializer,
    OrderItemSerializer,
)
from .pdf_generator import OrderPDFGenerator  # AJOUTER CET IMPORT


User = get_user_model()


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les commandes"""
    
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['customer__username', 'customer__email', 'shipping_address']
    ordering_fields = ['created_at', 'status', 'total_amount']
    ordering = ['-created_at']

    def _can_manage_orders(self, user):
        role = getattr(user, 'role', None)
        return (
            user.is_superuser
            or user.is_staff
            or role in ['responsable_stock', 'responsable_appro']
        )
    
    def get_queryset(self):
        """Retourne les commandes selon le rôle de l'utilisateur"""
        user = self.request.user

        if user.is_superuser:
            # Le superadmin voit tout
            return Order.objects.select_related('customer').prefetch_related('items', 'items__product').all()

        if hasattr(user, 'role') and user.role == 'responsable_appro':
            # L'admin appro voit uniquement les commandes confirmées
            return Order.objects.select_related('customer').prefetch_related(
                'items', 'items__product'
            ).all()

        if user.is_staff:
            # Les autres membres du staff (non superadmin, non appro_admin) voient tout pour le moment
            # TODO: Affiner cette logique si d'autres rôles staff sont ajoutés
            return Order.objects.select_related('customer').prefetch_related('items', 'items__product').all()

        # Les utilisateurs normaux voient uniquement leurs propres commandes
        return Order.objects.select_related('customer').prefetch_related(
            'items', 'items__product'
        ).filter(customer=user)
    
    def get_serializer_class(self):
        """Utilise le bon sérialiseur selon l'action"""
        if self.action == 'list':
            # Use OrderDetailSerializer to include items in list view
            return OrderDetailSerializer
        elif self.action == 'create':
            return OrderCreateSerializer
        return OrderDetailSerializer
    
    def create(self, request, *args, **kwargs):
        """Crée une nouvelle commande"""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        # Notifier le client et les administrateurs qu'une commande a ete creee.
        self._create_order_created_notifications(order)
        
        # Retourner la commande créée avec le sérialiseur détaillé
        return Response(
            OrderDetailSerializer(order).data,
            status=status.HTTP_201_CREATED
        )

    def _create_order_created_notifications(self, order):
        """Crée des notifications (in-app + email) lors de la création d'une commande."""
        customer_name = order.customer.get_full_name().strip() or order.customer.username
        order_total = f"{order.total_amount:.2f}"

        # Destinataires: client + utilisateurs qui gèrent les commandes (sans doublons).
        admin_users = User.objects.filter(
            Q(is_staff=True)
            | Q(is_superuser=True)
            | Q(role__in=['responsable_stock', 'responsable_appro'])
        )
        recipients = {order.customer.id: order.customer}
        recipients.update({user.id: user for user in admin_users})

        for user in recipients.values():
            if user.id == order.customer.id:
                title = "Commande créée avec succès"
                message = (
                    f"Votre commande #{order.id} a été créée avec succès. "
                    f"Montant total: {order_total}."
                )
            else:
                title = "Nouvelle commande créée"
                message = (
                    f"Une nouvelle commande #{order.id} a été créée par {customer_name}. "
                    f"Montant total: {order_total}."
                )

            self._create_and_send_notification(
                user=user,
                title=title,
                message=message,
            )

    def _create_and_send_notification(self, user, title, message, send_email=True):
        """Crée une notification et tente l'envoi email (sans casser le flow API)."""
        notification = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type='system',
        )

        # L'envoi email ne doit pas bloquer la réponse API en cas d'échec SMTP.
        if send_email:
            try:
                notification.send_email_notification()
            except Exception:
                pass

        # Telegram en miroir si l'utilisateur a un chat_id
        try:
            notification.send_telegram_notification()
        except Exception:
            pass
    
    def _build_order_lines_plain(self, order):
        lines = []
        for item in order.items.select_related('product').all():
            product = item.product
            unit = getattr(product, 'unit', None) or getattr(product, 'unite', None) or getattr(product, 'measurement_unit', None) or "U"
            nomenclature = getattr(product, 'sku', None) or getattr(product, 'nomenclature', None) or f"PROD-{product.id}"
            lines.append(
                f"- {nomenclature} | {product.name} | {unit} | Qté: {item.quantity} | Prix: {item.unit_price}"
            )
        return "\n".join(lines)

    def _build_order_lines_html(self, order):
        rows = []
        for item in order.items.select_related('product').all():
            product = item.product
            unit = getattr(product, 'unit', None) or getattr(product, 'unite', None) or getattr(product, 'measurement_unit', None) or "U"
            nomenclature = getattr(product, 'sku', None) or getattr(product, 'nomenclature', None) or f"PROD-{product.id}"
            rows.append(
                f"""
                <tr>
                    <td style="padding:10px;border:1px solid #e5e7eb;">{escape(str(nomenclature))}</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;">{escape(str(product.name))}</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;text-align:center;">{escape(str(unit))}</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;text-align:center;">{item.quantity}</td>
                    <td style="padding:10px;border:1px solid #e5e7eb;text-align:right;">{item.unit_price}</td>
                </tr>
                """
            )
        return "".join(rows)

    def _send_order_confirmed_email(self, order, recipient, actor):
        if not recipient.email:
            return

        actor_name = actor.get_full_name().strip() or actor.username
        recipient_name = recipient.get_full_name().strip() or recipient.username
        order_lines_plain = self._build_order_lines_plain(order)
        order_lines_html = self._build_order_lines_html(order)
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

        subject = f"Commande #{order.id} confirmée par {actor_name}"
        plain_message = f"""Bonjour {recipient_name},

Votre bon de commande #{order.id} a été confirmé par {actor_name}.

Détails de la commande :
Nomenclature | Désignation | Unité | Qté demandée | Prix unitaire
{order_lines_plain}

Adresse de livraison : {order.shipping_address or "-"}

Vous pouvez consulter votre commande ici :
{frontend_url}/orders

Cordialement,
L'équipe SmartNotify
"""

        html_message = f"""
        <div style="font-family:Arial,sans-serif;max-width:760px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:14px;background:#ffffff;">
            <h2 style="margin:0 0 16px;color:#2563eb;">Commande confirmée par {escape(actor_name)}</h2>
            <p style="font-size:15px;color:#111827;">Bonjour <strong>{escape(recipient_name)}</strong>,</p>
            <p style="font-size:15px;color:#374151;">
                Votre bon de commande <strong>#{order.id}</strong> a été confirmé par <strong>{escape(actor_name)}</strong>.
            </p>
            <div style="margin-top:20px;">
                <h3 style="margin:0 0 12px;color:#111827;">Détails de la commande</h3>
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                    <thead>
                        <tr style="background:#eff6ff;color:#1d4ed8;">
                            <th style="padding:10px;border:1px solid #dbeafe;text-align:left;">Nomenclature</th>
                            <th style="padding:10px;border:1px solid #dbeafe;text-align:left;">Désignation</th>
                            <th style="padding:10px;border:1px solid #dbeafe;text-align:center;">Unité</th>
                            <th style="padding:10px;border:1px solid #dbeafe;text-align:center;">Qté demandée</th>
                            <th style="padding:10px;border:1px solid #dbeafe;text-align:right;">Prix unitaire</th>
                        </tr>
                    </thead>
                    <tbody>{order_lines_html}</tbody>
                </table>
            </div>
            <p style="margin-top:18px;color:#374151;">
                <strong>Adresse de livraison :</strong> {escape(order.shipping_address or "-")}
            </p>
            <p style="margin-top:24px;">
                <a href="{frontend_url}/orders" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">
                    Voir la commande
                </a>
            </p>
            <p style="margin-top:24px;color:#6b7280;font-size:12px;">Cordialement,<br>L'équipe SmartNotify</p>
        </div>
        """

        email = EmailMultiAlternatives(
            subject=subject,
            body=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient.email],
        )
        email.attach_alternative(html_message, "text/html")
        email.send(fail_silently=True)

    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """Retourne les commandes de l'utilisateur connecté avec leurs articles"""
        queryset = Order.objects.filter(customer=request.user).select_related('customer').prefetch_related('items', 'items__product')
        serializer = OrderDetailSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Retourne les commandes en attente"""
        queryset = self.get_queryset().filter(status='pending')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """Filtrer par statut"""
        status_param = request.query_params.get('status')
        
        if not status_param:
            return Response(
                {'error': 'Le paramètre "status" est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        valid_statuses = [choice[0] for choice in Order.STATUS_CHOICES]
        if status_param not in valid_statuses:
            return Response(
                {'error': f'Statut invalide. Utilisez: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(status=status_param)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Retourne les statistiques des commandes"""
        queryset = self.get_queryset()
        
        stats = {
            'total_orders': queryset.count(),
            'pending': queryset.filter(status='pending').count(),
            'confirmed': queryset.filter(status='confirmed').count(),
            'preparing': queryset.filter(status='preparing').count(),
            'shipped': queryset.filter(status='shipped').count(),
            'delivered': queryset.filter(status='delivered').count(),
            'returned': queryset.filter(status='returned').count(),
            'cancelled': queryset.filter(status='cancelled').count(),
            'total_value': sum(order.total_amount for order in queryset),
            'average_value': queryset.filter(total_amount__gt=0).values('total_amount').count(),
        }
        
        if stats['average_value'] > 0:
            stats['average_value'] = stats['total_value'] / stats['average_value']
        
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirmé une commande"""
        order = self.get_object()
        
        # Vérifier les permissions
        if not (request.user == order.customer or self._can_manage_orders(request.user)):
            return Response(
                {'error': 'Vous n\'avez pas la permission d\'effectuer cette action'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if order.status != 'pending':
            return Response(
                {'error': 'Seules les commandes en attente peuvent être confirmées'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'confirmed'
        order.confirmed_at = timezone.now()
        order.save()

        # Notifications (in-app + email) lors de la confirmation admin.
        self._notify_order_confirmed(order, request.user)
        
        return Response(OrderDetailSerializer(order).data)

    def _notify_order_confirmed(self, order, actor):
        """Notifier client et admins qu'une commande est confirmée."""
        customer_name = order.customer.get_full_name().strip() or order.customer.username

        # Client
        self._create_and_send_notification(
            user=order.customer,
            title="Commande confirmee",
            message=(
                f"Votre commande #{order.id} a ete confirmee par l'administration. "
                "Nous preparons votre expedition."
            ),
            send_email=False,
        )
        self._send_order_confirmed_email(order, order.customer, actor)

        # Gestionnaires de commandes (hors acteur pour eviter le doublon de notification sur soi)
        admin_users = User.objects.filter(
            Q(is_staff=True)
            | Q(is_superuser=True)
            | Q(role__in=['responsable_stock', 'responsable_appro'])
        ).exclude(id=actor.id)
        for admin_user in admin_users:
            self._create_and_send_notification(
                user=admin_user,
                title="Commande confirmée par un administrateur",
                message=(
                    f"La commande #{order.id} de {customer_name} a ete confirmee par "
                    f"{actor.get_full_name().strip() or actor.username}."
                ),
            )
    
    @action(detail=True, methods=['post'])
    def prepare(self, request, pk=None):
        """Passe une commande en préparation"""
        order = self.get_object()
        
        # Seuls les admins peuvent passer en préparation
        if not self._can_manage_orders(request.user):
            return Response(
                {'error': 'Seuls les administrateurs peuvent effectuer cette action'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if order.status not in ['pending', 'confirmed']:
            return Response(
                {'error': 'Cette commande ne peut pas être mise en préparation'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'preparing'
        order.save()
        
        return Response(OrderDetailSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def ship(self, request, pk=None):
        """Marque une commande comme expédiée"""
        order = self.get_object()
        
        # Seuls les admins
        if not self._can_manage_orders(request.user):
            return Response(
                {'error': 'Seuls les administrateurs peuvent effectuer cette action'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if order.status != 'preparing':
            return Response(
                {'error': 'Cette commande ne peut pas être expédiée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'shipped'
        order.shipped_at = timezone.now()
        order.save()
        
        return Response(OrderDetailSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def deliver(self, request, pk=None):
        """Marque une commande comme livrée"""
        order = self.get_object()
        
        if order.status != 'shipped':
            return Response(
                {'error': 'Cette commande ne peut pas être marquée comme livrée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'delivered'
        order.delivered_at = timezone.now()
        order.save()
        
        return Response(OrderDetailSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Annule une commande"""
        order = self.get_object()
        
        # Vérifier les permissions
        if not (request.user == order.customer or request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Vous n\'avez pas la permission d\'effectuer cette action'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Ne peut annuler que les commandes non encore expédiées
        if order.status in ['shipped', 'delivered', 'returned']:
            return Response(
                {'error': 'Cette commande ne peut pas être annulée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'cancelled'
        order.save()
        
        return Response(OrderDetailSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def return_order(self, request, pk=None):
        """Marque une commande comme retournée"""
        order = self.get_object()
        
        if order.status != 'delivered':
            return Response(
                {'error': 'Seules les commandes livrées peuvent être retournées'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'returned'
        order.save()
        
        return Response(OrderDetailSerializer(order).data)

    @action(detail=True, methods=['post'])
    def generate_invoice(self, request, pk=None):
        """Génère une facture de vente à partir d'une commande.

        Règles métier:
        - Si la commande contient des produits fabriqués (liés à la production),
          la facture n'est générable qu'après production terminée.
        """
        order = self.get_object()
        user = request.user

        can_generate = self._can_manage_orders(user) or getattr(user, 'role', None) == 'responsable_facturation'
        if not can_generate:
            return Response(
                {'error': 'Vous n\'avez pas la permission de générer une facture'},
                status=status.HTTP_403_FORBIDDEN
            )

        if Invoice.objects.filter(order=order).exists():
            return Response(
                {'error': 'Une facture existe déjà pour cette commande'},
                status=status.HTTP_400_BAD_REQUEST
            )

        blocked_products = []
        for item in order.items.select_related('product').all():
            product = item.product

            is_manufactured = product.production_orders.exists() or hasattr(product, 'finished_product_info')
            if not is_manufactured:
                continue

            produced_qty = (
                ProductionOrder.objects.filter(
                    product=product,
                    status=ProductionOrder.STATUS_COMPLETED,
                ).aggregate(total=Sum('produced_quantity'))['total']
                or 0
            )

            if produced_qty < item.quantity:
                blocked_products.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'required_quantity': item.quantity,
                    'produced_quantity': int(produced_qty),
                })

        if blocked_products:
            return Response(
                {
                    'error': 'Production non terminée pour certains produits fabriqués',
                    'blocked_products': blocked_products,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        invoice_number = f"INV-ORD-{order.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        invoice_date = timezone.now().date()
        due_date = invoice_date + timedelta(days=30)

        customer_name = order.customer.get_full_name().strip() or order.customer.username

        invoice = Invoice.objects.create(
            invoice_number=invoice_number,
            purchase_order_number=f"ORD-{order.id}",
            order=order,
            invoice_type='sales',
            customer_name=customer_name,
            customer_email=order.customer.email,
            customer_address=order.shipping_address,
            invoice_date=invoice_date,
            due_date=due_date,
            subtotal=order.total_amount,
            tax_rate=20,
            discount=0,
            status='draft',
            notes=order.notes or '',
            created_by=user,
        )

        for item in order.items.select_related('product').all():
            InvoiceItem.objects.create(
                invoice=invoice,
                product=item.product,
                description=f"{item.product.name} (Commande #{order.id})",
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item.subtotal,
            )

        invoice.save()

        return Response(
            {
                'message': 'Facture générée avec succès',
                'invoice_id': invoice.id,
                'invoice_number': invoice.invoice_number,
            },
            status=status.HTTP_201_CREATED,
        )

    # ========== NOUVELLE METHODE PDF ==========
    @action(detail=True, methods=['get'])
    def export_pdf(self, request, pk=None):
        """Exporter la commande en PDF (même design que bon d'achat)"""
        order = self.get_object()
        
        # Vérifier les permissions
        if not (request.user == order.customer or self._can_manage_orders(request.user)):
            return Response(
                {'error': 'Vous n\'avez pas la permission d\'exporter cette commande'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Générer le PDF
            pdf_generator = OrderPDFGenerator(order)
            pdf_buffer = pdf_generator.generate()
            
            # Créer la réponse HTTP
            response = HttpResponse(pdf_buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="commande_{order.id}.pdf"'
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la génération du PDF: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
