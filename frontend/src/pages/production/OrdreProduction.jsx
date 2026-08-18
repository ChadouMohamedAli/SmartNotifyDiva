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

const OrdreProduction = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [ordres, setOrdres] = useState([]);
  const [filteredOrdres, setFilteredOrdres] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrdre, setSelectedOrdre] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    numero: "",
    date_debut: "",
    date_fin: "",
    statut: "en_attente",
    quantite: 0,
    produit: "",
    notes: "",
  });

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleAddClick = () => {
    setFormData({
      id: null,
      numero: "",
      date_debut: "",
      date_fin: "",
      statut: "en_attente",
      quantite: 0,
      produit: "",
      notes: "",
    });
    setEditingId(null);
    setOpenDialog(true);
  };

  const handleEditClick = (ordre) => {
    setFormData(ordre);
    setEditingId(ordre.id);
    setOpenDialog(true);
    setAnchorEl(null);
  };

  const handleDeleteClick = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet ordre de production ?")) {
      setOrdres(ordres.filter(o => o.id !== id));
      setSuccessMessage("Ordre supprimé");
      setAnchorEl(null);
    }
  };

  const handleSave = () => {
    if (!formData.numero) {
      setErrorMessage("Le numéro est requis");
      return;
    }
    if (!formData.date_debut || !formData.date_fin) {
      setErrorMessage("Les dates sont requises");
      return;
    }
    if (editingId) {
      setOrdres(ordres.map(o => o.id === editingId ? formData : o));
      setSuccessMessage("Ordre mis à jour");
    } else {
      setOrdres([...ordres, { ...formData, id: Date.now() }]);
      setSuccessMessage("Ordre ajouté");
    }
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    const filtered = ordres.filter(o =>
      o.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.produit.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredOrdres(filtered);
  };

  useEffect(() => {
    handleSearch();
  }, [ordres, searchQuery]);

  const statutColor = {
    en_attente: "#fbbf24",
    en_cours: "#3b82f6",
    completé: "#10b981",
    annulé: "#ef4444",
  };

  const statutLabel = {
    en_attente: "En attente",
    en_cours: "En cours",
    completé: "Complété",
    annulé: "Annulé",
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "black", position: "relative", zIndex: 1 }}>
      <Aurora colorStops={["#66a1ff", "#B19EEF", "#5227FF"]} blend={0.5} amplitude={1.0} speed={1} />

      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <Box sx={{ flex: 1, position: "relative", zIndex: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, bgcolor: "rgba(15, 23, 42, 0.5)" }}>
          <Typography variant="h4" sx={{ color: "white", fontWeight: 700 }}>
            Ordre de Production
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
            placeholder="Rechercher un ordre..."
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
                  <TableCell sx={{ color: "#94a3b8" }}>Numéro</TableCell>
                  <TableCell sx={{ color: "#94a3b8" }}>Produit</TableCell>
                  <TableCell sx={{ color: "#94a3b8" }}>Quantité</TableCell>
                  <TableCell sx={{ color: "#94a3b8" }}>Date Début</TableCell>
                  <TableCell sx={{ color: "#94a3b8" }}>Date Fin</TableCell>
                  <TableCell sx={{ color: "#94a3b8" }}>Statut</TableCell>
                  <TableCell sx={{ color: "#94a3b8", textAlign: "center" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrdres.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: "center", py: 3, color: "#94a3b8" }}>
                      Aucun ordre trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrdres.map(ordre => (
                    <TableRow key={ordre.id} sx={{ borderBottom: "1px solid #1e293b" }}>
                      <TableCell sx={{ color: "white" }}>{ordre.numero}</TableCell>
                      <TableCell sx={{ color: "#cbd5e1" }}>{ordre.produit}</TableCell>
                      <TableCell sx={{ color: "#cbd5e1" }}>{ordre.quantite}</TableCell>
                      <TableCell sx={{ color: "#cbd5e1" }}>{ordre.date_debut}</TableCell>
                      <TableCell sx={{ color: "#cbd5e1" }}>{ordre.date_fin}</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "inline-block",
                            bgcolor: statutColor[ordre.statut],
                            color: "white",
                            padding: "4px 12px",
                            borderRadius: "4px",
                            fontSize: "0.85rem",
                          }}
                        >
                          {statutLabel[ordre.statut]}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <IconButton
                          size="small"
                          sx={{ color: "#64748b" }}
                          onClick={(e) => {
                            setAnchorEl(e.currentTarget);
                            setSelectedOrdre(ordre);
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
        <MenuItem onClick={() => selectedOrdre && handleEditClick(selectedOrdre)}>
          <EditIcon sx={{ mr: 1 }} /> Éditer
        </MenuItem>
        <MenuItem onClick={() => selectedOrdre && handleDeleteClick(selectedOrdre.id)} sx={{ color: "red" }}>
          <DeleteIcon sx={{ mr: 1 }} /> Supprimer
        </MenuItem>
      </Menu>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "#0f172a", color: "white" }}>
          {editingId ? "Éditer Ordre" : "Ajouter Ordre"}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "#0f172a", color: "white" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Numéro"
              name="numero"
              value={formData.numero}
              onChange={handleInputChange}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "#475569" } },
                "& .MuiInputLabel-root": { color: "#94a3b8" },
              }}
            />
            <TextField
              label="Produit"
              name="produit"
              value={formData.produit}
              onChange={handleInputChange}
              fullWidth
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
              label="Date Début"
              name="date_debut"
              type="date"
              value={formData.date_debut}
              onChange={handleInputChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "#475569" } },
                "& .MuiInputLabel-root": { color: "#94a3b8" },
              }}
            />
            <TextField
              label="Date Fin"
              name="date_fin"
              type="date"
              value={formData.date_fin}
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
              <MenuItem value="en_attente">En attente</MenuItem>
              <MenuItem value="en_cours">En cours</MenuItem>
              <MenuItem value="completé">Complété</MenuItem>
              <MenuItem value="annulé">Annulé</MenuItem>
            </TextField>
            <TextField
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              sx={{
                "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "#475569" } },
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

export default OrdreProduction;
