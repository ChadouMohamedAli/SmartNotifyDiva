import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Avatar,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Tooltip,
  Snackbar,
  Tabs,
  Tab,
  Badge,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Star as StarIcon,
  Shield as ShieldIcon,
  Menu as MenuIcon,
  PriorityHigh as PriorityHighIcon,
  Close as CloseIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SharedSidebar from '../../components/SharedSidebar';

// ─────────────────────────────────────────────
// UrgentAlertsModal — s'affiche au login
// ─────────────────────────────────────────────
const UrgentAlertsModal = ({ open, onClose, alerts = [] }) => {
  const urgentAlerts = (alerts || []).filter(
    (a) =>
      a.is_active === true ||
      a.status === "active" ||
      a.status === "ACTIVE" ||
      a.active === true ||
      a.type === "critical" ||
      a.severity === "critical" ||
      a.priority === "high"
  );

  const getSeverityColor = (alert) => {
    if (alert.type === "critical" || alert.severity === "critical" || alert.priority === "high") return "#ef4444";
    if (alert.type === "warning" || alert.severity === "warning") return "#f59e0b";
    return "#3b82f6";
  };

  const getSeverityBg = (alert) => {
    if (alert.type === "critical" || alert.severity === "critical" || alert.priority === "high")
      return "rgba(239, 68, 68, 0.08)";
    if (alert.type === "warning" || alert.severity === "warning")
      return "rgba(245, 158, 11, 0.08)";
    return "rgba(59, 130, 246, 0.08)";
  };

  const getSeverityLabel = (alert) => {
    if (alert.type === "critical" || alert.severity === "critical") return "Critique";
    if (alert.type === "warning" || alert.severity === "warning") return "Avertissement";
    return "Active";
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "#0a0f1a",
          border: "1px solid rgba(239, 68, 68, 0.35)",
          borderRadius: 3,
          boxShadow: "0 0 60px rgba(239, 68, 68, 0.15), 0 24px 64px rgba(0,0,0,0.7)",
          overflow: "hidden",
        },
      }}
      BackdropProps={{
        sx: { backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.75)" },
      }}
    >
      {/* Header avec animation pulse */}
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            px: 3,
            py: 2.5,
            background: "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(15,23,42,0.6) 100%)",
            borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {/* Pulsing red dot */}
            <Box sx={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  bgcolor: "#ef4444",
                  "@keyframes urgentPulse": {
                    "0%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.7)" },
                    "70%": { boxShadow: "0 0 0 10px rgba(239,68,68,0)" },
                    "100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0)" },
                  },
                  animation: "urgentPulse 1.5s infinite",
                }}
              />
            </Box>
            <PriorityHighIcon sx={{ color: "#ef4444", fontSize: 22 }} />
            <Box>
              <Typography sx={{ color: "white", fontWeight: 700, fontSize: "1rem", lineHeight: 1.2 }}>
                Alertes urgentes
              </Typography>
              <Typography sx={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                {urgentAlerts.length} alerte{urgentAlerts.length > 1 ? "s" : ""} nécessite{urgentAlerts.length > 1 ? "nt" : ""} votre attention
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: "#64748b",
              "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.1)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, maxHeight: 420, overflowY: "auto",
        "&::-webkit-scrollbar": { width: "6px" },
        "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
        "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(239,68,68,0.3)", borderRadius: "3px" },
      }}>
        {urgentAlerts.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6, px: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: "#10b981", mb: 2 }} />
            <Typography sx={{ color: "white", fontWeight: 600, mb: 0.5 }}>Aucune alerte urgente</Typography>
            <Typography sx={{ color: "#64748b", fontSize: "0.875rem" }}>
              Tous les systèmes fonctionnent normalement.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {urgentAlerts.map((alert, idx) => {
              const color = getSeverityColor(alert);
              const bg = getSeverityBg(alert);
              return (
                <Box
                  key={alert.id || idx}
                  sx={{
                    p: 2,
                    bgcolor: bg,
                    border: `1px solid ${color}30`,
                    borderLeft: `3px solid ${color}`,
                    borderRadius: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: `${bg}`,
                      borderColor: `${color}60`,
                      transform: "translateX(2px)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.8 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <ErrorIcon sx={{ color, fontSize: 16 }} />
                      <Typography sx={{ color: "white", fontWeight: 600, fontSize: "0.9rem" }}>
                        {alert.name || alert.title || `Alerte #${alert.id}`}
                      </Typography>
                    </Box>
                    <Chip
                      label={getSeverityLabel(alert)}
                      size="small"
                      sx={{
                        bgcolor: `${color}20`,
                        color,
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        height: 20,
                        border: `1px solid ${color}40`,
                      }}
                    />
                  </Box>

                  {alert.module && (
                    <Typography sx={{ color: "#64748b", fontSize: "0.75rem", mb: 0.5 }}>
                      Module : <span style={{ color: "#94a3b8" }}>{alert.module}</span>
                    </Typography>
                  )}

                  {(alert.message || alert.description || alert.condition) && (
                    <Typography sx={{ color: "#94a3b8", fontSize: "0.8rem", lineHeight: 1.5 }}>
                      {alert.message || alert.description || alert.condition}
                    </Typography>
                  )}

                  {alert.created_at && (
                    <Typography sx={{ color: "#475569", fontSize: "0.72rem", mt: 0.8 }}>
                      {new Date(alert.created_at).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid rgba(239, 68, 68, 0.15)",
          background: "rgba(15,23,42,0.4)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography sx={{ color: "#475569", fontSize: "0.78rem" }}>
          Connecté en tant que Super Administrateur
        </Typography>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: "#ef4444",
            color: "white",
            fontWeight: 600,
            fontSize: "0.85rem",
            px: 3,
            py: 0.8,
            borderRadius: 2,
            textTransform: "none",
            "&:hover": { bgcolor: "#dc2626", boxShadow: "0 4px 16px rgba(239,68,68,0.4)" },
          }}
        >
          Accéder au tableau de bord
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // États
  const [openUrgentModal, setOpenUrgentModal] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour les dialogues
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [dialogType, setDialogType] = useState('user'); // 'user' ou 'admin'
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Formulaire
  const [newAccount, setNewAccount] = useState({
    email: '',
    username: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  });
  
  // Notifications
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Vérifie si l'utilisateur est le superadmin
  const isSuperAdmin = user?.email === 'superadmin@example.com';

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAllUsers();
    } else {
      navigate('/dashboard'); // Redirige les non-superadmins
    }
  }, [user, navigate, isSuperAdmin]);

  // Récupère TOUS les utilisateurs
  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Utilisez votre endpoint API existant ou créez-en un
      // Pour l'instant, on va simuler avec des données
      const usersData = await simulateUsersFetch();
      setAllUsers(usersData);
      
    } catch (error) {
      console.error('Erreur récupération users:', error);
      setError('Erreur de chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  // Simulation de récupération des users (à remplacer par votre API)
  const simulateUsersFetch = async () => {
    // En attendant votre API, voici des données de démo
    return [
      {
        id: 1,
        email: 'superadmin@example.com',
        username: 'superadmin',
        first_name: 'Super',
        last_name: 'Admin',
        is_active: true,
        is_superuser: true,
        is_staff: true,
        date_joined: '2024-01-01T10:00:00Z',
        last_login: new Date().toISOString(),
      },
      {
        id: 2,
        email: 'admin1@example.com',
        username: 'admin1',
        first_name: 'Admin',
        last_name: 'One',
        is_active: true,
        is_superuser: true,
        is_staff: true,
        date_joined: '2024-01-02T10:00:00Z',
        last_login: new Date().toISOString(),
      },
      {
        id: 3,
        email: 'user1@example.com',
        username: 'user1',
        first_name: 'John',
        last_name: 'Doe',
        is_active: true,
        is_superuser: false,
        is_staff: false,
        date_joined: '2024-01-03T10:00:00Z',
        last_login: new Date().toISOString(),
      },
      {
        id: 4,
        email: 'user2@example.com',
        username: 'user2',
        first_name: 'Jane',
        last_name: 'Smith',
        is_active: false,
        is_superuser: false,
        is_staff: false,
        date_joined: '2024-01-04T10:00:00Z',
        last_login: null,
      },
      {
        id: 5,
        email: 'admin2@example.com',
        username: 'admin2',
        first_name: 'Admin',
        last_name: 'Two',
        is_active: true,
        is_superuser: true,
        is_staff: true,
        date_joined: '2024-01-05T10:00:00Z',
        last_login: new Date().toISOString(),
      },
    ];
  };

  // Filtre les users selon l'onglet actif
  const getFilteredUsers = () => {
    let filtered = [...allUsers];
    
    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.email.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        u.first_name?.toLowerCase().includes(term) ||
        u.last_name?.toLowerCase().includes(term)
      );
    }
    
    // Filtre par onglet
    if (activeTab === 1) { // Admins seulement
      filtered = filtered.filter(u => u.is_superuser);
    } else if (activeTab === 2) { // Users seulement
      filtered = filtered.filter(u => !u.is_superuser);
    } else if (activeTab === 3) { // Inactifs
      filtered = filtered.filter(u => !u.is_active);
    }
    
    return filtered;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const openAddUserDialog = (type = 'user') => {
    setDialogType(type);
    setOpenAddDialog(true);
    setError('');
    setNewAccount({
      email: '',
      username: '',
      password: '',
      password2: '',
      first_name: '',
      last_name: '',
    });
  };

  const handleAddAccount = async () => {
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      
      // Utilisez votre endpoint d'inscription existant
      const response = await axios.post('http://localhost:8000/api/auth/register/', {
        email: newAccount.email,
        username: newAccount.username,
        password: newAccount.password,
        password2: newAccount.password2,
        first_name: newAccount.first_name,
        last_name: newAccount.last_name,
      });
      
      // Si c'est un admin, on pourrait avoir besoin d'un endpoint spécial
      if (dialogType === 'admin') {
        showSnackbar(` Admin ${newAccount.email} créé avec succès !`);
      } else {
        showSnackbar(` Utilisateur ${newAccount.email} créé avec succès !`);
      }
      
      setOpenAddDialog(false);
      fetchAllUsers(); // Recharger la liste
      
    } catch (error) {
      const errorMsg = error.response?.data?.email?.[0] || 
                      error.response?.data?.username?.[0] || 
                      error.response?.data?.detail ||
                      'Erreur lors de la création';
      setError(errorMsg);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      // Simuler l'activation/désactivation
      showSnackbar(`Utilisateur ${currentStatus ? 'désactivé' : 'activé'} avec succès`);
      fetchAllUsers(); // Recharger
    } catch (error) {
      console.error('Erreur changement statut:', error);
      showSnackbar('Erreur lors du changement de statut', 'error');
    }
  };

  const toggleUserRole = async (userId, isCurrentlyAdmin) => {
    try {
      // Simuler changement de rôle
      showSnackbar(`Rôle ${isCurrentlyAdmin ? 'retiré' : 'ajouté'} avec succès`);
      fetchAllUsers(); // Recharger
    } catch (error) {
      console.error('Erreur changement rôle:', error);
      showSnackbar('Erreur lors du changement de rôle', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSuccessMessage(message);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredUsers = getFilteredUsers();
  
  // Statistiques
  const stats = {
    total: allUsers.length,
    admins: allUsers.filter(u => u.is_superuser).length,
    users: allUsers.filter(u => !u.is_superuser).length,
    active: allUsers.filter(u => u.is_active).length,
    inactive: allUsers.filter(u => !u.is_active).length,
  };

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!isSuperAdmin) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'black' }}>
        <SharedSidebar mobileOpen={mobileOpen} onMobileClose={handleDrawerToggle} />
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Container maxWidth="md">
            <Box sx={{ mt: 8, textAlign: 'center' }}>
              <Alert severity="error" sx={{ mb: 3 }}>
                Accès réservé au Super Administrateur
              </Alert>
              <Button variant="contained" onClick={() => navigate('/dashboard')}>
                Retour au Dashboard
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'black' }}>
      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={handleDrawerToggle} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: isMobile ? '100%' : 'calc(100% - 280px)',
          minHeight: '100vh',
          bgcolor: 'black',
        }}
      >
        <Container maxWidth="xl">
      {/* Menu hamburger mobile */}
      {isMobile && (
        <Box sx={{ pt: 2, pb: 1 }}>
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
            <MenuIcon />
          </IconButton>
        </Box>
      )}
      
      {/* En-tête Super Admin */}
      <Box sx={{ mt: isMobile ? 2 : 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                👑 SUPER ADMIN DASHBOARD
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Gestion complète de tous les utilisateurs
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
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
                        <Box>
                          <Typography variant="body1">
                            {userItem.first_name} {userItem.last_name}
                            {userItem.email === 'superadmin@example.com' && (
                              <Chip 
                                label="Super Admin" 
                                size="small" 
                                color="warning" 
                                sx={{ ml: 1 }}
                                icon={<StarIcon />}
                              />
                            )}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            @{userItem.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{userItem.email}</TableCell>
                    <TableCell>
                      <Chip 
                        icon={userItem.is_active ? <CheckCircleIcon /> : <CancelIcon />}
                        label={userItem.is_active ? 'Actif' : 'Inactif'}
                        color={userItem.is_active ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {userItem.is_superuser ? (
                        <Chip 
                          label="Administrateur" 
                          color="primary" 
                          size="small" 
                          icon={<AdminIcon />}
                        />
                      ) : (
                        <Chip 
                          label="Utilisateur" 
                          variant="outlined" 
                          size="small" 
                          icon={<PersonIcon />}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(userItem.last_login)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(userItem.date_joined)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        {userItem.email !== 'superadmin@example.com' && (
                          <>
                            <Tooltip title={userItem.is_active ? "Désactiver" : "Activer"}>
                              <IconButton 
                                size="small" 
                                onClick={() => toggleUserStatus(userItem.id, userItem.is_active)}
                                color={userItem.is_active ? "warning" : "success"}
                              >
                                {userItem.is_active ? <CancelIcon /> : <CheckCircleIcon />}
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title={userItem.is_superuser ? "Retirer admin" : "Rendre admin"}>
                              <IconButton 
                                size="small" 
                                onClick={() => toggleUserRole(userItem.id, userItem.is_superuser)}
                                color={userItem.is_superuser ? "secondary" : "primary"}
                              >
                                <AdminIcon />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Supprimer">
                              <IconButton 
                                size="small" 
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        
                        {userItem.email === 'superadmin@example.com' && (
                          <Tooltip title="Super Admin - Actions limitées">
                            <IconButton size="small" disabled>
                              <ShieldIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dialog pour ajouter un compte */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'admin' ? '➕ Ajouter un Administrateur' : '➕ Ajouter un Utilisateur'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TextField
            fullWidth
            margin="normal"
            label="email"
            type="email"
            value={newAccount.email}
            onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
            required
            placeholder="exemple@email.com"
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Nom d'utilisateur *"
            value={newAccount.username}
            onChange={(e) => setNewAccount({...newAccount, username: e.target.value})}
            required
            placeholder="nom_utilisateur"
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Prénom"
            value={newAccount.first_name}
            onChange={(e) => setNewAccount({...newAccount, first_name: e.target.value})}
            placeholder="Jean"
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Nom"
            value={newAccount.last_name}
            onChange={(e) => setNewAccount({...newAccount, last_name: e.target.value})}
            placeholder="Dupont"
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Mot de passe *"
            type="password"
            value={newAccount.password}
            onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
            required
            placeholder="••••••••"
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Confirmer mot de passe *"
            type="password"
            value={newAccount.password2}
            onChange={(e) => setNewAccount({...newAccount, password2: e.target.value})}
            required
            placeholder="••••••••"
          />
          
          {dialogType === 'admin' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <strong>Administrateur :</strong> Cet utilisateur aura accès au panel d'administration.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Annuler</Button>
          <Button 
            onClick={handleAddAccount} 
            variant="contained"
            disabled={!newAccount.email || !newAccount.username || !newAccount.password || !newAccount.password2}
          >
            {dialogType === 'admin' ? 'Créer Admin' : 'Créer Utilisateur'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      <UrgentAlertsModal 
        open={openUrgentModal} 
        onClose={() => setOpenUrgentModal(false)} 
        alerts={[]} 
      />
    </Container>
      </Box>
    </Box>
  );
};

export default SuperAdminDashboard;
