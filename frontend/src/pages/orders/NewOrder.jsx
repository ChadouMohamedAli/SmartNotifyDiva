import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom"; //  Ajout de useLocation
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
  TextField,
  Alert,
  Snackbar,
  FormControl,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import SharedSidebar from "../../components/SharedSidebar";
import Aurora from "../../components/Aurora/Aurora";

const NewOrder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); //  Hook pour récupérer les données transmises
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newItem, setNewItem] = useState({
    product_id: "",
    product_name: "",
    sku: "",
    unit: "",
    quantity: 1,
    unit_price: 0,
    stock_disponible: 0,
  });

  const PRODUCTS_API = "http://localhost:8000/api/stock/products/";
  const ORDERS_API = "http://localhost:8000/api/orders/orders/";

  //  1. Récupère la liste des produits depuis l'API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
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
          
          // Normalisation des données pour correspondre au frontend
          const productsWithUnit = items.map((product) => ({
            ...product,
            id: product.id || product.product_id,
            quantity: Number(product.quantity) || 0,
            sku: product.sku || product.nomenclature || "",
            name: product.name || product.designation || "Produit",
            unit: product.unit || product.unite || product.measurement_unit || "U",
            price: parseFloat(product.price) || parseFloat(product.unit_price) || 0,
          }));
          setProducts(productsWithUnit);
        } else {
          setErrorMessage("Erreur lors du chargement des produits");
        }
      } catch (error) {
        console.error("Erreur lors du chargement des produits:", error);
        setErrorMessage("Erreur réseau lors du chargement des produits");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  //  2. EFFET : Pré-remplir le produit si passé depuis Stock via location.state
  useEffect(() => {
    const prefilledProduct = location.state?.prefilledProduct;

    // On attend que les produits soient chargés ET qu'il y ait un produit à pré-remplir
    if (!prefilledProduct || products.length === 0) return;

    // Fonction de comparaison robuste pour trouver le produit correspondant
    const findMatchingProduct = (prefilled, productList) => {
      // 1. Essayer par ID (gérer string/number)
      let found = productList.find(p => Number(p.id) === Number(prefilled.id));
      if (found) return found;

      // 2. Essayer par nomenclature/SKU
      found = productList.find(p =>
        String(p.nomenclature || "").toLowerCase().trim() ===
        String(prefilled.nomenclature || prefilled.sku || "").toLowerCase().trim()
      );
      if (found) return found;

      // 3. Essayer par nom exact
      found = productList.find(p =>
        String(p.name || "").toLowerCase().trim() ===
        String(prefilled.name || "").toLowerCase().trim()
      );
      return found;
    };

    const product = findMatchingProduct(prefilledProduct, products);

    if (product) {
      // Petit délai pour s'assurer que le DOM est prêt
      setTimeout(() => {
        setNewItem({
          product_id: String(product.id), //  Important : garder en string pour le Select
          product_name: product.name,
          sku: product.sku || product.nomenclature || "",
          unit: product.unit || product.unite || product.measurement_unit || "U",
          quantity: 1,
          unit_price: parseFloat(product.price) || parseFloat(product.unit_price) || 0,
          stock_disponible: product.quantity || 0,
        });

        setSuccessMessage(`Produit "${product.name}" sélectionné`);
        setTimeout(() => setSuccessMessage(""), 2000);
      }, 100);
    }

    //  Nettoyer le state APRÈS avoir traité le produit
    setTimeout(() => {
      navigate(location.pathname, { replace: true, state: {} });
    }, 200);

  }, [products, location, navigate]);

  //  3. Gestion du changement de produit dans le Select
  const handleProductChange = (productId) => {
    const product = products.find((p) => p.id === parseInt(productId));
    if (product) {
      const alreadyOrdered = items
        .filter((item) => Number(item.product_id) === product.id)
        .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

      const stockRestant = Math.max(0, (product.quantity || 0) - alreadyOrdered);

      setNewItem({
        ...newItem,
        product_id: productId,
        product_name: product.name,
        sku: product.sku || product.nomenclature || "",
        unit: product.unit || product.unite || product.measurement_unit || "U",
        unit_price: parseFloat(product.price) || parseFloat(product.unit_price) || 0,
        stock_disponible: stockRestant,
        quantity: stockRestant > 0 ? 1 : 0,
      });
    }
  };

  //  4. Ajout d'un article à la commande
  const handleAddItem = () => {
    if (!newItem.product_id) {
      setErrorMessage("Veuillez sélectionner un produit");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    if (newItem.quantity <= 0) {
      setErrorMessage("La quantité doit être supérieure à 0");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const product = products.find((p) => p.id === parseInt(newItem.product_id));
    if (!product) {
      setErrorMessage("Produit introuvable");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const requestedQuantity = Number(newItem.quantity);
    const availableStock = Number(product.quantity ?? 0);
    const alreadyRequested = items
      .filter((item) => Number(item.product_id) === Number(product.id))
      .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalRequested = requestedQuantity + alreadyRequested;

    if (totalRequested > availableStock) {
      setErrorMessage(
        `Stock insuffisant pour "${product.name}". Disponible: ${availableStock}, Demandé: ${totalRequested}`
      );
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setItems([
      ...items,
      {
        id: Date.now(),
        product_id: newItem.product_id,
        product_name: newItem.product_name,
        sku: newItem.sku,
        unit: newItem.unit || "U",
        quantity: Number(newItem.quantity),
        unit_price: Number(newItem.unit_price),
        stock_disponible: newItem.stock_disponible,
      }
    ]);

    setNewItem({
      product_id: "",
      product_name: "",
      sku: "",
      unit: "",
      quantity: 1,
      unit_price: 0,
      stock_disponible: 0,
    });

    setSuccessMessage("Article ajouté à la commande");
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      setErrorMessage("Ajoutez au moins un article à la commande");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    // Validation finale du stock
    const totalByProduct = items.reduce((acc, item) => {
      const key = Number(item.product_id);
      acc[key] = (acc[key] || 0) + (Number(item.quantity) || 0);
      return acc;
    }, {});

    for (const [productId, totalRequested] of Object.entries(totalByProduct)) {
      const product = products.find((p) => Number(p.id) === Number(productId));
      const availableStock = Number(product?.quantity ?? 0);
      if (!product || Number(totalRequested) > availableStock) {
        setErrorMessage(
          `Stock insuffisant pour "${product?.name}". Disponible: ${availableStock}, Demandé: ${totalRequested}`
        );
        setTimeout(() => setErrorMessage(""), 3000);
        return;
      }
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("access_token");

      const payload = {
        shipping_address: "Adresse par défaut",
        shipping_method: "Standard",
        notes: "",
        items: items.map((item) => ({
          product_id: parseInt(item.product_id),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          notes: "",
        })),
      };

      const response = await fetch(ORDERS_API, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setErrorMessage(errorData.detail || errorData.message || "Erreur lors de la création de la commande");
        setTimeout(() => setErrorMessage(""), 3000);
        return;
      }

      setSuccessMessage("Commande créée avec succès!");
      setTimeout(() => {
        navigate("/orders");
      }, 2000);
    } catch (error) {
      console.error("Erreur:", error);
      setErrorMessage("Erreur réseau lors de la création de la commande");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      color: "#94a3b8",
      "& fieldset": { borderColor: "rgba(59,130,246,0.2)" },
      "&:hover fieldset": { borderColor: "rgba(59,130,246,0.4)" },
      "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
      bgcolor: "rgba(59,130,246,0.05)",
      borderRadius: "10px",
    },
    "& .MuiInputLabel-root": { color: "#64748b" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
  };

  if (loading && products.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", bgcolor: "black" }}>
        <CircularProgress sx={{ color: "#3b82f6" }} />
      </Box>
    );
  }

  const subtotal = calculateSubtotal();

  // Calculer le stock restant pour un produit donné
  const getRemainingStock = (productId) => {
    const product = products.find((p) => p.id === parseInt(productId));
    if (!product) return 0;
    const alreadyOrdered = items
      .filter((item) => Number(item.product_id) === Number(productId))
      .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    return Math.max(0, (product.quantity || 0) - alreadyOrdered);
  };

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

      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(!mobileOpen)} />

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
          {/* Title */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box>
              <Typography variant="h4" sx={{ color: "white", fontWeight: 700, mb: 0.5 }}>
                Bon de Commande
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Créer un nouveau bon de commande
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/orders")}
              sx={{
                color: "#64748b",
                borderColor: "rgba(59,130,246,0.2)",
                textTransform: "none",
                borderRadius: 2,
                "&:hover": { borderColor: "rgba(59,130,246,0.4)", bgcolor: "rgba(59,130,246,0.05)" },
              }}
            >
              Retour
            </Button>
          </Box>

          {/* Bon de commande */}
          <Card sx={{ bgcolor: "rgba(30,41,59,0.5)", border: "1px solid rgba(59,130,246,0.1)", borderRadius: 3 }}>
            <CardContent>
              {/* En-tête du bon */}
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4, pb: 2, borderBottom: "2px solid #3b82f6" }}>
                <Box>
                  <Typography variant="h5" sx={{ color: "#3b82f6", fontWeight: 700 }}>
                    BON DE COMMANDE
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    Date: {new Date().toLocaleDateString("fr-FR")}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    N°: Nouvelle commande
                  </Typography>
                </Box>
              </Box>

              {/* Tableau des articles */}
              <TableContainer sx={{ mb: 3, overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "rgba(59,130,246,0.1)" }}>
                      <TableCell sx={{ color: "#3b82f6", fontWeight: 600 }}>Nomenclature</TableCell>
                      <TableCell sx={{ color: "#3b82f6", fontWeight: 600 }}>Désignation</TableCell>
                      <TableCell sx={{ color: "#3b82f6", fontWeight: 600 }}>Unité</TableCell>
                      <TableCell align="center" sx={{ color: "#3b82f6", fontWeight: 600 }}>Qté demandé</TableCell>
                      <TableCell align="right" sx={{ color: "#3b82f6", fontWeight: 600 }}>Prix unitaire</TableCell>
                      <TableCell align="right" sx={{ color: "#3b82f6", fontWeight: 600 }}>Qté restante</TableCell>
                      <TableCell align="center" sx={{ color: "#3b82f6", fontWeight: 600 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Ligne d'ajout */}
                    <TableRow sx={{ bgcolor: "rgba(59,130,246,0.05)" }}>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            key={`product-select-${newItem.product_id}`} //  Force le re-render quand product_id change
                            value={newItem.product_id}
                            onChange={(e) => handleProductChange(e.target.value)}
                            displayEmpty
                            sx={{ color: "white" }}
                          >
                            <MenuItem value="">Sélectionner</MenuItem>
                            {products.map((product) => (
                              <MenuItem key={product.id} value={String(product.id)}>
                                {product.sku || product.nomenclature}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                          {newItem.product_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                          {newItem.unit}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) => {
                            const rawValue = parseInt(e.target.value, 10);
                            const maxQuantity = Number(newItem.stock_disponible) || 0;
                            const nextQuantity = Number.isNaN(rawValue) ? 1 : rawValue;

                            setNewItem({
                              ...newItem,
                              quantity: Math.max(0, Math.min(nextQuantity, maxQuantity)),
                            });
                          }}
                          size="small"
                          sx={{ width: 80, ...inputSx }}
                          inputProps={{ min: 0, max: newItem.stock_disponible }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                          {newItem.unit_price.toFixed(2)} €
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ color: newItem.stock_disponible > 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                          {newItem.stock_disponible}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={handleAddItem} sx={{ color: "#10b981" }}>
                          <AddIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>

                    {/* Articles ajoutés */}
                    {items.map((item, idx) => {
                      const remainingStock = getRemainingStock(item.product_id);
                      return (
                        <TableRow key={item.id}>
                          <TableCell sx={{ color: "white", fontSize: "0.875rem" }}>
                            {item.sku}
                          </TableCell>
                          <TableCell sx={{ color: "white", fontSize: "0.875rem" }}>
                            {item.product_name}
                          </TableCell>
                          <TableCell sx={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                            {item.unit}
                          </TableCell>
                          <TableCell align="center" sx={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                            {item.quantity}
                          </TableCell>
                          <TableCell align="right" sx={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                            {item.unit_price.toFixed(2)} €
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ color: remainingStock > 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                              {remainingStock}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleRemoveItem(idx)} sx={{ color: "#ef4444" }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ color: "#64748b", py: 4 }}>
                          Aucun article ajouté
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Boutons d'action */}
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/orders")}
                  sx={{ color: "#64748b", borderColor: "rgba(59,130,246,0.2)" }}
                >
                  Annuler
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmitOrder}
                  disabled={submitting || items.length === 0}
                  sx={{
                    bgcolor: "#10b981",
                    "&:hover": { bgcolor: "#059669" },
                    "&.Mui-disabled": { bgcolor: "rgba(16,185,129,0.3)" }
                  }}
                >
                  {submitting ? "Création..." : "Créer le bon de commande"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity="success" sx={{ bgcolor: "#1e293b", color: "white" }}>{successMessage}</Alert>
      </Snackbar>
      <Snackbar open={!!errorMessage} autoHideDuration={3000} onClose={() => setErrorMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity="error">{errorMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default NewOrder;
