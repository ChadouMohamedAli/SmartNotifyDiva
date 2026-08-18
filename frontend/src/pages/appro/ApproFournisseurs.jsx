import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SharedSidebar from '../../components/SharedSidebar';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Store as StoreIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Science as ScienceIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,

} from '@mui/icons-material';

const SUPPLIERS_API = "http://127.0.0.1:8000/api/fournisseurs/";
const CATEGORIES_API = "http://127.0.0.1:8000/api/categories/";

// Design tokens
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

const FAMILY_OPTIONS = [
  { key: "matiere_premiere", label: "Matière Première", hint: "Matières principales de production", abbr: "MP", accent: "#3b82f6", icon: StoreIcon },
  { key: "matiere_consommable", label: "Matière Consommable", hint: "Consommables de production", abbr: "MC", accent: "#10b981", icon: InventoryIcon },
  { key: "matiere_emballage", label: "Matière Emballage", hint: "Packaging et conditionnement", abbr: "ME", accent: "#f59e0b", icon: CategoryIcon },
  { key: "matiere_chimique", label: "Matière Chimique", hint: "Produits et composants chimiques", abbr: "MH", accent: "#a78bfa", icon: ScienceIcon },
  { key: "matiere_dangereuse", label: "Matière Dangereuse", hint: "Produits sensibles et réglementés", abbr: "MD", accent: "#f87171", icon: WarningIcon },
  { key: "fourniture_bureau", label: "Fournitures Bureau", hint: "Besoins administratifs", abbr: "FB", accent: "#38bdf8", icon: PeopleIcon },
];

