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
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Check as CheckIcon,
  Close as CloseIcon,
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

const BonAchat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [statistics, setStatistics] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

  const API_BASE = "http://localhost:8000/api/purchase/purchase-orders/";
  
  // Permissions
  const isSuperAdmin = user?.is_superuser || user?.role === "super_admin";
  const isApproAdmin = user?.role === "responsable_appro";

  const canApprove = isSuperAdmin;        // Seul le super admin approuve
  const canCreate = isApproAdmin || isSuperAdmin;  // Les deux peuvent créer

  const statusConfig = {
    pending: { label: "En attente", color: "#f59e0b" },
    approved: { label: "Approuvée", color: "#3b82f6" },
    rejected: { label: "Rejetée", color: "#ef4444" },
    sent: { label: "Envoyée", color: "#06b6d4" },
    delivered: { label: "Livrée", color: "#10b981" },
    cancelled: { label: "Annulée", color: "#6b7280" },
  };

  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "pending", label: "En attente" },
    { value: "approved", label: "Approuvée" },
    { value: "rejected", label: "Rejetée" },
    { value: "sent", label: "Envoyée" },
    { value: "delivered", label: "Livrée" },
    { value: "cancelled", label: "Annulée" },
  ];

  // Fonction de normalisation des statuts
  const normalizeStatus = (s) => {
    if (!s) return s;
    let status = String(s).trim().toLowerCase();
    // Supprimer les accents
    status = status.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (status === 'approuvee' || status === 'approved') return 'approved';
    if (status === 'rejetee' || status === 'rejected') return 'rejected';
    if (status === 'envoyee' || status === 'sent') return 'sent';
    if (status === 'livree' || status === 'delivered') return 'delivered';
    if (status === 'annulee' || status === 'cancelled') return 'cancelled';
    if (status === 'enattente' || status === 'pending') return 'pending';
    
    return status;
  };

  const activeFiltersCount = filterStatus !== "all" ? 1 : 0;

  // Filtrer les commandes
  const filteredOrders = (purchaseOrders || []).filter((order) => {
    const normalizedOrderStatus = normalizeStatus(order.status);
    const normalizedFilterStatus = normalizeStatus(filterStatus);

    const matchesStatus = filterStatus === "all" || normalizedOrderStatus === normalizedFilterStatus;
    const matchesSearch =
      !searchQuery ||
      order.id.toString().includes(searchQuery) ||
      (order.supplier_name &&
        order.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.created_by_name &&
        order.created_by_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const isMatch = matchesStatus && matchesSearch;
    if (!isMatch) {
      console.log("❌ Filtered Out:", order);
    }
    return isMatch;
  });

  console.log(" Filtered Orders:", filteredOrders.length);

  const pendingOrdersCount = (purchaseOrders || []).filter(
    (order) => normalizeStatus(order.status) === "pending"
  ).length;

  // Récupérer les bons d'achat
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      let allOrders = [];
      let nextUrl = API_BASE;
      
      while (nextUrl) {
        const response = await fetch(nextUrl, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          const errorText = await response.text();
          setErrorMessage(errorText || "Erreur lors du chargement des bons d'achat");
          if (allOrders.length === 0) setPurchaseOrders([]);
          return;
        }
        const data = await response.json();
        
        if (data && data.results) {
          allOrders = [...allOrders, ...data.results];
          nextUrl = data.next;
        } else if (Array.isArray(data)) {
          allOrders = data;
          nextUrl = null;
        } else {
          nextUrl = null;
        }
      }
      
      console.log("📊 Bons d'achat chargés:", allOrders.length);
      setPurchaseOrders(allOrders);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      setErrorMessage("Erreur réseau lors du chargement des bons d'achat");
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les statistiques
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

  // Charger les données au montage
  useEffect(() => {
    const loadData = async () => {
      await fetchPurchaseOrders();
      await fetchStatistics();
    };
    loadData();
  }, []);

  const handleApprovePurchaseOrder = async (orderId) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}${orderId}/approve/`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        setErrorMessage(errorText || "Erreur lors de l'approbation du bon d'achat");
        return;
      }
      const updatedOrder = await response.json();
      setPurchaseOrders((prev) =>
        prev.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
      if (selectedOrder?.id === updatedOrder.id) {
        setSelectedOrder(updatedOrder);
      }
      setSuccessMessage(`Bon d'achat #${updatedOrder.id} approuvé avec succès`);
      fetchStatistics();
      fetchPurchaseOrders();
    } catch (error) {
      setErrorMessage("Erreur réseau lors de l'approbation du bon d'achat");
    }
  };

  const handleRejectPurchaseOrder = async (orderId) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}${orderId}/reject/`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        setErrorMessage(errorText || "Erreur lors du rejet du bon d'achat");
        return;
      }
      const updatedOrder = await response.json();
      setPurchaseOrders((prev) =>
        prev.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
      if (selectedOrder?.id === updatedOrder.id) {
        setSelectedOrder(updatedOrder);
      }
      setSuccessMessage(`Bon d'achat #${updatedOrder.id} rejeté`);
      fetchStatistics();
      fetchPurchaseOrders();
    } catch (error) {
      setErrorMessage("Erreur réseau lors du rejet du bon d'achat");
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setOpenDetailsDialog(true);
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

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `bon_achat_${selectedOrder.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccessMessage(`PDF du bon d'achat #${selectedOrder.id} téléchargé avec succès`);
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      setErrorMessage("Erreur réseau lors de l'export PDF");
    }
  };

  const approveOrder = async (orderId) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}${orderId}/approve/`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        setSuccessMessage("Bon d'achat approuvé avec succès.");
        await fetchPurchaseOrders();
      } else {
        const errorText = await response.text();
        setErrorMessage(errorText || "Erreur lors de l'approbation du bon d'achat.");
      }
    } catch (error) {
      console.error("Erreur réseau lors de l'approbation:", error);
      setErrorMessage("Erreur réseau lors de l'approbation.");
    }
  };

  const statCards = statistics
    ? [
        { label: "Total", value: statistics.total_orders, color: "#3b82f6" },
        { label: "En attente", value: statistics.pending, color: "#f59e0b" },
        { label: "Approuvés", value: statistics.approved, color: "#3b82f6" },
        { label: "Envoyés", value: statistics.sent, color: "#06b6d4" },
        { label: "Livrés", value: statistics.delivered, color: "#10b981" },
      ]
    : [];

  if (loading && purchaseOrders.length === 0) {
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
                {isSuperAdmin ? "Super Admin" : "Responsable Appro"}
              </Typography>
            </Box>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: isSuperAdmin ? "#ef4444" : "#f97316",
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
                Bons d'Achat
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                {canApprove ? "Approuvez les bons d'achat" : "Consultez vos bons d'achat"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <IconButton
                onClick={fetchPurchaseOrders}
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
              {canCreate && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate("/appro/bon-achat/new")}
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
                  Créer bon d'achat
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
                      else if (s.label === "Approuvés") setFilterStatus("approved");
                      else if (s.label === "Envoyés") setFilterStatus("sent");
                      else if (s.label === "Livrés") setFilterStatus("delivered");
                      else setFilterStatus("all");
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}

          {/* Pending approval panel */}
          {canApprove && pendingOrdersCount > 0 && (
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
                    Bons d'achat en attente d'approbation
                  </Typography>
                  <Typography sx={{ color: "#fcd34d", fontSize: "0.9rem" }}>
                    {pendingOrdersCount} bon(s) nécessitent votre validation.
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
                  Voir les bons
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
                placeholder="Rechercher par ID, Fournisseur..."
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
                      ID
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
                      Fournisseur
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
                      Créé par
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
                      Montant
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
                      Date Livraison
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
                  {(purchaseOrders || []).length > 0 && filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        sx={{
                          borderBottom: "1px solid rgba(59,130,246,0.1)",
                          "&:hover": { bgcolor: "rgba(59,130,246,0.05)" },
                        }}
                      >
                        <TableCell sx={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>
                          #{order.id}
                        </TableCell>
                        <TableCell sx={{ color: "white", fontSize: "0.85rem", fontWeight: 500 }}>
                          {order.supplier_name || "N/A"}
                        </TableCell>
                        <TableCell sx={{ color: "#64748b", fontSize: "0.85rem" }}>
                          {order.created_by_name || "N/A"}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: "#10b981", fontSize: "0.85rem", fontWeight: 600 }}
                        >
                          {parseFloat(order.total_amount || 0).toLocaleString("fr-FR", {
                            minimumFractionDigits: 2,
                          })} €
                        </TableCell>
                        <TableCell sx={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                          {order.expected_delivery_date || "N/A"}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={statusConfig[normalizeStatus(order.status)]?.label || order.status}
                            sx={{
                              bgcolor: `${statusConfig[normalizeStatus(order.status)]?.color || "#64748b"}20`,
                              color: statusConfig[normalizeStatus(order.status)]?.color || "#64748b",
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ border: "none" }}>
                        <Box sx={{ textAlign: "center", py: 6 }}>
                          <Typography sx={{ color: "white", mb: 1 }}>
                            {loading ? "Chargement..." : "Aucun bon d'achat trouvé"}
                          </Typography>
                          <Typography sx={{ color: "#64748b" }}>
                            {searchQuery || filterStatus !== "all"
                              ? "Aucun bon ne correspond à vos filtres."
                              : "Commencez par créer un bon d'achat."}
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
          Détails Bon d'Achat #{selectedOrder?.id}
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
                    Fournisseur
                  </Typography>
                  <Typography sx={{ color: "white", fontWeight: 600 }}>
                    {selectedOrder.supplier_name || "N/A"}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: "#64748b", mb: 1 }}>
                    Créé par
                  </Typography>
                  <Typography sx={{ color: "white", fontWeight: 600 }}>
                    {selectedOrder.created_by_name || "N/A"}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: "#64748b", mb: 1 }}>
                    Statut
                  </Typography>
                  <Chip
                    label={statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                    sx={{
                      bgcolor: `${statusConfig[selectedOrder.status]?.color || "#64748b"}20`,
                      color: statusConfig[selectedOrder.status]?.color || "#64748b",
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 2, fontWeight: 600 }}>
                  Articles ({selectedOrder.items?.length || 0})
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
                        <TableCell sx={{ color: "#3b82f6", fontWeight: 600, fontSize: "0.85rem" }}>
                          Produit
                        </TableCell>
                        <TableCell align="center" sx={{ color: "#3b82f6", fontWeight: 600, fontSize: "0.85rem" }}>
                          Quantité
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#3b82f6", fontWeight: 600, fontSize: "0.85rem" }}>
                          Prix unitaire
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#3b82f6", fontWeight: 600, fontSize: "0.85rem" }}>
                          Sous-total
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, idx) => {
                          const quantity = Number(item.quantity) || 0;
                          const unitPrice = parseFloat(item.unit_price) || 0;
                          const subtotal = quantity * unitPrice;
                          return (
                            <TableRow
                              key={item.id || idx}
                              sx={{ "&:hover": { bgcolor: "rgba(59,130,246,0.05)" } }}
                            >
                              <TableCell sx={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                                {item.product_name || "Produit"}
                              </TableCell>
                              <TableCell align="center" sx={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                                {quantity}
                              </TableCell>
                              <TableCell align="right" sx={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                                {unitPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                              </TableCell>
                              <TableCell align="right" sx={{ color: "#10b981", fontWeight: 600, fontSize: "0.85rem" }}>
                                {subtotal.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ color: "#64748b", py: 3 }}>
                            Aucun article dans ce bon d'achat
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Box sx={{ display: "flex", gap: 3, pt: 2, borderTop: "1px solid rgba(59,130,246,0.1)" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: "#64748b", mb: 1 }}>
                    Montant total
                  </Typography>
                  <Typography sx={{ color: "#10b981", fontWeight: 700, fontSize: "1.25rem" }}>
                    {parseFloat(selectedOrder.total_amount || 0).toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })} €
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: "#64748b", mb: 1 }}>
                    Date de livraison prévue
                  </Typography>
                  <Typography sx={{ color: "white", fontWeight: 600 }}>
                    {selectedOrder.expected_delivery_date || "N/A"}
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
            {canApprove && selectedOrder?.status === "pending" && (
              <>
                <Button
                  onClick={() => handleApprovePurchaseOrder(selectedOrder.id)}
                  startIcon={<CheckIcon />}
                  sx={{
                    color: "white",
                    bgcolor: "#10b981",
                    fontWeight: 600,
                    textTransform: "none",
                    borderRadius: 2,
                    "&:hover": { bgcolor: "#059669" },
                  }}
                >
                  Approuver
                </Button>
                <Button
                  onClick={() => handleRejectPurchaseOrder(selectedOrder.id)}
                  startIcon={<CloseIcon />}
                  sx={{
                    color: "white",
                    bgcolor: "#ef4444",
                    fontWeight: 600,
                    textTransform: "none",
                    borderRadius: 2,
                    "&:hover": { bgcolor: "#dc2626" },
                  }}
                >
                  Rejeter
                </Button>
              </>
            )}
            <Button
              onClick={handleExportPDF}
              startIcon={<DownloadIcon />}
              sx={{
                color: "white",
                bgcolor: "#3b82f6",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
                "&:hover": { bgcolor: "#2563eb" },
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
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
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
            Statut du bon
          </Typography>
        </Box>
        {statusOptions.map((opt) => (
          <MenuItem
            key={opt.value}
            onClick={() => {
              setFilterStatus(opt.value);
              setFilterAnchorEl(null);
            }}
            sx={{
              px: 2,
              py: 0.8,
              color: filterStatus === opt.value ? "#3b82f6" : "#94a3b8",
              bgcolor: filterStatus === opt.value ? "rgba(59,130,246,0.1)" : "transparent",
              fontSize: "0.875rem",
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

export default BonAchat;