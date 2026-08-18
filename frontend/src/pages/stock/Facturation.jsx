import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useActivityContext } from "../../context/ActivityContext";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Grid, Card, CardContent, IconButton, Button,
  useTheme, useMediaQuery, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Menu, MenuItem, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Snackbar, FormControl, InputLabel,
  Select, Divider, Tooltip, Badge, InputAdornment, Avatar, Checkbox,
} from "@mui/material";
import {
  Receipt as ReceiptIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Payment as PaymentIcon,
  Check as CheckIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Warning as WarningIcon,
  Menu as MenuIcon,
  PictureAsPdf as PdfIcon,
  DocumentScanner as DocumentScannerIcon,
} from "@mui/icons-material";
import SharedSidebar from "../../components/SharedSidebar";
import { facturationService } from "../../services/facturationService";
import { CiFilter } from "react-icons/ci";
import { categoryService } from "../../services/categoryService";
import { fournisseurService } from "../../services/fournisseurService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ─── StatCard Component ─────────────────────────────────────────────────── */
const StatCard = ({ label, value, color, onClick }) => {
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        bgcolor: hexToRgba(color, 0.1),
        border: `1px solid ${hexToRgba(color, 0.2)}`,
        borderRadius: 3,
        transition: "all 0.3s ease",
        cursor: onClick ? "pointer" : "default",
        minHeight: 120,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 24px ${hexToRgba(color, 0.2)}`,
        },
      }}
    >
      <CardContent
        sx={{
          py: 3,
          px: 3,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Typography variant="body2" sx={{ color: "#94a3b8", mb: 1, fontSize: "0.875rem", letterSpacing: 0.3 }}>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ color: "white", fontWeight: 700, letterSpacing: 0.5 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

const Facturation = () => {
  const { user } = useAuth();
  const { triggerActivityRefresh } = useActivityContext();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [invoicePage, setInvoicePage] = useState(0);
  const INVOICES_PER_PAGE = 5;

  const [formData, setFormData] = useState({
    id: null,
    invoice_number: "",
    purchase_order_number: "",
    invoice_type: "sales",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    supplier: "",
    category: "",
    currency: "EUR",
    supplier_departure_date: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: "",
    subtotal: 0,
    tax_rate: 20,
    discount: 0,
    status: "draft",
    notes: "",
    terms: "",
    items: [],
  });

  const [paymentData, setPaymentData] = useState({
    payment_date: new Date().toISOString().split("T")[0],
    amount: 0,
    payment_method: "cash",
    reference: "",
    notes: "",
  });
  const fileInputRef = useRef(null);

  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "draft", label: "Brouillon" },
    { value: "sent", label: "Envoyée" },
    { value: "paid", label: "Payée" },
    { value: "overdue", label: "En retard" },
    { value: "cancelled", label: "Annulée" },
  ];

  const typeOptions = [
    { value: "all", label: "Tous les types" },
    { value: "sales", label: "Vente" },
    { value: "purchase", label: "Achat" },
  ];

  const paymentMethods = [
    { value: "cash", label: "Espèces" },
    { value: "check", label: "Chèque" },
    { value: "bank_transfer", label: "Virement bancaire" },
    { value: "credit_card", label: "Carte de crédit" },
    { value: "other", label: "Autre" },
  ];

  const taxRateOptions = [0, 7, 13, 19, 20];

  useEffect(() => {
    setInvoicePage(0);
    fetchInvoices();
    fetchStatistics();
  }, [filterStatus, filterType, searchQuery]);

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterType !== "all") params.type = filterType;
      if (searchQuery) params.search = searchQuery;
      const data = await facturationService.getAllInvoices(params);
      setInvoices(data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setErrorMessage("Erreur lors du chargement des factures");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await facturationService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await fournisseurService.getAllSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const normalizeSupplierName = (value) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const findSupplierFromOcr = (supplierName) => {
    const normalizedTarget = normalizeSupplierName(supplierName);
    if (!normalizedTarget) return null;

    return suppliers.find((supplier) => {
      const normalizedSupplier = normalizeSupplierName(supplier.name);
      return (
        normalizedSupplier === normalizedTarget ||
        normalizedSupplier.includes(normalizedTarget) ||
        normalizedTarget.includes(normalizedSupplier)
      );
    }) || null;
  };

  const findCategoryFromOcr = (categoryLabel, matchedSupplier) => {
    const normalizedTarget = normalizeSupplierName(categoryLabel);
    if (!normalizedTarget && !matchedSupplier) return null;

    const supplierScopedCategories = matchedSupplier
      ? categories.filter((cat) => cat?.supplier?.id === matchedSupplier.id)
      : [];
    const sourceCategories = supplierScopedCategories.length > 0 ? supplierScopedCategories : categories;

    if (normalizedTarget) {
      const directMatch = sourceCategories.find((cat) => {
        const name = normalizeSupplierName(cat.name);
        const materialType = normalizeSupplierName(cat.material_type_display || cat.material_type || "");
        return (
          name === normalizedTarget ||
          name.includes(normalizedTarget) ||
          normalizedTarget.includes(name) ||
          materialType === normalizedTarget ||
          materialType.includes(normalizedTarget) ||
          normalizedTarget.includes(materialType)
        );
      });
      if (directMatch) return directMatch;
    }

    return supplierScopedCategories[0] || null;
  };

  const paginatedInvoices = invoices.slice(
    invoicePage * INVOICES_PER_PAGE,
    (invoicePage + 1) * INVOICES_PER_PAGE
  );
  const invoiceTotalPages = Math.ceil(invoices.length / INVOICES_PER_PAGE);

  const handleAddNew = () => {
    setFormData({
      id: null,
      invoice_number: `INV-${Date.now()}`,
      purchase_order_number: "",
      invoice_type: "sales",
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      customer_address: "",
      supplier: "",
      category: "",
      currency: "EUR",
      supplier_departure_date: "",
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: "",
      subtotal: 0,
      tax_rate: 20,
      discount: 0,
      status: "draft",
      notes: "",
      terms: "",
      items: [],
    });
    setOpenAddDialog(true);
  };

  const handleOpenOcrPicker = () => {
    fileInputRef.current?.click();
  };

  const handleOcrFileSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setOcrLoading(true);
      setErrorMessage("");
      const result = await facturationService.scanInvoiceWithOcr(file);
      const extracted = result?.extracted_data || {};
      const matchedSupplier = findSupplierFromOcr(extracted.supplier_name || extracted.customer_name);
      const matchedCategory = findCategoryFromOcr(extracted.category_label, matchedSupplier);

      setFormData({
        id: null,
        invoice_number: extracted.invoice_number || `INV-${Date.now()}`,
        purchase_order_number: extracted.purchase_order_number || "",
        invoice_type: "purchase",
        customer_name: matchedSupplier?.name || extracted.customer_name || extracted.supplier_name || "",
        customer_email: matchedSupplier?.email || extracted.customer_email || "",
        customer_phone: matchedSupplier?.phone || extracted.customer_phone || "",
        customer_address: matchedSupplier?.address || extracted.customer_address || "",
        supplier: matchedSupplier?.id || "",
        category: matchedCategory?.id || "",
        currency: extracted.currency || "EUR",
        supplier_departure_date: extracted.supplier_departure_date || "",
        invoice_date: extracted.invoice_date || new Date().toISOString().split("T")[0],
        due_date: extracted.due_date || "",
        subtotal: Number(extracted.subtotal) || 0,
        tax_rate: Number(extracted.tax_rate) || 20,
        discount: Number(extracted.discount) || 0,
        status: "draft",
        notes: extracted.notes || "Préremplie via OCR.",
        terms: "",
        items: [],
      });
      setOpenAddDialog(true);
      setSuccessMessage(matchedSupplier
        ? "Scan OCR terminé. La facture a été préremplie."
        : "Scan OCR terminé. Vérifie et associe le fournisseur avant d’enregistrer.");
    } catch (error) {
      setErrorMessage(error.message || "Erreur lors du scan OCR");
    } finally {
      setOcrLoading(false);
      event.target.value = "";
    }
  };

  const handleEdit = (invoice) => {
    setFormData({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      purchase_order_number: invoice.purchase_order_number || "",
      invoice_type: invoice.invoice_type,
      customer_name: invoice.customer_name,
      customer_email: invoice.customer_email || "",
      customer_phone: invoice.customer_phone || "",
      customer_address: invoice.customer_address || "",
      supplier: invoice.supplier || "",
      category: invoice.category || "",
      currency: invoice.currency || "EUR",
      supplier_departure_date: invoice.supplier_departure_date || "",
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      subtotal: invoice.subtotal,
      tax_rate: invoice.tax_rate,
      discount: invoice.discount,
      status: invoice.status,
      notes: invoice.notes || "",
      terms: invoice.terms || "",
      items: invoice.items || [],
    });
    setOpenAddDialog(true);
    handleCloseMenu();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
      try {
        await facturationService.deleteInvoice(id);
        setSuccessMessage("Facture supprimée avec succès");
        fetchInvoices();
        fetchStatistics();
        triggerActivityRefresh();
      } catch (error) {
        setErrorMessage("Erreur lors de la suppression de la facture");
      }
    }
    handleCloseMenu();
  };

  const handleSaveInvoice = async () => {
    if (!formData.supplier) {
      setErrorMessage("Veuillez sélectionner un fournisseur depuis la base");
      return;
    }
    try {
      if (formData.id) {
        await facturationService.updateInvoice(formData.id, formData);
        setSuccessMessage("Facture mise à jour avec succès");
      } else {
        await facturationService.createInvoice(formData);
        setSuccessMessage("Facture créée avec succès");
      }
      setOpenAddDialog(false);
      fetchInvoices();
      fetchStatistics();
      triggerActivityRefresh();
    } catch (error) {
      setErrorMessage(error.message || "Erreur lors de la sauvegarde");
    }
  };

  const handleOpenPaymentDialog = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      payment_date: new Date().toISOString().split("T")[0],
      amount: invoice.balance_due,
      payment_method: "cash",
      reference: "",
      notes: "",
    });
    setOpenPaymentDialog(true);
    handleCloseMenu();
  };

  const handleAddPayment = async () => {
    try {
      await facturationService.addPayment(selectedInvoice.id, paymentData);
      setSuccessMessage("Paiement ajouté avec succès");
      setOpenPaymentDialog(false);
      fetchInvoices();
      fetchStatistics();
      triggerActivityRefresh();
    } catch (error) {
      setErrorMessage("Erreur lors de l'ajout du paiement");
    }
  };

  const handleExportPDF = (invoice) => {
    try {
      if (!invoice) {
        setErrorMessage("Aucune facture sélectionnée");
        return;
      }
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246);
      doc.text("FACTURE", 105, 20, { align: "center" });
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(20, 25, 190, 25);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      let y = 35;
      doc.setFont("helvetica", "bold");
      doc.text(`N° Facture: ${invoice.invoice_number || "N/A"}`, 20, y);
      doc.text(`Date: ${formatDate(invoice.invoice_date)}`, 140, y);
      y += 7;
      if (invoice.purchase_order_number) {
        doc.setFont("helvetica", "normal");
        doc.text(`N° Commande Achat: ${invoice.purchase_order_number}`, 20, y);
        y += 7;
      }
      doc.setFont("helvetica", "normal");
      doc.text(`Échéance: ${formatDate(invoice.due_date)}`, 140, y - 7);
      y += 3;
      doc.setFont("helvetica", "bold");
      doc.text("FOURNISSEUR", 20, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.text(invoice.supplier_name || invoice.customer_name || "-", 20, y);
      y += 5;
      if (invoice.customer_email) { doc.text(`Email: ${invoice.customer_email}`, 20, y); y += 5; }
      if (invoice.customer_phone) { doc.text(`Tél: ${invoice.customer_phone}`, 20, y); y += 5; }
      if (invoice.customer_address) {
        const addressLines = doc.splitTextToSize(invoice.customer_address, 80);
        doc.text(addressLines, 20, y);
        y += addressLines.length * 5;
      }
      y += 5;
      if (invoice.category_name) {
        doc.setFont("helvetica", "bold");
        doc.text("Catégorie: ", 20, y);
        doc.setFont("helvetica", "normal");
        doc.text(invoice.category_name, 45, y);
        y += 7;
      }
      if (invoice.supplier_departure_date) {
        doc.setFont("helvetica", "bold");
        doc.text("Départ Fournisseur: ", 20, y);
        doc.setFont("helvetica", "normal");
        doc.text(formatDate(invoice.supplier_departure_date), 60, y);
        y += 7;
      }
      doc.setFont("helvetica", "bold");
      doc.text("Statut: ", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(getStatusLabel(invoice.status), 40, y);
      y += 10;
      const tableData = [
        ["Sous-total HT", formatCurrency(invoice.subtotal || 0, invoice.currency)],
        ["TVA", formatCurrency(invoice.tax_amount || 0, invoice.currency)],
        ["Total TTC", formatCurrency(invoice.total_amount || 0, invoice.currency)],
      ];
      if (typeof doc.autoTable === "function") {
        doc.autoTable({
          startY: y,
          head: [["Description", "Montant"]],
          body: tableData,
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246], textColor: 255 },
          styles: { fontSize: 10 },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 70, halign: "right", fontStyle: "bold" },
          },
        });
        y = doc.lastAutoTable.finalY + 10;
      } else {
        tableData.forEach(([label, value]) => {
          doc.text(label, 20, y);
          doc.text(value, 140, y);
          y += 7;
        });
        y += 3;
      }
      if (invoice.notes) {
        doc.setFont("helvetica", "bold");
        doc.text("Observations:", 20, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const notesLines = doc.splitTextToSize(invoice.notes, 170);
        doc.text(notesLines, 20, y);
        y += notesLines.length * 5;
      }
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const footerY = 280;
      doc.text(`Créé par: ${invoice.created_by_name || "-"}`, 20, footerY);
      doc.text(`Date de création: ${formatDateTime(invoice.created_at)}`, 20, footerY + 5);
      if (invoice.updated_by_name) {
        doc.text(`Modifié par: ${invoice.updated_by_name}`, 20, footerY + 10);
        doc.text(`Date de modification: ${formatDateTime(invoice.updated_at)}`, 20, footerY + 15);
      }
      doc.save(`Facture_${invoice.invoice_number || "sans_numero"}.pdf`);
      setSuccessMessage("PDF exporté avec succès");
      handleCloseMenu();
    } catch (error) {
      console.error("Erreur PDF:", error);
      setErrorMessage(`Erreur lors de l'export du PDF: ${error.message || "Erreur inconnue"}`);
      handleCloseMenu();
    }
  };

  const handleMenuClick = (event, invoice) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  const handleCloseMenu = () => setAnchorEl(null);

  const handleToggleRowSelection = (invoiceId) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(invoiceId) ? prev.filter((id) => id !== invoiceId) : [...prev, invoiceId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedInvoiceIds.length === invoices.length) {
      setSelectedInvoiceIds([]);
      return;
    }
    setSelectedInvoiceIds(invoices.map((invoice) => invoice.id));
  };

  const allRowsSelected = invoices.length > 0 && selectedInvoiceIds.length === invoices.length;
  const someRowsSelected = selectedInvoiceIds.length > 0 && selectedInvoiceIds.length < invoices.length;

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":      return "#10b981";
      case "sent":      return "#3b82f6";
      case "draft":     return "#6b7280";
      case "overdue":   return "#ef4444";
      case "cancelled": return "#f97316";
      default:          return "#94a3b8";
    }
  };

  const getStatusLabel = (status) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option ? option.label : status;
  };

  const getTypeLabel = (type) => (type === "sales" ? "Vente" : "Achat");

  const normalizeCurrencyCode = (currency) => {
    const raw = String(currency || "").trim().toUpperCase();
    const aliases = { DT: "TND", "D.T": "TND", DINAR: "TND", DINARS: "TND" };
    return aliases[raw] || raw || "EUR";
  };

  const formatCurrency = (amount, currency = "EUR") => {
    const safeAmount = Number(amount) || 0;
    const normalizedCurrency = normalizeCurrencyCode(currency);
    try {
      return new Intl.NumberFormat("fr-FR", { style: "currency", currency: normalizedCurrency }).format(safeAmount);
    } catch {
      return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(safeAmount);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("fr-FR");
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime())
      ? "-"
      : date.toLocaleString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  /* ─── Shared sx for table cells ─────────────────────────────────────── */
  const thSx = { color: "#94a3b8", fontWeight: 700, borderBottom: "none", px: 2.5, py: 2, fontSize: "0.8rem", letterSpacing: 0.4, whiteSpace: "nowrap" };
  const tdSx = { color: "white", px: 2.5, py: 2.2, fontSize: "0.875rem", lineHeight: 1.6 };

  /* ─── Shared sx for dialog text fields ──────────────────────────────── */
  const tfSx = {
    "& .MuiInputLabel-root": { color: "#94a3b8" },
    "& .MuiOutlinedInput-root": { color: "white" },
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "black", overflow: "hidden" }}>
      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(!mobileOpen)} selectedMenu="facturation" />

      <Box component="main" sx={{
          flexGrow: 1, minWidth: 0, height: "100vh", bgcolor: "black", overflowY: "auto", overflowX: "hidden",
          /* Hide scrollbar for Chrome/Safari/Edge */
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: "transparent", borderRadius: "10px" },
          "&:hover::-webkit-scrollbar-thumb": { background: "rgba(59,130,246,0.25)" },
          /* Firefox */
          scrollbarWidth: "thin",
          scrollbarColor: "transparent transparent",
          "&:hover": { scrollbarColor: "rgba(59,130,246,0.25) transparent" },
        }}>

        {/* ── Header bar ─────────────────────────────────────────────────── */}
        <Box sx={{ px: 3, py: 1.8, borderBottom: "1px solid rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          {isMobile && (
            <IconButton onClick={() => setMobileOpen(!mobileOpen)} sx={{ color: "white" }}>
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, ml: "auto" }}>
            <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
              <Typography variant="body2" sx={{ color: "white", fontWeight: 600, lineHeight: 1.5 }}>
                {user?.first_name || user?.username}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", letterSpacing: 0.3 }}>
                {user?.is_superuser ? "Administrateur" : "Utilisateur"}
              </Typography>
            </Box>
            <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: user?.is_superuser || user?.is_staff ? "#ef4444" : user?.role === "responsable_appro" ? "#f97316" : user?.role === "responsable_stock" ? "#22c55e" : "#3b82f6",
                    fontWeight: 600,
                    fontSize: "1rem",
                  }}
                >
                  {user?.first_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || "U"}
                </Avatar>
          </Box>
        </Box>

        {/* ── Page content ───────────────────────────────────────────────── */}
        <Box sx={{ p: 4 }}>

          {/* Title + actions */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ color: "white", fontWeight: 700, mb: 0.8, letterSpacing: 0.3 }}>
                Facturation
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b", letterSpacing: 0.2 }}>
                Gérez vos factures et paiements
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                style={{ display: "none" }}
                onChange={handleOcrFileSelected}
              />
              <Button
                variant="outlined"
                startIcon={<DocumentScannerIcon />}
                onClick={handleOpenOcrPicker}
                disabled={ocrLoading}
                sx={{
                  color: "#60a5fa",
                  borderColor: "rgba(59,130,246,0.35)",
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "10px",
                  px: 2.5,
                  py: 1.2,
                  fontSize: "0.9rem",
                  letterSpacing: 0.3,
                  "&:hover": { borderColor: "#3b82f6", bgcolor: "rgba(59,130,246,0.08)" },
                }}
              >
                {ocrLoading ? "Scan OCR..." : "Scanner facture"}
              </Button>
              <IconButton
                onClick={fetchInvoices}
                disabled={loading}
                sx={{
                  color: "#64748b",
                  border: "1px solid rgba(59,130,246,0.15)",
                  borderRadius: "10px",
                  width: 46,
                  height: 46,
                  "&:hover": { color: "#3b82f6", borderColor: "rgba(59,130,246,0.4)" },
                }}
              >
                <RefreshIcon />
              </IconButton>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddNew}
                sx={{
                  bgcolor: "#3b82f6",
                  "&:hover": { bgcolor: "#2563eb" },
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "10px",
                  px: 3,
                  py: 1.2,
                  fontSize: "0.9rem",
                  letterSpacing: 0.3,
                }}
              >
                Nouvelle Facture
              </Button>
            </Box>
          </Box>

          {/* ── Filters ──────────────────────────────────────────────────── */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: (filterStatus !== "all" || filterType !== "all") ? 2 : 0 }}>
              <Tooltip title="Filtres avancés">
                <Badge
                  badgeContent={(filterStatus !== "all" ? 1 : 0) + (filterType !== "all" ? 1 : 0)}
                  sx={{ "& .MuiBadge-badge": { bgcolor: "#3b82f6", color: "white", fontSize: "0.65rem", minWidth: 16, height: 16 } }}
                >
                  <IconButton
                    onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                    sx={{
                      color: (filterStatus !== "all" || filterType !== "all") ? "#3b82f6" : "#64748b",
                      bgcolor: (filterStatus !== "all" || filterType !== "all") ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.05)",
                      border: (filterStatus !== "all" || filterType !== "all") ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(59,130,246,0.15)",
                      borderRadius: "10px",
                      width: 46,
                      height: 46,
                      flexShrink: 0,
                      "&:hover": { bgcolor: "rgba(59,130,246,0.15)" },
                    }}
                  >
                    <CiFilter size={22} />
                  </IconButton>
                </Badge>
              </Tooltip>

              <Box sx={{ flex: 1, position: "relative" }}>
                <SearchIcon sx={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 20 }} />
                <input
                  type="text"
                  placeholder="Rechercher une facture..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "13px 16px 13px 50px",
                    backgroundColor: "rgba(59,130,246,0.08)",
                    border: "1px solid rgba(59,130,246,0.2)",
                    borderRadius: "10px",
                    color: "#94a3b8",
                    fontSize: "0.9rem",
                    outline: "none",
                    boxSizing: "border-box",
                    letterSpacing: "0.2px",
                  }}
                />
              </Box>
            </Box>

            {/* Active filter chips */}
            {(filterStatus !== "all" || filterType !== "all") && (
              <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap", alignItems: "center" }}>
                {filterStatus !== "all" && (
                  <Chip
                    label={statusOptions.find((d) => d.value === filterStatus)?.label}
                    onDelete={() => setFilterStatus("all")}
                    size="small"
                    sx={{ bgcolor: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)", fontWeight: 500, px: 0.5 }}
                  />
                )}
                {filterType !== "all" && (
                  <Chip
                    label={typeOptions.find((m) => m.value === filterType)?.label}
                    onDelete={() => setFilterType("all")}
                    size="small"
                    sx={{ bgcolor: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)", fontWeight: 500, px: 0.5 }}
                  />
                )}
                <Button
                  size="small"
                  onClick={() => { setFilterStatus("all"); setFilterType("all"); }}
                  sx={{ color: "#64748b", fontSize: "0.75rem", textTransform: "none", py: 0, minHeight: 0, "&:hover": { color: "#ef4444" } }}
                >
                  Tout effacer
                </Button>
              </Box>
            )}
          </Box>

          {/* ── Filter Menu ──────────────────────────────────────────────── */}
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={() => setFilterAnchorEl(null)}
            PaperProps={{
              sx: {
                bgcolor: "rgba(15,23,42,0.97)",
                border: "1px solid rgba(59,130,246,0.2)",
                borderRadius: "12px",
                backdropFilter: "blur(12px)",
                minWidth: 270,
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                mt: 0.5,
              },
            }}
          >
            <Box sx={{ px: 2.5, pt: 2, pb: 0.5 }}>
              <Typography variant="caption" sx={{ color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontSize: "0.7rem" }}>
                Statut
              </Typography>
            </Box>
            {statusOptions.map((opt) => (
              <MenuItem
                key={opt.value}
                onClick={() => { setFilterStatus(opt.value); setFilterAnchorEl(null); }}
                sx={{
                  px: 2.5,
                  py: 1.1,
                  color: filterStatus === opt.value ? "#3b82f6" : "#94a3b8",
                  bgcolor: filterStatus === opt.value ? "rgba(59,130,246,0.1)" : "transparent",
                  fontSize: "0.875rem",
                  letterSpacing: 0.2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  "&:hover": { bgcolor: "rgba(59,130,246,0.08)", color: "white" },
                }}
              >
                {opt.label}
                {filterStatus === opt.value && <CheckIcon sx={{ fontSize: 16, color: "#3b82f6" }} />}
              </MenuItem>
            ))}

            <Divider sx={{ borderColor: "rgba(59,130,246,0.15)", my: 1 }} />

            <Box sx={{ px: 2.5, pt: 0.5, pb: 0.5 }}>
              <Typography variant="caption" sx={{ color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontSize: "0.7rem" }}>
                Type
              </Typography>
            </Box>
            {typeOptions.map((mod) => (
              <MenuItem
                key={mod.value}
                onClick={() => { setFilterType(mod.value); setFilterAnchorEl(null); }}
                sx={{
                  px: 2.5,
                  py: 1.1,
                  color: filterType === mod.value ? "#3b82f6" : "#94a3b8",
                  bgcolor: filterType === mod.value ? "rgba(59,130,246,0.1)" : "transparent",
                  fontSize: "0.875rem",
                  letterSpacing: 0.2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  "&:hover": { bgcolor: "rgba(59,130,246,0.08)", color: "white" },
                }}
              >
                {mod.label}
                {filterType === mod.value && <CheckIcon sx={{ fontSize: 16, color: "#3b82f6" }} />}
              </MenuItem>
            ))}

            {(filterStatus !== "all" || filterType !== "all") && (
              <>
                <Divider sx={{ borderColor: "rgba(59,130,246,0.15)", mt: 1 }} />
                <Box sx={{ p: 2 }}>
                  <Button
                    fullWidth
                    size="small"
                    onClick={() => { setFilterStatus("all"); setFilterType("all"); setFilterAnchorEl(null); }}
                    sx={{ color: "#ef4444", fontSize: "0.8rem", textTransform: "none", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", py: 0.8, "&:hover": { bgcolor: "rgba(239,68,68,0.08)" } }}
                  >
                    Réinitialiser les filtres
                  </Button>
                </Box>
              </>
            )}
          </Menu>

          {/* ── Invoices Table ───────────────────────────────────────────── */}
          <Card sx={{ bgcolor: "rgba(30,41,59,0.5)", border: "1px solid rgba(59,130,246,0.1)", borderRadius: 3 }}>
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 1400, tableLayout: "auto" }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "rgba(59,130,246,0.06)", borderBottom: "1px solid rgba(59,130,246,0.12)" }}>
                    <TableCell sx={{ ...thSx, width: 56 }}>
                      <Checkbox
                        checked={allRowsSelected}
                        indeterminate={someRowsSelected}
                        onChange={handleToggleSelectAll}
                        sx={{ color: "#94a3b8", "&.Mui-checked": { color: "#3b82f6" } }}
                      />
                    </TableCell>
                    {[
                      "N° Facture", "N° Commande Achat", "Fournisseur", "État",
                      "Total HT", "Total TVA", "Total TTC",
                      "Saisi par", "Départ Fournisseur", "Saisi le",
                      "Observations", "Modifié le", "Modifié par",
                      "Catégorie", "Devise",
                    ].map((col) => (
                      <TableCell key={col} sx={thSx}>{col}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedInvoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      sx={{
                        borderBottom: "1px solid rgba(59,130,246,0.08)",
                        "&:hover": { bgcolor: "rgba(59,130,246,0.04)" },
                        transition: "background 0.15s",
                      }}
                    >
                      {/* Checkbox */}
                      <TableCell sx={{ ...tdSx, width: 56 }}>
                        <Checkbox
                          checked={selectedInvoiceIds.includes(invoice.id)}
                          onChange={() => handleToggleRowSelection(invoice.id)}
                          sx={{ color: "#94a3b8", "&.Mui-checked": { color: "#3b82f6" } }}
                        />
                      </TableCell>

                      {/* N° Facture */}
                      <TableCell sx={{ ...tdSx, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {invoice.invoice_number}
                      </TableCell>

                      {/* N° Commande Achat */}
                      <TableCell sx={tdSx}>
                        {invoice.purchase_order_number || invoice.order_number || "-"}
                      </TableCell>

                      {/* Fournisseur */}
                      <TableCell sx={{ ...tdSx, whiteSpace: "nowrap" }}>
                        {invoice.supplier_name || invoice.customer_name || "-"}
                      </TableCell>

                      {/* État */}
                      <TableCell sx={tdSx}>
                        <Chip
                          label={getStatusLabel(invoice.status)}
                          size="small"
                          sx={{
                            bgcolor: `${getStatusColor(invoice.status)}22`,
                            color: getStatusColor(invoice.status),
                            fontWeight: 600,
                            fontSize: "0.78rem",
                            px: 0.5,
                          }}
                        />
                      </TableCell>

                      {/* Totals */}
                      <TableCell sx={{ ...tdSx, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {formatCurrency(invoice.subtotal || 0, invoice.currency || "EUR")}
                      </TableCell>
                      <TableCell sx={{ ...tdSx, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {formatCurrency(invoice.tax_amount || 0, invoice.currency || "EUR")}
                      </TableCell>
                      <TableCell sx={{ ...tdSx, fontWeight: 700, whiteSpace: "nowrap" }}>
                        {formatCurrency(invoice.total_amount || 0, invoice.currency || "EUR")}
                      </TableCell>

                      {/* Saisi par */}
                      <TableCell sx={tdSx}>{invoice.created_by_name || "-"}</TableCell>

                      {/* Départ Fournisseur */}
                      <TableCell sx={{ ...tdSx, whiteSpace: "nowrap" }}>
                        {formatDate(invoice.supplier_departure_date)}
                      </TableCell>

                      {/* Saisi le */}
                      <TableCell sx={{ ...tdSx, whiteSpace: "nowrap" }}>
                        {formatDateTime(invoice.created_at)}
                      </TableCell>

                      {/* Observations */}
                      <TableCell sx={{ ...tdSx, maxWidth: 180 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}
                          title={invoice.notes || ""}
                        >
                          {invoice.notes || "-"}
                        </Typography>
                      </TableCell>

                      {/* Modifié le */}
                      <TableCell sx={{ ...tdSx, whiteSpace: "nowrap" }}>
                        {formatDateTime(invoice.updated_at)}
                      </TableCell>

                      {/* Modifié par + action menu */}
                      <TableCell sx={tdSx}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "space-between" }}>
                          <Typography variant="body2" sx={{ color: "white", whiteSpace: "nowrap" }}>
                            {invoice.updated_by_name || invoice.created_by_name || "-"}
                          </Typography>
                          <IconButton
                            onClick={(e) => handleMenuClick(e, invoice)}
                            size="small"
                            sx={{ color: "#64748b", "&:hover": { color: "#94a3b8" } }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>

                      {/* Catégorie */}
                      <TableCell sx={tdSx}>
                        <Chip
                          label={invoice.category_name || getTypeLabel(invoice.invoice_type)}
                          size="small"
                          sx={{
                            bgcolor: invoice.invoice_type === "sales" ? "#10b98122" : "#f59e0b22",
                            color: invoice.invoice_type === "sales" ? "#10b981" : "#f59e0b",
                            fontWeight: 500,
                            fontSize: "0.78rem",
                          }}
                        />
                      </TableCell>

                      {/* Devise */}
                      <TableCell sx={tdSx}>{invoice.currency || "EUR"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Empty state */}
            {invoices.length === 0 && !loading && (
              <Box sx={{ p: 6, textAlign: "center" }}>
                <ReceiptIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.08)", mb: 2 }} />
                <Typography variant="h6" sx={{ color: "white", mb: 1, fontWeight: 600 }}>
                  Aucune facture trouvée
                </Typography>
                <Typography sx={{ color: "#64748b", lineHeight: 1.7 }}>
                  {searchQuery || filterStatus !== "all" || filterType !== "all"
                    ? "Aucune facture ne correspond à vos filtres."
                    : "Commencez par créer une facture."}
                </Typography>
              </Box>
            )}

            {/* Pagination */}
            {invoiceTotalPages > 1 && invoices.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 2,
                  px: 3,
                  py: 2.5,
                  borderTop: "1px solid rgba(59,130,246,0.1)",
                }}
              >
                <Button
                  size="small"
                  disabled={invoicePage === 0}
                  onClick={() => setInvoicePage(invoicePage - 1)}
                  sx={{ textTransform: "none", color: "#3b82f6", fontSize: "0.82rem", px: 2 }}
                >
                  ← Précédent
                </Button>
                <Typography sx={{ color: "#94a3b8", fontSize: "0.82rem" }}>
                  Page <strong style={{ color: "white" }}>{invoicePage + 1}</strong> / {invoiceTotalPages}
                </Typography>
                <Button
                  size="small"
                  disabled={invoicePage >= invoiceTotalPages - 1}
                  onClick={() => setInvoicePage(invoicePage + 1)}
                  sx={{ textTransform: "none", color: "#3b82f6", fontSize: "0.82rem", px: 2 }}
                >
                  Suivant →
                </Button>
              </Box>
            )}
          </Card>

          {/* ── Action Menu ──────────────────────────────────────────────── */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            PaperProps={{
              sx: {
                bgcolor: "rgba(15,23,42,0.97)",
                border: "1px solid rgba(59,130,246,0.2)",
                borderRadius: "12px",
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                minWidth: 200,
              },
            }}
          >
            {[
              { label: "Modifier",            icon: <EditIcon fontSize="small" />,    color: "#3b82f6", hoverBg: "rgba(59,130,246,0.08)",   action: () => handleEdit(selectedInvoice) },
              { label: "Exporter en PDF",      icon: <PdfIcon fontSize="small" />,     color: "#10b981", hoverBg: "rgba(16,185,129,0.08)",   action: () => handleExportPDF(selectedInvoice) },
              { label: "Ajouter un paiement",  icon: <PaymentIcon fontSize="small" />, color: "#f59e0b", hoverBg: "rgba(245,158,11,0.08)",   action: () => handleOpenPaymentDialog(selectedInvoice) },
              { label: "Supprimer",            icon: <DeleteIcon fontSize="small" />,  color: "#ef4444", hoverBg: "rgba(239,68,68,0.08)",    action: () => handleDelete(selectedInvoice?.id) },
            ].map(({ label, icon, color, hoverBg, action }) => (
              <MenuItem
                key={label}
                onClick={action}
                sx={{ color, fontSize: "0.875rem", gap: 1.5, py: 1.3, px: 2.5, letterSpacing: 0.2, "&:hover": { bgcolor: hoverBg } }}
              >
                {icon} {label}
              </MenuItem>
            ))}
          </Menu>

          {/* ── Add / Edit Invoice Dialog ─────────────────────────────────── */}
          <Dialog
            open={openAddDialog}
            onClose={() => setOpenAddDialog(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { bgcolor: "#1e293b", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 3, color: "white" } }}
          >
            <DialogTitle sx={{ color: "white", fontWeight: 700, fontSize: "1.15rem", borderBottom: "1px solid rgba(59,130,246,0.1)", px: 3, py: 2.5 }}>
              {formData.id ? "Modifier la facture" : "Nouvelle facture"}
            </DialogTitle>

            <DialogContent sx={{ px: 3, pt: 3, pb: 1 }}>
              <Alert
                severity="info"
                sx={{
                  mb: 3,
                  bgcolor: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.2)",
                  color: "#bfdbfe",
                }}
              >
                Tu peux importer un PDF ou une image avec le bouton "Scanner facture". Les champs sont préremplis par OCR, puis tu valides et ajustes avant enregistrement.
              </Alert>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: "#94a3b8" }}>Type</InputLabel>
                    <Select value={formData.invoice_type} onChange={(e) => setFormData({ ...formData, invoice_type: e.target.value })} label="Type" sx={{ color: "white" }}>
                      <MenuItem value="sales">Vente</MenuItem>
                      <MenuItem value="purchase">Achat</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="N° Facture" value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} sx={tfSx} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="N° Commande Achat" value={formData.purchase_order_number}
                    onChange={(e) => setFormData({ ...formData, purchase_order_number: e.target.value })} sx={tfSx} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: "#94a3b8" }}>Fournisseur</InputLabel>
                    <Select
                      value={formData.supplier}
                      onChange={(e) => {
                        const s = suppliers.find((sup) => sup.id === e.target.value);
                        setFormData({ ...formData, supplier: e.target.value, customer_name: s?.name || "", customer_email: s?.email || formData.customer_email, customer_phone: s?.phone || formData.customer_phone, customer_address: s?.address || formData.customer_address });
                      }}
                      label="Fournisseur"
                      sx={{ color: "white" }}
                    >
                      <MenuItem value="">Sélectionner un fournisseur</MenuItem>
                      {suppliers.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: "#94a3b8" }}>Catégorie</InputLabel>
                    <Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} label="Catégorie" sx={{ color: "white" }}>
                      <MenuItem value="">Aucune</MenuItem>
                      {categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Devise" value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })} sx={tfSx} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Départ Fournisseur" type="date" value={formData.supplier_departure_date}
                    onChange={(e) => setFormData({ ...formData, supplier_departure_date: e.target.value })}
                    InputLabelProps={{ shrink: true }} sx={tfSx} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Email" type="email" value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })} sx={tfSx} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Téléphone" value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })} sx={tfSx} />
                </Grid>

                <Grid item xs={12}>
                  <TextField fullWidth label="Adresse" multiline rows={2} value={formData.customer_address}
                    onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })} sx={tfSx} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Date de facturation" type="date" value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    InputLabelProps={{ shrink: true }} sx={tfSx} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Date d'échéance" type="date" value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    InputLabelProps={{ shrink: true }} sx={tfSx} />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Sous-total" type="number" value={formData.subtotal}
                    onChange={(e) => setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })} sx={tfSx} />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: "#94a3b8" }}>TVA (%)</InputLabel>
                    <Select value={formData.tax_rate} onChange={(e) => setFormData({ ...formData, tax_rate: Number(e.target.value) || 0 })} label="TVA (%)" sx={{ color: "white" }}>
                      {taxRateOptions.map((rate) => <MenuItem key={rate} value={rate}>{rate}%</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Remise" type="number" value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })} sx={tfSx} />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: "#94a3b8" }}>Statut</InputLabel>
                    <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} label="Statut" sx={{ color: "white" }}>
                      {statusOptions.filter((opt) => opt.value !== "all").map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField fullWidth label="Notes" multiline rows={3} value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })} sx={tfSx} />
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2.5, borderTop: "1px solid #334155", gap: 1 }}>
              <Button onClick={() => setOpenAddDialog(false)} sx={{ color: "#94a3b8", px: 2.5 }}>
                Annuler
              </Button>
              <Button onClick={handleSaveInvoice} variant="contained" sx={{ bgcolor: "#3b82f6", "&:hover": { bgcolor: "#2563eb" }, px: 3 }}>
                {formData.id ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* ── Payment Dialog ────────────────────────────────────────────── */}
          <Dialog
            open={openPaymentDialog}
            onClose={() => setOpenPaymentDialog(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { bgcolor: "#1e293b", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 3, color: "white" } }}
          >
            <DialogTitle sx={{ color: "white", fontWeight: 700, fontSize: "1.1rem", borderBottom: "1px solid rgba(59,130,246,0.1)", px: 3, py: 2.5 }}>
              Ajouter un paiement
            </DialogTitle>

            <DialogContent sx={{ px: 3, pt: 3, pb: 1 }}>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Date de paiement" type="date" value={paymentData.payment_date}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                    InputLabelProps={{ shrink: true }} sx={tfSx} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Montant" type="number" value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })} sx={tfSx} />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: "#94a3b8" }}>Méthode de paiement</InputLabel>
                    <Select value={paymentData.payment_method} onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })} label="Méthode de paiement" sx={{ color: "white" }}>
                      {paymentMethods.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Référence" value={paymentData.reference}
                    onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })} sx={tfSx} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Notes" multiline rows={2} value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })} sx={tfSx} />
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2.5, borderTop: "1px solid #334155", gap: 1 }}>
              <Button onClick={() => setOpenPaymentDialog(false)} sx={{ color: "#94a3b8", px: 2.5 }}>
                Annuler
              </Button>
              <Button onClick={handleAddPayment} variant="contained" sx={{ bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" }, px: 3 }}>
                Ajouter le paiement
              </Button>
            </DialogActions>
          </Dialog>

          {/* ── Snackbars ─────────────────────────────────────────────────── */}
          <Snackbar open={!!successMessage} autoHideDuration={5000} onClose={() => setSuccessMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
            <Alert onClose={() => setSuccessMessage("")} severity="success" sx={{ width: "100%" }}>{successMessage}</Alert>
          </Snackbar>
          <Snackbar open={!!errorMessage} autoHideDuration={5000} onClose={() => setErrorMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
            <Alert onClose={() => setErrorMessage("")} severity="error" sx={{ width: "100%" }}>{errorMessage}</Alert>
          </Snackbar>

        </Box>
      </Box>
    </Box>
  );
};

export default Facturation;
