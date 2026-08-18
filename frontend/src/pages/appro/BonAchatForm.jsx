import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useActivityContext } from "../../context/ActivityContext";
import { useLocation, useNavigate } from "react-router-dom";
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
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  InputAdornment,
  Badge,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  Paper,
  LinearProgress,
  Grid,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Business as BusinessIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Menu as MenuIcon,
  Check as CheckIcon,
  FilterList as FilterListIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  AttachMoney as AttachMoneyIcon,
  LocalShipping as LocalShippingIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FileDownload as FileDownloadIcon,
  Close as CloseIcon,
  ShoppingCart as ShoppingCartIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { CiFilter } from "react-icons/ci";
import SharedSidebar from "../../components/SharedSidebar";

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const C = {
  bg: "black",
  surface: "#0d1321",
  surfaceHi: "#111827",
  border: "#1e2d42",
  borderHi: "#2d4a6e",
  accent: "#3b82f6",
  accentDim: "rgba(59,130,246,0.12)",
  accentHi: "#60a5fa",
  success: "#10b981",
  successDim: "rgba(16,185,129,0.12)",
  danger: "#ef4444",
  dangerDim: "rgba(239,68,68,0.12)",
  warning: "#f59e0b",
  warningDim: "rgba(245,158,11,0.12)",
  info: "#8b5cf6",
  infoDim: "rgba(139,92,246,0.12)",
  text: "#f1f5f9",
  textMuted: "#64748b",
  textSub: "#94a3b8",
};

const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const extractNumericPrice = (priceString) => {
  if (!priceString) return "";
  const match = String(priceString).match(/(\d+(?:[.,]\d+)?)/);
  return match ? match[1].replace(",", ".") : "";
};

