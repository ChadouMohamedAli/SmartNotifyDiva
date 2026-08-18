import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useActivityContext } from "../../context/ActivityContext";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CircularProgress,
  Grid,
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
  Menu,
  MenuItem,
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
  Divider,
  Switch,
} from "@mui/material";
import {
  Business as BusinessIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Menu as MenuIcon,
  Check as CheckIcon,
  FilterList as FilterListIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { CiFilter } from "react-icons/ci";
import SharedSidebar from "../../components/SharedSidebar";

// Fonctions utilitaires pour la famille
const getFamilyLabel = (family) => {
  const familyMap = {
    'matiere_premiere': 'Matière première',
    'matiere_consommable': 'Matière consommable',
    'matiere_emballage': 'Matière emballage',
    'matiere_chimique': 'Matière chimique',
    'matiere_dangereuse': 'Matière dangereuse',
    'fourniture_bureau': 'Fournitures bureau',
  };
  return familyMap[family] || '-';
};

const getFamilyColor = (family) => {
  const colorMap = {
    'matiere_premiere': '#3b82f6',
    'matiere_consommable': '#10b981',
    'matiere_emballage': '#f59e0b',
    'matiere_chimique': '#8b5cf6',
    'matiere_dangereuse': '#ef4444',
    'fourniture_bureau': '#06b6d4',
  };
  return colorMap[family] || '#64748b';
};

const familyOptions = [
  { value: "matiere_premiere", label: "Matière première" },
  { value: "matiere_consommable", label: "Matière consommable" },
  { value: "matiere_emballage", label: "Matière emballage" },
  { value: "matiere_chimique", label: "Matière chimique" },
  { value: "matiere_dangereuse", label: "Matière dangereuse" },
  { value: "fourniture_bureau", label: "Fournitures bureau" },
];

const defaultSupplierForm = {
  id: null,
  name: "",
  registre_commerce: "",
  identifiant_fiscal: "",
  famille: "",
  secteur: "",
  anciennete: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "",
  prix_unitaire: "",
  conditions_paiement: "",
  remise: "",
  zone_couverture: "",
  minimum_commande: "",
  delai_livraison: "",
  certifications: "",
  garantie_sav: "",
  references_clients: "",
  capacite_production: "",
  is_active: true,
  note_globale: 3,
  commentaires: "",
};

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

const Fournisseur = () => {
  const { user } = useAuth();
  const { triggerActivityRefresh } = useActivityContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { famille } = useParams(); // Récupérer le paramètre d'URL
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFamily, setFilterFamily] = useState("");
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState(defaultSupplierForm);

  const [suppliers, setSuppliers] = useState([]);

  const API_BASE = "http://localhost:8000/api/fournisseurs/";

  const mapFromApi = (item) => ({
    id: item.id,
    name: item.name || "",
    registre_commerce: item.registre_commerce || "",
    identifiant_fiscal: item.identifiant_fiscal || "",
    famille: item.famille || item.family || "",
    secteur: item.secteur || item.famille || item.family || "",
    anciennete: item.anciennete || "",
    contact_name: item.contact_name || "",
    email: item.email || "",
    phone: item.phone || "",
    address: item.address || "",
    city: item.city || "",
    country: item.country || "",
    prix_unitaire: item.prix_unitaire || "",
    conditions_paiement: item.conditions_paiement || "",
    remise: item.remise || "",
    zone_couverture: item.zone_couverture || "",
    minimum_commande: item.minimum_commande || "",
    delai_livraison: item.delai_livraison || "",
    certifications: item.certifications || "",
    garantie_sav: item.garantie_sav || "",
    references_clients: item.references_clients || "",
    capacite_production: item.capacite_production || "",
    is_active: Boolean(item.is_active),
    note_globale: item.note_globale || 3,
    commentaires: item.commentaires || "",
    created_at: item.created_at || null,
    updated_at: item.updated_at || null,
  });

  const mapToApi = (item) => ({
    name: item.name,
    registre_commerce: item.registre_commerce,
    identifiant_fiscal: item.identifiant_fiscal,
    famille: item.famille || item.secteur,
    secteur: item.secteur || item.famille,
    anciennete: item.anciennete,
    contact_name: item.contact_name,
    email: item.email,
    phone: item.phone,
    address: item.address,
    city: item.city,
    country: item.country,
    prix_unitaire: item.prix_unitaire,
    conditions_paiement: item.conditions_paiement,
    remise: parseFloat(String(item.remise || "").replace("%", "")) || 0,
    zone_couverture: item.zone_couverture,
    minimum_commande: item.minimum_commande,
    delai_livraison: item.delai_livraison,
    certifications: item.certifications,
    garantie_sav: item.garantie_sav,
    references_clients: item.references_clients,
    capacite_production: item.capacite_production,
    is_active: item.is_active,
    note_globale: parseInt(item.note_globale, 10) || 3,
    commentaires: item.commentaires,
  });

  const fetchSuppliers = async () => {
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
        setErrorMessage(errorText || "Erreur lors du chargement des fournisseurs");
        return;
      }

      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.results || []);
      setSuppliers(items.map(mapFromApi));
    } catch (error) {
      setErrorMessage("Erreur reseau lors du chargement des fournisseurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Appliquer le filtre automatiquement quand le paramètre d'URL change
  useEffect(() => {
    if (famille) {
      // Convertir le nom de la famille (ex: "matiere-premiere" -> "matiere_premiere")
      const familleMap = {
        "matiere-premiere": "matiere_premiere",
        "matiere-consommable": "matiere_consommable",
        "matiere-emballage": "matiere_emballage",
        "matiere-chimique": "matiere_chimique",
        "matiere-dangereuse": "matiere_dangereuse",
        "fourniture-bureau": "fourniture_bureau",
      };
      
      const mappedFamily = familleMap[famille] || famille;
      setFilterFamily(mappedFamily);
      
      // Afficher un message de notification
      const familleLabel = {
        matiere_premiere: "Matière première",
        matiere_consommable: "Matière consommable",
        matiere_emballage: "Matière emballage",
        matiere_chimique: "Matière chimique",
        matiere_dangereuse: "Matière dangereuse",
        fourniture_bureau: "Fournitures bureau",
      }[mappedFamily] || famille;
      
      setSuccessMessage(`Filtre appliqué : ${familleLabel}`);
      
      // Nettoyer le message après 3 secondes
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  }, [famille]);

  useEffect(() => {
    if (location.pathname === "/fournisseur/new") {
      handleOpenAddDialog();
    }
  }, [location.pathname]);

  const emptyForm = defaultSupplierForm;

  const handleOpenAddDialog = (supplier = null) => {
    setFormData(supplier ? { ...supplier } : emptyForm);
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setFormData(emptyForm);
    if (location.pathname === "/fournisseur/new") {
      navigate("/fournisseur");
    }
  };

  const handleSaveSupplier = async () => {
    if (!formData.name) {
      setErrorMessage("Le nom du fournisseur est requis");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const isUpdate = Boolean(formData.id);
      const response = await fetch(isUpdate ? `${API_BASE}${formData.id}/` : API_BASE, {
        method: isUpdate ? "PUT" : "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mapToApi(formData)),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setErrorMessage(errorText || "Erreur lors de l'enregistrement du fournisseur");
        return;
      }

      const saved = mapFromApi(await response.json());
      if (isUpdate) {
        setSuppliers(suppliers.map((s) => (s.id === saved.id ? saved : s)));
        setSuccessMessage("Fournisseur mis a jour avec succes");
      } else {
        setSuppliers([saved, ...suppliers]);
        setSuccessMessage("Fournisseur ajoute avec succes");
        triggerActivityRefresh();
      }
      handleCloseAddDialog();
    } catch (error) {
      setErrorMessage("Erreur reseau lors de l'enregistrement du fournisseur");
    }
  };

  const handleDeleteSupplier = async (id) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}${id}/`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });

      if (!response.ok) {
        const errorText = await response.text();
        setErrorMessage(errorText || "Erreur lors de la suppression du fournisseur");
        return;
      }

      setSuppliers(suppliers.filter((s) => s.id !== id));
      setSuccessMessage("Fournisseur supprime avec succes");
    } catch (error) {
      setErrorMessage("Erreur reseau lors de la suppression du fournisseur");
    } finally {
      handleMenuClose();
    }
  };

  const handleToggleStatus = async (supplier) => {
    const newStatus = !Boolean(supplier.is_active);
    
    try {
      setSuppliers(prev => prev.map(s => 
        s.id === supplier.id ? { ...s, is_active: newStatus } : s
      ));

      const token = localStorage.getItem('access_token');
      const payload = mapToApi({ ...supplier, is_active: newStatus });
      
      const res = await fetch(`${API_BASE}${supplier.id}/`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setSuppliers(prev => prev.map(s => 
          s.id === supplier.id ? { ...s, is_active: Boolean(supplier.is_active) } : s
        ));
        throw new Error(errorData.message || 'Erreur lors de la modification du statut');
      }

      setSuccessMessage(`Fournisseur ${newStatus ? 'activé' : 'désactivé'} avec succès`);
    } catch (err) {
      setErrorMessage(`Erreur: ${err.message}`);
    }
  };

  const handleMenuOpen = (event, supplier) => {
    setAnchorEl(event.currentTarget);
    setSelectedSupplier(supplier);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSupplier(null);
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (
      s.name.toLowerCase().includes(q) ||
      s.contact_name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q) ||
      ((s.famille || s.family) && getFamilyLabel(s.famille || s.family).toLowerCase().includes(q))
    );
    
    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "active" && s.is_active) ||
      (filterStatus === "inactive" && !s.is_active);
    
    const matchesFamily = !filterFamily || s.famille === filterFamily;
    
    return matchesSearch && matchesStatus && matchesFamily;
  });

  const stats = {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter((s) => s.is_active).length,
    inactiveSuppliers: suppliers.filter((s) => !s.is_active).length,
  };

  const statCards = [
    { label: "Total fournisseurs", value: stats.totalSuppliers, accent: "#3b82f6", onClick: () => { setFilterStatus("all"); setFilterFamily(""); } },
    { label: "Actifs", value: stats.activeSuppliers, accent: "#10b981", onClick: () => { setFilterStatus("active"); setFilterFamily(""); } },
    { label: "Inactifs", value: stats.inactiveSuppliers, accent: "#ef4444", onClick: () => { setFilterStatus("inactive"); setFilterFamily(""); } },
  ];

  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "active", label: "Actifs" },
    { value: "inactive", label: "Inactifs" },
  ];

  const activeFiltersCount = (filterStatus !== "all" ? 1 : 0) + (filterFamily ? 1 : 0);

  const menuItemSx = (active) => ({
    px: 2, py: 0.8,
    color: active ? "#3b82f6" : "#94a3b8",
    bgcolor: active ? "rgba(59,130,246,0.1)" : "transparent",
    fontSize: "0.875rem", display: "flex", justifyContent: "space-between", alignItems: "center",
    "&:hover": { bgcolor: "rgba(59,130,246,0.08)", color: "white" },
  });

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
        selectedMenu="fournisseurs"
      />

      <Box
        component="main"
        sx={{ flexGrow: 1, minWidth: 0, height: "100vh", bgcolor: "black", overflowY: "auto", overflowX: "hidden", position: "relative", zIndex: 1 }}
      >
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
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ color: "white", fontWeight: 700, mb: 0.5 }}>
                Gestion des fournisseurs
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Gérez et suivez vos fournisseurs
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <IconButton
                onClick={fetchSuppliers}
                disabled={loading}
                sx={{ color: "#64748b", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "10px", width: 44, height: 44, "&:hover": { color: "#3b82f6", borderColor: "rgba(59,130,246,0.4)" } }}
              >
                <RefreshIcon />
              </IconButton>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenAddDialog()}
                sx={{ bgcolor: "#3b82f6", color: "white", fontWeight: 600, py: 1.2, px: 3, borderRadius: 2, textTransform: "none", fontSize: "0.95rem", boxShadow: "0 4px 12px rgba(59,130,246,0.3)", "&:hover": { bgcolor: "#2563eb" } }}
              >
                Ajouter un fournisseur
              </Button>
            </Box>
          </Box>

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

          {/* Cartes de famille cliquables */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", mb: 1.5 }}>
              Filtrer par famille
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {familyOptions.map((fam) => {
                const familleKey = fam.value.replace("_", "-"); // Convertir "matiere_premiere" en "matiere-premiere" pour l'URL
                const isActive = filterFamily === fam.value;
                return (
                  <Card
                    key={fam.value}
                    onClick={() => navigate(`/fournisseur/${familleKey}`)}
                    sx={{
                      bgcolor: isActive ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.05)",
                      border: `1px solid ${isActive ? "rgba(59,130,246,0.5)" : "rgba(59,130,246,0.2)"}`,
                      borderRadius: 2,
                      px: 2.5,
                      py: 1.5,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      "&:hover": {
                        transform: "translateY(-2px)",
                        borderColor: "rgba(59,130,246,0.6)",
                        boxShadow: `0 4px 12px ${getFamilyColor(fam.value)}20`,
                      },
                    }}
                  >
                    <Box sx={{ width: 8, height: 8, bgcolor: getFamilyColor(fam.value), borderRadius: "50%" }} />
                    <Typography variant="body2" sx={{ color: isActive ? "#3b82f6" : "#94a3b8", fontWeight: isActive ? 600 : 500, textTransform: "none" }}>
                      {fam.label}
                    </Typography>
                    {isActive && <CheckIcon sx={{ fontSize: 16, ml: "auto", color: "#3b82f6" }} />}
                  </Card>
                );
              })}
              {filterFamily && (
                <Button 
                  size="small"
                  onClick={() => { setFilterFamily(""); navigate("/fournisseur"); }}
                  sx={{ color: "#ef4444", fontSize: "0.85rem", textTransform: "none", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 2, px: 1.5, py: 0.75 }}
                >
                  ✕ Effacer
                </Button>
              )}
            </Box>
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

            <TextField
              placeholder="Rechercher par nom, contact, email, ville, famille..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#64748b" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  color: "#94a3b8",
                  bgcolor: "rgba(59,130,246,0.08)",
                  borderRadius: "10px",
                  "& fieldset": { borderColor: "rgba(59,130,246,0.2)" },
                  "&:hover fieldset": { borderColor: "rgba(59,130,246,0.4)" },
                  "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                },
              }}
            />
          </Box>

          {/* Active filter chips */}
          {activeFiltersCount > 0 && (
            <Box sx={{ display: "flex", gap: 1, mb: 2.5, flexWrap: "wrap", alignItems: "center" }}>
              {filterStatus !== "all" && (
                <Chip 
                  label={statusOptions.find((s) => s.value === filterStatus)?.label}
                  onDelete={() => setFilterStatus("all")} 
                  size="small"
                  sx={{ bgcolor: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)", fontWeight: 500 }}
                />
              )}
              {filterFamily && (
                <Chip 
                  label={`Famille: ${getFamilyLabel(filterFamily)}`}
                  onDelete={() => setFilterFamily("")} 
                  size="small"
                  sx={{ bgcolor: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)", fontWeight: 500 }}
                />
              )}
              <Button size="small" onClick={() => { setFilterStatus("all"); setFilterFamily(""); }}
                sx={{ color: "#94a3b8", fontSize: "0.75rem", textTransform: "none", py: 0, minHeight: 0, "&:hover": { color: "#ef4444" } }}
              >
                Tout effacer
              </Button>
            </Box>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress sx={{ color: "#3b82f6" }} />
            </Box>
          ) : filteredSuppliers.length > 0 ? (
            <Grid container spacing={3}>
              {filteredSuppliers.map((supplier) => (
                <Grid item xs={12} md={6} lg={4} key={supplier.id}>
                  <Card
                    sx={{
                      bgcolor: "#0d1321",
                      border: "1px solid rgba(59,130,246,0.15)",
                      borderRadius: 3,
                      transition: "all 0.3s ease",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        borderColor: "#3b82f6",
                        boxShadow: "0 8px 24px rgba(59,130,246,0.15)",
                      },
                    }}
                  >
                    {/* Header avec icône et actions */}
                    <Box sx={{ p: 2, borderBottom: "1px solid rgba(59,130,246,0.1)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: "rgba(59,130,246,0.15)", width: 48, height: 48 }}>
                          <BusinessIcon sx={{ color: "#3b82f6" }} />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ color: "white", fontWeight: 700 }}>
                            {supplier.name}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                            {supplier.famille && (
                              <Chip
                                label={getFamilyLabel(supplier.famille)}
                                size="small"
                                sx={{ bgcolor: getFamilyColor(supplier.famille), color: "white", fontSize: "0.7rem", height: 22 }}
                              />
                            )}
                            <Chip
                              label={supplier.is_active ? "Actif" : "Inactif"}
                              size="small"
                              sx={{ bgcolor: supplier.is_active ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: supplier.is_active ? "#10b981" : "#ef4444", fontSize: "0.7rem", height: 22 }}
                            />
                          </Box>
                        </Box>
                      </Box>
                      <IconButton onClick={(e) => handleMenuOpen(e, supplier)} sx={{ color: "#64748b" }}>
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    {/* Contenu */}
                    <Box sx={{ flex: 1, p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                      {/* CONTACT */}
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: "rgba(59,130,246,0.15)" }}>
                            <PersonIcon sx={{ fontSize: 16, color: "#3b82f6" }} />
                          </Avatar>
                          <Box>
                            <Typography variant="caption" sx={{ color: "#64748b", display: "block", fontSize: "0.7rem" }}>
                              Contact
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#f1f5f9", fontWeight: 500 }}>
                              {supplier.contact_name || "-"}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* EMAIL */}
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: "rgba(59,130,246,0.15)" }}>
                          <EmailIcon sx={{ fontSize: 16, color: "#3b82f6" }} />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" sx={{ color: "#64748b", display: "block", fontSize: "0.7rem" }}>
                            Email
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#f1f5f9", fontWeight: 500, wordBreak: "break-word" }}>
                            {supplier.email || "-"}
                          </Typography>
                        </Box>
                      </Box>

                      {/* TÉLÉPHONE */}
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: "rgba(59,130,246,0.15)" }}>
                          <PhoneIcon sx={{ fontSize: 16, color: "#3b82f6" }} />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" sx={{ color: "#64748b", display: "block", fontSize: "0.7rem" }}>
                            Téléphone
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#f1f5f9", fontWeight: 500 }}>
                            {supplier.phone || "-"}
                          </Typography>
                        </Box>
                      </Box>

                      {/* LOCALISATION */}
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: "rgba(59,130,246,0.15)" }}>
                          <LocationOnIcon sx={{ fontSize: 16, color: "#3b82f6" }} />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" sx={{ color: "#64748b", display: "block", fontSize: "0.7rem" }}>
                            Localisation
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#f1f5f9", fontWeight: 500 }}>
                            {`${supplier.city || ""} ${supplier.country || ""}`.trim() || "-"}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Note */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2, pt: 2, borderTop: "1px solid rgba(59,130,246,0.1)" }}>
                        <StarIcon sx={{ fontSize: 18, color: "#f59e0b" }} />
                        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                          Note: {supplier.note_globale || 3}/5
                        </Typography>
                      </Box>
                    </Box>

                    {/* Bouton action */}
                    <Box sx={{ p: 2, borderTop: "1px solid rgba(59,130,246,0.1)" }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => handleOpenAddDialog(supplier)}
                        sx={{
                          borderColor: "#3b82f6",
                          color: "#3b82f6",
                          textTransform: "none",
                          borderRadius: 2,
                          "&:hover": {
                            borderColor: "#60a5fa",
                            bgcolor: "rgba(59,130,246,0.08)",
                          },
                        }}
                      >
                        Voir les détails
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Card sx={{ bgcolor: "rgba(30,41,59,0.5)", border: "1px solid rgba(59,130,246,0.1)", borderRadius: 3, textAlign: "center", py: 6 }}>
              <BusinessIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.1)", mb: 2 }} />
              <Typography variant="h6" sx={{ color: "white", mb: 1 }}>Aucun fournisseur trouvé</Typography>
              <Typography sx={{ color: "#64748b" }}>
                {searchQuery ? "Aucun fournisseur ne correspond à votre recherche." : "Commencez par ajouter un fournisseur."}
              </Typography>
            </Card>
          )}
        </Box>
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        PaperProps={{
          sx: {
            bgcolor: "rgba(13,19,33,0.98)", border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: "12px", backdropFilter: "blur(12px)",
            minWidth: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", mt: 0.5,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.2, borderBottom: "1px solid rgba(59,130,246,0.1)" }}>
          <Typography sx={{ color: "#94a3b8", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 0.75 }}>
            <FilterListIcon sx={{ fontSize: 14 }} />
            Statut
          </Typography>
        </Box>
        {statusOptions.map((opt) => (
          <MenuItem key={opt.value} onClick={() => setFilterStatus(opt.value)} sx={menuItemSx(filterStatus === opt.value)}>
            <span>{opt.label}</span>
            {filterStatus === opt.value && <CheckIcon sx={{ fontSize: 16, ml: "auto" }} />}
          </MenuItem>
        ))}

        <Divider sx={{ borderColor: "rgba(59,130,246,0.1)", my: 1 }} />

        <Box sx={{ px: 2, py: 1.2, borderBottom: "1px solid rgba(59,130,246,0.1)" }}>
          <Typography sx={{ color: "#94a3b8", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 0.75 }}>
            <BusinessIcon sx={{ fontSize: 14 }} />
            Famille
          </Typography>
        </Box>
        {familyOptions.map((opt) => (
          <MenuItem key={opt.value} onClick={() => setFilterFamily(opt.value)} sx={menuItemSx(filterFamily === opt.value)}>
            <span>{opt.label}</span>
            {filterFamily === opt.value && <CheckIcon sx={{ fontSize: 16, ml: "auto" }} />}
          </MenuItem>
        ))}

        {activeFiltersCount > 0 && (
          <>
            <Divider sx={{ borderColor: "rgba(59,130,246,0.1)", mt: 1 }} />
            <Box sx={{ p: 1.5 }}>
              <Button fullWidth size="small"
                onClick={() => { setFilterStatus("all"); setFilterFamily(""); setFilterAnchorEl(null); }}
                sx={{ color: "#ef4444", fontSize: "0.8rem", textTransform: "none", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", "&:hover": { bgcolor: "rgba(239,68,68,0.08)" } }}
              >
                Réinitialiser les filtres
              </Button>
            </Box>
          </>
        )}
      </Menu>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: "rgba(15,23,42,0.97)",
            border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: "12px",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            handleOpenAddDialog(selectedSupplier);
            handleMenuClose();
          }}
          sx={{ color: "#3b82f6", fontSize: "0.875rem", gap: 1, "&:hover": { bgcolor: "rgba(59,130,246,0.08)" } }}
        >
          <EditIcon fontSize="small" /> Modifier
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteSupplier(selectedSupplier?.id)}
          sx={{ color: "#ef4444", fontSize: "0.875rem", gap: 1, "&:hover": { bgcolor: "rgba(239,68,68,0.08)" } }}
        >
          <DeleteIcon fontSize="small" /> Supprimer
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: "#1e293b", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 3 } }}
      >
        <DialogTitle sx={{ color: "white", fontWeight: 700, borderBottom: "1px solid rgba(59,130,246,0.1)" }}>
          {formData.id ? "Modifier le fournisseur" : "Ajouter un fournisseur"}
        </DialogTitle>
        <DialogContent sx={{ pt: 4, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField 
            label="Nom du fournisseur *" 
            value={formData.name} 
            fullWidth 
            size="small" 
            sx={{ ...inputSx, mt: 1.5 }}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <TextField 
            label="Personne de contact" 
            value={formData.contact_name} 
            fullWidth 
            size="small" 
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
          />
          <TextField 
            label="Email" 
            value={formData.email} 
            fullWidth 
            size="small" 
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <TextField 
            label="Téléphone" 
            value={formData.phone} 
            fullWidth 
            size="small" 
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <TextField 
            label="Adresse" 
            value={formData.address} 
            fullWidth 
            size="small" 
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <TextField 
            label="Ville" 
            value={formData.city} 
            fullWidth 
            size="small" 
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
          <TextField 
            label="Pays" 
            value={formData.country} 
            fullWidth 
            size="small" 
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          />
          <TextField
            select
            label="Famille"
            value={formData.famille || ""}
            fullWidth
            size="small"
            sx={inputSx}
            onChange={(e) =>
              setFormData({
                ...formData,
                famille: e.target.value,
                secteur: e.target.value,
              })
            }
          >
            <MenuItem value="">Aucune</MenuItem>
            {familyOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Registre commercial / ICE"
            value={formData.registre_commerce}
            fullWidth
            size="small"
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, registre_commerce: e.target.value })}
          />
          <TextField
            label="Identifiant fiscal / RC"
            value={formData.identifiant_fiscal}
            fullWidth
            size="small"
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, identifiant_fiscal: e.target.value })}
          />
          <TextField
            label="Anciennete / Date creation"
            value={formData.anciennete}
            fullWidth
            size="small"
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, anciennete: e.target.value })}
          />
          <TextField
            label="Prix unitaire / Tarif"
            value={formData.prix_unitaire}
            fullWidth
            size="small"
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, prix_unitaire: e.target.value })}
          />
          <TextField
            label="Conditions de paiement"
            value={formData.conditions_paiement}
            fullWidth
            size="small"
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, conditions_paiement: e.target.value })}
          />
          <TextField
            label="Remise / Reduction"
            value={formData.remise}
            fullWidth
            size="small"
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, remise: e.target.value })}
          />
          <TextField
            label="Zone de couverture"
            value={formData.zone_couverture}
            fullWidth
            size="small"
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, zone_couverture: e.target.value })}
          />
          <TextField
            label="Minimum de commande"
            value={formData.minimum_commande}
            fullWidth
            size="small"
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, minimum_commande: e.target.value })}
          />
          <TextField
            label="Delai de livraison"
            value={formData.delai_livraison}
            fullWidth
            size="small"
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, delai_livraison: e.target.value })}
          />
          <TextField
            label="Certifications"
            value={formData.certifications}
            fullWidth
            size="small"
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
          />
          <TextField
            label="Garantie / SAV"
            value={formData.garantie_sav}
            fullWidth
            size="small"
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, garantie_sav: e.target.value })}
          />
          <TextField
            label="References clients"
            value={formData.references_clients}
            fullWidth
            multiline
            rows={3}
            size="small"
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, references_clients: e.target.value })}
          />
          <TextField
            label="Capacite de production"
            value={formData.capacite_production}
            fullWidth
            size="small"
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, capacite_production: e.target.value })}
          />
          <TextField
            select
            label="Note globale"
            value={String(formData.note_globale)}
            fullWidth
            size="small"
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, note_globale: e.target.value })}
          >
            {[1, 2, 3, 4, 5].map((note) => (
              <MenuItem key={note} value={String(note)}>{note} / 5</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Commentaires / Remarques"
            value={formData.commentaires}
            fullWidth
            multiline
            rows={4}
            size="small"
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })}
          />
          <TextField
            select
            label="Statut"
            value={formData.is_active ? "active" : "inactive"}
            fullWidth
            size="small"
            sx={inputSx}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "active" })}
          >
            <MenuItem value="active">Actif</MenuItem>
            <MenuItem value="inactive">Inactif</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: "1px solid rgba(59,130,246,0.1)" }}>
          <Button onClick={handleCloseAddDialog} sx={{ color: "#94a3b8" }}>Annuler</Button>
          <Button onClick={handleSaveSupplier} variant="contained"
            sx={{ bgcolor: "#3b82f6", fontWeight: 600, textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#2563eb" } }}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity="success" sx={{ width: "100%" }}>{successMessage}</Alert>
      </Snackbar>
      <Snackbar open={!!errorMessage} autoHideDuration={3000} onClose={() => setErrorMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity="error" sx={{ width: "100%" }}>{errorMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Fournisseur;
