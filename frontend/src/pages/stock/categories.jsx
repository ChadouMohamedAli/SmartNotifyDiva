import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useActivityContext } from "../../context/ActivityContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box, Typography, Grid, Card, CardContent, Avatar, IconButton, Button,
  useTheme, useMediaQuery, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Menu, MenuItem, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Snackbar, InputAdornment, Switch,
  FormControlLabel, Badge, Divider, Tooltip, FormControl, InputLabel, Select,
} from "@mui/material";
import {
  Category as CategoryIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Menu as MenuIcon,
  Check as CheckIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";
import { CiFilter } from "react-icons/ci";
import SharedSidebar from "../../components/SharedSidebar";

/* ─── StatCard ───────────────────────────────────────────────────────────────────────────────── */
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

const Categories = () => {
  const { user } = useAuth();
  const { triggerActivityRefresh } = useActivityContext();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const emptyForm = useMemo(() => ({
    id: null, name: "", description: "", color: "#3b82f6", is_active: true,
    created_at: null, updated_at: null, supplier_id: null, material_type: "matiere_premiere",
  }), []);

  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    fetchCategoriesFromAPI();
    fetchSuppliersFromAPI();
  }, []);

  const fetchCategoriesFromAPI = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/categories/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur API');
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.results || []);
      console.log("Categories récupérées:", items);
      // S'assurer que is_active est un booléen
      const processedItems = items.map(cat => {
        const isActive = Boolean(cat.is_active);
        console.log(`Catégorie ${cat.name}: is_active = ${cat.is_active} (type: ${typeof cat.is_active}, converti en ${isActive})`);
        return {
          ...cat,
          is_active: isActive
        };
      });
      setCategories(processedItems);
    } catch (err) {
      setErrorMessage('Erreur lors du chargement des catégories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliersFromAPI = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/fournisseurs/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur API');
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.results || []);
      setSuppliers(items);
    } catch (err) {
      console.log('Erreur lors du chargement des fournisseurs:', err);
      setSuppliers([]);
    }
  };

  useEffect(() => {
    if (location.pathname === "/categories/new") handleOpenAddDialog();
  }, [location.pathname]);

  const handleOpenAddDialog = (category = null) => {
    setFormData(category ? { ...category } : emptyForm);
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setFormData(emptyForm);
    if (location.pathname === "/categories/new") navigate("/categories");
  };

  const handleSaveCategory = async () => {
    if (!formData.name.trim()) { 
      setErrorMessage("Le nom de la catégorie est requis"); 
      return; 
    }
    
    try {
      const token = localStorage.getItem('access_token');
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id 
        ? `http://localhost:8000/api/categories/${formData.id}/`
        : 'http://localhost:8000/api/categories/';

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        material_type: formData.material_type || "matiere_premiere",
        is_active: formData.is_active,
        supplier_id: formData.supplier_id || null,
      };

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }

      const isCreating = !formData.id;
      setSuccessMessage(isCreating ? "Catégorie ajoutée avec succès" : "Catégorie mise à jour avec succès");
      if (isCreating) {
        triggerActivityRefresh();
      }
      handleCloseAddDialog();
      fetchCategoriesFromAPI();
    } catch (err) {
      setErrorMessage(`Erreur: ${err.message}`);
    }
  };

  const handleToggleStatus = async (category) => {
    console.log("Toggle status appelé pour:", category);
    console.log("Valeur actuelle de is_active:", category.is_active);
    
    const newStatus = !Boolean(category.is_active);
    console.log("Nouveau statut:", newStatus);
    
    try {
      // Mise à jour optimiste de l'interface
      setCategories(prev => prev.map(cat => 
        cat.id === category.id ? { ...cat, is_active: newStatus } : cat
      ));

      const token = localStorage.getItem('access_token');
      const payload = {
        name: category.name,
        description: category.description,
        material_type: category.material_type || "matiere_premiere",
        is_active: newStatus,
        supplier_id: category.supplier_id || null,
      };
      console.log("Envoi du payload:", payload);
      
      const res = await fetch(`http://localhost:8000/api/categories/${category.id}/`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      console.log("Réponse du serveur:", res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Erreur API:", errorData);
        // Annuler la mise à jour optimiste en cas d'erreur
        setCategories(prev => prev.map(cat => 
          cat.id === category.id ? { ...cat, is_active: Boolean(category.is_active) } : cat
        ));
        throw new Error(errorData.message || 'Erreur lors de la modification du statut');
      }

      const responseData = await res.json();
      console.log("Réponse complète:", responseData);
      setSuccessMessage(`Catégorie ${newStatus ? 'activée' : 'désactivée'} avec succès`);
    } catch (err) {
      console.error("Erreur complète:", err);
      setErrorMessage(`Erreur: ${err.message}`);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:8000/api/categories/${selectedCategory.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setSuccessMessage("Catégorie supprimée avec succès");
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
      fetchCategoriesFromAPI();
    } catch (err) {
      setErrorMessage(`Erreur: ${err.message}`);
    }
  };

  const handleMenuOpen = (event, category) => { setAnchorEl(event.currentTarget); setSelectedCategory(category); };
  const handleMenuClose = () => { setAnchorEl(null); setSelectedCategory(null); };

  // ── Filters ───────────────────────────────────────────────────────────────
  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "active", label: "Actives" },
    { value: "inactive", label: "Inactives" },
  ];
  const activeFiltersCount = filterStatus !== "all" ? 1 : 0;

  const filteredCategories = categories.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || (filterStatus === "active" ? c.is_active : !c.is_active);
    return matchSearch && matchStatus;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total: categories.length,
    active: categories.filter(c => c.is_active).length,
    inactive: categories.filter(c => !c.is_active).length,
  };

  const statCards = [
    { label: "Total catégories", value: stats.total, accent: "#3b82f6", onClick: () => setFilterStatus("all") },
    { label: "Actives", value: stats.active, accent: "#10b981", onClick: () => setFilterStatus("active") },
    { label: "Inactives", value: stats.inactive, accent: "#ef4444", onClick: () => setFilterStatus("inactive") },
  ];

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
    px: 2, py: 0.8,
    color: active ? "#3b82f6" : "#94a3b8",
    bgcolor: active ? "rgba(59,130,246,0.1)" : "transparent",
    fontSize: "0.875rem", display: "flex", justifyContent: "space-between", alignItems: "center",
    "&:hover": { bgcolor: "rgba(59,130,246,0.08)", color: "white" },
  });

  const materialTypeOptions = [
    { value: "matiere_premiere", label: "Matiere premiere" },
    { value: "matiere_consommable", label: "Matiere consommable" },
    { value: "matiere_emballage", label: "Matiere emballage" },
    { value: "matiere_chimique", label: "Matiere chimique" },
    { value: "matiere_dangereuse", label: "Matiere dangereuse" },
    { value: "fourniture_bureau", label: "Fournitures bureau" },
  ];

  const getMaterialTypeLabel = (value) =>
    materialTypeOptions.find((opt) => opt.value === value)?.label || "Matiere premiere";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "black", overflow: "hidden", position: "relative" }}>
      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(!mobileOpen)} />

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, height: "100vh", bgcolor: "black", overflowY: "auto", overflowX: "hidden", position: "relative", zIndex: 1 }}>

        {/* Header bar */}
        <Box sx={{ p: 1.2, borderBottom: "1px solid rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          {isMobile && (
            <IconButton onClick={() => setMobileOpen(!mobileOpen)} sx={{ color: "white" }}>
              <MenuIcon />
            </IconButton>
          )}
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
          {/* Title + actions */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ color: "white", fontWeight: 700, mb: 0.5 }}>Gestion des catégories</Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>Organisez vos produits par catégorie</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <IconButton
                onClick={fetchCategoriesFromAPI}
                sx={{ color: "#64748b", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "10px", width: 44, height: 44, "&:hover": { color: "#3b82f6", borderColor: "rgba(59,130,246,0.4)" } }}
              >
                <RefreshIcon />
              </IconButton>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenAddDialog()}
                sx={{ bgcolor: "#3b82f6", color: "white", fontWeight: 600, py: 1.2, px: 3, borderRadius: 2, textTransform: "none", fontSize: "0.95rem", boxShadow: "0 4px 12px rgba(59,130,246,0.3)", "&:hover": { bgcolor: "#2563eb" } }}
              >
                Ajouter une catégorie
              </Button>
            </Box>
          </Box>

          {/* Stat Cards */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            {statCards.map((s) => (
              <Box key={s.label} sx={{ flex: "1 1 0", minWidth: 250 }}>
                <StatCard
                  label={s.label}
                  value={s.value}
                  color={s.accent}
                  onClick={s.onClick}
                />
              </Box>
            ))}
          </Box>

          {/* Filter + Search */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: activeFiltersCount > 0 ? 1.5 : 3 }}>
            <Tooltip title="Filtres">
              <Badge badgeContent={activeFiltersCount} sx={{ "& .MuiBadge-badge": { bgcolor: "#3b82f6", color: "white", fontSize: "0.65rem", minWidth: 16, height: 16 } }}>
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
                placeholder="Rechercher par nom ou description..."
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
            <Box sx={{ display: "flex", gap: 1, mb: 2.5, alignItems: "center" }}>
              {filterStatus !== "all" && (
                <Chip
                  label={statusOptions.find(s => s.value === filterStatus)?.label}
                  onDelete={() => setFilterStatus("all")} size="small"
                  sx={{ bgcolor: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)", fontWeight: 500 }}
                />
              )}
              <Button size="small" onClick={() => setFilterStatus("all")}
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
                    {["Catégorie", "Type matière", "Description", "Fournisseur", "Statut", "Date de création", "Actions"].map((h, i) => (
                      <TableCell key={h} align={i >= 5 ? "center" : "left"} sx={{ color: "#94a3b8", fontWeight: 600, borderBottom: "none" }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCategories.length > 0 ? filteredCategories.map((cat) => (
                    <TableRow key={cat.id} sx={{ borderBottom: "1px solid rgba(59,130,246,0.1)", "&:hover": { bgcolor: "rgba(59,130,246,0.05)" } }}>
                      {/* Name + color dot */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar sx={{ bgcolor: `${cat.color}22`, width: 36, height: 36, border: `2px solid ${cat.color}66` }}>
                            <CategoryIcon sx={{ fontSize: 18, color: cat.color }} />
                          </Avatar>
                          <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>{cat.name}</Typography>
                        </Box>
                      </TableCell>

                      {/* Material type */}
                      <TableCell sx={{ color: "#64748b", fontSize: "0.875rem" }}>
                        <Chip
                          size="small"
                          label={getMaterialTypeLabel(cat.material_type)}
                          sx={{
                            bgcolor: "rgba(59,130,246,0.15)",
                            color: "#93c5fd",
                            border: "1px solid rgba(59,130,246,0.35)",
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>

                      {/* Description */}
                      <TableCell sx={{ color: "#64748b", fontSize: "0.875rem", maxWidth: 260 }}>
                        <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.875rem" }} noWrap>
                          {cat.description || <span style={{ color: "#475569", fontStyle: "italic" }}>Aucune description</span>}
                        </Typography>
                      </TableCell>

                      {/* Supplier */}
                      <TableCell sx={{ color: "#64748b", fontSize: "0.875rem", maxWidth: 200 }}>
                        <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.875rem" }} noWrap>
                          {cat.supplier ? (typeof cat.supplier === 'object' ? cat.supplier.name : cat.supplier) : "—"}
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell align="center">
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                          <Switch 
                            checked={cat.is_active} 
                            onChange={() => handleToggleStatus(cat)}
                            size="small"
                            sx={{ 
                              "& .MuiSwitch-switchBase.Mui-checked": { color: "#10b981" }, 
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#10b981" } 
                            }}
                          />
                          <Typography variant="caption" sx={{ color: cat.is_active ? "#10b981" : "#ef4444", fontWeight: 600, fontSize: "0.75rem", minWidth: 55 }}>
                            {cat.is_active ? "Actif" : "Inactif"}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Date */}
                      <TableCell align="center">
                        <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                          {cat.created_at ? new Date(cat.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" }) : "—"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>
                          {cat.created_at ? new Date(cat.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="center">
                        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                          <Tooltip title="Modifier">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenAddDialog(cat)}
                              sx={{ color: "#3b82f6", "&:hover": { bgcolor: "rgba(59,130,246,0.1)" } }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton 
                              size="small" 
                              onClick={(e) => { setSelectedCategory(cat); setDeleteDialogOpen(true); }}
                              sx={{ color: "#ef4444", "&:hover": { bgcolor: "rgba(239,68,68,0.1)" } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ border: "none" }}>
                        <Box sx={{ textAlign: "center", py: 6 }}>
                          <CategoryIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.1)", mb: 2 }} />
                          <Typography variant="h6" sx={{ color: "white", mb: 1 }}>Aucune catégorie trouvée</Typography>
                          <Typography sx={{ color: "#64748b", mb: 3 }}>
                            {searchQuery || activeFiltersCount > 0 ? "Aucune catégorie ne correspond à vos filtres." : "Commencez par ajouter une catégorie."}
                          </Typography>
                          {!searchQuery && activeFiltersCount === 0 && (
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenAddDialog()}
                              sx={{ bgcolor: "#3b82f6", color: "white", textTransform: "none", "&:hover": { bgcolor: "#2563eb" } }}
                            >
                              Ajouter une catégorie
                            </Button>
                          )}
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
          sx: { bgcolor: "rgba(15,23,42,0.97)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", backdropFilter: "blur(12px)", minWidth: 220, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", mt: 0.5 },
        }}
      >
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
          <FilterListIcon sx={{ fontSize: 14, color: "#3b82f6" }} />
          <Typography variant="caption" sx={{ color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.7rem" }}>
            Statut
          </Typography>
        </Box>
        {statusOptions.map((opt) => (
          <MenuItem key={opt.value} onClick={() => setFilterStatus(opt.value)} sx={menuItemSx(filterStatus === opt.value)}>
            {opt.label}
            {filterStatus === opt.value && <CheckIcon sx={{ fontSize: 16, color: "#3b82f6" }} />}
          </MenuItem>
        ))}
        {activeFiltersCount > 0 && (
          <>
            <Divider sx={{ borderColor: "rgba(59,130,246,0.15)", mt: 1 }} />
            <Box sx={{ p: 1.5 }}>
              <Button fullWidth size="small"
                onClick={() => { setFilterStatus("all"); setFilterAnchorEl(null); }}
                sx={{ color: "#ef4444", fontSize: "0.8rem", textTransform: "none", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", "&:hover": { bgcolor: "rgba(239,68,68,0.08)" } }}
              >
                Réinitialiser
              </Button>
            </Box>
          </>
        )}
      </Menu>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}
        PaperProps={{ sx: { bgcolor: "rgba(15,23,42,0.97)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", backdropFilter: "blur(12px)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" } }}
      >
        <MenuItem onClick={() => { handleOpenAddDialog(selectedCategory); handleMenuClose(); }}
          sx={{ color: "#3b82f6", fontSize: "0.875rem", gap: 1, "&:hover": { bgcolor: "rgba(59,130,246,0.08)" } }}
        >
          <EditIcon fontSize="small" /> Modifier
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialogOpen(true); setAnchorEl(null); }}
          sx={{ color: "#ef4444", fontSize: "0.875rem", gap: 1, "&:hover": { bgcolor: "rgba(239,68,68,0.08)" } }}
        >
          <DeleteIcon fontSize="small" /> Supprimer
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: "#1e293b", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 3 } }}
      >
        <DialogTitle sx={{ color: "white", fontWeight: 700, borderBottom: "1px solid rgba(59,130,246,0.1)" }}>
          {formData.id ? "Modifier la catégorie" : "Ajouter une catégorie"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Nom" value={formData.name} fullWidth size="small" sx={inputSx}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField label="Description" value={formData.description} fullWidth size="small" sx={inputSx} multiline rows={2}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />


     
          
       
      
          <FormControlLabel
            control={
              <Switch checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#10b981" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#10b981" } }}
              />
            }
            label={<Typography sx={{ color: "#94a3b8", fontSize: "0.9rem" }}>Actif</Typography>}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: "1px solid rgba(59,130,246,0.1)" }}>
          <Button onClick={handleCloseAddDialog} sx={{ color: "#94a3b8", textTransform: "none" }}>Annuler</Button>
          <Button variant="contained" onClick={handleSaveCategory}
            sx={{ bgcolor: "#3b82f6", textTransform: "none", fontWeight: 600, borderRadius: 2, "&:hover": { bgcolor: "#2563eb" } }}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { bgcolor: "#1e293b", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 3 } }}
      >
        <DialogTitle sx={{ color: "white", borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DeleteIcon sx={{ color: "#ef4444" }} /> Supprimer la catégorie
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ color: "#94a3b8", mb: 2 }}>
            Êtes-vous sûr de vouloir supprimer la catégorie <strong style={{ color: "white" }}>{selectedCategory?.name}</strong> ?
          </Typography>
          <Alert severity="warning" sx={{ bgcolor: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)" }}>
            Cette action est irréversible.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: "1px solid rgba(239,68,68,0.1)" }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: "#94a3b8" }}>Annuler</Button>
          <Button onClick={handleDeleteCategory} variant="contained"
            sx={{ bgcolor: "#ef4444", fontWeight: 600, "&:hover": { bgcolor: "#dc2626" } }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(successMessage)} autoHideDuration={3000} onClose={() => setSuccessMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity="success" sx={{ width: "100%" }}>{successMessage}</Alert>
      </Snackbar>
      <Snackbar open={Boolean(errorMessage)} autoHideDuration={4000} onClose={() => setErrorMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity="error" sx={{ width: "100%" }}>{errorMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Categories;