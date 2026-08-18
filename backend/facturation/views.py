from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Sum, Q, Count
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from smartalerte_project.telegram_utils import send_telegram_to_user
from .models import Invoice, InvoiceItem, Payment
from .serializers import (
    InvoiceSerializer, InvoiceCreateSerializer,
    InvoiceItemSerializer, PaymentSerializer,
    InvoiceOCRUploadSerializer, InvoiceOCRResultSerializer,
)
from .ocr_service import scan_invoice_file, OCRConfigurationError, OCRProcessingError


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing invoices
    """
    queryset = Invoice.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return InvoiceCreateSerializer
        return InvoiceSerializer

    def _send_invoice_created_email(self, invoice):
        supplier_email = None
        if invoice.supplier and invoice.supplier.email and "@" in str(invoice.supplier.email):
            supplier_email = str(invoice.supplier.email).strip()

        if not supplier_email:
            return

        subject = f"Nouvelle facture créée : {invoice.invoice_number}"
        message = (
            f"Bonjour,\n\n"
            f"Une nouvelle facture a été créée avec succès.\n\n"
            f"Numéro : {invoice.invoice_number}\n"
            f"Commande achat : {invoice.purchase_order_number or '-'}\n"
            f"Fournisseur : {invoice.supplier.name if invoice.supplier else '-'}\n"
            f"Date facture : {invoice.invoice_date}\n"
            f"Montant total : {invoice.total_amount} {invoice.currency or 'EUR'}\n"
            f"Statut : {invoice.get_status_display()}\n\n"
            f"Cordialement,\n"
            f"SmartNotify"
        )

        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[supplier_email],
            fail_silently=False,
        )

        # Telegram en miroir pour l'utilisateur qui a créé la facture
        try:
            if invoice.created_by:
                send_telegram_to_user(invoice.created_by, message)
        except Exception:
            pass
    
    def perform_create(self, serializer):
        invoice = serializer.save(created_by=self.request.user)
        try:
            self._send_invoice_created_email(invoice)
        except Exception as error:
            print(f"[FACTURATION] Erreur envoi email création facture: {error}")

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    def get_queryset(self):
        user = self.request.user
        queryset = Invoice.objects.all()

        # Seul le superadmin voit toutes les factures
        if not (hasattr(user, 'is_super_admin') and user.is_super_admin):
            queryset = queryset.filter(created_by=user)

        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)

        # Filter by type
        type_param = self.request.query_params.get('type', None)
        if type_param:
            queryset = queryset.filter(invoice_type=type_param)

        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date and end_date:
            queryset = queryset.filter(invoice_date__range=[start_date, end_date])

        # Search by customer name or invoice number
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(customer_name__icontains=search) |
                Q(invoice_number__icontains=search)
            )

        return queryset.select_related('supplier', 'category', 'created_by', 'updated_by').prefetch_related('items', 'payments')
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get invoice statistics"""
        now = timezone.now()
        
        # Total invoices
        total_invoices = Invoice.objects.count()
        
        # Invoices by status
        draft_count = Invoice.objects.filter(status='draft').count()
        sent_count = Invoice.objects.filter(status='sent').count()
        paid_count = Invoice.objects.filter(status='paid').count()
        overdue_count = Invoice.objects.filter(status='overdue').count()
        
        # Revenue statistics
        total_revenue = Invoice.objects.filter(
            status='paid', 
            invoice_type='sales'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        total_expenses = Invoice.objects.filter(
            status='paid',
            invoice_type='purchase'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Outstanding amount (unpaid invoices)
        outstanding = Invoice.objects.filter(
            status__in=['sent', 'overdue']
        ).aggregate(
            total=Sum('total_amount') - Sum('amount_paid')
        )['total'] or 0
        
        # This month's revenue
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_revenue = Invoice.objects.filter(
            invoice_date__gte=month_start,
            status='paid',
            invoice_type='sales'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Recent invoices (last 30 days)
        recent_date = now - timedelta(days=30)
        recent_invoices = Invoice.objects.filter(
            created_at__gte=recent_date
        ).count()
        
        return Response({
            'total_invoices': total_invoices,
            'draft_count': draft_count,
            'sent_count': sent_count,
            'paid_count': paid_count,
            'overdue_count': overdue_count,
            'total_revenue': float(total_revenue),
            'total_expenses': float(total_expenses),
            'outstanding': float(outstanding),
            'monthly_revenue': float(monthly_revenue),
            'recent_invoices': recent_invoices,
        })

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def scan_ocr(self, request):
        upload_serializer = InvoiceOCRUploadSerializer(data=request.data)
        upload_serializer.is_valid(raise_exception=True)

        try:
            result = scan_invoice_file(upload_serializer.validated_data['file'])
        except OCRConfigurationError as error:
            return Response(
                {'detail': f"OCR non configuré: {error}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except OCRProcessingError as error:
            return Response(
                {'detail': str(error)},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        except Exception as error:
            return Response(
                {'detail': f"Erreur OCR inattendue: {error}"},
                status=status.HTTP_502_BAD_GATEWAY
            )

        response_serializer = InvoiceOCRResultSerializer(data=result)
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.validated_data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """Add a payment to an invoice"""
        invoice = self.get_object()
        serializer = PaymentSerializer(data=request.data)
        
        if serializer.is_valid():
            payment = serializer.save(
                invoice=invoice,
                created_by=request.user
            )
            
            # Update invoice amount_paid
            total_paid = invoice.payments.aggregate(
                total=Sum('amount')
            )['total'] or 0
            invoice.amount_paid = total_paid
            invoice.save()
            
            return Response(
                InvoiceSerializer(invoice).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InvoiceItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing invoice items
    """
    queryset = InvoiceItem.objects.all()
    serializer_class = InvoiceItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = InvoiceItem.objects.all()
        invoice_id = self.request.query_params.get('invoice', None)
        if invoice_id:
            queryset = queryset.filter(invoice_id=invoice_id)
        return queryset


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing payments
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        payment = serializer.save(created_by=self.request.user)
        
        # Update invoice amount_paid
        invoice = payment.invoice
        total_paid = invoice.payments.aggregate(
            total=Sum('amount')
        )['total'] or 0
        invoice.amount_paid = total_paid
        invoice.save()
    
    def get_queryset(self):
        queryset = Payment.objects.all()
        invoice_id = self.request.query_params.get('invoice', None)
        if invoice_id:
            queryset = queryset.filter(invoice_id=invoice_id)
        return queryset
