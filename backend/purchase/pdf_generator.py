from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY


class PurchaseOrderPDFGenerator:
    """Générateur de PDF pour les bons d'achat"""
    
    def __init__(self, purchase_order):
        self.purchase_order = purchase_order
        self.buffer = BytesIO()
        self.doc = SimpleDocTemplate(
            self.buffer,
            pagesize=A4,
            rightMargin=0.5 * inch,
            leftMargin=0.5 * inch,
            topMargin=0.5 * inch,
            bottomMargin=0.5 * inch,
        )
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        self.story = []
        
    def _setup_custom_styles(self):
        """Configurer les styles personnalisés"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=6,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=12,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=6,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['BodyText'],
            fontSize=9,
            alignment=TA_LEFT,
        ))
        
    def _get_status_display(self):
        """Obtenir l'affichage du statut"""
        status_map = {
            'pending': ('En attente', '#f59e0b'),
            'approved': ('Approuvée', '#10b981'),
            'rejected': ('Rejetée', '#ef4444'),
            'sent': ('Envoyée', '#8b5cf6'),
            'delivered': ('Livrée', '#06b6d4'),
            'cancelled': ('Annulée', '#6b7280'),
        }
        status_text, color = status_map.get(self.purchase_order.status, ('Inconnu', '#000000'))
        return status_text, color
        
    def generate(self):
        """Générer le PDF complet"""
        self._add_header()
        self.story.append(Spacer(1, 0.15 * inch))
        self._add_purchase_order_info()
        self.story.append(Spacer(1, 0.2 * inch))
        self._add_supplier_info()
        self.story.append(Spacer(1, 0.2 * inch))
        self._add_items_table()
        self.story.append(Spacer(1, 0.2 * inch))
        self._add_totals()
        self.story.append(Spacer(1, 0.3 * inch))
        self._add_footer()
        
        # Générer le PDF
        self.doc.build(self.story)
        self.buffer.seek(0)
        return self.buffer
        
    def _add_header(self):
        """Ajouter l'en-tête du document"""
        title = Paragraph("BON D'ACHAT", self.styles['CustomTitle'])
        self.story.append(title)
        
        # Ligne séparatrice
        self.story.append(Spacer(1, 0.1 * inch))
        
        # Infos du document
        status_text, color = self._get_status_display()
        info_data = [
            ['Numéro de Commande:', f"#{self.purchase_order.id}", 'Statut:', status_text],
            ['Date de Création:', self.purchase_order.order_date.strftime('%d/%m/%Y à %H:%M'), 
             'Date de Livraison:', self.purchase_order.expected_delivery_date.strftime('%d/%m/%Y')],
        ]
        
        info_table = Table(info_data, colWidths=[1.5 * inch, 2 * inch, 1.2 * inch, 1.8 * inch])
        info_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 9),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('ALIGNMENT', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f4f8')),
            ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f0f4f8')),
            ('TEXTCOLOR', (3, 0), (3, 0), colors.HexColor(color)),
            ('FONTNAME', (3, 0), (3, 0), 'Helvetica-Bold'),
        ]))
        self.story.append(info_table)
        
    def _add_purchase_order_info(self):
        """Ajouter les informations du bon de commande"""
        title = Paragraph("Informations de Commande", self.styles['CustomHeading'])
        self.story.append(title)
        self.story.append(Spacer(1, 0.08 * inch))
        
        info_data = [
            ['Créé par:', self.purchase_order.created_by.get_full_name() or self.purchase_order.created_by.username],
            ['Montant Total:', f"{self.purchase_order.total_amount:,.2f} DH"],
        ]
        
        info_table = Table(info_data, colWidths=[2 * inch, 4 * inch])
        info_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 9),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('ALIGNMENT', (0, 0), (-1, -1), 'LEFT'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LINEBELOW', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        self.story.append(info_table)
        
    def _add_supplier_info(self):
        """Ajouter les informations du fournisseur"""
        title = Paragraph("Informations du Fournisseur", self.styles['CustomHeading'])
        self.story.append(title)
        self.story.append(Spacer(1, 0.08 * inch))
        
        supplier = self.purchase_order.supplier
        info_data = [
            ['Nom:', supplier.name],
            ['Email:', supplier.email or 'N/A'],
            ['Téléphone:', supplier.phone or 'N/A'],
            ['Adresse:', supplier.address or 'N/A'],
        ]
        
        info_table = Table(info_data, colWidths=[1.5 * inch, 4.5 * inch])
        info_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 9),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('ALIGNMENT', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LINEBELOW', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        self.story.append(info_table)
        
    def _add_items_table(self):
        """Ajouter le tableau des articles"""
        title = Paragraph("Articles Commandés", self.styles['CustomHeading'])
        self.story.append(title)
        self.story.append(Spacer(1, 0.08 * inch))
        
        # Préparer les données du tableau
        items_data = [
            ['N°', 'Produit', 'Quantité', 'Prix Unitaire', 'Total']
        ]
        
        for idx, item in enumerate(self.purchase_order.items.all(), 1):
            total = item.quantity * item.unit_price
            items_data.append([
                str(idx),
                item.product.name,
                str(item.quantity),
                f"{item.unit_price:,.2f} DH",
                f"{total:,.2f} DH",
            ])
        
        items_table = Table(items_data, colWidths=[0.5 * inch, 2.5 * inch, 1 * inch, 1.2 * inch, 1.3 * inch])
        items_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 9),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGNMENT', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGNMENT', (1, 1), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ]))
        self.story.append(items_table)
        
    def _add_totals(self):
        """Ajouter les totaux"""
        # Tableau des totaux
        totals_data = [
            ['', '', '', 'Sous-Total:', f"{self.purchase_order.total_amount:,.2f} DH"],
            ['', '', '', 'Total TTC:', f"{self.purchase_order.total_amount:,.2f} DH"],
        ]
        
        totals_table = Table(totals_data, colWidths=[0.5 * inch, 2.5 * inch, 1 * inch, 1.2 * inch, 1.3 * inch])
        totals_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, 0), 'Helvetica', 9),
            ('FONT', (0, 1), (-1, 1), 'Helvetica-Bold', 10),
            ('FONTNAME', (3, 0), (3, -1), 'Helvetica-Bold'),
            ('ALIGNMENT', (0, 0), (-1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LINEABOVE', (3, 0), (4, 0), 1, colors.grey),
            ('LINEABOVE', (3, 1), (4, 1), 2, colors.HexColor('#1e40af')),
            ('BACKGROUND', (3, 1), (4, 1), colors.HexColor('#e0e7ff')),
        ]))
        self.story.append(totals_table)
        
    def _add_footer(self):
        """Ajouter le pied de page"""
        footer_text = f"Document généré le {datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}"
        footer = Paragraph(footer_text, self.styles['CustomBody'])
        
        footer_table = Table([[footer]], colWidths=[6 * inch])
        footer_table.setStyle(TableStyle([
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 8),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.grey),
            ('ALIGNMENT', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('LINEABOVE', (0, 0), (-1, -1), 1, colors.lightgrey),
        ]))
        self.story.append(footer_table)