// Helper pour rgba
const hexToRgba = (hex, alpha) => {
  if (!hex || hex === "#") return `rgba(59,130,246,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ApproFournisseurs = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toast = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sRes, cRes] = await Promise.all([
        axios.get(SUPPLIERS_API),
        axios.get(CATEGORIES_API)
      ]);
      const suppliersData = Array.isArray(sRes.data) ? sRes.data : sRes.data?.results || [];
      const categoriesData = Array.isArray(cRes.data) ? cRes.data : cRes.data?.results || [];
      setSuppliers(suppliersData);
      setCategories(categoriesData);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Erreur lors de la récupération des données.");
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

const familyCards = useMemo(
  () =>
    FAMILY_OPTIONS.map((fam) => {
      // Récupérer les fournisseurs qui ont ce secteur
      const suppliersInFamily = suppliers.filter((s) => s?.secteur === fam.key);
      const supplierCount = suppliersInFamily.length;
      
      // Pour les catégories, compter les catégories liées à ces fournisseurs
      const supplierIds = new Set(suppliersInFamily.map(s => s.id));
      const categoryCount = categories.filter((cat) => 
        supplierIds.has(cat?.supplier?.id) || supplierIds.has(cat?.supplier_id)
      ).length;
      
      return { ...fam, supplierCount, categoryCount };
    }),
  [suppliers, categories]
);
  const handleFamilyClick = (familyKey) => {
    navigate(`/appro/fournisseurs/${familyKey}`);
  };

  const totalSuppliers = familyCards.reduce((sum, card) => sum + card.supplierCount, 0);
  const totalCategories = familyCards.reduce((sum, card) => sum + card.categoryCount, 0);

  if (loading) {
    return (
      <Flex h="100vh" bg={C.bg} align="center" justify="center" direction="column" gap={3}>
        <Spinner size="lg" color={C.accent} thickness="2px" />
        <Text fontSize="sm" color={C.textMuted}>Chargement des données...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex h="100vh" bg={C.bg} align="center" justify="center">
        <Box textAlign="center" p={8} bg={C.surface} borderRadius="xl" borderWidth="1px" borderColor={C.border} maxW="400px">
          <WarningIcon sx={{ fontSize: 48, color: C.danger, mb: 2 }} />
          <Text color={C.text} fontWeight="600" mb={2}>Erreur de chargement</Text>
          <Text color={C.textMuted} fontSize="sm" mb={4}>{error}</Text>
          <Button 
            size="sm" 
            colorScheme="blue" 
            onClick={fetchData}
            sx={{
              bgcolor: C.accent,
              color: "white",
              "&:hover": { bgcolor: "#2563eb" }
            }}
          >
            Réessayer
          </Button>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex minH="100vh" bg={C.bg} sx={{ position: "relative" }}>
      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} selectedMenu="fournisseurs" />

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          minHeight: "100vh", 
          overflowY: "auto",
          p: isMobile ? "20px 16px" : "32px 40px",
          position: "relative",
          zIndex: 1,
          ml: { base: 0, md: "280px" },
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.75 }}>
             
              <Typography sx={{ color: C.text, fontSize: isMobile ? "1.4rem" : "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>
                Familles de matières
              </Typography>
            </Box>
            <Typography sx={{ color: C.textMuted, fontSize: "0.875rem" }}>
              Gérez vos fournisseurs par famille de produits
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/appro/fournisseurs/all?add=true")}
              sx={{
                bgcolor: C.accent,
                color: "white",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: "10px",
                px: 2,
                "&:hover": { bgcolor: "#2563eb" },
                display: { xs: "none", sm: "flex" }
              }}
            >
              Ajouter un fournisseur
            </Button>
            <Tooltip title="Actualiser">
              <IconButton 
                onClick={fetchData} 
                sx={{ 
                  color: C.textMuted, 
                  border: `1px solid ${C.border}`, 
                  borderRadius: "10px", 
                  "&:hover": { color: C.accent, borderColor: C.accent } 
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

    

        {/* Grid des familles */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={3}>
          {familyCards.map((fam) => {
            const Icon = fam.icon;
            const bgColor = hexToRgba(fam.accent, 0.08);
            const borderColor = hexToRgba(fam.accent, 0.2);
            const iconBg = hexToRgba(fam.accent, 0.12);
            const hoverBorder = fam.accent;

            return (
              <Box
                key={fam.key}
                role="button"
                tabIndex={0}
                onClick={() => handleFamilyClick(fam.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleFamilyClick(fam.key);
                  }
                }}
                sx={{ cursor: "pointer" }}
              >
                <Card sx={{
                  bgcolor: bgColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: "12px",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: `0 8px 24px ${hexToRgba(fam.accent, 0.2)}`,
                    borderColor: hoverBorder,
                    bgcolor: hexToRgba(fam.accent, 0.12),
                  },
                }}>
                  <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                    {/* Header avec label et icône */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Box>
                        <Chip
                          label={fam.abbr}
                          size="small"
                          sx={{
                            bgcolor: iconBg,
                            color: fam.accent,
                            fontWeight: 600,
                            fontSize: "0.65rem",
                            height: 20,
                            mb: 1,
                            "& .MuiChip-label": { px: 1, py: 0.5 },
                          }}
                        />
                        <Typography sx={{ color: C.text, fontWeight: 700, fontSize: "1rem", lineHeight: 1.3 }}>
                          {fam.label}
                        </Typography>
                        <Typography sx={{ color: C.textMuted, fontSize: "0.7rem", mt: 0.5 }}>
                          {fam.hint}
                        </Typography>
                      </Box>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <Icon sx={{ color: fam.accent, fontSize: 22 }} />
                      </Box>
                    </Box>

                    {/* Nombre de fournisseurs */}
                    <Box sx={{ mt: 2 }}>
                      <Typography sx={{ fontSize: "32px", fontWeight: 700, color: fam.accent, lineHeight: 1 }}>
                        {fam.supplierCount}
                      </Typography>
                      <Typography sx={{ fontSize: "11px", color: C.textMuted, mt: 0.5 }}>
                        Fournisseur{fam.supplierCount !== 1 ? "s" : ""}
                      </Typography>
                    </Box>

                    {/* Badge catégories */}
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        icon={<CategoryIcon sx={{ fontSize: 12 }} />}
                        label={`${fam.categoryCount} catégorie${fam.categoryCount !== 1 ? "s" : ""}`}
                        size="small"
                        sx={{
                          bgcolor: iconBg,
                          color: fam.accent,
                          fontWeight: 500,
                          fontSize: "0.7rem",
                          height: 24,
                          "& .MuiChip-label": { px: 1.5 },
                          "& .MuiChip-icon": { color: fam.accent, fontSize: 12, ml: 0.5 },
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </SimpleGrid>
      </Box>
    </Flex>
  );
};

export default ApproFournisseurs;