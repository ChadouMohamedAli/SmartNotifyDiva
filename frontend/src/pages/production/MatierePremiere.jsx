import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Box, Typography, Grid, Card, CardContent, Button,
  useTheme, useMediaQuery, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Menu, MenuItem, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, Snackbar, Badge,
  IconButton, Tooltip,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import SharedSidebar from "../../components/SharedSidebar";
import Aurora from "../../components/Aurora/Aurora";

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

const MatierePremiere = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [matieres, setMatieres] = useState([]);
  const [filteredMatieres, setFilteredMatieres] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMatiere, setSelectedMatiere] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    nom: "",
    description: "",
    unite: "kg",
    quantite: 0,
    prix_unitaire: 0,
    fournisseur: "",
  });

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleAddClick = () => {
    setFormData({
      id: null,
      nom: "",
      description: "",
      unite: "kg",
      quantite: 0,
      prix_unitaire: 0,
      fournisseur: "",
    });
    setEditingId(null);
    setOpenDialog(true);
  };

  const handleEditClick = (matiere) => {
    setFormData(matiere);
    setEditingId(matiere.id);
    setOpenDialog(true);
    setAnchorEl(null);
  };

  const handleDeleteClick = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette matière première ?")) {
      setMatieres(matieres.filter(m => m.id !== id));
      setSuccessMessage("Matière première supprimée");
      setAnchorEl(null);
    }
  };

  const handleSave = () => {
    if (!formData.nom) {
      setErrorMessage("Le nom est requis");
      return;
    }
    if (editingId) {
      setMatieres(matieres.map(m => m.id === editingId ? formData : m));
      setSuccessMessage("Matière première mise à jour");
    } else {
      setMatieres([...matieres, { ...formData, id: Date.now() }]);
      setSuccessMessage("Matière première ajoutée");
    }
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    const filtered = matieres.filter(m =>
      m.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMatieres(filtered);
  };

  useEffect(() => {
    handleSearch();
  }, [matieres, searchQuery]);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "black", position: "relative", zIndex: 1 }}>
      <Aurora colorStops={["#66a1ff", "#B19EEF", "#5227FF"]} blend={0.5} amplitude={1.0} speed={1} />

      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <Box sx={{ flex: 1, ml: isMobile ? 0 : 0, position: "relative", zIndex: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, bgcolor: "rgba(15, 23, 42, 0.5)" }}>
          <Typography variant="h4" sx={{ color: "white", fontWeight: 700 }}>
            Matière Première
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              sx={{ bgcolor: "#3b82f6", "&:hover": { bgcolor: "#2563eb" } }}
              onClick={handleAddClick}
            >
              Ajouter
            </Button>
            <Tooltip title="Actualiser">
              <IconButton sx={{ color: "white" }} onClick={() => handleSearch()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Rechercher une matière..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                color: "white",
                "& fieldset": { borderColor: "#475569" },
                "&:hover fieldset": { borderColor: "#64748b" },
              },
              "& .MuiOutlinedInput-input::placeholder": { color: "#94a3b8", opacity: 1 },
            }}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: "#94a3b8", mr: 1 }} /> }}
          />

          <TableContainer sx={{ bgcolor: "rgba(15, 23, 42, 0.5)", borderRadius: 2, border: "1px solid #1e293b" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(30, 41, 59, 0.5)" }}>
                  <TableCell sx={{ color: "#94a3b8" }}>Nom</TableCell>
                  <TableCell sx={{ color: "#94a3b8" }}>Description</TableCell>
                  <TableCell sx={{ color: "#94a3b8" }}>Unité</TableCell>
                  <TableCell sx={{ color: "#94a3b8" }}>Quantité</TableCell>
                  <TableCell sx={{ color: "#94a3b8" }}>Prix Unitaire</TableCell>
                  <TableCell sx={{ color: "#94a3b8", textAlign: "center" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMatieres.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 3, color: "#94a3b8" }}>
                      Aucune matière première trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMatieres.map(matiere => (
                    <TableRow key={matiere.id} sx={{ borderBottom: "1px solid #1e293b" }}>
                      <TableCell sx={{ color: "white" }}>{matiere.nom}</TableCell>
                      <TableCell sx={{ color: "#cbd5e1" }}>{matiere.description}</TableCell>
                      <TableCell sx={{ color: "#cbd5e1" }}>{matiere.unite}</TableCell>
                      <TableCell sx={{ color: "#cbd5e1" }}>{matiere.quantite}</TableCell>
                      <TableCell sx={{ color: "#cbd5e1" }}>${matiere.prix_unitaire}</TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <IconButton
                          size="small"
                          sx={{ color: "#64748b" }}
                          onClick={(e) => {
                            setAnchorEl(e.currentTarget);
                            setSelectedMatiere(matiere);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => selectedMatiere && handleEditClick(selectedMatiere)}>
          <EditIcon sx={{ mr: 1 }} /> Éditer
        </MenuItem>
        <MenuItem onClick={() => selectedMatiere && handleDeleteClick(selectedMatiere.id)} sx={{ color: "red" }}>
          <DeleteIcon sx={{ mr: 1 }} /> Supprimer
        </MenuItem>
      </Menu>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "#0f172a", color: "white" }}>
          {editingId ? "Éditer Matière Première" : "Ajouter Matière Première"}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "#0f172a", color: "white" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Nom"
              name="nom"
              value={formData.nom}
              onChange={handleInputChange}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "#475569" } },
                "& .MuiInputBase-input": { color: "white" },
                "& .MuiInputLabel-root": { color: "#94a3b8" },
              }}
            />
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              sx={{
                "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "#475569" } },
                "& .MuiInputBase-input": { color: "white" },
                "& .MuiInputLabel-root": { color: "#94a3b8" },
              }}
            />
            <TextField
              label="Unité"
              name="unite"
              value={formData.unite}
              onChange={handleInputChange}
              fullWidth
              select
              sx={{
                "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "#475569" } },
                "& .MuiInputBase-input": { color: "white" },
                "& .MuiInputLabel-root": { color: "#94a3b8" },
              }}
            >
              <MenuItem value="kg">Kilogramme (kg)</MenuItem>
              <MenuItem value="g">Gramme (g)</MenuItem>
              <MenuItem value="l">Litre (l)</MenuItem>
              <MenuItem value="ml">Millilitre (ml)</MenuItem>
              <MenuItem value="u">Unité (u)</MenuItem>
            </TextField>
            <TextField
              label="Quantité"
              name="quantite"
              type="number"
              value={formData.quantite}
              onChange={handleInputChange}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "#475569" } },
                "& .MuiInputBase-input": { color: "white" },
                "& .MuiInputLabel-root": { color: "#94a3b8" },
              }}
            />
            <TextField
              label="Prix Unitaire"
              name="prix_unitaire"
              type="number"
              value={formData.prix_unitaire}
              onChange={handleInputChange}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "#475569" } },
                "& .MuiInputBase-input": { color: "white" },
                "& .MuiInputLabel-root": { color: "#94a3b8" },
              }}
            />
            <TextField
              label="Fournisseur"
              name="fournisseur"
              value={formData.fournisseur}
              onChange={handleInputChange}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "#475569" } },
                "& .MuiInputBase-input": { color: "white" },
                "& .MuiInputLabel-root": { color: "#94a3b8" },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: "#0f172a", p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: "#94a3b8" }}>Annuler</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: "#3b82f6" }}>
            {editingId ? "Mettre à jour" : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage("")}>
        <Alert severity="success" sx={{ width: "100%" }}>{successMessage}</Alert>
      </Snackbar>
      <Snackbar open={!!errorMessage} autoHideDuration={3000} onClose={() => setErrorMessage("")}>
        <Alert severity="error" sx={{ width: "100%" }}>{errorMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default MatierePremiere;