const BonAchatForm = () => {
  const { user } = useAuth();
  const { triggerActivityRefresh } = useActivityContext();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedSupplierForDialog, setSelectedSupplierForDialog] = useState(
    location.state?.selectedSupplier || null
  );
  const [activeStep, setActiveStep] = useState(0);

  // 🔒 CORRECTION: Le statut est forcé à "pending" et ne peut pas être modifié
  const [formData, setFormData] = useState({
    supplier: location.state?.selectedSupplier?.id || "",
    expected_delivery_date: "",
    items: [],
  });

  const [newItem, setNewItem] = useState({
    product: "",
    quantity: "",
    unit_price: "",
  });

  const API_BASE = "http://localhost:8000/api/purchase/";

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.supplier && suppliers.length > 0) {
      const selectedSupplier = suppliers.find(s => s.id === formData.supplier);
      
      if (selectedSupplier) {
        setSelectedSupplierForDialog(selectedSupplier);
        if (selectedSupplier.prix_unitaire && !newItem.unit_price) {
          const numericPrice = extractNumericPrice(selectedSupplier.prix_unitaire);
          setNewItem(prev => ({ ...prev, unit_price: numericPrice }));
        }

        const productsInSector = products.filter(p => 
          p.material_type === selectedSupplier.secteur
        );
        setFilteredProducts(productsInSector);
      } else {
        setFilteredProducts([]);
        setNewItem({ product: "", quantity: "", unit_price: "" });
      }
    } else {
      setFilteredProducts([]);
    }
  }, [formData.supplier, suppliers, products]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      const headers = token ? { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };

      const [suppRes, prodRes] = await Promise.all([
        fetch("http://localhost:8000/api/fournisseurs/", { headers }),
        fetch("http://localhost:8000/api/stock/products/", { headers }),
      ]);

      if (suppRes.ok) {
        const data = await suppRes.json();
        const suppliersList = Array.isArray(data) ? data : data.results || [];
        setSuppliers(suppliersList);
        
        if (selectedSupplierForDialog && !formData.supplier) {
          const found = suppliersList.find(s => s.id === selectedSupplierForDialog.id);
          if (found) {
            setFormData(prev => ({ ...prev, supplier: found.id }));
          }
        }
      }
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      setErrorMessage("Erreur lors du chargement des données");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (activeStep === 0 && !formData.supplier) {
      setErrorMessage("Veuillez sélectionner un fournisseur");
      return;
    }
    if (activeStep === 1 && !formData.expected_delivery_date) {
      setErrorMessage("Veuillez sélectionner une date de livraison");
      return;
    }
    setErrorMessage("");
    setActiveStep(prev => prev + 1);
  };

  const prevStep = () => {
    setErrorMessage("");
    setActiveStep(prev => prev - 1);
  };

  const handleAddItem = () => {
    if (!newItem.product || !newItem.quantity || !newItem.unit_price) {
      setErrorMessage("Veuillez remplir tous les champs de l'article");
      return;
    }

    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product: parseInt(newItem.product),
          quantity: parseInt(newItem.quantity),
          unit_price: parseFloat(newItem.unit_price),
        },
      ],
    }));

    const selectedSupplier = suppliers.find(s => s.id === formData.supplier);
    const numericPrice = selectedSupplier?.prix_unitaire ? extractNumericPrice(selectedSupplier.prix_unitaire) : "";

    setNewItem({ product: "", quantity: "", unit_price: numericPrice });
    setSuccessMessage("Article ajouté");
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSavePurchaseOrder = async () => {
    if (!formData.supplier || !formData.expected_delivery_date || formData.items.length === 0) {
      setErrorMessage("Fournisseur, date de livraison et articles requis");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const headers = token ? { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
      
      // 🔒 CORRECTION: Le statut est forcé à "pending" et N'EST PAS envoyé dans le payload
      // Le backend va automatiquement le mettre à "pending"
      const payload = {
        supplier: formData.supplier,
        expected_delivery_date: formData.expected_delivery_date,
        items: formData.items,
      };

      const response = await fetch(`${API_BASE}purchase-orders/`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: "Erreur serveur" };
        }
        
        let errorMsg = errorData.error || "Erreur lors de la création";
        if (errorData.items) {
          if (Array.isArray(errorData.items)) {
            errorData.items.forEach((itemErr, idx) => {
              if (typeof itemErr === 'object') {
                Object.entries(itemErr).forEach(([field, msgs]) => {
                  const msgText = Array.isArray(msgs) ? msgs.join(", ") : msgs;
                  errorMsg += `\nArticle ${idx + 1} - ${field}: ${msgText}`;
                });
              }
            });
          }
        }
        setErrorMessage(errorMsg);
        return;
      }

      const createdOrder = await response.json();
      setSuccessMessage(`Bon d'achat #${createdOrder.id} créé avec succès (en attente d'approbation)`);
      triggerActivityRefresh();
      setTimeout(() => {
        navigate("/appro/bon-achat");
      }, 2000);
    } catch (error) {
      setErrorMessage("Erreur réseau");
      console.error(error);
    }
  };

  const totalAmount = useMemo(() => {
    return formData.items.reduce((sum, item) => {
      const quantity = parseInt(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      return sum + quantity * unitPrice;
    }, 0);
  }, [formData.items]);

  const largeInputSx = {
    "& .MuiOutlinedInput-root": {
      color: C.textSub,
      "& fieldset": { borderColor: C.border },
      "&:hover fieldset": { borderColor: C.borderHi },
      "&.Mui-focused fieldset": { borderColor: C.accent },
      bgcolor: "rgba(0,0,0,0.3)",
      borderRadius: "10px",
    },
    "& .MuiInputLabel-root": { color: C.textMuted },
    "& .MuiInputLabel-root.Mui-focused": { color: C.accent },
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", bgcolor: C.bg }}>
        <CircularProgress sx={{ color: C.accent }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: C.bg, overflow: "hidden" }}>
      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(!mobileOpen)} />

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, height: "100vh", bgcolor: C.bg, overflowY: "auto", overflowX: "hidden" }}>
        {/* Header */}
        <Box sx={{ p: 1.2, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          {isMobile && (
            <IconButton onClick={() => setMobileOpen(!mobileOpen)} sx={{ color: C.text }}>
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
              <Typography variant="body2" sx={{ color: C.text, fontWeight: 600 }}>
                {user?.first_name || user?.username}
              </Typography>
              <Typography variant="caption" sx={{ color: C.textMuted }}>
                Responsable Approvisionnement
              </Typography>
            </Box>
            <Avatar sx={{ width: 40, height: 40, bgcolor: C.accent, fontWeight: 600, fontSize: "1rem" }}>
              {user?.first_name?.charAt(0)?.toUpperCase() || "U"}
            </Avatar>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Titre avec bouton retour */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Tooltip title="Retour à la liste">
              <IconButton
                onClick={() => navigate("/appro/bon-achat")}
                sx={{ color: C.accent }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Box>
              <Typography variant="h4" sx={{ color: C.text, fontWeight: 700 }}>
                Créer un Bon d'Achat
              </Typography>
              <Typography variant="body2" sx={{ color: C.textMuted }}>
                Configurez votre nouvelle commande auprès d'un fournisseur
              </Typography>
            </Box>
          </Box>

          {/* Dialogue/Formulaire */}
          <Card sx={{ bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden" }}>
            {/* Header professionnel */}
            <Box sx={{ p: 3, borderBottom: `1px solid ${C.border}` }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                <ReceiptIcon sx={{ color: C.accent, fontSize: 24 }} />
                <Typography sx={{ color: C.text, fontSize: "1.25rem", fontWeight: 700 }}>
                  Configuration du bon d'achat
                </Typography>
              </Box>
              <Typography sx={{ color: C.textMuted, fontSize: "0.875rem" }}>
                Suivez les étapes pour créer votre commande
              </Typography>
              <Chip label={`Étape ${activeStep + 1} / 3`} size="small" sx={{ mt: 1, bgcolor: C.accentDim, color: C.accent }} />
            </Box>

            {/* Stepper */}
            <Box sx={{ px: 3, pt: 3 }}>
              <Stepper activeStep={activeStep}>
                {["Fournisseur", "Détails", "Articles"].map((label) => (
                  <Step key={label}>
                    <StepLabel sx={{ "& .MuiStepLabel-label": { color: C.textMuted }, "& .MuiStepLabel-label.Mui-active": { color: C.text }, "& .MuiStepIcon-root": { color: C.border }, "& .MuiStepIcon-root.Mui-active": { color: C.accent }, "& .MuiStepIcon-root.Mui-completed": { color: C.success } }}>
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            {/* Content */}
            <Box sx={{ p: 3, minHeight: 380 }}>
              {/* ÉTAPE 0 — Fournisseur */}
              {activeStep === 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <FormControl fullWidth size="medium" sx={largeInputSx}>
                    <InputLabel sx={{ fontWeight: 500 }}>Sélectionner un fournisseur *</InputLabel>
                    <Select
                      value={formData.supplier}
                      label="Sélectionner un fournisseur *"
                      onChange={(e) => {
                        const selectedSupplierId = e.target.value;
                        setFormData({ ...formData, supplier: selectedSupplierId });
                        const selected = suppliers.find(s => s.id === selectedSupplierId);
                        setSelectedSupplierForDialog(selected);
                      }}
                    >
                      {suppliers.map((supp) => (
                        <MenuItem key={supp.id} value={supp.id}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                            <BusinessIcon sx={{ fontSize: 18, color: C.accent }} />
                            <Box>
                              <Typography sx={{ fontWeight: 600 }}>{supp.name}</Typography>
                              <Typography variant="caption" sx={{ color: C.textMuted }}>
                                {supp.email || "Sans email"}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {formData.supplier && selectedSupplierForDialog && (
                    <Paper sx={{ bgcolor: hexToRgba(C.accent, 0.08), border: `2px solid ${C.accent}`, p: 2.5, borderRadius: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <EmailIcon sx={{ color: C.accent, mt: 0.5 }} />
                            <Box>
                              <Typography variant="caption" sx={{ color: C.textMuted, display: "block", mb: 0.5 }}>
                                Email
                              </Typography>
                              <Typography sx={{ color: C.text, fontWeight: 500 }}>
                                {selectedSupplierForDialog.email || "N/A"}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <PhoneIcon sx={{ color: C.accent, mt: 0.5 }} />
                            <Box>
                              <Typography variant="caption" sx={{ color: C.textMuted, display: "block", mb: 0.5 }}>
                                Téléphone
                              </Typography>
                              <Typography sx={{ color: C.text, fontWeight: 500 }}>
                                {selectedSupplierForDialog.phone || "N/A"}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  )}
                </Box>
              )}

              {/* ÉTAPE 1 — Détails */}
              {activeStep === 1 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <TextField
                    label="Date de livraison attendue"
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                    fullWidth
                    size="medium"
                    sx={largeInputSx}
                    InputLabelProps={{ shrink: true }}
                    required
                  />

                  {/* 🔒 Message d'information sur le statut */}
                  <Box sx={{ p: 2.5, bgcolor: hexToRgba(C.warning, 0.1), border: `2px solid ${C.warning}`, borderRadius: 2 }}>
                    <Typography sx={{ color: C.textMuted, fontSize: "0.85rem", fontWeight: 500, mb: 1 }}>
                      Statut automatique
                    </Typography>
                    <Chip 
                      label="En attente d'approbation" 
                      sx={{ bgcolor: hexToRgba(C.warning, 0.2), color: C.warning, fontWeight: 700, border: `1px solid ${C.warning}` }} 
                    />
                    <Typography variant="caption" sx={{ color: C.textMuted, display: "block", mt: 1 }}>
                      Le super admin approuvera cette commande
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* ÉTAPE 2 — Articles */}
              {activeStep === 2 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Paper sx={{ bgcolor: hexToRgba(C.accent, 0.05), border: `1px solid ${C.border}`, p: 2.5, borderRadius: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={5}>
                        <FormControl fullWidth size="small" sx={largeInputSx}>
                          <InputLabel>Produit *</InputLabel>
                          <Select
                            value={newItem.product}
                            label="Produit *"
                            onChange={(e) => setNewItem({ ...newItem, product: e.target.value })}
                          >
                            {filteredProducts.length > 0 ? (
                              filteredProducts.map((prod) => (
                                <MenuItem key={prod.id} value={prod.id}>
                                  {prod.name} ({prod.sku || prod.code})
                                </MenuItem>
                              ))
                            ) : (
                              <MenuItem disabled>
                                Aucun produit disponible
                              </MenuItem>
                            )}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={2.5}>
                        <TextField
                          label="Quantité"
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                          fullWidth
                          size="small"
                          sx={largeInputSx}
                          inputProps={{ min: 1 }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={2.5}>
                        <TextField
                          label="Prix (DH)"
                          type="number"
                          value={newItem.unit_price}
                          onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                          fullWidth
                          size="small"
                          sx={largeInputSx}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={2}>
                        <Button
                          variant="contained"
                          onClick={handleAddItem}
                          fullWidth
                          sx={{ bgcolor: C.success, color: "white", fontWeight: 600, textTransform: "none", height: "40px", "&:hover": { bgcolor: "#059669" } }}
                        >
                          Ajouter
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>

                  {formData.items.length > 0 && (
                    <>
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                          <Badge badgeContent={formData.items.length} color="primary">
                            <ShoppingCartIcon sx={{ color: C.accent, fontSize: 20 }} />
                          </Badge>
                          <Typography sx={{ color: C.text, fontWeight: 600 }}>
                            Articles ({formData.items.length})
                          </Typography>
                        </Box>
                        <TableContainer sx={{ bgcolor: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 2, overflow: "hidden" }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: hexToRgba(C.accent, 0.15) }}>
                                <TableCell sx={{ color: C.text, fontWeight: 700 }}>Produit</TableCell>
                                <TableCell align="center" sx={{ color: C.text, fontWeight: 700 }}>Quantité</TableCell>
                                <TableCell align="right" sx={{ color: C.text, fontWeight: 700 }}>Prix Unitaire</TableCell>
                                <TableCell align="right" sx={{ color: C.text, fontWeight: 700 }}>Total</TableCell>
                                <TableCell align="center" sx={{ color: C.text, fontWeight: 700 }}>Action</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {formData.items.map((item, idx) => {
                                const product = products.find((p) => p.id === item.product);
                                const unitPrice = parseFloat(item.unit_price) || 0;
                                const quantity = parseInt(item.quantity) || 0;
                                return (
                                  <TableRow key={idx} sx={{ borderBottom: `1px solid ${C.border}`, "&:hover": { bgcolor: hexToRgba(C.accent, 0.05) } }}>
                                    <TableCell sx={{ color: C.text, fontWeight: 500 }}>{product?.name}</TableCell>
                                    <TableCell align="center" sx={{ color: C.text }}>
                                      <Chip label={quantity} size="small" variant="outlined" sx={{ borderColor: C.accent, color: C.accent }} />
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: C.text }}>{unitPrice.toFixed(2)} DH</TableCell>
                                    <TableCell align="right" sx={{ color: C.success, fontWeight: 700 }}>{(quantity * unitPrice).toFixed(2)} DH</TableCell>
                                    <TableCell align="center">
                                      <IconButton size="small" onClick={() => handleRemoveItem(idx)} sx={{ color: C.danger }}>
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        <Box sx={{ mt: 2, p: 2.5, bgcolor: hexToRgba(C.success, 0.12), border: `2px solid ${C.success}`, borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Box>
                            <Typography sx={{ color: C.textMuted, fontSize: "0.9rem", mb: 0.5 }}>
                              Montant total
                            </Typography>
                            <Typography sx={{ color: C.success, fontWeight: 700, fontSize: "1.3rem" }}>
                              {totalAmount.toFixed(2)} DH
                            </Typography>
                          </Box>
                          <AttachMoneyIcon sx={{ fontSize: 40, color: C.success, opacity: 0.3 }} />
                        </Box>
                      </Box>
                    </>
                  )}

                  {errorMessage && (
                    <Alert severity="error" onClose={() => setErrorMessage("")}>
                      {errorMessage}
                    </Alert>
                  )}
                </Box>
              )}

              {/* Erreurs générales */}
              {errorMessage && activeStep !== 2 && (
                <Alert severity="error" onClose={() => setErrorMessage("")} sx={{ mt: 2 }}>
                  {errorMessage}
                </Alert>
              )}
            </Box>

            {/* Footer */}
            <Box sx={{ p: 3, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Button onClick={prevStep} disabled={activeStep === 0} sx={{ color: C.textMuted }}>
                Précédent
              </Button>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button onClick={() => navigate("/appro/bon-achat")} sx={{ color: C.textMuted }}>
                  Annuler
                </Button>
                {activeStep === 2 ? (
                  <Button
                    variant="contained"
                    onClick={handleSavePurchaseOrder}
                    disabled={loading}
                    sx={{ background: `linear-gradient(135deg, ${C.accent} 0%, #2563eb 100%)`, color: "white", fontWeight: 600, textTransform: "none" }}
                  >
                    {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Créer"}
                  </Button>
                ) : (
                  <Button variant="contained" onClick={nextStep} sx={{ background: `linear-gradient(135deg, ${C.accent} 0%, #2563eb 100%)`, color: "white", fontWeight: 600, textTransform: "none" }}>
                    Suivant
                  </Button>
                )}
              </Box>
            </Box>

            {loading && <LinearProgress sx={{ position: "absolute", bottom: 0, left: 0, right: 0 }} />}
          </Card>
        </Box>
      </Box>

      {/* Notifications */}
      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity="success">{successMessage}</Alert>
      </Snackbar>
      <Snackbar open={!!errorMessage && activeStep === 2} autoHideDuration={3000} onClose={() => setErrorMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity="error">{errorMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default BonAchatForm;