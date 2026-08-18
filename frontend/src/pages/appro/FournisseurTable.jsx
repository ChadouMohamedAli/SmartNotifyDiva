import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useActivityContext } from "../../context/ActivityContext";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
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
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from "@mui/material";
import {
  Business as BusinessIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Menu as MenuIcon,
  Check as CheckIcon,
  FilterList as FilterListIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Star as StarIcon,
  Receipt as ReceiptIcon,
  AttachMoney as AttachMoneyIcon,
  LocalShipping as LocalShippingIcon,
  Verified as VerifiedIcon,
  Percent as PercentIcon,
  Person as PersonIcon,
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

/* ─── StatCard ─────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, color, onClick }) => {
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

/* ─── Supplier Card Component ─────────────────────────────────────────── */
const SupplierCard = ({ supplier, onEdit, onDelete, onToggleStatus, onSelectSupplier }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [expanded, setExpanded] = useState(true);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getNoteColor = (note) => {
    if (note >= 4) return C.success;
    if (note >= 3) return C.warning;
    return C.danger;
  };

  const getFamilleLabel = (famille) => {
    const options = {
      matiere_premiere: "Matière Première",
      matiere_consommable: "Matière Consommable",
      matiere_emballage: "Matière Emballage",
      matiere_chimique: "Matière Chimique",
      matiere_dangereuse: "Matière Dangereuse",
      fourniture_bureau: "Fournitures Bureau",
    };
    return options[famille] || famille || "-";
  };

  const getFamilleColor = (famille) => {
    const colors = {
      matiere_premiere: C.accent,
      matiere_consommable: C.success,
      matiere_emballage: C.warning,
      matiere_chimique: C.info,
      matiere_dangereuse: C.danger,
      fourniture_bureau: "#38bdf8",
    };
    return colors[famille] || C.textMuted;
  };

  const InfoRow = ({ icon: Icon, label, value, color }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
      <Avatar sx={{ width: 32, height: 32, bgcolor: hexToRgba(color || C.accent, 0.15) }}>
        <Icon sx={{ fontSize: 16, color: color || C.accent }} />
      </Avatar>
      <Box>
        <Typography variant="caption" sx={{ color: C.textMuted, display: "block", fontSize: "0.7rem" }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ color: C.text, fontWeight: 500 }}>
          {value || "-"}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Card
      sx={{
        bgcolor: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 3,
        transition: "all 0.3s ease",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          transform: "translateY(-4px)",
          borderColor: C.accent,
          boxShadow: `0 8px 24px rgba(0,0,0,0.3)`,
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ bgcolor: hexToRgba(getFamilleColor(supplier.secteur), 0.15), width: 48, height: 48 }}>
            <BusinessIcon sx={{ color: getFamilleColor(supplier.secteur) }} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ color: C.text, fontWeight: 700 }}>
              {supplier.name}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Chip
                label={getFamilleLabel(supplier.secteur)}
                size="small"
                sx={{ bgcolor: hexToRgba(getFamilleColor(supplier.secteur), 0.15), color: getFamilleColor(supplier.secteur), fontSize: "0.7rem", height: 22 }}
              />
              <Chip
                label={supplier.is_active ? "Actif" : "Inactif"}
                size="small"
                sx={{ bgcolor: supplier.is_active ? hexToRgba(C.success, 0.15) : hexToRgba(C.danger, 0.15), color: supplier.is_active ? C.success : C.danger, fontSize: "0.7rem", height: 22 }}
              />
            </Box>
          </Box>
        </Box>
        <IconButton onClick={handleMenuOpen} sx={{ color: C.textMuted }}>
          <MoreVertIcon />
        </IconButton>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { onEdit(supplier); handleMenuClose(); }}>
          <EditIcon fontSize="small" sx={{ mr: 1, color: C.accent }} /> Modifier
        </MenuItem>
        <MenuItem onClick={() => { onDelete(supplier.id); handleMenuClose(); }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1, color: C.danger }} /> Supprimer
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onToggleStatus(supplier); handleMenuClose(); }}>
          <Switch size="small" checked={supplier.is_active} sx={{ mr: 1 }} />
          {supplier.is_active ? "Désactiver" : "Activer"}
        </MenuItem>
      </Menu>

      <CardContent sx={{ flex: 1, p: 2 }}>
        {/* INFORMATIONS LÉGALES */}
        <Typography variant="caption" sx={{ color: C.accent, fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}>
          <Box sx={{ display: "inline-block", width: 4, height: 4, bgcolor: C.accent, borderRadius: "50%" }} />
          Informations Légales
        </Typography>
        <InfoRow icon={BusinessIcon} label="Registre commercial" value={supplier.registre_commerce} />
        <InfoRow icon={BusinessIcon} label="Identifiant fiscal" value={supplier.identifiant_fiscal} />
        <InfoRow icon={BusinessIcon} label="Anciennete" value={supplier.anciennete} />

        {/* CONTACT */}
        <Typography variant="caption" sx={{ color: C.accent, fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 0.75, mb: 1.5, mt: 2 }}>
          <Box sx={{ display: "inline-block", width: 4, height: 4, bgcolor: C.accent, borderRadius: "50%" }} />
          Contact
        </Typography>
        <InfoRow icon={PersonIcon} label="Contact principal" value={supplier.contact_name} />
        <InfoRow icon={EmailIcon} label="Email" value={supplier.email} />
        <InfoRow icon={PhoneIcon} label="Téléphone" value={supplier.phone} />

        {/* LOCALISATION */}
        <Typography variant="caption" sx={{ color: C.accent, fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 0.75, mb: 1.5, mt: 2 }}>
          <Box sx={{ display: "inline-block", width: 4, height: 4, bgcolor: C.accent, borderRadius: "50%" }} />
          Localisation
        </Typography>
        <InfoRow icon={LocationOnIcon} label="Adresse" value={supplier.address} />
        <InfoRow icon={LocationOnIcon} label="Zone couverture" value={supplier.zone_couverture} />
        <InfoRow icon={LocationOnIcon} label="Ville" value={supplier.city} />
        <InfoRow icon={LocationOnIcon} label="Pays" value={supplier.country} />

        {/* OFFRE COMMERCIALE (dépliable) */}
        <Box sx={{ mt: 2, borderTop: `1px solid ${C.border}`, pt: 2 }}>
          <Typography variant="caption" sx={{ color: C.accent, fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 0.75, mb: 1.5, cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
            <Box sx={{ display: "inline-block", width: 4, height: 4, bgcolor: C.accent, borderRadius: "50%" }} />
            Offre Commerciale
            <Box sx={{ ml: "auto", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
              ▼
            </Box>
          </Typography>

          {expanded && (
            <Box sx={{ mt: 1.5 }}>
              <InfoRow icon={AttachMoneyIcon} label="Prix unitaire" value={supplier.prix_unitaire} color={C.success} />
              <InfoRow icon={ReceiptIcon} label="Conditions paiement" value={supplier.conditions_paiement} color={C.success} />
              <InfoRow icon={PercentIcon} label="Remise" value={supplier.remise} color={C.success} />
              <InfoRow icon={LocalShippingIcon} label="Délai livraison" value={supplier.delai_livraison} color={C.success} />
              <InfoRow icon={VerifiedIcon} label="Certifications" value={supplier.certifications} color={C.success} />
            </Box>
          )}
        </Box>

        {/* STATUT ET NOTE */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2.5, pt: 2, borderTop: `1px solid ${C.border}` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" sx={{ color: C.textMuted, fontSize: "0.7rem", fontWeight: 600 }}>
              Statut du fournisseur
            </Typography>
            <Switch 
              checked={supplier.is_active} 
              onChange={() => onToggleStatus(supplier)}
              size="small"
              sx={{ 
                "& .MuiSwitch-switchBase.Mui-checked": { color: C.success }, 
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: C.success } 
              }}
            />
            <Typography variant="caption" sx={{ color: supplier.is_active ? C.success : C.danger, fontSize: "0.7rem", fontWeight: 600 }}>
              {supplier.is_active ? "Actif" : "Inactif"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <StarIcon sx={{ fontSize: 18, color: getNoteColor(supplier.note_globale) }} />
            <Typography variant="body2" sx={{ color: C.textSub }}>Note: {supplier.note_globale}/5</Typography>
          </Box>
        </Box>

        <Button fullWidth variant="contained" onClick={() => onSelectSupplier(supplier)} sx={{ mt: 2.5, bgcolor: C.success, color: "white", fontWeight: 600, textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#059669" } }}>
          ✓ Choisir ce fournisseur
        </Button>
      </CardContent>
    </Card>
  );
};

const Fournisseur = () => {
  const { user } = useAuth();
  const { triggerActivityRefresh } = useActivityContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { familyKey } = useParams(); // Récupérer le paramètre d'URL (:familyKey depuis la route)
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSecteur, setFilterSecteur] = useState("");
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedSupplierForConfirm, setSelectedSupplierForConfirm] = useState(null);

  // Appliquer le filtre automatiquement quand le paramètre d'URL change
  useEffect(() => {
    if (familyKey && familyKey !== "all") {
      // Convertir le nom de la famille (ex: "matiere-premiere" -> "matiere_premiere" ou "matiere_premiere" -> "matiere_premiere")
      const secteurMap = {
        "matiere-premiere": "matiere_premiere",
        "matiere_premiere": "matiere_premiere",
        "matiere-consommable": "matiere_consommable",
        "matiere_consommable": "matiere_consommable",
        "matiere-emballage": "matiere_emballage",
        "matiere_emballage": "matiere_emballage",
        "matiere-chimique": "matiere_chimique",
        "matiere_chimique": "matiere_chimique",
        "matiere-dangereuse": "matiere_dangereuse",
        "matiere_dangereuse": "matiere_dangereuse",
        "fourniture-bureau": "fourniture_bureau",
        "fourniture_bureau": "fourniture_bureau",
      };
      
      const mappedSecteur = secteurMap[familyKey] || familyKey;
      setFilterSecteur(mappedSecteur);
      
      // Afficher un message de notification
      const secteurLabel = {
        matiere_premiere: "Matière première",
        matiere_consommable: "Matière consommable",
        matiere_emballage: "Matière emballage",
        matiere_chimique: "Matière chimique",
        matiere_dangereuse: "Matière dangereuse",
        fourniture_bureau: "Fournitures bureau",
      }[mappedSecteur] || familyKey;
      
      setSuccessMessage(`Filtre appliqué : ${secteurLabel}`);
      
      // Nettoyer le message après 3 secondes
      setTimeout(() => setSuccessMessage(""), 3000);
    } else if (familyKey === "all") {
      setFilterSecteur("");
    }
  }, [familyKey]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("add") === "true") {
      handleOpenAddDialog();
    }
  }, [location.search]);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    secteur: "",
    registre_commerce: "",
    identifiant_fiscal: "",
    anciennete: "",
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
  });

  const [suppliers, setSuppliers] = useState([]);

  const API_BASE = "http://localhost:8000/api/fournisseurs/";

  const secteurOptions = [
    { value: "", label: "Tous les secteurs" },
    { value: "matiere_premiere", label: "Matière première" },
    { value: "matiere_consommable", label: "Matière consommable" },
    { value: "matiere_emballage", label: "Matière emballage" },
    { value: "matiere_chimique", label: "Matière chimique" },
    { value: "matiere_dangereuse", label: "Matière dangereuse" },
    { value: "fourniture_bureau", label: "Fournitures bureau" },
  ];

  const conditionsPaiementOptions = [
    "Net à réception",
    "30 jours fin de mois",
    "45 jours fin de mois",
    "60 jours fin de mois",
    "À la commande",
    "À la livraison",
    "Crédit documentaire",
  ];

  const mapFromApi = (item) => ({
    id: item.id,
    name: item.name || "",
    contact_name: item.contact_name || "",
    email: item.email || "",
    phone: item.phone || "",
    address: item.address || "",
    city: item.city || "",
    country: item.country || "",
    secteur: item.secteur || item.famille || item.family || "",
    registre_commerce: item.registre_commerce || "",
    identifiant_fiscal: item.identifiant_fiscal || "",
    anciennete: item.anciennete || "",
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
    contact_name: item.contact_name,
    email: item.email,
    phone: item.phone,
    address: item.address,
    city: item.city,
    country: item.country,
    secteur: item.secteur,
    registre_commerce: item.registre_commerce,
    identifiant_fiscal: item.identifiant_fiscal,
    anciennete: item.anciennete,
    prix_unitaire: item.prix_unitaire,
    conditions_paiement: item.conditions_paiement,
    remise: item.remise,
    zone_couverture: item.zone_couverture,
    minimum_commande: item.minimum_commande,
    delai_livraison: item.delai_livraison,
    certifications: item.certifications,
    garantie_sav: item.garantie_sav,
    references_clients: item.references_clients,
    capacite_production: item.capacite_production,
    is_active: item.is_active,
    note_globale: item.note_globale,
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

  useEffect(() => {
    if (location.pathname === "/appro/fournisseurs/new") {
      handleOpenAddDialog();
    }
  }, [location.pathname]);

  const emptyForm = {
    id: null,
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    secteur: "",
    registre_commerce: "",
    identifiant_fiscal: "",
    anciennete: "",
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

  const handleOpenAddDialog = (supplier = null) => {
    if (supplier) {
      setFormData(supplier);
    } else {
      setFormData(emptyForm);
    }
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setFormData(emptyForm);
    if (location.pathname === "/appro/fournisseurs/new") {
      navigate("/appro/fournisseurs");
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
        setSuccessMessage("Fournisseur mis à jour avec succès");
      } else {
        setSuppliers([saved, ...suppliers]);
        setSuccessMessage("Fournisseur ajouté avec succès");
        triggerActivityRefresh();
      }
      handleCloseAddDialog();
    } catch (error) {
      setErrorMessage("Erreur réseau lors de l'enregistrement du fournisseur");
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
      setSuccessMessage("Fournisseur supprimé avec succès");
    } catch (error) {
      setErrorMessage("Erreur réseau lors de la suppression du fournisseur");
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

  const handleSelectSupplier = (supplier) => {
    setSelectedSupplierForConfirm(supplier);
    setConfirmDialogOpen(true);
  };

  const handleConfirmSelection = () => {
    // Naviguer vers la page formulaire Bon d'Achat avec le fournisseur sélectionné
    navigate("/appro/bon-achat/new", { 
      state: { selectedSupplier: selectedSupplierForConfirm } 
    });
    setSuccessMessage(`Fournisseur "${selectedSupplierForConfirm?.name}" sélectionné - Création du bon d'achat`);
    setConfirmDialogOpen(false);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleCancelSelection = () => {
    setConfirmDialogOpen(false);
    setSelectedSupplierForConfirm(null);
  };

  // Filtrage des fournisseurs
  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (
      s.name?.toLowerCase().includes(q) ||
      s.contact_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.country?.toLowerCase().includes(q)
    );
    
    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "active" && s.is_active) ||
      (filterStatus === "inactive" && !s.is_active);
    
    const matchesSecteur = !filterSecteur || s.secteur === filterSecteur;
    
    return matchesSearch && matchesStatus && matchesSecteur;
  });

  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "active", label: "Actifs" },
    { value: "inactive", label: "Inactifs" },
  ];

  const activeFiltersCount = (filterStatus !== "all" ? 1 : 0) + (filterSecteur ? 1 : 0);

  const menuItemSx = (active) => ({
    px: 2, py: 0.8,
    color: active ? C.accent : C.textSub,
    bgcolor: active ? C.accentDim : "transparent",
    fontSize: "0.875rem", display: "flex", justifyContent: "space-between", alignItems: "center",
    "&:hover": { bgcolor: hexToRgba(C.accent, 0.08), color: C.text },
  });

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

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: C.bg, overflow: "hidden", position: "relative" }}>
      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(!mobileOpen)} selectedMenu="fournisseurs" />

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, height: "100vh", bgcolor: C.bg, overflowY: "auto", overflowX: "hidden", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ p: 1.2, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          {isMobile && (
            <IconButton onClick={() => setMobileOpen(!mobileOpen)} sx={{ color: C.text }}>
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: "auto" }}>
            {(user?.role === "responsable_appro" || user?.is_superuser) && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenAddDialog()}
                sx={{
                  bgcolor: C.accent,
                  color: "white",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: "10px",
                  "&:hover": { bgcolor: "#2563eb" },
                  display: { xs: "none", sm: "flex" }
                }}
              >
                Ajouter un fournisseur
              </Button>
            )}
            {isMobile && (user?.role === "responsable_appro" || user?.is_superuser) && (
              <IconButton 
                onClick={() => handleOpenAddDialog()}
                sx={{ bgcolor: C.accent, color: "white", borderRadius: "10px", "&:hover": { bgcolor: "#2563eb" } }}
              >
                <AddIcon />
              </IconButton>
            )}
            <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
              <Typography variant="body2" sx={{ color: C.text, fontWeight: 600 }}>{user?.first_name || user?.username}</Typography>
              <Typography variant="caption" sx={{ color: C.textMuted }}>
                {user?.is_superuser ? "Administrateur" : user?.role === "responsable_appro" ? "Responsable Approvisionnement" : user?.role === "responsable_stock" ? "Responsable Stock" : "Utilisateur"}
              </Typography>
            </Box>
            <Avatar sx={{ width: 40, height: 40, bgcolor: user?.is_superuser || user?.is_staff ? C.danger : user?.role === "responsable_appro" ? C.warning : user?.role === "responsable_stock" ? C.success : C.accent, fontWeight: 600, fontSize: "1rem" }}>
              {user?.first_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || "U"}
            </Avatar>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Titre avec filtre actif */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ color: C.text, fontWeight: 700, mb: 0.5 }}>
                Gestion des fournisseurs
              </Typography>
              <Typography variant="body2" sx={{ color: C.textMuted }}>
                {filterSecteur ? (
                  <>Affichage des fournisseurs pour : <strong style={{ color: C.accent }}>{secteurOptions.find(opt => opt.value === filterSecteur)?.label}</strong></>
                ) : (
                  "Gérez et suivez tous vos fournisseurs"
                )}
              </Typography>
            </Box>
          </Box>

          {/* Barre de recherche et filtres */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: activeFiltersCount > 0 ? 1.5 : 3 }}>
            <Tooltip title="Filtres">
              <Badge badgeContent={activeFiltersCount} sx={{ "& .MuiBadge-badge": { bgcolor: C.accent, color: C.text } }}>
                <IconButton onClick={(e) => setFilterAnchorEl(e.currentTarget)} sx={{ color: activeFiltersCount > 0 ? C.accent : C.textMuted, border: `1px solid ${C.border}`, borderRadius: "10px", width: 44, height: 44 }}>
                  <CiFilter size={22} />
                </IconButton>
              </Badge>
            </Tooltip>

            <TextField
              placeholder="Rechercher par nom, contact, email, ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: C.textMuted }} /></InputAdornment>) }}
              sx={{ flex: 1, "& .MuiOutlinedInput-root": { color: C.textSub, bgcolor: hexToRgba(C.accent, 0.05), borderRadius: "10px", "& fieldset": { borderColor: C.border }, "&:hover fieldset": { borderColor: C.borderHi }, "&.Mui-focused fieldset": { borderColor: C.accent } } }}
            />

            {/* Bouton pour effacer le filtre secteur */}
            {filterSecteur && (
              <Button 
                variant="outlined"
                size="small"
                onClick={() => { setFilterSecteur(""); navigate("/appro/fournisseurs"); }}
                sx={{ borderColor: C.border, color: C.textMuted, textTransform: "none", whiteSpace: "nowrap" }}
              >
                Effacer le filtre
              </Button>
            )}
          </Box>

          {/* Filtres actifs */}
          {activeFiltersCount > 0 && (
            <Box sx={{ display: "flex", gap: 1, mb: 2.5, flexWrap: "wrap", alignItems: "center" }}>
              {filterStatus !== "all" && (
                <Chip label={statusOptions.find((s) => s.value === filterStatus)?.label} onDelete={() => setFilterStatus("all")} size="small" sx={{ bgcolor: C.accentDim, color: C.accent, fontWeight: 500 }} />
              )}
              {filterSecteur && (
                <Chip 
                  label={`Secteur: ${secteurOptions.find((opt) => opt.value === filterSecteur)?.label || filterSecteur}`} 
                  onDelete={() => { setFilterSecteur(""); navigate("/appro/fournisseurs"); }} 
                  size="small" 
                  sx={{ bgcolor: C.accentDim, color: C.accent, fontWeight: 500 }} 
                />
              )}
              <Button size="small" onClick={() => { setFilterStatus("all"); setFilterSecteur(""); navigate("/appro/fournisseurs"); }} sx={{ color: C.textMuted, fontSize: "0.75rem", textTransform: "none" }}>Tout effacer</Button>
            </Box>
          )}

          {/* Liste des fournisseurs */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: C.accent }} /></Box>
          ) : filteredSuppliers.length > 0 ? (
            <Grid container spacing={3}>
              {filteredSuppliers.map((supplier) => (
                <Grid item xs={12} md={6} lg={4} key={supplier.id}>
                  <SupplierCard supplier={supplier} onEdit={handleOpenAddDialog} onDelete={handleDeleteSupplier} onToggleStatus={handleToggleStatus} onSelectSupplier={handleSelectSupplier} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Card sx={{ bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", textAlign: "center", py: 6 }}>
              <BusinessIcon sx={{ fontSize: 64, color: C.border, mb: 2 }} />
              <Typography variant="h6" sx={{ color: C.text, mb: 1 }}>Aucun fournisseur trouvé</Typography>
              <Typography sx={{ color: C.textMuted }}>
                {filterSecteur 
                  ? `Aucun fournisseur dans la catégorie "${secteurOptions.find(opt => opt.value === filterSecteur)?.label}".` 
                  : searchQuery 
                    ? "Aucun fournisseur ne correspond à votre recherche." 
                    : "Commencez par ajouter un fournisseur."}
              </Typography>
            </Card>
          )}
        </Box>
      </Box>

      {/* Menu de filtres */}
      <Menu anchorEl={filterAnchorEl} open={Boolean(filterAnchorEl)} onClose={() => setFilterAnchorEl(null)} PaperProps={{ sx: { bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", minWidth: 240 } }}>
        <Box sx={{ px: 2, py: 1.2, borderBottom: `1px solid ${C.border}` }}>
          <Typography sx={{ color: C.textSub, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 0.75 }}>
            <FilterListIcon sx={{ fontSize: 14 }} /> Statut
          </Typography>
        </Box>
        {statusOptions.map((opt) => (
          <MenuItem key={opt.value} onClick={() => setFilterStatus(opt.value)} sx={menuItemSx(filterStatus === opt.value)}>
            <span>{opt.label}</span>
            {filterStatus === opt.value && <CheckIcon sx={{ fontSize: 16, ml: "auto" }} />}
          </MenuItem>
        ))}
        <Divider sx={{ borderColor: C.border, my: 1 }} />
        <Box sx={{ px: 2, py: 1.2, borderBottom: `1px solid ${C.border}` }}>
          <Typography sx={{ color: C.textSub, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 0.75 }}>
            <BusinessIcon sx={{ fontSize: 14 }} /> Secteur
          </Typography>
        </Box>
        {secteurOptions.filter(opt => opt.value !== "").map((opt) => (
          <MenuItem key={opt.value} onClick={() => { setFilterSecteur(opt.value); setFilterAnchorEl(null); }} sx={menuItemSx(filterSecteur === opt.value)}>
            <span>{opt.label}</span>
            {filterSecteur === opt.value && <CheckIcon sx={{ fontSize: 16, ml: "auto" }} />}
          </MenuItem>
        ))}
        {activeFiltersCount > 0 && (
          <>
            <Divider sx={{ borderColor: C.border, mt: 1 }} />
            <Box sx={{ p: 1.5 }}>
              <Button fullWidth size="small" onClick={() => { setFilterStatus("all"); setFilterSecteur(""); navigate("/appro/fournisseurs"); setFilterAnchorEl(null); }} sx={{ color: C.danger, fontSize: "0.8rem", textTransform: "none", border: `1px solid rgba(239,68,68,0.3)`, borderRadius: "6px" }}>Réinitialiser les filtres</Button>
            </Box>
          </>
        )}
      </Menu>

      {/* Dialogue d'ajout/modification */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="lg" fullWidth PaperProps={{ sx: { bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: 3, maxHeight: "90vh" } }}>
        <DialogTitle sx={{ color: C.text, fontWeight: 700, borderBottom: `1px solid ${C.border}` }}>{formData.id ? "Modifier le fournisseur" : "Ajouter un fournisseur"}</DialogTitle>
        <DialogContent sx={{ pt: 3, overflowY: "auto" }}>
          {/* INFORMATIONS GÉNÉRALES */}
          <Typography variant="h6" sx={{ color: C.accent, fontWeight: 600, mb: 2, borderLeft: `4px solid ${C.accent}`, pl: 1.5 }}>INFORMATIONS GÉNÉRALES</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <TextField label="Nom du fournisseur *" value={formData.name} fullWidth size="medium" sx={largeInputSx} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Registre commercial / ICE" value={formData.registre_commerce} fullWidth size="medium" sx={largeInputSx} onChange={(e) => setFormData({ ...formData, registre_commerce: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Identifiant fiscal / RC" value={formData.identifiant_fiscal} fullWidth size="medium" sx={largeInputSx} onChange={(e) => setFormData({ ...formData, identifiant_fiscal: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="medium" sx={largeInputSx}>
                <InputLabel>Secteur / Catégorie *</InputLabel>
                <Select value={formData.secteur} label="Secteur / Catégorie *" onChange={(e) => setFormData({ ...formData, secteur: e.target.value })}>
                  {secteurOptions.filter(opt => opt.value !== "").map((opt) => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Ancienneté" value={formData.anciennete} fullWidth size="medium" sx={largeInputSx} placeholder="Ex: 10 ans" onChange={(e) => setFormData({ ...formData, anciennete: e.target.value })} />
            </Grid>
          </Grid>

          {/* CONTACT & LOCALISATION */}
          <Typography variant="h6" sx={{ color: C.accent, fontWeight: 600, mb: 2, borderLeft: `4px solid ${C.accent}`, pl: 1.5 }}>CONTACT & LOCALISATION</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField label="Email" type="email" value={formData.email} fullWidth size="medium" sx={largeInputSx} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Téléphone" value={formData.phone} fullWidth size="medium" sx={largeInputSx} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Contact principal" value={formData.contact_name} fullWidth size="medium" sx={largeInputSx} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Adresse" value={formData.address} fullWidth size="medium" sx={largeInputSx} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Ville" value={formData.city} fullWidth size="medium" sx={largeInputSx} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Pays" value={formData.country} fullWidth size="medium" sx={largeInputSx} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
            </Grid>
          </Grid>

          {/* OFFRE COMMERCIALE */}
          <Typography variant="h6" sx={{ color: C.accent, fontWeight: 600, mb: 2, borderLeft: `4px solid ${C.accent}`, pl: 1.5 }}>OFFRE COMMERCIALE</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField label="Prix unitaire" value={formData.prix_unitaire} fullWidth size="medium" sx={largeInputSx} onChange={(e) => setFormData({ ...formData, prix_unitaire: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="medium" sx={largeInputSx}>
                <InputLabel>Conditions de paiement</InputLabel>
                <Select value={formData.conditions_paiement} label="Conditions de paiement" onChange={(e) => setFormData({ ...formData, conditions_paiement: e.target.value })}>
                  {conditionsPaiementOptions.map((opt) => (<MenuItem key={opt} value={opt}>{opt}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Remise" value={formData.remise} fullWidth size="medium" sx={largeInputSx} placeholder="Ex: 5%" onChange={(e) => setFormData({ ...formData, remise: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Zone de couverture" value={formData.zone_couverture} fullWidth size="medium" sx={largeInputSx} onChange={(e) => setFormData({ ...formData, zone_couverture: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Minimum de commande" value={formData.minimum_commande} fullWidth size="medium" sx={largeInputSx} onChange={(e) => setFormData({ ...formData, minimum_commande: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Délai de livraison" value={formData.delai_livraison} fullWidth size="medium" sx={largeInputSx} placeholder="Ex: 5-7 jours" onChange={(e) => setFormData({ ...formData, delai_livraison: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Certifications" value={formData.certifications} fullWidth size="medium" sx={largeInputSx} placeholder="ISO, CE..." onChange={(e) => setFormData({ ...formData, certifications: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Garantie SAV" value={formData.garantie_sav} fullWidth size="medium" sx={largeInputSx} onChange={(e) => setFormData({ ...formData, garantie_sav: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Références clients" value={formData.references_clients} fullWidth size="medium" sx={largeInputSx} multiline rows={2} onChange={(e) => setFormData({ ...formData, references_clients: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Capacité de production" value={formData.capacite_production} fullWidth size="medium" sx={largeInputSx} multiline rows={2} onChange={(e) => setFormData({ ...formData, capacite_production: e.target.value })} />
            </Grid>
          </Grid>

          {/* ÉVALUATION */}
          <Typography variant="h6" sx={{ color: C.accent, fontWeight: 600, mb: 2, borderLeft: `4px solid ${C.accent}`, pl: 1.5 }}>ÉVALUATION</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="medium" sx={largeInputSx}>
                <InputLabel>Note globale (1–5)</InputLabel>
                <Select value={formData.note_globale} label="Note globale (1–5)" onChange={(e) => setFormData({ ...formData, note_globale: e.target.value })}>
                  {[1, 2, 3, 4, 5].map(n => (<MenuItem key={n} value={n}>{n} / 5</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="medium" sx={largeInputSx}>
                <InputLabel>Statut</InputLabel>
                <Select value={formData.is_active ? "active" : "inactive"} label="Statut" onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "active" })}>
                  <MenuItem value="active">Actif</MenuItem>
                  <MenuItem value="inactive">Inactif</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Commentaires" value={formData.commentaires} fullWidth size="medium" sx={largeInputSx} multiline rows={3} onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${C.border}` }}>
          <Button onClick={handleCloseAddDialog} sx={{ color: C.textMuted }}>Annuler</Button>
          <Button onClick={handleSaveSupplier} variant="contained" sx={{ bgcolor: C.accent, fontWeight: 600, textTransform: "none", "&:hover": { bgcolor: "#2563eb" } }}>Enregistrer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de confirmation */}
      <Dialog open={confirmDialogOpen} onClose={handleCancelSelection} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: 3 } }}>
        <DialogTitle sx={{ color: C.text, fontWeight: 700 }}>Confirmation du choix</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: C.textSub, mb: 2 }}>Êtes-vous sûr de vouloir choisir ce fournisseur ?</Typography>
          {selectedSupplierForConfirm && (
            <Alert severity="info" sx={{ bgcolor: hexToRgba(C.accent, 0.08), color: C.text, border: `1px solid ${hexToRgba(C.accent, 0.25)}`, "& .MuiAlert-icon": { color: C.accent } }}>
              {selectedSupplierForConfirm.name}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCancelSelection} sx={{ color: C.textMuted }}>Annuler</Button>
          <Button onClick={handleConfirmSelection} variant="contained" sx={{ bgcolor: C.success, textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#059669" } }}>Confirmer</Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity="success">{successMessage}</Alert>
      </Snackbar>
      <Snackbar open={!!errorMessage} autoHideDuration={3000} onClose={() => setErrorMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity="error">{errorMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Fournisseur;