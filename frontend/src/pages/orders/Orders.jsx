import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Badge,
  Menu,
  Divider,
  Tooltip,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Menu as MenuIcon,
  ShoppingCart as ShoppingCartIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  DescriptionOutlined as DescriptionIcon,
  Check as CheckIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { CiFilter } from "react-icons/ci";
import SharedSidebar from "../../components/SharedSidebar";

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
        minHeight: 100,
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
          py: 2,
          px: 2.5,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
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

const Orders = () => {
  const { user } = useAuth();
  const isAdmin = user?.is_staff || user?.is_superuser;
  const isAdminAppro = user?.role === "responsable_appro";
  const canConfirmOrders =
    isAdmin || user?.role === "responsable_stock" || isAdminAppro;
  const canGenerateInvoice =
    isAdmin || user?.role === "responsable_stock" || user?.role === "responsable_facturation";
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [statistics, setStatistics] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

  const API_BASE = "http://localhost:8000/api/orders/orders/";
  const PRODUCTS_API = "http://localhost:8000/api/stock/products/";

  const statusConfig = {
    pending: { label: "En attente", color: "#f59e0b" },
    confirmed: { label: "Confirmée", color: "#3b82f6" },
    preparing: { label: "En préparation", color: "#8b5cf6" },
    shipped: { label: "Expédiée", color: "#06b6d4" },
    delivered: { label: "Livrée", color: "#10b981" },
    returned: { label: "Retournée", color: "#6b7280" },
    cancelled: { label: "Annulée", color: "#ef4444" },
  };

  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "pending", label: "En attente" },
    { value: "confirmed", label: "Confirmée" },
    { value: "preparing", label: "En préparation" },
    { value: "shipped", label: "Expédiée" },
    { value: "delivered", label: "Livrée" },
    { value: "returned", label: "Retournée" },
    { value: "cancelled", label: "Annulée" },
  ];

  const activeFiltersCount = filterStatus !== "all" ? 1 : 0;

  const menuItemSx = (active) => ({
    px: 2,
    py: 0.8,
    color: active ? "#3b82f6" : "#94a3b8",
    bgcolor: active ? "rgba(59,130,246,0.1)" : "transparent",
    fontSize: "0.875rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    "&:hover": { bgcolor: "rgba(59,130,246,0.08)", color: "white" },
  });

  //  FONCTION: Calculer le stock restant
  const normalizeProductId = (value) =>
    value === undefined || value === null || value === "" ? null : Number(value);

  const getProductById = (productId) => {
    const normalizedProductId = normalizeProductId(productId);
    if (normalizedProductId === null) return null;
    return (
      products.find((product) => normalizeProductId(product?.id) === normalizedProductId) || null
    );
  };

  const getProductStock = (product) =>
    Number(
      product?.quantity ??
        product?.quantite ??
        product?.stock_disponible ??
        product?.stockDisponible ??
        0
    ) || 0;

  const getRemainingStockForProduct = (productId) => {
    const normalizedProductId = normalizeProductId(productId);
    const product = getProductById(normalizedProductId);
    if (!product) return 0;
    return getProductStock(product);
  };

  // Filtre les commandes
  const filteredOrders = (orders || []).filter((order) => {
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      order.id.toString().includes(searchQuery) ||
      (order.customer_name &&
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.customer_email &&
        order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const pendingOrdersCount = (orders || []).filter((order) => order.status === "pending").length;

  //  Récupère les produits - UNITÉ FIXÉE
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(PRODUCTS_API, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data) ? data : data.results || [];
        const productsWithStock = items.map((product) => ({
          ...product,
          id: normalizeProductId(product.id || product.product_id),
          quantity:
            Number(
              product.quantity ??
                product.quantite ??
                product.stock_disponible ??
                product.stockDisponible ??
                0
            ) || 0,
          sku: product.sku || product.nomenclature || "",
          name: product.name || product.designation || "Produit",
          unit: product.unit || product.unite || product.measurement_unit || product.unit_of_measure || "U",
        }));
        setProducts(productsWithStock);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  //  Récupère les commandes
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      const url = canConfirmOrders ? API_BASE : `${API_BASE}my_orders/`;
      const response = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        setErrorMessage(errorText || "Erreur lors du chargement des commandes");
        setOrders([]);
        return;
      }
      const data = await response.json();
      const items = Array.isArray(data) ? data : data.results || [];
      const ordersWithItems = items.map((order) => ({
        ...order,
        items: (order.items || []).map((item) => ({
          ...item,
          id: item.id || item.order_item_id,
          product_id: item.product_id || item.product?.id,
          quantity: Number(item.quantity) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
        })),
        customer_name:
          order.customer?.full_name ||
          order.customer_name ||
          order.customer?.username ||
          "Employé",
        customer_email: order.customer?.email || order.customer_email || "",
        item_count: order.items?.length || 0,
      }));
      setOrders(ordersWithItems);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setErrorMessage("Erreur réseau lors du chargement des commandes");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Récupère les statistiques
  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}statistics/`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    }
  };

  //  useEffect - Charger les produits en premier
  useEffect(() => {
    setOrders([]);
    setProducts([]);
    const loadData = async () => {
      await fetchProducts();
      await fetchOrders();
      await fetchStatistics();
    };
    loadData();
  }, []);

  const handleNewOrder = () => {
    navigate("/orders/new");
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}${orderId}/confirm/`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        setErrorMessage(errorText || "Erreur lors de la confirmation de la commande");
        return;
      }
      const updatedOrder = await response.json();
      setOrders((prev) =>
        prev.map((order) =>
          order.id === updatedOrder.id
            ? {
                ...updatedOrder,
                items: (updatedOrder.items || []).map((item) => ({
                  ...item,
                  product_id: item.product_id || item.product?.id,
                  quantity: Number(item.quantity) || 0,
                })),
                customer_name:
                  updatedOrder.customer?.full_name || updatedOrder.customer_name,
              }
            : order
        )
      );
      if (selectedOrder?.id === updatedOrder.id) {
        setSelectedOrder({
          ...updatedOrder,
          items: (updatedOrder.items || []).map((item) => ({
            ...item,
            product_id: item.product_id || item.product?.id,
            quantity: Number(item.quantity) || 0,
          })),
        });
      }
      setSuccessMessage(`Commande #${updatedOrder.id} confirmée avec succès`);
      fetchStatistics();
      fetchOrders();
    } catch (error) {
      setErrorMessage("Erreur réseau lors de la confirmation de la commande");
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOpenDetailsDialog(true);
  };

  const handleGenerateInvoice = async (orderId) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}${orderId}/generate_invoice/`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const blocked = Array.isArray(data.blocked_products) ? data.blocked_products : [];
        if (blocked.length > 0) {
          const details = blocked
            .map(
              (p) =>
                `${p.product_name} (requis: ${p.required_quantity}, produit: ${p.produced_quantity})`
            )
            .join(" | ");
          setErrorMessage(`Production incomplète: ${details}`);
          return;
        }
        setErrorMessage(data.error || "Erreur lors de la génération de facture");
        return;
      }
      setSuccessMessage(`Facture ${data.invoice_number} générée avec succès`);
      navigate("/facturation");
    } catch (error) {
      setErrorMessage("Erreur réseau lors de la génération de facture");
    }
  };

  const handleCloseDetails = () => {
    setOpenDetailsDialog(false);
    setSelectedOrder(null);
  };

const handleExportPDF = async () => {
  if (!selectedOrder) return;
  
  try {
    const token = localStorage.getItem("access_token");
    const response = await fetch(`${API_BASE}${selectedOrder.id}/export_pdf/`, {
      method: "GET",
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      setErrorMessage(error.error || "Erreur lors de l'export PDF");
      return;
    }
    
    // Télécharger le PDF généré par ReportLab
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `commande_${selectedOrder.id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    setSuccessMessage(`PDF de la commande #${selectedOrder.id} téléchargé avec succès`);
  } catch (error) {
    console.error("Erreur lors de l'export PDF:", error);
    setErrorMessage("Erreur réseau lors de l'export PDF");
  }
};

  const statCards = statistics
    ? [
        { label: "Total", value: statistics.total_orders, color: "#3b82f6" },
        { label: "En attente", value: statistics.pending, color: "#f59e0b" },
        { label: "Confirmées", value: statistics.confirmed, color: "#3b82f6" },
        { label: "Livrées", value: statistics.delivered, color: "#10b981" },
        { label: "Annulées", value: statistics.cancelled, color: "#ef4444" },
      ]
    : [];

  if (loading && orders.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          bgcolor: "black",
        }}
      >
        <CircularProgress sx={{ color: "#3b82f6" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "black",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <SharedSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(!mobileOpen)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          height: "100vh",
          bgcolor: "black",
          position: "relative",
          zIndex: 1,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* Header bar */}
        <Box
          sx={{
            p: 1.2,
            borderBottom: "1px solid rgba(59,130,246,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          {isMobile && (
            <IconButton onClick={() => setMobileOpen(!mobileOpen)} sx={{ color: "white" }}>
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: "auto" }}>
            <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
              <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>
                {user?.first_name || user?.username}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
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

        <Box sx={{ p: 3 }}>
          {/* Title + Actions */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ color: "white", fontWeight: 700, mb: 0.5 }}>
                Commandes
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                {isAdmin || isAdminAppro ? "Gérez toutes les commandes" : "Consultez vos commandes"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <IconButton
                onClick={fetchOrders}
                disabled={loading}
                sx={{
                  color: "#64748b",
                  border: "1px solid rgba(59,130,246,0.15)",
                  borderRadius: "10px",
                  width: 44,
                  height: 44,
                  "&:hover": { color: "#3b82f6", borderColor: "rgba(59,130,246,0.4)" },
                }}
              >
                <RefreshIcon />
              </IconButton>
              {!isAdminAppro && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleNewOrder}
                  sx={{
                    bgcolor: "#3b82f6",
                    color: "white",
                    fontWeight: 600,
                    py: 1.2,
                    px: 3,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "0.95rem",
                    boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
                    "&:hover": { bgcolor: "#2563eb" },
                  }}
                >
                  Nouvelle commande
                </Button>
              )}
            </Box>
          </Box>

          {/* Stat Cards */}
          {statCards.length > 0 && (
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
              {statCards.map((s) => (
                <Box key={s.label} sx={{ flex: "1 1 0", minWidth: 150 }}>
                  <StatCard
                    label={s.label}
                    value={s.value}
                    color={s.color}
                    onClick={() => {
                      if (s.label === "En attente") setFilterStatus("pending");
                      else if (s.label === "Confirmées") setFilterStatus("confirmed");
                      else if (s.label === "Livrées") setFilterStatus("delivered");
                      else if (s.label === "Annulées") setFilterStatus("cancelled");
                      else setFilterStatus("all");
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}

          {/* Pending confirmation panel */}
          {canConfirmOrders && pendingOrdersCount > 0 && (
            <Card
              sx={{
                mb: 3,
                bgcolor: "rgba(245,158,11,0.08)",
                border: "1px solid #F59E0B40",
                borderRadius: 3,
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography sx={{ color: "#f59e0b", fontWeight: 700 }}>
                    Commandes en attente de confirmation
                  </Typography>
                  <Typography sx={{ color: "#fcd34d", fontSize: "0.9rem" }}>
                    {pendingOrdersCount} commande(s) nécessitent votre validation.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  onClick={() => setFilterStatus("pending")}
                  sx={{
                    bgcolor: "#f59e0b",
                    color: "#111827",
                    fontWeight: 700,
                    textTransform: "none",
                    "&:hover": { bgcolor: "#d97706" },
                  }}
                >
                  Voir les commandes
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Filter + Search */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: activeFiltersCount > 0 ? 1.5 : 3,
            }}
          >
            <Tooltip title="Filtres avancés">
              <Badge
                badgeContent={activeFiltersCount}
                sx={{
                  "& .MuiBadge-badge": {
                    bgcolor: "#3b82f6",
                    color: "white",
                    fontSize: "0.65rem",
                    minWidth: 16,
                    height: 16,
                  },
                }}
              >
                <IconButton
                  onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                  sx={{
                    color: activeFiltersCount > 0 ? "#3b82f6" : "#64748b",
                    bgcolor:
                      activeFiltersCount > 0
                        ? "rgba(59,130,246,0.15)"
                        : "rgba(59,130,246,0.05)",
                    border:
                      activeFiltersCount > 0
                        ? "1px solid rgba(59,130,246,0.4)"
                        : "1px solid rgba(59,130,246,0.15)",
                    borderRadius: "10px",
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    "&:hover": { bgcolor: "rgba(59,130,246,0.15)" },
                  }}
                >
                  <CiFilter size={22} />
                </IconButton>
              </Badge>
            </Tooltip>
            <Box sx={{ flex: 1, position: "relative" }}>
              <SearchIcon
                sx={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                  fontSize: 20,
                }}
              />
              <input
                type="text"
                placeholder="Rechercher par ID, Employé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 48px",
                  backgroundColor: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.2)",
                  borderRadius: "10px",
                  color: "#94a3b8",
                  fontSize: "0.9rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </Box>
          </Box>

          {/* Active filter chips */}
          {activeFiltersCount > 0 && (
            <Box
              sx={{
                display: "flex",
                gap: 1,
                mb: 2.5,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {filterStatus !== "all" && (
                <Chip
                  label={statusOptions.find((s) => s.value === filterStatus)?.label}
                  onDelete={() => setFilterStatus("all")}
                  size="small"
                  sx={{
                    bgcolor: "rgba(59,130,246,0.15)",
                    color: "#3b82f6",
                    border: "1px solid rgba(59,130,246,0.3)",
                    fontWeight: 500,
                  }}
                />
              )}
              <Button
                size="small"
                onClick={() => setFilterStatus("all")}
                sx={{
                  color: "#64748b",
                  fontSize: "0.75rem",
                  textTransform: "none",
                  py: 0,
                  minHeight: 0,
                  "&:hover": { color: "#ef4444" },
                }}
              >
                Tout effacer
              </Button>
            </Box>
          )}

          {/* Table */}
          <Card
            sx={{
              bgcolor: "rgba(30,41,59,0.5)",
              border: "1px solid rgba(59,130,246,0.1)",
              borderRadius: 3,
              overflow: "auto",
            }}
          >
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: "rgba(59,130,246,0.05)",
                      borderBottom: "1px solid rgba(59,130,246,0.1)",
                    }}
                  >
                    <TableCell
                      sx={{
                        color: "#94a3b8",
                        fontWeight: 600,
                        borderBottom: "none",
                        fontSize: "0.85rem",
                        backgroundColor: "rgba(30,41,59,0.9)",
                      }}
                    >
                      Nomenclature
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#94a3b8",
                        fontWeight: 600,
                        borderBottom: "none",
                        fontSize: "0.85rem",
                        backgroundColor: "rgba(30,41,59,0.9)",
                      }}
                    >
                      Désignation
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#94a3b8",
                        fontWeight: 600,
                        borderBottom: "none",
                        fontSize: "0.85rem",
                        backgroundColor: "rgba(30,41,59,0.9)",
                      }}
                    >
                      Unité
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: "#94a3b8",
                        fontWeight: 600,
                        borderBottom: "none",
                        fontSize: "0.85rem",
                        backgroundColor: "rgba(30,41,59,0.9)",
                      }}
                    >
                      Qté demandé
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: "#94a3b8",
                        fontWeight: 600,
                        borderBottom: "none",
                        fontSize: "0.85rem",
                        backgroundColor: "rgba(30,41,59,0.9)",
                      }}
                    >
                      Prix unitaire
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: "#94a3b8",
                        fontWeight: 600,
                        borderBottom: "none",
                        fontSize: "0.85rem",
                        backgroundColor: "rgba(30,41,59,0.9)",
                      }}
                    >
                      Qté restante
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: "#94a3b8",
                        fontWeight: 600,
                        borderBottom: "none",
                        fontSize: "0.85rem",
                        backgroundColor: "rgba(30,41,59,0.9)",
                      }}
                    >
                      Statut
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: "#94a3b8",
                        fontWeight: 600,
                        borderBottom: "none",
                        fontSize: "0.85rem",
                        backgroundColor: "rgba(30,41,59,0.9)",
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(orders || []).length > 0 && filteredOrders.length > 0 ? (
                    filteredOrders.flatMap((order) =>
                      order.items && order.items.length > 0
                        ? order.items.map((item, itemIndex) => {
                            const productId = item.product_id || item.product?.id;
                            const product = getProductById(productId);
                            const nomenclature =
                              product?.sku ||
                              product?.nomenclature ||
                              `PROD-${item.id || itemIndex + 1}`;
                            const designation = product?.name || "Produit";
                            const unite = product?.unit || product?.unite || product?.measurement_unit || "-";
                            const quantite = Number(item.quantity) || 0;
                            const prixUnitaire = parseFloat(item.unit_price) || 0;
                            const quantiteRestante = getRemainingStockForProduct(productId);
                            return (
                              <TableRow
                                key={`${order.id}-${item.id || itemIndex}`}
                                sx={{
                                  borderBottom: "1px solid rgba(59,130,246,0.1)",
                                  "&:hover": { bgcolor: "rgba(59,130,246,0.05)" },
                                }}
                              >
                                <TableCell sx={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                                  <Box>
                                    <Typography
                                      sx={{
                                        color: "white",
                                        fontWeight: 600,
                                        fontSize: "0.85rem",
                                      }}
                                    >
                                      {nomenclature}
                                    </Typography>
                                    <Typography
                                      sx={{ color: "#64748b", fontSize: "0.75rem" }}
                                    >
                                      Cmd #{order.id}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell
                                  sx={{
                                    color: "white",
                                    fontSize: "0.85rem",
                                    fontWeight: 500,
                                  }}
                                >
                                  {designation}
                                </TableCell>
                                <TableCell
                                  sx={{ color: "#64748b", fontSize: "0.85rem" }}
                                >
                                  {unite}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{ color: "#94a3b8", fontSize: "0.85rem" }}
                                >
                                  {quantite}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{ color: "#94a3b8", fontSize: "0.85rem" }}
                                >
                                  {prixUnitaire.toLocaleString("fr-FR", {
                                    minimumFractionDigits: 2,
                                  })}{" "}
                                  €
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{
                                    color: quantiteRestante > 0 ? "#10b981" : "#ef4444",
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  {quantiteRestante}
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={statusConfig[order.status]?.label || order.status}
                                    sx={{
                                      bgcolor: `${statusConfig[order.status]?.color || "#64748b"}20`,
                                      color: statusConfig[order.status]?.color || "#64748b",
                                      fontWeight: 600,
                                      fontSize: "0.75rem",
                                      px: 1,
                                      height: 24,
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Tooltip title="Voir détails">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleViewOrder(order)}
                                      sx={{ color: "#3b82f6" }}
                                    >
                                      <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        : [
                            <TableRow key={order.id}>
                              <TableCell colSpan={8} sx={{ border: "none" }}>
                                <Box sx={{ textAlign: "center", py: 2 }}>
                                  <Typography sx={{ color: "#64748b" }}>
                                    Commande #{order.id} - Aucun article
                                  </Typography>
                                  <Button
                                    size="small"
                                    onClick={() => handleViewOrder(order)}
                                    sx={{ mt: 1, color: "#3b82f6" }}
                                  >
                                    Voir détails
                                  </Button>
                                </Box>
                              </TableCell>
                            </TableRow>,
                          ]
                    )
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ border: "none" }}>
                        <Box sx={{ textAlign: "center", py: 6 }}>
                          <ShoppingCartIcon
                            sx={{
                              fontSize: 64,
                              color: "rgba(255,255,255,0.1)",
                              mb: 2,
                            }}
                          />
                          <Typography variant="h6" sx={{ color: "white", mb: 1 }}>
                            {loading ? "Chargement..." : "Aucune commande trouvée"}
                          </Typography>
                          <Typography sx={{ color: "#64748b" }}>
                            {searchQuery || filterStatus !== "all"
                              ? "Aucune commande ne correspond à vos filtres."
                              : "Commencez par créer une commande."}
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

      {/* Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#1e293b",
            border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "white",
            fontWeight: 700,
            borderBottom: "1px solid rgba(59,130,246,0.1)",
          }}
        >
          Détails Commande #{selectedOrder?.id}
        </DialogTitle>
        <DialogContent
          sx={{
            pt: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {selectedOrder && (
            <>
              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: "#64748b", mb: 1 }}>
                    Employé
                  </Typography>
                  <Typography sx={{ color: "white", fontWeight: 600 }}>
                    {selectedOrder.customer?.full_name ||
                      selectedOrder.customer_name ||
                      "N/A"}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: "#64748b", mb: 1 }}>
                    Statut
                  </Typography>
                  <Chip
                    label={
                      statusConfig[selectedOrder.status]?.label ||
                      selectedOrder.status
                    }
                    sx={{
                      bgcolor: `${
                        statusConfig[selectedOrder.status]?.color || "#64748b"
                      }20`,
                      color: statusConfig[selectedOrder.status]?.color || "#64748b",
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  sx={{ color: "#64748b", mb: 2, fontWeight: 600 }}
                >
                  Articles de la commande ({selectedOrder.items?.length || 0})
                </Typography>
                <TableContainer
                  sx={{
                    bgcolor: "rgba(59,130,246,0.05)",
                    borderRadius: 1,
                    border: "1px solid rgba(59,130,246,0.1)",
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "rgba(59,130,246,0.1)" }}>
                        <TableCell
                          sx={{
                            color: "#3b82f6",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                          }}
                        >
                          Nomenclature
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "#3b82f6",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                          }}
                        >
                          Désignation
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            color: "#3b82f6",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                          }}
                        >
                          Unité
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            color: "#3b82f6",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                          }}
                        >
                          Qté demandé
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: "#3b82f6",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                          }}
                        >
                          Prix unitaire
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: "#3b82f6",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                          }}
                        >
                          Qté restante
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            color: "#3b82f6",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                          }}
                        >
                          Statut
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, idx) => {
                          const productId = item.product_id || item.product?.id;
                          const product = getProductById(productId);
                          const nomenclature =
                            product?.sku ||
                            product?.nomenclature ||
                            `PROD-${idx + 1}`;
                          const designation = product?.name || "Produit";
                          const unite = product?.unit || product?.unite || product?.measurement_unit || "-";
                          const quantite = Number(item.quantity) || 0;
                          const prixUnitaire = parseFloat(item.unit_price) || 0;
                          const quantiteRestante = getRemainingStockForProduct(productId);
                          return (
                            <TableRow
                              key={item.id || idx}
                              sx={{ "&:hover": { bgcolor: "rgba(59,130,246,0.05)" } }}
                            >
                              <TableCell
                                sx={{ color: "#94a3b8", fontSize: "0.85rem" }}
                              >
                                {nomenclature}
                              </TableCell>
                              <TableCell
                                sx={{
                                  color: "white",
                                  fontSize: "0.85rem",
                                  fontWeight: 500,
                                }}
                              >
                                {designation}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{ color: "#64748b", fontSize: "0.85rem" }}
                              >
                                {unite}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{ color: "#94a3b8", fontSize: "0.85rem" }}
                              >
                                {quantite}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ color: "#94a3b8", fontSize: "0.85rem" }}
                              >
                                {prixUnitaire.toLocaleString("fr-FR", {
                                  minimumFractionDigits: 2,
                                })}{" "}
                                €
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  color:
                                    quantiteRestante > 0 ? "#10b981" : "#ef4444",
                                  fontSize: "0.85rem",
                                  fontWeight: 600,
                                }}
                              >
                                {quantiteRestante}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                                  sx={{
                                    bgcolor: `${statusConfig[selectedOrder.status]?.color || "#64748b"}20`,
                                    color: statusConfig[selectedOrder.status]?.color || "#64748b",
                                    fontWeight: 600,
                                    fontSize: "0.75rem",
                                    px: 1,
                                    height: 24,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            align="center"
                            sx={{ color: "#64748b", py: 3 }}
                          >
                            Aucun article dans cette commande
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: "#64748b", mb: 1 }}>
                    Date de création
                  </Typography>
                  <Typography sx={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                    {selectedOrder.created_at
                      ? new Date(selectedOrder.created_at).toLocaleDateString(
                          "fr-FR",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "N/A"}
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            borderTop: "1px solid rgba(59,130,246,0.1)",
            display: "flex",
            gap: 1,
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            {canConfirmOrders && selectedOrder?.status === "pending" && (
              <Button
                onClick={() => handleConfirmOrder(selectedOrder.id)}
                startIcon={<CheckIcon />}
                sx={{
                  color: "white",
                  bgcolor: "#3b82f6",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#2563eb" },
                }}
              >
                Confirmer
              </Button>
            )}
            {canGenerateInvoice && selectedOrder?.status !== "cancelled" && (
              <Button
                onClick={() => handleGenerateInvoice(selectedOrder.id)}
                startIcon={<DescriptionIcon />}
                sx={{
                  color: "white",
                  bgcolor: "#8b5cf6",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#7c3aed" },
                }}
              >
                Facture
              </Button>
            )}
            <Button
              onClick={handleExportPDF}
              startIcon={<DownloadIcon />}
              sx={{
                color: "white",
                bgcolor: "#10b981",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
                "&:hover": { bgcolor: "#059669" },
              }}
            >
              PDF
            </Button>
          </Box>
          <Button onClick={handleCloseDetails} sx={{ color: "#94a3b8" }}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

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
            minWidth: 260,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            mt: 0.5,
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            pt: 1.5,
            pb: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "#3b82f6",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              fontSize: "0.7rem",
            }}
          >
            Statut de la commande
          </Typography>
        </Box>
        {statusOptions.map((opt) => (
          <MenuItem
            key={opt.value}
            onClick={() => {
              setFilterStatus(opt.value);
              setFilterAnchorEl(null);
            }}
            sx={menuItemSx(filterStatus === opt.value)}
          >
            {opt.label}
            {filterStatus === opt.value && (
              <CheckIcon sx={{ fontSize: 16, color: "#3b82f6" }} />
            )}
          </MenuItem>
        ))}
        {activeFiltersCount > 0 && (
          <>
            <Divider sx={{ borderColor: "rgba(59,130,246,0.15)", mt: 1 }} />
            <Box sx={{ p: 1.5 }}>
              <Button
                fullWidth
                size="small"
                onClick={() => {
                  setFilterStatus("all");
                  setFilterAnchorEl(null);
                }}
                sx={{
                  color: "#ef4444",
                  fontSize: "0.8rem",
                  textTransform: "none",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "6px",
                  "&:hover": { bgcolor: "rgba(239,68,68,0.08)" },
                }}
              >
                Réinitialiser les filtres
              </Button>
            </Box>
          </>
        )}
      </Menu>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={3000}
        onClose={() => setErrorMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="error" sx={{ width: "100%" }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Orders;
