import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useActivityContext } from "../../context/ActivityContext";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box, Typography, Grid, Card, CardContent, Avatar, IconButton, Button,
  useTheme, useMediaQuery, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Menu, MenuItem, TextField, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, Snackbar, Badge, Divider, Slide,
  Collapse,
} from "@mui/material";
import {
  Inventory as InventoryIcon,
  Inventory2 as Inventory2Icon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Menu as MenuIcon,
  Check as CheckIcon,
  CalendarToday as CalendarTodayIcon,
  Science as ScienceIcon,
  WarningAmber as WarningAmberIcon,
  BusinessCenter as BusinessCenterIcon,
  PrecisionManufacturing as PrecisionManufacturingIcon,
  LocalShipping as LocalShippingIcon,
  FilterAlt as FilterAltIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { CiFilter } from "react-icons/ci";
import SharedSidebar from "../../components/SharedSidebar";

/* ─── StatCard ───────────────────────────────────────────────────────────── */
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
        minHeight: 110,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 24px ${hexToRgba(color, 0.2)}`,
        },
      }}
    >
      <CardContent sx={{ py: 2, px: 2.5, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <Typography variant="body2" sx={{ color: "#94a3b8", mb: 0.5, fontSize: "0.85rem" }}>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};
// Composant d'alerte modale centrée
const ChromeAlert = ({ open, message, severity, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: '#1e293b',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 3,
          minWidth: 320,
          maxWidth: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        },
      }}
    >
      <DialogContent sx={{ pt: 4, pb: 3, px: 3, textAlign: 'center' }}>
        <Typography
          sx={{
            color: 'white',
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.5,
          }}
        >
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'center', pb: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: '#3b82f6',
            color: 'white',
            fontWeight: 600,
            px: 4,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '0.9rem',
            '&:hover': {
              bgcolor: '#2563eb',
            },
          }}
        >
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Stock = () => {
  const { user } = useAuth();
  const { triggerActivityRefresh } = useActivityContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMaterialType, setFilterMaterialType] = useState("all");
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableSuppliers, setAvailableSuppliers] = useState([]);
  // État pour l'alerte style Chrome
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const [formData, setFormData] = useState({
    id: null, name: "", nomenclature: "", category: "", status: "optimal",
    quantity: 0, minQuantity: 0, maxQuantity: 0, price: 0, supplier: "", materialType: "matiere_premiere", unit: "piece",
  });
  const canAddProduct = user?.is_staff || user?.is_superuser || user?.role === "responsable_stock";
  const [products, setProducts] = useState([]);
  const MATERIAL_TYPE_PREFIX_MAP = {
    matiere_premiere: "01",
    matiere_consommable: "02",
    matiere_emballage: "03",
    matiere_chimique: "04",
    matiere_dangereuse: "05",
    fourniture_bureau: "06",
  };
  // Fonction pour afficher l'alerte style Chrome
  const showAlert = (message, severity = "success") => {
    setAlert({ open: true, message, severity });
    // Auto-fermeture après 4 secondes
    setTimeout(() => {
      setAlert({ open: false, message: "", severity: "success" });
    }, 4000);
  };
  // Fonction pour fermer l'alerte manuellement
  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };
  // ── Filter config ─────────────────────────────────────────────────────────
  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "optimal", label: "Optimal" },
    { value: "low", label: "Stock bas" },
    { value: "out_of_stock", label: "Out of stock" },
    { value: "rupture", label: "Rupture" },
  ];
  const materialTypeOptions = [
    {
      value: "all",
      label: "Tous les types",
      icon: <FilterAltIcon sx={{ fontSize: 16 }} />,
      color: "#082633",
      keywords: [],
    },
    {
      value: "matiere_premiere",
      label: "Matiere premiere",
      icon: <PrecisionManufacturingIcon sx={{ fontSize: 16 }} />,
      color: "#082633",
      keywords: ["matiere premiere", "premiere", "raw material", "raw"],
    },
    {
      value: "matiere_consommable",
      label: "Matiere consommable",
      icon: <InventoryIcon sx={{ fontSize: 16 }} />,
      color: "#082633",
      keywords: ["consommable", "consommables", "consumable"],
    },
    {
      value: "matiere_chimique",
      label: "Matiere chimique",
      icon: <ScienceIcon sx={{ fontSize: 16 }} />,
      color: "#082633",
      keywords: ["chimique", "chimie", "chemical"],
    },
    {
      value: "matiere_dangereuse",
      label: "Matiere dangereuse",
      icon: <WarningAmberIcon sx={{ fontSize: 16 }} />,
      color: "#082633",
      keywords: ["dangereuse", "dangereux", "danger", "toxique", "hazard", "corrosif", "inflammable"],
    },
    {
      value: "matiere_emballage",
      label: "Matiere emballage",
      icon: <LocalShippingIcon sx={{ fontSize: 16 }} />,
      color: "#082633",
      keywords: ["emballage", "packaging", "conditionnement", "carton", "boite", "sachet"],
    },
    {
      value: "fourniture_bureau",
      label: "Fournitures bureau",
      icon: <BusinessCenterIcon sx={{ fontSize: 16 }} />,
      color: "#082633",
      keywords: ["bureau", "fourniture", "fournitures", "papeterie", "formulaire", "office"],
    },
  ];
  const activeFiltersCount =
    (filterStatus !== "all" ? 1 : 0)
    + (filterMaterialType !== "all" ? 1 : 0);
  const handleMaterialTypeSelect = (typeValue) => {
    const selectedType = materialTypeOptions.some((opt) => opt.value === typeValue) ? typeValue : "all";
    setFilterMaterialType(selectedType);
    const nextParams = new URLSearchParams(searchParams);
    if (selectedType === "all") {
      nextParams.delete("materialType");
    } else {
      nextParams.set("materialType", selectedType);
    }
    setSearchParams(nextParams, { replace: true });
  };
  const buildNomenclatureCode = (materialType, sequenceNumber) => {
    const prefix = MATERIAL_TYPE_PREFIX_MAP[materialType] || "01";
    return `${prefix}-${String(sequenceNumber).padStart(4, "0")}`;
  };
  const getNextNomenclatureByType = (materialType, currentProductId = null) => {
    const prefix = MATERIAL_TYPE_PREFIX_MAP[materialType] || "01";
    const sameTypeProducts = products.filter((p) => {
      if (currentProductId && p.id === currentProductId) return false;
      if (p.materialType) return p.materialType === materialType;
      return String(p.nomenclature || "").startsWith(`${prefix}-`);
    });
    const maxSequence = sameTypeProducts.reduce((max, product) => {
      const normalizednomenclature = String(product.nomenclature || "").trim();
      const match = normalizednomenclature.match(/^\d{2}-(\d{1,})$/);
      if (!match) return max;
      const seq = parseInt(match[1], 10);
      if (Number.isNaN(seq)) return max;
      return Math.max(max, seq);
    }, 0);
    return buildNomenclatureCode(materialType, maxSequence + 1);
  };
  // ── Helpers ───────────────────────────────────────────────────────────────
  const statusMeta = {
    optimal: { label: "Optimal", color: "#10b981", key: "optimal" },
    low: { label: "Stock bas", color: "#f59e0b", key: "low" },
    out_of_stock: { label: "Out of stock", color: "#ef4444", key: "out_of_stock" },
    rupture: { label: "Rupture", color: "#dc2626", key: "rupture" },
  };
  const getStockStatus = (quantity, minQuantity, maxQuantity, status) => {
    if (status && statusMeta[status]) {
      return statusMeta[status];
    }
    if (quantity === 0) return statusMeta.out_of_stock;
    if (quantity < minQuantity) return statusMeta.low;
    if (quantity > maxQuantity) return statusMeta.optimal;
    return statusMeta.optimal;
  };
  const normalizeText = (value) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  const getProductCategoryName = (product) =>
    product.categoryName || availableCategories.find((c) => Number(c.id) === Number(product.category))?.name || "";
  const matchesMaterialType = (product, materialType) => {
    if (materialType === "all") return true;
    if (product.materialType) {
      return product.materialType === materialType;
    }
    const selectedType = materialTypeOptions.find((opt) => opt.value === materialType);
    if (!selectedType) return true;
    const searchableText = normalizeText(
      `${product.name || ""} ${product.nomenclature || ""} ${getProductCategoryName(product) || ""}`
    );
    return selectedType.keywords.some((keyword) => searchableText.includes(normalizeText(keyword)));
  };
  // ── Filtered products ─────────────────────────────────────────────────────
  const filteredProducts = products.filter(p => {
    const status = getStockStatus(p.quantity, p.minQuantity, p.maxQuantity, p.status);
    const matchesStatus = filterStatus === "all" || status.key === filterStatus;
    const matchesMaterial = matchesMaterialType(p, filterMaterialType);
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.nomenclature.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q);
    return matchesStatus && matchesMaterial && matchesSearch;
  });
  const materialTypeCounts = materialTypeOptions.reduce((acc, type) => {
    if (type.value === "all") {
      acc[type.value] = products.length;
      return acc;
    }
    acc[type.value] = products.filter((product) => matchesMaterialType(product, type.value)).length;
    return acc;
  }, {});
  // ── Stats ─────────────────────────────────────────────────────────────────
  const getStatusKey = (product) => {
    if (product.status && statusMeta[product.status]) {
      return product.status;
    }
    return getStockStatus(product.quantity, product.minQuantity, product.maxQuantity).key;
  };
  const stats = {
    totalProducts: products.length,
    totalValue: products.reduce((sum, p) => sum + p.quantity * p.price, 0),
    lowStockProducts: products.filter(p => getStatusKey(p) === "low").length,
    outOfStockProducts: products.filter(p => {
      const key = getStatusKey(p);
      return key === "out_of_stock" || key === "rupture";
    }).length,
    optimalStock: products.filter(p => getStatusKey(p) === "optimal").length,
  };
  const statCards = [
    { label: "Total Produits", value: stats.totalProducts, accent: "#3b82f6", onClick: () => { setFilterStatus("all"); handleMaterialTypeSelect("all"); } },
    { label: "Stock Optimal", value: stats.optimalStock, accent: "#10b981", onClick: () => { setFilterStatus("optimal"); handleMaterialTypeSelect("all"); } },
    { label: "Stock Bas", value: stats.lowStockProducts, accent: "#f59e0b", onClick: () => { setFilterStatus("low"); handleMaterialTypeSelect("all"); } },
    { label: "Rupture", value: stats.outOfStockProducts, accent: "#ef4444", onClick: () => { setFilterStatus("out_of_stock"); handleMaterialTypeSelect("all"); } },
    { label: "Valeur Totale", value: `$${stats.totalValue.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, accent: "#8b5cf6" },
  ];
  // ── Form / CRUD ───────────────────────────────────────────────────────────
  const emptyForm = { id: null, name: "", nomenclature: "", category: "", status: "optimal", quantity: 0, minQuantity: 0, maxQuantity: 0, price: 0, supplier: "", materialType: "matiere_premiere", unit: "piece" };
  const handleOpenAddDialog = (product = null) => {
    if (product) {
      setFormData({ ...product, unit: product.unit || "piece" });
    } else {
      const defaultType = emptyForm.materialType;
      const defaultnomenclature = getNextNomenclatureByType(defaultType);
      setFormData({ ...emptyForm, nomenclature: defaultnomenclature });
    }
    setOpenAddDialog(true);
  };
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setFormData(emptyForm);
    if (location.pathname === "/stock/new") {
      navigate("/stock");
    }
  };
  const handleSaveProduct = async () => {
    if (savingProduct) return;
    const normalizedName = normalizeText(formData.name);
    const normalizedNomenclature = String(formData.nomenclature || "").trim();
    if (!normalizedName || !normalizedNomenclature) {
      showAlert("Nom et nomenclature sont requis", "error");
      return;
    }
    const duplicateNameExists = products.some(
      (product) =>
        String(product.id) !== String(formData.id) &&
        normalizeText(product.name || "") === normalizedName
    );
    if (duplicateNameExists) {
      showAlert("Ce nom de produit existe deja. Veuillez choisir un autre nom.", "error");
      return;
    }
    setSavingProduct(true);
    try {
      const token = localStorage.getItem("access_token");
      const isUpdate = Boolean(formData.id);
      const payload = mapToApi({
        ...formData,
        name: String(formData.name || "").trim(),
        nomenclature: normalizedNomenclature,
      });
      console.log("Payload envoyé:", payload);
      const response = await fetch(isUpdate ? `${API_BASE}${formData.id}/` : API_BASE, {
        method: isUpdate ? "PUT" : "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Erreur du serveur:", errorText);
        showAlert(errorText || "Erreur lors de l'enregistrement du produit", "error");
        return;
      }
      const saved = mapFromApi(await response.json());
      if (isUpdate) {
        setProducts(products.map(p => p.id === saved.id ? saved : p));
        showAlert("Produit mis à jour avec succès", "success");
      } else {
        setProducts([saved, ...products]);
        showAlert("Produit ajouté avec succès", "success");
        // Déclencher le rafraîchissement des activités récentes
        triggerActivityRefresh();
      }
      handleCloseAddDialog();
    } catch (error) {
      showAlert("Erreur réseau lors de l'enregistrement du produit", "error");
    } finally {
      setSavingProduct(false);
    }
  };
  const handleDeleteProduct = async (id) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}${id}/`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });
      if (!response.ok) {
        const errorText = await response.text();
        showAlert(errorText || "Erreur lors de la suppression du produit", "error");
        return;
      }
      setProducts(products.filter(p => p.id !== id));
      showAlert("Produit supprimé avec succès", "success");
    } catch (error) {
      showAlert("Erreur réseau lors de la suppression du produit", "error");
    } finally {
      handleMenuClose();
    }
  };
  const handleMenuOpen = (event, product) => { setAnchorEl(event.currentTarget); setSelectedProduct(product); };
  const handleMenuClose = () => { setAnchorEl(null); setSelectedProduct(null); };
  const inputSx = {
    "& .MuiOutlinedInput-root": {
      color: "#94a3b8",
      "& fieldset": { borderColor: "rgba(59,130,246,0.2)" },
      "&:hover fieldset": { borderColor: "rgba(59,130,246,0.4)" },
      "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
      bgcolor: "rgba(59,130,246,0.05)", borderRadius: "10px",
    },
    "& .MuiInputLabel-root": { color: "#64748b" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
  };
 const menuItemSx = (active) => ({
  px: 2, 
  py: 0.8,
  color: active ? "#3b82f6" : "#94a3b8",
  bgcolor: active ? "rgba(59,130,246,0.1)" : "transparent",
  fontSize: "0.875rem", 
  display: "flex", 
  justifyContent: "space-between", 
  alignItems: "center",
  whiteSpace: "normal", // Permet le retour à la ligne
  overflow: "visible", // Affiche tout le texte
  textOverflow: "unset", // Supprime les "..."
  "&:hover": { 
    bgcolor: "rgba(59,130,246,0.08)", 
    color: "white" 
  },
});
  const formatCreatedAt = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  const API_BASE = "http://localhost:8000/api/stock/products/";
  const mapFromApi = (item) => ({
    id: item.id,
    name: item.name || "",
    nomenclature: item.nomenclature || item.sku || "",
    category: item.category || "",
    categoryName: item.category_name || item.category_details?.name || "",
    materialType: item.material_type || "matiere_premiere",
    status: item.status || "optimal",
    quantity: Number(item.quantity ?? 0),
    minQuantity: Number(item.min_quantity ?? 0),
    maxQuantity: Number(item.max_quantity ?? 0),
    price: Number(item.price ?? 0),
    supplier: item.supplier || "",
    supplierName: item.supplier_name || "",
    unit: item.unit || "piece",
    lastRestocked: item.last_restocked || null,
    createdAt: item.created_at || null,
  });
  const mapToApi = (item) => ({
    name: item.name,
    sku: item.nomenclature,
    category: item.category ? parseInt(item.category) : null,
    material_type: item.materialType || "matiere_premiere",
    status: item.status,
    quantity: parseInt(item.quantity) || 0,
    min_quantity: parseInt(item.minQuantity) || 0,
    max_quantity: parseInt(item.maxQuantity) || 0,
    price: parseFloat(item.price) || 0,
    supplier: item.supplier ? parseInt(item.supplier) : null,
    warehouse: null,
    last_restocked: item.lastRestocked || null,
  });
  const fetchProducts = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    const response = await fetch(API_BASE, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      showAlert(errorText || "Erreur lors du chargement du stock", "error");
      return;
    }
    const data = await response.json();
    const items = Array.isArray(data) ? data : (data.results || []);
    
    // DEBUG: Voir la structure des données
    console.log("Produits reçus:", items);
    if (items.length > 0) {
      console.log("Structure du premier produit:", items[0]);
      console.log("Catégorie du premier produit:", items[0].category, items[0].category_name, items[0].category_details);
    }
    
    setProducts(items.map(mapFromApi));
  } catch (error) {
    showAlert("Erreur réseau lors du chargement du stock", "error");
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSuppliers();
  }, []);
  useEffect(() => {
    const fromUrl = searchParams.get("materialType") || "all";
    const normalized = materialTypeOptions.some((opt) => opt.value === fromUrl) ? fromUrl : "all";
    // Si le catégories vient de la sidebar (query param),
    // on neutralise les autres filtres pour afficher uniquement ce type.
    setFilterStatus("all");
    if (normalized !== filterMaterialType) {
      setFilterMaterialType(normalized);
    }
  }, [searchParams, filterMaterialType]);
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = 'http://localhost:8000/api/categories/';
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      let res = await fetch(endpoint, { headers: authHeaders });
      // L'API categories autorise la liste publique: fallback sans token si le token est invalide/expiré.
      if (!res.ok && token) {
        res = await fetch(endpoint);
      }
      if (!res.ok) throw new Error('Erreur API catégories');
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.results || []);
      const normalized = items.map((cat) => ({
        id: Number(cat.id),
        name: cat.name || '',
      }));
      setAvailableCategories(normalized);
    } catch (err) {
      console.error('Erreur lors du chargement des catégories:', err);
      showAlert('Impossible de charger les catégories', "error");
      setAvailableCategories([]);
    }
  };
  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/fournisseurs/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur API');
      const data = await res.json();
      console.log('Réponse API fournisseurs:', data);
      let items = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data.results && Array.isArray(data.results)) {
        items = data.results;
      } else {
        console.warn('Format de réponse inattendu:', data);
      }
      console.log('Fournisseurs traités:', items);
      setAvailableSuppliers(items);
    } catch (err) {
      console.error('Erreur lors du chargement des fournisseurs:', err);
      setAvailableSuppliers([]);
    }
  };
  useEffect(() => {
    if (location.pathname === "/stock/new") {
      handleOpenAddDialog();
    }
  }, [location.pathname]);
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "black", overflow: "hidden", position: "relative" }}>
      {/* Alerte style Boite Centrée - placée en haut de la page */}
     {/* Alerte modale centrée */}
<ChromeAlert
  open={alert.open}
  message={alert.message}
  severity={alert.severity}
  onClose={handleCloseAlert}
/>
      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(!mobileOpen)} selectedMenu="stock" />
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, height: "100vh", bgcolor: "black", overflowY: "auto", overflowX: "hidden", position: "relative", zIndex: 1 }}>
        {/* Header bar */}
        <Box sx={{ p: 2.7, borderBottom: "1px solid rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          {isMobile && (
            <IconButton onClick={() => setMobileOpen(!mobileOpen)} sx={{ color: "white" }}>
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ color: "white", fontWeight: 700, lineHeight: 1.1 }}>
              Gestion du Stock
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mt: 0.25 }}>
              Gérez et surveillez votre inventaire de produits
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: "auto" }}>
            <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
              <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>{user?.first_name || user?.username}</Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>{user?.is_superuser ? "Administrateur" : "Utilisateur"}</Typography>
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
        <Box sx={{ p: 3 }}>
          {/* Actions */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <IconButton onClick={fetchProducts} disabled={loading}
                sx={{ color: "#64748b", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "10px", width: 44, height: 44, "&:hover": { color: "#3b82f6", borderColor: "rgba(59,130,246,0.4)" } }}
              >
                <RefreshIcon />
              </IconButton>
              {canAddProduct && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenAddDialog()}
                  sx={{ bgcolor: "#3b82f6", color: "white", fontWeight: 600, py: 1.2, px: 3, borderRadius: 2, textTransform: "none", fontSize: "0.95rem", boxShadow: "0 4px 12px rgba(59,130,246,0.3)", "&:hover": { bgcolor: "#2563eb" } }}
                >
                  Ajouter un produit
                </Button>
              )}
            </Box>
          </Box>
          {/* Stat Cards */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            {statCards.map((s) => (
              <Box key={s.label} sx={{ flex: "1 1 0", minWidth: 200 }}>
                <StatCard
                  label={s.label}
                  value={s.value}
                  color={s.accent}
                  onClick={s.onClick}
                />
              </Box>
            ))}
          </Box>
          {/* Filter icon + Search bar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: activeFiltersCount > 0 ? 1.5 : 3 }}>
            <Tooltip title="Filtres avancés">
              <Badge
                badgeContent={activeFiltersCount}
                sx={{ "& .MuiBadge-badge": { bgcolor: "#3b82f6", color: "white", fontSize: "0.65rem", minWidth: 16, height: 16 } }}
              >
                <IconButton
                  onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                  sx={{
                    color: activeFiltersCount > 0 ? "#3b82f6" : "#64748b",
                    bgcolor: activeFiltersCount > 0 ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.05)",
                    border: activeFiltersCount > 0 ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(59,130,246,0.15)",
                    borderRadius: "10px", width: 44, height: 44, flexShrink: 0,
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
                placeholder="Rechercher par nom, nomenclature ou catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%", padding: "12px 16px 12px 48px",
                  backgroundColor: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.2)",
                  borderRadius: "10px", color: "#94a3b8",
                  fontSize: "0.9rem", outline: "none", boxSizing: "border-box",
                }}
              />
            </Box>
          </Box>
          {/* Active filter chips */}
          {activeFiltersCount > 0 && (
            <Box sx={{ display: "flex", gap: 1, mb: 2.5, flexWrap: "wrap", alignItems: "center" }}>
              {filterStatus !== "all" && (
                <Chip
                  label={statusOptions.find(s => s.value === filterStatus)?.label}
                  onDelete={() => setFilterStatus("all")} size="small"
                  sx={{ bgcolor: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)", fontWeight: 500 }}
                />
              )}
              {filterMaterialType !== "all" && (
                <Chip
                  label={materialTypeOptions.find((m) => m.value === filterMaterialType)?.label || filterMaterialType}
                  onDelete={() => handleMaterialTypeSelect("all")}
                  size="small"
                  sx={{ bgcolor: "rgba(16,185,129,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.35)", fontWeight: 500 }}
                />
              )}
              <Button size="small"
                onClick={() => { setFilterStatus("all"); handleMaterialTypeSelect("all"); }}
                sx={{ color: "#64748b", fontSize: "0.75rem", textTransform: "none", py: 0, minHeight: 0, "&:hover": { color: "#ef4444" } }}
              >
                Tout effacer
              </Button>
            </Box>
          )}
          {/* Table */}
          <Card sx={{ bgcolor: "rgba(30,41,59,0.5)", border: "1px solid rgba(59,130,246,0.1)", borderRadius: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "rgba(59,130,246,0.05)", borderBottom: "1px solid rgba(59,130,246,0.1)" }}>
                  {["Produit", "Nomenclature", "Type de matière", "Unité", "Date d'ajout", "Quantité", "Statut", "Prix", "Actions"].map((h, i) => (
                    <TableCell key={h} align={i >= 4 ? "center" : "left"} sx={{ color: "#94a3b8", fontWeight: 600, borderBottom: "none" }}>{h}</TableCell>
                  ))}
                  </TableRow>
                </TableHead>
              <TableBody>
  {filteredProducts.length > 0 ? filteredProducts.map((product) => {
    const status = getStockStatus(product.quantity, product.minQuantity, product.maxQuantity, product.status);
    // Trouver le label et la couleur du type de matière
    const materialTypeObj = materialTypeOptions.find(opt => opt.value === product.materialType);
    const materialTypeLabel = materialTypeObj ? materialTypeObj.label : product.materialType || "-";
    const materialTypeColor = materialTypeObj ? materialTypeObj.color : '#64748b';
    return (
      <TableRow key={product.id} sx={{ borderBottom: "1px solid rgba(59,130,246,0.1)", "&:hover": { bgcolor: "rgba(59,130,246,0.05)" } }}>
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "rgba(59,130,246,0.15)", width: 36, height: 36 }}>
              <InventoryIcon sx={{ fontSize: 18, color: "#3b82f6" }} />
            </Avatar>
            <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>{product.name}</Typography>
          </Box>
        </TableCell>
        <TableCell sx={{ color: "#64748b", fontSize: "0.875rem" }}>{product.nomenclature}</TableCell>
        <TableCell sx={{ color: "#94a3b8", fontSize: "0.875rem" }}>
          {materialTypeLabel && materialTypeLabel !== "-" ? (
            <Chip
              label={materialTypeLabel}
              size="small"
              sx={{
                bgcolor: materialTypeColor,
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.85rem',
                borderRadius: '6px',
                px: 2,
                py: 0.2,
                letterSpacing: 0.2,
                textTransform: 'capitalize',
                border: 'none',
                minWidth: 0,
                // maxWidth et ellipsis supprimés pour afficher tout le texte
                whiteSpace: 'normal',
                overflow: 'visible',
              }}
            />
          ) : (
            <span style={{ color: '#64748b' }}>-</span>
          )}
        </TableCell>
        <TableCell sx={{ color: "#94a3b8", fontSize: "0.875rem" }}>
          {product.unit || "piece"}
        </TableCell>
        <TableCell align="center" sx={{ color: "#cbd5e1", fontSize: "0.82rem" }}>
          {formatCreatedAt(product.createdAt)}
        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>{product.quantity}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={status.label} size="small" sx={{ bgcolor: `${status.color}20`, color: status.color, fontWeight: 600, fontSize: "0.75rem", border: `1px solid ${status.color}40` }} />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>${product.price.toFixed(2)}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, product)} sx={{ color: "#64748b", "&:hover": { color: "#3b82f6" } }}>
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={9} sx={{ border: "none" }}>
                        <Box sx={{ textAlign: "center", py: 6 }}>
                          <InventoryIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.1)", mb: 2 }} />
                          <Typography variant="h6" sx={{ color: "white", mb: 1 }}>Aucun produit trouvé</Typography>
                          <Typography sx={{ color: "#64748b" }}>
                            {searchQuery || activeFiltersCount > 0 ? "Aucun produit ne correspond à vos filtres." : "Commencez par ajouter un produit."}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      </Box>
      {/* Filter Menu */}
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
      minWidth: 300, // Augmentez de 260 à 300 ou plus
      maxWidth: 350, // Ajoutez cette ligne
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)", 
      mt: 0.5,
    },
  }}
>
        {/* Status section */}
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
          <CalendarTodayIcon sx={{ fontSize: 14, color: "#3b82f6" }} />
          <Typography variant="caption" sx={{ color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.7rem" }}>
            Statut du stock
          </Typography>
        </Box>
        {statusOptions.map((opt) => (
          <MenuItem key={opt.value} onClick={() => setFilterStatus(opt.value)} sx={menuItemSx(filterStatus === opt.value)}>
            {opt.label}
            {filterStatus === opt.value && <CheckIcon sx={{ fontSize: 16, color: "#3b82f6" }} />}
          </MenuItem>
        ))}
        <Divider sx={{ borderColor: "rgba(59,130,246,0.15)", my: 1 }} />
        {/* Material type section */}
        <Box sx={{ px: 2, pt: 0.5, pb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
          <FilterAltIcon sx={{ fontSize: 14, color: "#3b82f6" }} />
          <Typography variant="caption" sx={{ color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.7rem" }}>
            Type de matière
          </Typography>
        </Box>
       {materialTypeOptions.map((opt) => (
  <MenuItem 
    key={opt.value} 
    onClick={() => handleMaterialTypeSelect(opt.value)} 
    sx={{
      ...menuItemSx(filterMaterialType === opt.value),
      whiteSpace: "normal",
      wordBreak: "break-word", // Casse les mots longs
      py: 1.5, // Plus d'espace vertical
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {opt.icon}
      {opt.label}
    </Box>
    {filterMaterialType === opt.value && <CheckIcon sx={{ fontSize: 16, color: "#3b82f6" }} />}
  </MenuItem>
))} 
        {activeFiltersCount > 0 && (
          <>
            <Divider sx={{ borderColor: "rgba(59,130,246,0.15)", mt: 1 }} />
            <Box sx={{ p: 1.5 }}>
              <Button fullWidth size="small"
                onClick={() => { setFilterStatus("all"); handleMaterialTypeSelect("all"); setFilterAnchorEl(null); }}
                sx={{ color: "#ef4444", fontSize: "0.8rem", textTransform: "none", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", "&:hover": { bgcolor: "rgba(239,68,68,0.08)" } }}
              >
                Réinitialiser les filtres
              </Button>
            </Box>
          </>
        )}
      </Menu>
      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}
        PaperProps={{ sx: { bgcolor: "rgba(15,23,42,0.97)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", backdropFilter: "blur(12px)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" } }}
      >
        <MenuItem onClick={() => { navigate("/orders/new", { state: { prefilledProduct: selectedProduct } }); handleMenuClose(); }} sx={{ color: "#10b981", fontSize: "0.875rem", gap: 1, "&:hover": { bgcolor: "rgba(16,185,129,0.08)" } }}>
          <AddIcon fontSize="small" /> Passer une commande
        </MenuItem>
        <MenuItem onClick={() => { handleOpenAddDialog(selectedProduct); handleMenuClose(); }} sx={{ color: "#3b82f6", fontSize: "0.875rem", gap: 1, "&:hover": { bgcolor: "rgba(59,130,246,0.08)" } }}>
          <EditIcon fontSize="small" /> Modifier
        </MenuItem>
        {(user?.is_staff || user?.is_superuser) && (
          <MenuItem onClick={() => handleDeleteProduct(selectedProduct?.id)} sx={{ color: "#ef4444", fontSize: "0.875rem", gap: 1, "&:hover": { bgcolor: "rgba(239,68,68,0.08)" } }}>
            <DeleteIcon fontSize="small" /> Supprimer
          </MenuItem>
        )}
      </Menu>
      {/* Add/Edit Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: "#1e293b", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 3 } }}
      >
        <DialogTitle sx={{ color: "white", fontWeight: 700, borderBottom: "1px solid rgba(59,130,246,0.1)" }}>
          {formData.id ? "Modifier le produit" : "Ajouter un produit"}
        </DialogTitle>
        <DialogContent sx={{ pt: 5, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            select
            label="Type de matière"
            value={formData.materialType || "matiere_premiere"}
            onChange={(e) => {
              const nextType = e.target.value;
              if (formData.id) {
                setFormData({ ...formData, materialType: nextType });
                return;
              }
              setFormData({
                ...formData,
                materialType: nextType,
                nomenclature: getNextNomenclatureByType(nextType),
              });
            }}
            fullWidth
            size="small"
            sx={{ ...inputSx, mt: 1.5 }}
          >
            {materialTypeOptions.filter((opt) => opt.value !== "all").map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          {[
            { label: "Nom du produit", key: "name", type: "text" },
          ].map(({ label, key, type }) => (
            <TextField key={key} label={label} type={type} value={formData[key]} fullWidth size="small" sx={inputSx}
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            />
          ))}
          <TextField
            select
            label="Unité"
            value={formData.unit || "piece"}
            fullWidth
            size="small"
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          >
            <MenuItem value="piece">Piece</MenuItem>
            <MenuItem value="kg">Kg</MenuItem>
            <MenuItem value="g">g</MenuItem>
            <MenuItem value="l">L</MenuItem>
            <MenuItem value="ml">ml</MenuItem>
            <MenuItem value="m">m</MenuItem>
            <MenuItem value="cm">cm</MenuItem>
            <MenuItem value="boite">Boite</MenuItem>
            <MenuItem value="carton">Carton</MenuItem>
          </TextField>
          {[
            { label: "Quantité", key: "quantity", type: "number" },
            { label: "Quantité min.", key: "minQuantity", type: "number" },
            { label: "Prix", key: "price", type: "number" },
          ].map(({ label, key, type }) => (
            <TextField key={key} label={label} type={type} value={formData[key]} fullWidth size="small" sx={inputSx}
              onChange={(e) => setFormData({ ...formData, [key]: type === "number" ? (key === "price" ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0) : e.target.value })}
            />
          ))}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: "1px solid rgba(59,130,246,0.1)" }}>
          <Button onClick={handleCloseAddDialog} sx={{ color: "#94a3b8" }}>Annuler</Button>
          <Button onClick={handleSaveProduct} variant="contained" disabled={savingProduct}
            sx={{ bgcolor: "#3b82f6", fontWeight: 600, textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#2563eb" } }}
          >
            {savingProduct ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default Stock;