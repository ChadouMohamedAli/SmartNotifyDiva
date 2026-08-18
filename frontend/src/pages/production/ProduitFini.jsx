import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Box, Typography, Button, useTheme, useMediaQuery, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Menu, MenuItem, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Snackbar, IconButton, Tooltip,
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

const ProduitFini = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [produits, setProduits] = useState([]);
  const [filteredProduits, setFilteredProduits] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProduit, setSelectedProduit] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    nom: "",
    code: "",
    description: "",
    quantite: 0,
    prix: 0,
    date_production: "",
    date_expiration: "",
    statut: "en_stock",
  });

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleAddClick = () => {
    setFormData({
      id: null,
      nom: "",
      code: "",
      description: "",
      quantite: 0,
      prix: 0,
      date_production: "",
      date_expiration: "",
      statut: "en_stock",
    });
    setEditingId(null);
    setOpenDialog(true);
  };

  const handleEditClick = (produit) => {
    setFormData(produit);
    setEditingId(produit.id);
    setOpenDialog(true);
    setAnchorEl(null);
  };

  const handleDeleteClick = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit fini ?")) {
      setProduits(produits.filter(p => p.id !== id));
      setSuccessMessage("Produit supprimé");
      setAnchorEl(null);
    }
  };

  const handleSave = () => {
    if (!formData.nom) {
      setErrorMessage("Le nom est requis");
      return;
    }
    if (!formData.code) {
      setErrorMessage("Le code est requis");
      return;
    }
    if (editingId) {
      setProduits(produits.map(p => p.id === editingId ? formData : p));
      setSuccessMessage("Produit mis à jour");
    } else {
      setProduits([...produits, { ...formData, id: Date.now() }]);
      setSuccessMessage("Produit ajouté");
    }
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    const filtered = produits.filter(p =>
      p.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProduits(filtered);
  };

  useEffect(() => {
    handleSearch();
  }, [produits, searchQuery]);

  const statutColor = {
    en_stock: "#10b981",
    faible_stock: "#fbbf24",
    rupture: "#ef4444",
    archivé: "#6b7280",
  };

  const statutLabel = {
    en_stock: "En stock",
    faible_stock: "Stock faible",
    rupture: "Rupture",
    archivé: "Archivé",
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "black", position: "relative", zIndex: 1 }}>
      <Aurora colorStops={["#66a1ff", "#B19EEF", "#5227FF"]} blend={0.5} amplitude={1.0} speed={1} />

      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <Box sx={{ flex: 1, position: "relative", zIndex: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, bgcolor: "rgba(15, 23, 42, 0.5)" }}>
          <Typography variant="h4" sx={{ color: "white", fontWeight: 700 }}>
            Produit Fini
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
            placeholder="Rechercher un produit..."
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
                  <TableCell sx={{ color: "#94a3b8" }}>Code</TableCell>
                  <TableCell sx={{ color: "#94a3b8" }}>Quantité</TableCell>
                  <TableCell sx={{ color: "#94a3b8" }}>Prix</TableCell>
                  <TableCell sx={{ color: "#94a3b8" }}>Date Production</TableCell>
                  <TableCell sx={{ color: "#94a3b8" }}>Statut</TableCell>
                  <TableCell sx={{ color: "#94a3b8", textAlign: "center" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProduits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: "center", py: 3, color: "#94a3b8" }}>
                      Aucun produit trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProduits.map(produit => (
                    <TableRow key={produit.id} sx={{ borderBottom: "1px solid #1e293b" }}>
                      <TableCell sx={{ color: "white" }}>{produit.nom}</TableCell>
                      <TableCell sx={{ color: "#cbd5e1" }}>{produit.code}</TableCell>
                      <TableCell sx={{ color: "#cbd5e1" }}>{produit.quantite}</TableCell>
                      <TableCell sx={{ color: "#cbd5e1" }}>${produit.prix}</TableCell>
                      <TableCell sx={{ color: "#cbd5e1" }}>{produit.date_production}</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "inline-block",
                            bgcolor: statutColor[produit.statut],
                            color: "white",
                            padding: "4px 12px",
                            borderRadius: "4px",
                            fontSize: "0.85rem",
                          }}
                        >
                          {statutLabel[produit.statut]}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <IconButton
                          size="small"
                          sx={{ color: "#64748b" }}
                          onClick={(e) => {
                            setAnchorEl(e.currentTarget);
                            setSelectedProduit(produit);
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
        <MenuItem onClick={() => selectedProduit && handleEditClick(selectedProduit)}>
          <EditIcon sx={{ mr: 1 }} /> Éditer
        </MenuItem>
        <MenuItem onClick={() => selectedProduit && handleDeleteClick(selectedProduit.id)} sx={{ color: "red" }}>
          <DeleteIcon sx={{ mr: 1 }} /> Supprimer
        </MenuItem>
      </Menu>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "#0f172a", color: "white" }}>
          {editingId ? "Éditer Produit" : "Ajouter Produit"}
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
                "& .MuiInputLabel-root": { color: "#94a3b8" },
              }}
            />
            <TextField
              label="Code"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "#475569" } },
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
                "& .MuiInputLabel-root": { color: "#94a3b8" },
              }}
            />
            <TextField
              label="Quantité"
              name="quantite"
              type="number"
              value={formData.quantite}
              onChange={handleInputChange}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "#475569" } },
                "& .MuiInputLabel-root": { color: "#94a3b8" },
              }}
            />
            <TextField
              label="Prix"
              name="prix"
              type="number"
              value={formData.prix}
              onChange={handleInputChange}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "#475569" } },
                "& .MuiInputLabel-root": { color: "#94a3b8" },
              }}
            />
            <TextField
              label="Date Production"
              name="date_production"
              type="date"
              value={formData.date_production}
              onChange={handleInputChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "#475569" } },
                "& .MuiInputLabel-root": { color: "#94a3b8" },
              }}
            />
            <TextField
              label="Date Expiration"
              name="date_expiration"
              type="date"
              value={formData.date_expiration}
              onChange={handleInputChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "#475569" } },
                "& .MuiInputLabel-root": { color: "#94a3b8" },
              }}
            />
            <TextField
              label="Statut"
              name="statut"
              value={formData.statut}
              onChange={handleInputChange}
              fullWidth
              select
              sx={{
                "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "#475569" } },
                "& .MuiInputLabel-root": { color: "#94a3b8" },
              }}
            >
              <MenuItem value="en_stock">En stock</MenuItem>
              <MenuItem value="faible_stock">Stock faible</MenuItem>
              <MenuItem value="rupture">Rupture</MenuItem>
              <MenuItem value="archivé">Archivé</MenuItem>
            </TextField>
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

export default ProduitFini;
