import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useActivityContext } from "../../context/ActivityContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Avatar, IconButton, Button,
  useTheme, useMediaQuery, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Menu, MenuItem, TextField, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, Snackbar, Badge, Divider, Switch,
} from "@mui/material";
import {
  Warehouse as WarehouseIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Menu as MenuIcon,
  Check as CheckIcon,
  LocationOn as LocationOnIcon,
  Public as PublicIcon,
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

const DashboardEntrepots = () => {
  const { user } = useAuth();
  const { triggerActivityRefresh } = useActivityContext();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Liste complète des pays
  const countriesList = [
    "Afghanistan", "Afrique du Sud", "Albanie", "Algérie", "Allemagne", "Andorre", "Angola", "Antigua-et-Barbuda", "Arabie Saoudite", "Argentine",
    "Arménie", "Australie", "Autriche", "Azerbaïdjan", "Bahamas", "Bahreïn", "Bangladesh", "Barbade", "Belgique", "Belize",
    "Bénin", "Bhoutan", "Biélorussie", "Birmanie", "Bolivie", "Bosnie-Herzégovine", "Botswana", "Brésil", "Brunei", "Bulgarie",
    "Burkina Faso", "Burundi", "Cambodge", "Cameroun", "Canada", "Cap-Vert", "Centrafrique", "Chili", "Chine", "Chypre",
    "Colombie", "Comores", "Congo", "Corée du Nord", "Corée du Sud", "Costa Rica", "Côte d'Ivoire", "Croatie", "Cuba", "Danemark",
    "Djibouti", "Dominique", "Égypte", "Émirats Arabes Unis", "Équateur", "Érythrée", "Espagne", "Estonie", "Eswatini", "États-Unis",
    "Éthiopie", "Fidji", "Finlande", "France", "Gabon", "Gambie", "Géorgie", "Ghana", "Grèce", "Grenade",
    "Guatemala", "Guinée", "Guinée équatoriale", "Guinée-Bissau", "Guyana", "Haïti", "Honduras", "Hongrie", "Inde", "Indonésie",
    "Irak", "Iran", "Irlande", "Islande", "Israël", "Italie", "Jamaïque", "Japon", "Jordanie", "Kazakhstan",
    "Kenya", "Kirghizistan", "Kiribati", "Kosovo", "Koweït", "Laos", "Lesotho", "Lettonie", "Liban", "Libéria",
    "Libye", "Liechtenstein", "Lituanie", "Luxembourg", "Macédoine du Nord", "Madagascar", "Malaisie", "Malawi", "Maldives", "Mali",
    "Malte", "Maroc", "Marshall", "Maurice", "Mauritanie", "Mexique", "Micronésie", "Moldavie", "Monaco", "Mongolie",
    "Monténégro", "Mozambique", "Namibie", "Nauru", "Népal", "Nicaragua", "Niger", "Nigéria", "Norvège", "Nouvelle-Zélande",
    "Oman", "Ouganda", "Ouzbékistan", "Pakistan", "Palaos", "Palestine", "Panama", "Papouasie-Nouvelle-Guinée", "Paraguay", "Pays-Bas",
    "Pérou", "Philippines", "Pologne", "Portugal", "Qatar", "République Démocratique du Congo", "République Dominicaine", "République Tchèque", "Roumanie", "Royaume-Uni",
    "Russie", "Rwanda", "Saint-Christophe-et-Niévès", "Saint-Marin", "Saint-Vincent-et-les-Grenadines", "Sainte-Lucie", "Salomon", "Salvador", "Samoa", "São Tomé-et-Príncipe",
    "Sénégal", "Serbie", "Seychelles", "Sierra Leone", "Singapour", "Slovaquie", "Slovénie", "Somalie", "Soudan", "Soudan du Sud",
    "Sri Lanka", "Suède", "Suisse", "Suriname", "Syrie", "Tadjikistan", "Tanzanie", "Tchad", "Thaïlande", "Timor oriental",
    "Togo", "Tonga", "Trinité-et-Tobago", "Tunisie", "Turkménistan", "Turquie", "Tuvalu", "Ukraine", "Uruguay", "Vanuatu",
    "Vatican", "Venezuela", "Viêt Nam", "Yémen", "Zambie", "Zimbabwe"
  ];

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedEntrepot, setSelectedEntrepot] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: null, name: "", code: "", address: "", city: "", country: "Tunisie",
    capacity: 0, manager_name: "", phone: "", email: "", is_active: true,
  });

  const [entrepots, setEntrepots] = useState([]);

  // ── Filter config ─────────────────────────────────────────────────────────
  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "active", label: "Actifs" },
    { value: "inactive", label: "Inactifs" },
  ];

  const cities = [...new Set(entrepots.map(e => e.city).filter(Boolean))].map(c => ({ value: c, label: c }));
  const countries = [...new Set(entrepots.map(e => e.country).filter(Boolean))].map(c => ({ value: c, label: c }));
  
  const activeFiltersCount = (filterStatus !== "all" ? 1 : 0) + (filterCity !== "all" ? 1 : 0) + (filterCountry !== "all" ? 1 : 0);

  // ── Filtered entrepots ────────────────────────────────────────────────────
  const filteredEntrepots = entrepots.filter(e => {
    const matchesStatus = filterStatus === "all" || (filterStatus === "active" ? e.is_active : !e.is_active);
    const matchesCity = filterCity === "all" || e.city === filterCity;
    const matchesCountry = filterCountry === "all" || e.country === filterCountry;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q) || e.city.toLowerCase().includes(q);
    return matchesStatus && matchesCity && matchesCountry && matchesSearch;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total: entrepots.length,
    active: entrepots.filter(e => e.is_active).length,
    inactive: entrepots.filter(e => !e.is_active).length,
    totalCapacity: entrepots.reduce((sum, e) => sum + e.capacity, 0),
  };

  const statCards = [
    { label: "Total Entrepôts", value: stats.total, accent: "#3b82f6", onClick: () => { setFilterStatus("all"); setFilterCity("all"); setFilterCountry("all"); } },
    { label: "Actifs", value: stats.active, accent: "#10b981", onClick: () => { setFilterStatus("active"); setFilterCity("all"); setFilterCountry("all"); } },
    { label: "Inactifs", value: stats.inactive, accent: "#ef4444", onClick: () => { setFilterStatus("inactive"); setFilterCity("all"); setFilterCountry("all"); } },
    { label: "Capacité Totale", value: `${stats.totalCapacity.toLocaleString("fr-FR")} m²`, accent: "#8b5cf6" },
  ];

  // ── Form / CRUD ───────────────────────────────────────────────────────────
  const emptyForm = { id: null, name: "", code: "", address: "", city: "", country: "Tunisie", capacity: 0, manager_name: "", phone: "", email: "", is_active: true };
  
  const handleOpenAddDialog = (entrepot = null) => { 
    setFormData(entrepot ? { ...entrepot } : emptyForm); 
    setOpenAddDialog(true); 
  };
  
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setFormData(emptyForm);
    if (location.pathname === "/entrepots/new") {
      navigate("/entrepots");
    }
  };
  
  const handleSaveEntrepot = async () => {
    if (!formData.name || !formData.code) { 
      setErrorMessage("Nom et code sont requis"); 
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
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || errorData.code?.[0] || "Erreur lors de l'enregistrement de l'entrepôt");
        return;
      }

      const saved = await response.json();
      if (isUpdate) {
        setEntrepots(entrepots.map(e => e.id === saved.id ? saved : e));
        setSuccessMessage("Entrepôt mis à jour avec succès");
      } else {
        setEntrepots([saved, ...entrepots]);
        setSuccessMessage("Entrepôt ajouté avec succès");
        triggerActivityRefresh();
      }
      handleCloseAddDialog();
    } catch (error) {
      setErrorMessage("Erreur réseau lors de l'enregistrement de l'entrepôt");
    }
  };
  
  const handleDeleteEntrepot = async (id) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}${id}/`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });

      if (!response.ok) {
        const errorText = await response.text();
        setErrorMessage(errorText || "Erreur lors de la suppression de l'entrepôt");
        return;
      }

      setEntrepots(entrepots.filter(e => e.id !== id));
      setSuccessMessage("Entrepôt supprimé avec succès");
    } catch (error) {
      setErrorMessage("Erreur réseau lors de la suppression de l'entrepôt");
    } finally {
      handleMenuClose();
    }
  };

  const handleToggleStatus = async (entrepot) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}${entrepot.id}/`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...entrepot, is_active: !entrepot.is_active }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setErrorMessage(errorText || "Erreur lors de la mise à jour du statut");
        return;
      }

      const updated = await response.json();
      setEntrepots(entrepots.map(e => e.id === updated.id ? updated : e));
      setSuccessMessage(`Entrepôt ${updated.is_active ? "activé" : "désactivé"} avec succès`);
    } catch (error) {
      setErrorMessage("Erreur réseau lors de la mise à jour du statut");
    }
  };
  
  const handleMenuOpen = (event, entrepot) => { 
    setAnchorEl(event.currentTarget); 
    setSelectedEntrepot(entrepot); 
  };
  
  const handleMenuClose = () => { 
    setAnchorEl(null); 
    setSelectedEntrepot(null); 
  };

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

  const API_BASE = "http://localhost:8000/api/entrepots/entrepots/";

  const fetchEntrepots = async () => {
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
        setErrorMessage(errorText || "Erreur lors du chargement des entrepôts");
        return;
      }

      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.results || []);
      setEntrepots(items);
    } catch (error) {
      setErrorMessage("Erreur réseau lors du chargement des entrepôts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntrepots();
  }, []);

  useEffect(() => {
    if (location.pathname === "/entrepots/new") {
      handleOpenAddDialog();
    }
  }, [location.pathname]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "black", overflow: "hidden" }}>
      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(!mobileOpen)} selectedMenu="entrepots" />

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, height: "100vh", bgcolor: "black", overflowY: "auto", overflowX: "hidden" }}>

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
              <Typography variant="h4" sx={{ color: "white", fontWeight: 700, mb: 0.5 }}>Gestion des Entrepôts</Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>Gérez et surveillez vos entrepôts et leurs capacités</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <IconButton onClick={fetchEntrepots} disabled={loading}
                sx={{ color: "#64748b", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "10px", width: 44, height: 44, "&:hover": { color: "#3b82f6", borderColor: "rgba(59,130,246,0.4)" } }}
              >
                <RefreshIcon />
              </IconButton>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenAddDialog()}
                sx={{ bgcolor: "#3b82f6", color: "white", fontWeight: 600, py: 1.2, px: 3, borderRadius: 2, textTransform: "none", fontSize: "0.95rem", boxShadow: "0 4px 12px rgba(59,130,246,0.3)", "&:hover": { bgcolor: "#2563eb" } }}
              >
                Ajouter un entrepôt
              </Button>
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
                placeholder="Rechercher par nom, code ou ville..."
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
              {filterCity !== "all" && (
                <Chip
                  label={filterCity}
                  onDelete={() => setFilterCity("all")} size="small"
                  sx={{ bgcolor: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)", fontWeight: 500 }}
                />
              )}
              {filterCountry !== "all" && (
                <Chip
                  label={filterCountry}
                  onDelete={() => setFilterCountry("all")} size="small"
                  sx={{ bgcolor: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)", fontWeight: 500 }}
                />
              )}
              <Button size="small"
                onClick={() => { setFilterStatus("all"); setFilterCity("all"); setFilterCountry("all"); }}
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
                    {["Entrepôt", "Code", "Ville", "Pays", "Capacité", "Responsable", "Statut", "Actions"].map((h, i) => (
                      <TableCell key={h} align={i >= 4 ? "center" : "left"} sx={{ color: "#94a3b8", fontWeight: 600, borderBottom: "none" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEntrepots.length > 0 ? filteredEntrepots.map((entrepot) => {
                    return (
                      <TableRow key={entrepot.id} sx={{ borderBottom: "1px solid rgba(59,130,246,0.1)", "&:hover": { bgcolor: "rgba(59,130,246,0.05)" } }}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Avatar sx={{ bgcolor: "rgba(59,130,246,0.15)", width: 36, height: 36 }}>
                              <WarehouseIcon sx={{ fontSize: 18, color: "#3b82f6" }} />
                            </Avatar>
                            <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>{entrepot.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: "#64748b", fontSize: "0.875rem" }}>{entrepot.code}</TableCell>
                        <TableCell sx={{ color: "#94a3b8", fontSize: "0.875rem" }}>{entrepot.city || "-"}</TableCell>
                        <TableCell sx={{ color: "#94a3b8", fontSize: "0.875rem" }}>{entrepot.country}</TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>{entrepot.capacity.toLocaleString("fr-FR")} m²</Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ color: "#94a3b8", fontSize: "0.875rem" }}>{entrepot.manager_name || "-"}</TableCell>
                        <TableCell align="center">
                          <Switch
                            checked={entrepot.is_active}
                            onChange={() => handleToggleStatus(entrepot)}
                            sx={{
                              "& .MuiSwitch-switchBase.Mui-checked": { color: "#10b981" },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#10b981" },
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, entrepot)} sx={{ color: "#64748b", "&:hover": { color: "#3b82f6" } }}>
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ border: "none" }}>
                        <Box sx={{ textAlign: "center", py: 6 }}>
                          <WarehouseIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.1)", mb: 2 }} />
                          <Typography variant="h6" sx={{ color: "white", mb: 1 }}>Aucun entrepôt trouvé</Typography>
                          <Typography sx={{ color: "#64748b" }}>
                            {searchQuery || activeFiltersCount > 0 ? "Aucun entrepôt ne correspond à vos filtres." : "Commencez par ajouter un entrepôt."}
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
            bgcolor: "rgba(15,23,42,0.97)", border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: "12px", backdropFilter: "blur(12px)",
            minWidth: 260, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", mt: 0.5,
          },
        }}
      >
        {/* Status section */}
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
          <CheckIcon sx={{ fontSize: 14, color: "#3b82f6" }} />
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

        <Divider sx={{ borderColor: "rgba(59,130,246,0.15)", my: 1 }} />

        {/* City section */}
        {cities.length > 0 && (
          <>
            <Box sx={{ px: 2, pt: 0.5, pb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
              <LocationOnIcon sx={{ fontSize: 14, color: "#3b82f6" }} />
              <Typography variant="caption" sx={{ color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.7rem" }}>
                Ville
              </Typography>
            </Box>
            <MenuItem onClick={() => setFilterCity("all")} sx={menuItemSx(filterCity === "all")}>
              Toutes les villes
              {filterCity === "all" && <CheckIcon sx={{ fontSize: 16, color: "#3b82f6" }} />}
            </MenuItem>
            {cities.map((city) => (
              <MenuItem key={city.value} onClick={() => setFilterCity(city.value)} sx={menuItemSx(filterCity === city.value)}>
                {city.label}
                {filterCity === city.value && <CheckIcon sx={{ fontSize: 16, color: "#3b82f6" }} />}
              </MenuItem>
            ))}
            <Divider sx={{ borderColor: "rgba(59,130,246,0.15)", my: 1 }} />
          </>
        )}

        {/* Country section */}
        {countries.length > 0 && (
          <>
            <Box sx={{ px: 2, pt: 0.5, pb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
              <PublicIcon sx={{ fontSize: 14, color: "#3b82f6" }} />
              <Typography variant="caption" sx={{ color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.7rem" }}>
                Pays
              </Typography>
            </Box>
            <MenuItem onClick={() => setFilterCountry("all")} sx={menuItemSx(filterCountry === "all")}>
              Tous les pays
              {filterCountry === "all" && <CheckIcon sx={{ fontSize: 16, color: "#3b82f6" }} />}
            </MenuItem>
            {countries.map((country) => (
              <MenuItem key={country.value} onClick={() => setFilterCountry(country.value)} sx={menuItemSx(filterCountry === country.value)}>
                {country.label}
                {filterCountry === country.value && <CheckIcon sx={{ fontSize: 16, color: "#3b82f6" }} />}
              </MenuItem>
            ))}
          </>
        )}

        {activeFiltersCount > 0 && (
          <>
            <Divider sx={{ borderColor: "rgba(59,130,246,0.15)", mt: 1 }} />
            <Box sx={{ p: 1.5 }}>
              <Button fullWidth size="small"
                onClick={() => { setFilterStatus("all"); setFilterCity("all"); setFilterCountry("all"); setFilterAnchorEl(null); }}
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
        <MenuItem onClick={() => { handleOpenAddDialog(selectedEntrepot); handleMenuClose(); }} sx={{ color: "#3b82f6", fontSize: "0.875rem", gap: 1, "&:hover": { bgcolor: "rgba(59,130,246,0.08)" } }}>
          <EditIcon fontSize="small" /> Modifier
        </MenuItem>
        <MenuItem onClick={() => handleDeleteEntrepot(selectedEntrepot?.id)} sx={{ color: "#ef4444", fontSize: "0.875rem", gap: 1, "&:hover": { bgcolor: "rgba(239,68,68,0.08)" } }}>
          <DeleteIcon fontSize="small" /> Supprimer
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: "#1e293b", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 3 } }}
      >
        <DialogTitle sx={{ color: "white", fontWeight: 700, borderBottom: "1px solid rgba(59,130,246,0.1)" }}>
          {formData.id ? "Modifier l'entrepôt" : "Ajouter un entrepôt"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { label: "Nom de l'entrepôt", key: "name", type: "text" },
            { label: "Code", key: "code", type: "text" },
            { label: "Adresse", key: "address", type: "text", multiline: true },
            { label: "Ville", key: "city", type: "text" },
          ].map(({ label, key, type, multiline }) => (
            <TextField 
              key={key} 
              label={label} 
              type={type} 
              value={formData[key]} 
              fullWidth 
              size="small" 
              sx={inputSx}
              multiline={multiline}
              rows={multiline ? 2 : 1}
              onChange={(e) => setFormData({ ...formData, [key]: type === "number" ? parseInt(e.target.value) || 0 : e.target.value })}
            />
          ))}
          
          {/* Dropdown pour les pays */}
          <TextField
            select
            label="Pays"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            fullWidth
            size="small"
            sx={inputSx}
          >
            {countriesList.map((country) => (
              <MenuItem key={country} value={country}>
                {country}
              </MenuItem>
            ))}
          </TextField>

          {[
            { label: "Capacité (m²)", key: "capacity", type: "number" },
            { label: "Responsable", key: "manager_name", type: "text" },
            { label: "Téléphone", key: "phone", type: "text" },
            { label: "Email", key: "email", type: "email" },
          ].map(({ label, key, type, multiline }) => (
            <TextField 
              key={key} 
              label={label} 
              type={type} 
              value={formData[key]} 
              fullWidth 
              size="small" 
              sx={inputSx}
              multiline={multiline}
              rows={multiline ? 2 : 1}
              onChange={(e) => setFormData({ ...formData, [key]: type === "number" ? parseInt(e.target.value) || 0 : e.target.value })}
            />
          ))}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
            <Typography sx={{ color: "#94a3b8", fontSize: "0.9rem" }}>Statut:</Typography>
            <Switch
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: "#10b981" },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#10b981" },
              }}
            />
            <Typography sx={{ color: formData.is_active ? "#10b981" : "#ef4444", fontWeight: 600, fontSize: "0.9rem" }}>
              {formData.is_active ? "Actif" : "Inactif"}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: "1px solid rgba(59,130,246,0.1)" }}>
          <Button onClick={handleCloseAddDialog} sx={{ color: "#94a3b8" }}>Annuler</Button>
          <Button onClick={handleSaveEntrepot} variant="contained"
            sx={{ bgcolor: "#3b82f6", fontWeight: 600, textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#2563eb" } }}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity="success" sx={{ width: "100%" }}>{successMessage}</Alert>
      </Snackbar>
      <Snackbar open={!!errorMessage} autoHideDuration={3000} onClose={() => setErrorMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity="error" sx={{ width: "100%" }}>{errorMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default DashboardEntrepots;
