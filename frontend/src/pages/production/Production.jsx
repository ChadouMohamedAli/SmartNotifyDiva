import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Menu as MenuIcon,
  WarningAmber as WarningAmberIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import SharedSidebar from "../../components/SharedSidebar";
import Aurora from "../../components/Aurora/Aurora";
import { productionService } from "../../services/productionService";
import { useAuth } from "../../context/AuthContext";

const statusLabel = {
  in_progress: "En cours",
  completed: "Terminé",
  delayed: "Retard",
};

const statusColor = {
  in_progress: "info",
  completed: "success",
  delayed: "error",
};

const emptyOrder = {
  product_id: "",
  planned_quantity: 1,
  produced_quantity: 0,
  status: "in_progress",
  start_date: "",
  due_date: "",
  issue_description: "",
  materials: [],
};

const emptyMaterial = {
  name: "",
  unit: "kg",
  available_stock: 0,
  reorder_level: 0,
  is_active: true,
};

const Production = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [orderForm, setOrderForm] = useState(emptyOrder);

  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [materialForm, setMaterialForm] = useState(emptyMaterial);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isAdmin = user?.is_staff || user?.is_superuser;

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const loadData = async () => {
    try {
      const [dashboardData, ordersData, productsData, materialsData, alertsData] = await Promise.all([
        productionService.getDashboard(),
        productionService.getOrders(),
        productionService.getProducts(),
        productionService.getRawMaterials(),
        productionService.getAlerts(),
      ]);

      setDashboard(dashboardData);
      setOrders(ordersData);
      setProducts(productsData);
      setRawMaterials(materialsData);
      setAlerts(alertsData);
    } catch (error) {
      setErrorMessage("Erreur lors du chargement du module production");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateOrderDialog = () => {
    setEditingOrderId(null);
    setOrderForm(emptyOrder);
    setOrderDialogOpen(true);
  };

  const openEditOrderDialog = (order) => {
    setEditingOrderId(order.id);
    setOrderForm({
      product_id: order.product_id || "",
      planned_quantity: order.planned_quantity,
      produced_quantity: order.produced_quantity,
      status: order.status,
      start_date: order.start_date,
      due_date: order.due_date,
      issue_description: order.issue_description || "",
      materials: (order.materials || []).map((m) => ({
        material_id: m.material_id || m.material?.id || "",
        planned_quantity: m.planned_quantity,
        consumed_quantity: m.consumed_quantity,
      })),
    });
    setOrderDialogOpen(true);
  };

  const saveOrder = async () => {
    try {
      if (!orderForm.product_id || !orderForm.start_date || !orderForm.due_date) {
        setErrorMessage("Produit, date de début et date d'échéance sont obligatoires");
        return;
      }

      const payload = {
        ...orderForm,
        product_id: Number(orderForm.product_id),
        materials: (orderForm.materials || []).filter((item) => item.material_id).map((item) => ({
          material_id: Number(item.material_id),
          planned_quantity: Number(item.planned_quantity || 0),
          consumed_quantity: Number(item.consumed_quantity || 0),
        })),
      };

      if (editingOrderId) {
        await productionService.updateOrder(editingOrderId, payload);
        setSuccessMessage("Ordre de production modifié");
      } else {
        await productionService.createOrder(payload);
        setSuccessMessage("Ordre de production créé");
      }
      setOrderDialogOpen(false);
      await loadData();
    } catch (error) {
      setErrorMessage("Erreur lors de la sauvegarde de l'ordre");
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Supprimer cet ordre de production ?")) return;
    try {
      await productionService.deleteOrder(id);
      setSuccessMessage("Ordre supprimé");
      await loadData();
    } catch {
      setErrorMessage("Erreur lors de la suppression de l'ordre");
    }
  };

  const addMaterialLineToOrder = () => {
    setOrderForm((prev) => ({
      ...prev,
      materials: [...prev.materials, { material_id: "", planned_quantity: 0, consumed_quantity: 0 }],
    }));
  };

  const updateMaterialLine = (index, field, value) => {
    setOrderForm((prev) => {
      const next = [...prev.materials];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, materials: next };
    });
  };

  const removeMaterialLine = (index) => {
    setOrderForm((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  };

  const openCreateMaterialDialog = () => {
    setEditingMaterialId(null);
    setMaterialForm(emptyMaterial);
    setMaterialDialogOpen(true);
  };

  const openEditMaterialDialog = (material) => {
    setEditingMaterialId(material.id);
    setMaterialForm({
      name: material.name,
      unit: material.unit,
      available_stock: Number(material.available_stock || 0),
      reorder_level: Number(material.reorder_level || 0),
      is_active: material.is_active,
    });
    setMaterialDialogOpen(true);
  };

  const saveRawMaterial = async () => {
    try {
      if (!materialForm.name) {
        setErrorMessage("Le nom de la matière première est obligatoire");
        return;
      }

      if (editingMaterialId) {
        await productionService.updateRawMaterial(editingMaterialId, materialForm);
        setSuccessMessage("Matière première modifiée");
      } else {
        await productionService.createRawMaterial(materialForm);
        setSuccessMessage("Matière première créée");
      }
      setMaterialDialogOpen(false);
      await loadData();
    } catch {
      setErrorMessage("Erreur lors de la sauvegarde de la matière première");
    }
  };

  const deleteRawMaterial = async (id) => {
    if (!window.confirm("Supprimer cette matière première ?")) return;
    try {
      await productionService.deleteRawMaterial(id);
      setSuccessMessage("Matière première supprimée");
      await loadData();
    } catch {
      setErrorMessage("Suppression impossible (utilisée par un ordre?)");
    }
  };

  const unresolvedAlerts = useMemo(() => alerts.filter((a) => !a.is_resolved), [alerts]);

  const resolveAlert = async (id) => {
    try {
      await productionService.resolveAlert(id, true);
      setSuccessMessage("Alerte résolue");
      await loadData();
    } catch {
      setErrorMessage("Erreur lors de la résolution de l'alerte");
    }
  };

  if (!user) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "black", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography sx={{ color: "white" }}>Chargement...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "black", position: "relative" }}>
      {/* Aurora Background */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.4,
        }}
      >
        <Aurora
          colorStops={["#66a1ff", "#B19EEF", "#5227FF"]}
          blend={0.5}
          amplitude={1.0}
          speed={1}
        />
      </Box>

      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={handleDrawerToggle} selectedMenu="production" />

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, bgcolor: "black", pb: 6, position: "relative", zIndex: 1 }}>
        {/* Header */}
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
            <IconButton
              onClick={handleDrawerToggle}
              sx={{ color: "white" }}
            >
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
              <Typography
                variant="h4"
                sx={{ color: "white", fontWeight: 700, mb: 0.5 }}
              >
                Module Production
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Gestion des ordres de production et des matières premières
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <IconButton
                onClick={loadData}
                sx={{
                  color: "#64748b",
                  border: "1px solid rgba(59,130,246,0.15)",
                  borderRadius: "10px",
                  width: 44,
                  height: 44,
                  "&:hover": {
                    color: "#3b82f6",
                    borderColor: "rgba(59,130,246,0.4)",
                  },
                }}
              >
                <RefreshIcon />
              </IconButton>
              {isAdmin && (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={openCreateMaterialDialog}
                    sx={{
                      borderColor: "rgba(59,130,246,0.4)",
                      color: "#93c5fd",
                      textTransform: "none",
                      fontSize: "0.9rem",
                    }}
                  >
                    Matière première
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openCreateOrderDialog}
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
                    Nouvel ordre
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          {/* Stats Cards */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <Box sx={{ flex: "1 1 0", minWidth: 150 }}>
              <Card
                sx={{
                  bgcolor: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.2)",
                  borderRadius: 3,
                  minHeight: 110,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 24px rgba(59,130,246,0.2)",
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
                    Ordres en cours
                  </Typography>
                  <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
                    {dashboard?.order_status?.en_cours || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: "1 1 0", minWidth: 150 }}>
              <Card
                sx={{
                  bgcolor: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: 3,
                  minHeight: 110,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 24px rgba(16,185,129,0.2)",
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
                    Ordres terminés
                  </Typography>
                  <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
                    {dashboard?.order_status?.termine || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: "1 1 0", minWidth: 150 }}>
              <Card
                sx={{
                  bgcolor: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 3,
                  minHeight: 110,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 24px rgba(239,68,68,0.2)",
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
                    Ordres en retard
                  </Typography>
                  <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
                    {dashboard?.order_status?.retard || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: "1 1 0", minWidth: 150 }}>
              <Card
                sx={{
                  bgcolor: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  borderRadius: 3,
                  minHeight: 110,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 24px rgba(245,158,11,0.2)",
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
                    Alertes ouvertes
                  </Typography>
                  <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
                    {dashboard?.open_alerts_count || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Grid container spacing={3} sx={{ width: "100%" }}>
            <Grid item xs={6} sx={{ width: "50%", boxSizing: "border-box" }}>
              <Card
                sx={{
                  bgcolor: "rgba(30,41,59,0.5)",
                  border: "1px solid rgba(59,130,246,0.1)",
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Typography sx={{ color: "white", fontWeight: 600, mb: 2 }}>
                    Produits en production
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow
                          sx={{
                            backgroundColor: "rgba(59,130,246,0.05)",
                            borderBottom: "1px solid rgba(59,130,246,0.1)",
                          }}
                        >
                          <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }}>
                            Produit
                          </TableCell>
                          <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }}>
                            SKU
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(dashboard?.products_in_production || []).length > 0 ? (
                          (dashboard?.products_in_production || []).map((product) => (
                            <TableRow
                              key={product.id}
                              sx={{
                                borderBottom: "1px solid rgba(59,130,246,0.1)",
                                "&:hover": { bgcolor: "rgba(59,130,246,0.05)" },
                              }}
                            >
                              <TableCell sx={{ color: "#e2e8f0" }}>
                                {product.name}
                              </TableCell>
                              <TableCell sx={{ color: "#94a3b8" }}>
                                {product.sku}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} sx={{ textAlign: "center", py: 3 }}>
                              <Typography sx={{ color: "#64748b" }}>
                                Aucun produit en production
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6}>
              <Card
                sx={{
                  bgcolor: "rgba(30,41,59,0.5)",
                  border: "1px solid rgba(239,68,68,0.1)",
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Typography
                    sx={{
                      color: "white",
                      fontWeight: 600,
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <WarningAmberIcon sx={{ color: "#ef4444" }} /> Alertes de production
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {unresolvedAlerts.slice(0, 6).length > 0 ? (
                      unresolvedAlerts.slice(0, 6).map((alertItem) => (
                        <Box
                          key={alertItem.id}
                          sx={{
                            p: 1.2,
                            borderRadius: 2,
                            border: "1px solid rgba(239,68,68,0.2)",
                            bgcolor: "rgba(127,29,29,0.2)",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 1,
                          }}
                        >
                          <Box>
                            <Typography
                              sx={{
                                color: "#fecaca",
                                fontWeight: 600,
                                fontSize: "0.85rem",
                              }}
                            >
                              {alertItem.order_code} •{" "}
                              {alertItem.alert_type === "delay" ? "Retard" : "Problème"}
                            </Typography>
                            <Typography sx={{ color: "#cbd5e1", fontSize: "0.82rem" }}>
                              {alertItem.message}
                            </Typography>
                          </Box>
                          {isAdmin && (
                            <Button
                              size="small"
                              onClick={() => resolveAlert(alertItem.id)}
                              sx={{
                                color: "#3b82f6",
                                textTransform: "none",
                                "&:hover": { bgcolor: "rgba(59,130,246,0.1)" },
                              }}
                            >
                              Résoudre
                            </Button>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Typography sx={{ color: "#64748b", py: 2, textAlign: "center" }}>
                        Aucune alerte ouverte
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6}>
              <Card
                sx={{
                  bgcolor: "rgba(30,41,59,0.5)",
                  border: "1px solid rgba(59,130,246,0.1)",
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Typography sx={{ color: "white", fontWeight: 600, mb: 2 }}>
                    Ordres de production
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow
                          sx={{
                            backgroundColor: "rgba(59,130,246,0.05)",
                            borderBottom: "1px solid rgba(59,130,246,0.1)",
                          }}
                        >
                          <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }}>
                            Code
                          </TableCell>
                          <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }}>
                            Produit
                          </TableCell>
                          <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }} align="center">
                            Prévu
                          </TableCell>
                          <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }} align="center">
                            Produit
                          </TableCell>
                          <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }} align="center">
                            Statut
                          </TableCell>
                          <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }}>
                            Échéance
                          </TableCell>
                          <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }} align="center">
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orders.length > 0 ? (
                          orders.map((order) => (
                            <TableRow
                              key={order.id}
                              sx={{
                                borderBottom: "1px solid rgba(59,130,246,0.1)",
                                "&:hover": { bgcolor: "rgba(59,130,246,0.05)" },
                              }}
                            >
                              <TableCell sx={{ color: "#e2e8f0", fontWeight: 600 }}>
                                {order.code}
                              </TableCell>
                              <TableCell sx={{ color: "#cbd5e1" }}>
                                {order.product_name}
                              </TableCell>
                              <TableCell align="center" sx={{ color: "#cbd5e1" }}>
                                {order.planned_quantity}
                              </TableCell>
                              <TableCell align="center" sx={{ color: "#cbd5e1" }}>
                                {order.produced_quantity}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  size="small"
                                  color={statusColor[order.status] || "default"}
                                  label={statusLabel[order.status] || order.status}
                                />
                              </TableCell>
                              <TableCell sx={{ color: "#94a3b8" }}>
                                {order.due_date}
                              </TableCell>
                              <TableCell align="center">
                                {isAdmin && (
                                  <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => openEditOrderDialog(order)}
                                      sx={{ color: "#93c5fd" }}
                                    >
                                      <EditIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => deleteOrder(order.id)}
                                      sx={{ color: "#fca5a5" }}
                                    >
                                      <DeleteIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Box>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} sx={{ textAlign: "center", py: 3 }}>
                              <Typography sx={{ color: "#64748b" }}>
                                Aucun ordre de production
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6}>
              <Card
                sx={{
                  bgcolor: "rgba(30,41,59,0.5)",
                  border: "1px solid rgba(16,185,129,0.1)",
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Typography sx={{ color: "white", fontWeight: 600, mb: 2 }}>
                    Ressources utilisées (Matières premières)
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow
                          sx={{
                            backgroundColor: "rgba(59,130,246,0.05)",
                            borderBottom: "1px solid rgba(59,130,246,0.1)",
                          }}
                        >
                          <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }}>
                            Nom
                          </TableCell>
                          <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }}>
                            Unité
                          </TableCell>
                          <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }} align="center">
                            Stock disponible
                          </TableCell>
                          <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }} align="center">
                            Seuil réappro
                          </TableCell>
                          <TableCell sx={{ color: "#94a3b8", fontWeight: 600 }} align="center">
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rawMaterials.length > 0 ? (
                          rawMaterials.map((material) => (
                            <TableRow
                              key={material.id}
                              sx={{
                                borderBottom: "1px solid rgba(59,130,246,0.1)",
                                "&:hover": { bgcolor: "rgba(59,130,246,0.05)" },
                              }}
                            >
                              <TableCell sx={{ color: "#e2e8f0" }}>
                                {material.name}
                              </TableCell>
                              <TableCell sx={{ color: "#cbd5e1" }}>
                                {material.unit}
                              </TableCell>
                              <TableCell align="center" sx={{ color: "#cbd5e1" }}>
                                {material.available_stock}
                              </TableCell>
                              <TableCell align="center" sx={{ color: "#cbd5e1" }}>
                                {material.reorder_level}
                              </TableCell>
                              <TableCell align="center">
                                {isAdmin && (
                                  <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => openEditMaterialDialog(material)}
                                      sx={{ color: "#6ee7b7" }}
                                    >
                                      <EditIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => deleteRawMaterial(material.id)}
                                      sx={{ color: "#fca5a5" }}
                                    >
                                      <DeleteIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Box>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} sx={{ textAlign: "center", py: 3 }}>
                              <Typography sx={{ color: "#64748b" }}>
                                Aucune matière première
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>

      <Dialog
        open={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: "#0f172a",
            backgroundImage: "none",
            color: "white",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "rgba(59,130,246,0.05)",
            borderBottom: "1px solid rgba(59,130,246,0.1)",
            color: "white",
            fontWeight: 700,
            fontSize: "1.2rem",
          }}
        >
          {editingOrderId ? "Modifier ordre de production" : "Nouvel ordre de production"}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "#0f172a", pt: 3 }}>
          <Grid container spacing={2}>
            {/* Produit - Full width */}
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Produit"
                value={orderForm.product_id}
                onChange={(e) =>
                  setOrderForm((prev) => ({ ...prev, product_id: e.target.value }))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#e2e8f0",
                    "& fieldset": { borderColor: "rgba(59,130,246,0.2)" },
                    "&:hover fieldset": { borderColor: "rgba(59,130,246,0.4)" },
                    "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                  },
                  "& .MuiInputBase-input::placeholder": { color: "#64748b" },
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
                }}
              >
                {products.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Quantités - 2 colonnes */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Qté prévue"
                value={orderForm.planned_quantity}
                onChange={(e) =>
                  setOrderForm((prev) => ({
                    ...prev,
                    planned_quantity: Number(e.target.value),
                  }))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#e2e8f0",
                    "& fieldset": { borderColor: "rgba(59,130,246,0.2)" },
                    "&:hover fieldset": { borderColor: "rgba(59,130,246,0.4)" },
                    "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                  },
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Qté produite"
                value={orderForm.produced_quantity}
                onChange={(e) =>
                  setOrderForm((prev) => ({
                    ...prev,
                    produced_quantity: Number(e.target.value),
                  }))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#e2e8f0",
                    "& fieldset": { borderColor: "rgba(59,130,246,0.2)" },
                    "&:hover fieldset": { borderColor: "rgba(59,130,246,0.4)" },
                    "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                  },
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
                }}
              />
            </Grid>

            {/* Statut - Full width */}
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Statut"
                value={orderForm.status}
                onChange={(e) =>
                  setOrderForm((prev) => ({ ...prev, status: e.target.value }))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#e2e8f0",
                    "& fieldset": { borderColor: "rgba(59,130,246,0.2)" },
                    "&:hover fieldset": { borderColor: "rgba(59,130,246,0.4)" },
                    "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                  },
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
                }}
              >
                <MenuItem value="in_progress">En cours</MenuItem>
                <MenuItem value="completed">Terminé</MenuItem>
                <MenuItem value="delayed">Retard</MenuItem>
              </TextField>
            </Grid>

            {/* Dates - 2 colonnes */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Date début"
                InputLabelProps={{ shrink: true }}
                value={orderForm.start_date}
                onChange={(e) =>
                  setOrderForm((prev) => ({ ...prev, start_date: e.target.value }))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#e2e8f0",
                    "& fieldset": { borderColor: "rgba(59,130,246,0.2)" },
                    "&:hover fieldset": { borderColor: "rgba(59,130,246,0.4)" },
                    "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                  },
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Date échéance"
                InputLabelProps={{ shrink: true }}
                value={orderForm.due_date}
                onChange={(e) =>
                  setOrderForm((prev) => ({ ...prev, due_date: e.target.value }))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#e2e8f0",
                    "& fieldset": { borderColor: "rgba(59,130,246,0.2)" },
                    "&:hover fieldset": { borderColor: "rgba(59,130,246,0.4)" },
                    "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                  },
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
                }}
              />
            </Grid>

            {/* Description - Full width */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Problème de production (optionnel)"
                value={orderForm.issue_description}
                onChange={(e) =>
                  setOrderForm((prev) => ({
                    ...prev,
                    issue_description: e.target.value,
                  }))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#e2e8f0",
                    "& fieldset": { borderColor: "rgba(59,130,246,0.2)" },
                    "&:hover fieldset": { borderColor: "rgba(59,130,246,0.4)" },
                    "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                  },
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
                }}
              />
            </Grid>
          </Grid>

          {/* Matières premières */}
          <Box
            sx={{
              mt: 3,
              p: 2,
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: 2,
              bgcolor: "rgba(15,23,42,0.5)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  color: "white",
                  fontSize: "0.95rem",
                }}
              >
                Matières premières utilisées
              </Typography>
              <Button
                onClick={addMaterialLineToOrder}
                size="small"
                variant="text"
                sx={{
                  textTransform: "none",
                  color: "#3b82f6",
                  "&:hover": { bgcolor: "rgba(59,130,246,0.1)" },
                }}
              >
                + Ajouter
              </Button>
            </Box>
            <Grid container spacing={1}>
              {(orderForm.materials || []).map((line, idx) => (
                <React.Fragment key={`line-${idx}`}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Matière"
                      value={line.material_id}
                      onChange={(e) =>
                        updateMaterialLine(idx, "material_id", e.target.value)
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: "#e2e8f0",
                          fontSize: "0.875rem",
                          "& fieldset": { borderColor: "rgba(59,130,246,0.2)" },
                          "&:hover fieldset": { borderColor: "rgba(59,130,246,0.4)" },
                          "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                        },
                        "& .MuiInputLabel-root": { color: "#94a3b8" },
                        "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
                      }}
                    >
                      {rawMaterials.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          {m.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Qté prévue"
                      value={line.planned_quantity}
                      onChange={(e) =>
                        updateMaterialLine(idx, "planned_quantity", e.target.value)
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: "#e2e8f0",
                          fontSize: "0.875rem",
                          "& fieldset": { borderColor: "rgba(59,130,246,0.2)" },
                          "&:hover fieldset": { borderColor: "rgba(59,130,246,0.4)" },
                          "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                        },
                        "& .MuiInputLabel-root": { color: "#94a3b8" },
                        "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
                      }}
                    />
                  </Grid>
                  <Grid item xs={11} sm={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Qté consommée"
                      value={line.consumed_quantity}
                      onChange={(e) =>
                        updateMaterialLine(idx, "consumed_quantity", e.target.value)
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: "#e2e8f0",
                          fontSize: "0.875rem",
                          "& fieldset": { borderColor: "rgba(59,130,246,0.2)" },
                          "&:hover fieldset": { borderColor: "rgba(59,130,246,0.4)" },
                          "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                        },
                        "& .MuiInputLabel-root": { color: "#94a3b8" },
                        "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
                      }}
                    />
                  </Grid>
                  <Grid item xs={1} sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IconButton
                      size="small"
                      onClick={() => removeMaterialLine(idx)}
                      sx={{
                        color: "#fca5a5",
                        "&:hover": { bgcolor: "rgba(252,165,165,0.1)" },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Grid>
                </React.Fragment>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            bgcolor: "rgba(59,130,246,0.05)",
            borderTop: "1px solid rgba(59,130,246,0.1)",
            p: 2,
            gap: 1,
          }}
        >
          <Button
            onClick={() => setOrderDialogOpen(false)}
            sx={{
              color: "#94a3b8",
              textTransform: "none",
              "&:hover": { bgcolor: "rgba(59,130,246,0.1)" },
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={saveOrder}
            variant="contained"
            sx={{
              bgcolor: "#3b82f6",
              color: "white",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { bgcolor: "#2563eb" },
            }}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={materialDialogOpen}
        onClose={() => setMaterialDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: "#0f172a",
            backgroundImage: "none",
            color: "white",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "rgba(59,130,246,0.05)",
            borderBottom: "1px solid rgba(59,130,246,0.1)",
            color: "white",
            fontWeight: 700,
            fontSize: "1.2rem",
          }}
        >
          {editingMaterialId ? "Modifier matière première" : "Nouvelle matière première"}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "#0f172a", pt: 3 }}>
          <Grid container spacing={2}>
            {/* Nom - Full width */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom"
                value={materialForm.name}
                onChange={(e) =>
                  setMaterialForm((prev) => ({ ...prev, name: e.target.value }))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#e2e8f0",
                    "& fieldset": { borderColor: "rgba(59,130,246,0.2)" },
                    "&:hover fieldset": { borderColor: "rgba(59,130,246,0.4)" },
                    "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                  },
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
                }}
              />
            </Grid>

            {/* Unité - 3 colonnes */}
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Unité"
                value={materialForm.unit}
                onChange={(e) =>
                  setMaterialForm((prev) => ({ ...prev, unit: e.target.value }))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#e2e8f0",
                    "& fieldset": { borderColor: "rgba(59,130,246,0.2)" },
                    "&:hover fieldset": { borderColor: "rgba(59,130,246,0.4)" },
                    "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                  },
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
                }}
              >
                <MenuItem value="kg">Kg</MenuItem>
                <MenuItem value="l">Litre</MenuItem>
                <MenuItem value="piece">Pièce</MenuItem>
              </TextField>
            </Grid>

            {/* Stock dispo - 3 colonnes */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Stock dispo"
                value={materialForm.available_stock}
                onChange={(e) =>
                  setMaterialForm((prev) => ({
                    ...prev,
                    available_stock: Number(e.target.value),
                  }))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#e2e8f0",
                    "& fieldset": { borderColor: "rgba(59,130,246,0.2)" },
                    "&:hover fieldset": { borderColor: "rgba(59,130,246,0.4)" },
                    "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                  },
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
                }}
              />
            </Grid>

            {/* Seuil réappro - 3 colonnes */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Seuil réappro"
                value={materialForm.reorder_level}
                onChange={(e) =>
                  setMaterialForm((prev) => ({
                    ...prev,
                    reorder_level: Number(e.target.value),
                  }))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#e2e8f0",
                    "& fieldset": { borderColor: "rgba(59,130,246,0.2)" },
                    "&:hover fieldset": { borderColor: "rgba(59,130,246,0.4)" },
                    "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                  },
                  "& .MuiInputLabel-root": { color: "#94a3b8" },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            bgcolor: "rgba(59,130,246,0.05)",
            borderTop: "1px solid rgba(59,130,246,0.1)",
            p: 2,
            gap: 1,
          }}
        >
          <Button
            onClick={() => setMaterialDialogOpen(false)}
            sx={{
              color: "#94a3b8",
              textTransform: "none",    
              "&:hover": { bgcolor: "rgba(59,130,246,0.1)" },
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={saveRawMaterial}
            variant="contained"
            sx={{
              bgcolor: "#3b82f6",
              color: "white",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { bgcolor: "#2563eb" },
            }}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage("")}>
        <Alert severity="success" sx={{ width: "100%" }}>{successMessage}</Alert>
      </Snackbar>
      <Snackbar open={!!errorMessage} autoHideDuration={4000} onClose={() => setErrorMessage("")}>
        <Alert severity="error" sx={{ width: "100%" }}>{errorMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Production;
