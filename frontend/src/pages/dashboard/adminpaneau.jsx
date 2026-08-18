import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Chip,
  Snackbar,
  Tooltip,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  useMediaQuery,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminIcon,
  PersonRemove as PersonRemoveIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Menu as MenuIcon,
  BarChart as BarChartIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Today as TodayIcon,
  Person as PersonIcon,
  Block as BlockIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import SharedSidebar from '../../components/SharedSidebar';
import { authFetch } from '../../utils/authFetch';

// Options de rôles disponibles (doivent correspondre au backend)
const allRoleOptions = [
  { value: 'super_admin', label: 'Super Administrateur' },
  { value: 'responsable_stock', label: 'Responsable Stock' },
  { value: 'responsable_production', label: 'Responsable Production' },
  { value: 'responsable_facturation', label: 'Responsable Facturation' },
  { value: 'responsable_commandes', label: 'Responsable Commandes' },
  { value: 'agent_stock', label: 'Agent Stock' },
  { value: 'agent_production', label: 'Agent Production' },
  { value: 'employe', label: 'Employé' },
];

// Rôles par module
const MODULE_ROLES = {
  stock: [
    { value: 'responsable_stock', label: 'Responsable Stock' },
    { value: 'agent_stock', label: 'Agent Stock' },
  ],
  production: [
    { value: 'responsable_production', label: 'Responsable Production' },
    { value: 'agent_production', label: 'Agent Production' },
  ],
  facturation: [
    { value: 'responsable_facturation', label: 'Responsable Facturation' },
  ],
  commandes: [
    { value: 'responsable_commandes', label: 'Responsable Commandes' },
  ],
};

// Fonction pour obtenir les rôles disponibles selon l'utilisateur connecté
const getAvailableRoles = (currentUser) => {
  if (!currentUser) return allRoleOptions;
  
  // Super admin voit tous les rôles
  if (currentUser.is_superuser || currentUser.is_staff || currentUser.is_primary_admin) {
    return allRoleOptions;
  }
  
  // Responsable de module ne voit que les rôles de son module
  if (currentUser.role === 'responsable_stock') {
    return MODULE_ROLES.stock;
  } else if (currentUser.role === 'responsable_production') {
    return MODULE_ROLES.production;
  } else if (currentUser.role === 'responsable_facturation') {
    return MODULE_ROLES.facturation;
  } else if (currentUser.role === 'responsable_commandes') {
    return MODULE_ROLES.commandes;
  }
  
  return allRoleOptions;
};

// Fonction pour obtenir le libellé du rôle
const getRoleLabel = (roleValue) => {
  const role = allRoleOptions.find(opt => opt.value === roleValue);
  return role ? role.label : (roleValue || 'Non renseigné');
};

const AdminPaneau = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // États
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour les filtres
  const [filterType, setFilterType] = useState('all'); // 'all', 'active', 'inactive', 'today', 'admins'
  
  // États pour les dialogues
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // États pour le drawer
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // État pour le formulaire
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    password2: '',
    is_superuser: false,
    is_staff: false,
    role: 'employe',
  });

  // État pour l'édition d'utilisateur
  const [editUser, setEditUser] = useState({
    id: '',
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    is_active: true,
    is_staff: false,
    is_superuser: false,
    role: 'employe',
  });
  
  // Snackbar (notifications)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  
  // Menu d'actions
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUser, setMenuUser] = useState(null);

  // Style global pour éliminer les espaces blancs
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = 'black';
    document.documentElement.style.backgroundColor = 'black';
  }, []);

  // Charger les données
  useEffect(() => {
    fetchAdminData();
  }, []);

  // Filtrer les utilisateurs
  useEffect(() => {
    let filtered = users;
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrer par type
    if (filterType === 'active') {
      filtered = filtered.filter(user => user.is_active);
    } else if (filterType === 'inactive') {
      filtered = filtered.filter(user => !user.is_active);
    } else if (filterType === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter(user => {
        const userDate = new Date(user.date_joined).toDateString();
        return userDate === today;
      });
    } else if (filterType === 'admins') {
      filtered = filtered.filter(user => user.is_staff || user.is_superuser);
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, users, filterType]);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('access_token');
      
      // Récupérer les statistiques
      try {
        const statsResponse = await fetch('http://localhost:8000/api/admin/stats/', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (statsErr) {
        console.log('Stats endpoint not available, using default stats');
      }
      
      // Récupérer tous les utilisateurs
      const usersResponse = await fetch('http://localhost:8000/api/admin/users/', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const usersArray = usersData.results || [];
        setUsers(usersArray);
        setFilteredUsers(usersArray);
        
        // Calculer les statistiques à partir des utilisateurs
        const today = new Date().toDateString();
        const todayRegistrations = usersArray.filter(u => {
          const userDate = new Date(u.date_joined).toDateString();
          return userDate === today;
        }).length;
        
        const userStats = {
          total_users: usersArray.length,
          active_users: usersArray.filter(u => u.is_active).length,
          inactive_users: usersArray.filter(u => !u.is_active).length,
          admins_count: usersArray.filter(u => u.is_staff || u.is_superuser).length,
          today_registrations: todayRegistrations
        };
        setStats(userStats);
      } else {
        throw new Error('Erreur lors du chargement des utilisateurs');
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError('Erreur: ' + err.message);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Gérer l'ajout d'un nouvel utilisateur
  const handleAddUser = async () => {
    try {
      const token = localStorage.getItem('access_token'); // FIX: Ajout de la récupération du token
      
      const userData = {
        email: newUser.email,
        username: newUser.username,
        password: newUser.password,
        password2: newUser.password2,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        is_superuser: newUser.is_superuser,
        is_staff: newUser.is_staff,
        role: newUser.role,
      };
      
      // Utiliser l'endpoint de gestion des utilisateurs qui gère les permissions
      const endpoint = 'http://localhost:8000/api/admin/users/';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Utilisateur créé avec succès!',
          severity: 'success',
        });
        
        // Réinitialiser le formulaire avec un rôle par défaut approprié
        const defaultRole = getAvailableRoles(user)[0]?.value || 'employe';
        setNewUser({
          email: '',
          username: '',
          first_name: '',
          last_name: '',
          password: '',
          password2: '',
          is_superuser: false,
          is_staff: false,
          role: defaultRole,
        });
        
        setOpenAddDialog(false);
        fetchAdminData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Erreur lors de la création');
      }
      
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erreur: ' + err.message,
        severity: 'error',
      });
    }
  };

  // Gérer la promotion/dépromotion d'admin
  const handleToggleAdmin = async (userId, isCurrentlyAdmin) => {
    try {
      const updateData = {
        is_staff: !isCurrentlyAdmin,
        is_superuser: !isCurrentlyAdmin,
      };
      
      const response = await authFetch(`/admin/users/${userId}/`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
      
      if (response.ok) {
        setSnackbar({
          open: true,
          message: isCurrentlyAdmin ? 'Utilisateur promovoir avec succès!' : 'Utilisateur promu administrateur avec succès!',
          severity: 'success',
        });
        fetchAdminData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Erreur lors de la modification');
      }
      
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erreur: ' + err.message,
        severity: 'error',
      });
    }
  };

  // Gérer la suppression d'utilisateur
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await authFetch(`/admin/users/${selectedUser.id}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Utilisateur supprimé avec succès!',
          severity: 'success',
        });
        setOpenDeleteDialog(false);
        setSelectedUser(null);
        fetchAdminData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Erreur lors de la suppression');
      }

    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erreur: ' + err.message,
        severity: 'error',
      });
    }
  };

  // Gérer l'édition d'utilisateur
  const handleEditUser = async () => {
    try {
      const response = await authFetch(`/admin/users/${editUser.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          email: editUser.email,
          username: editUser.username,
          first_name: editUser.first_name,
          last_name: editUser.last_name,
          is_active: editUser.is_active,
          is_staff: editUser.is_staff,
          is_superuser: editUser.is_superuser,
          role: editUser.role,
        }),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Utilisateur modifié avec succès!',
          severity: 'success',
        });
        setOpenEditDialog(false);
        setEditUser({
          id: '',
          email: '',
          username: '',
          first_name: '',
          last_name: '',
          is_active: true,
          is_staff: false,
          is_superuser: false,
          role: 'employe',
        });
        fetchAdminData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Erreur lors de la modification');
      }

    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erreur: ' + err.message,
        severity: 'error',
      });
    }
  };

  // Gérer l'activation/désactivation d'utilisateur (avec appel API)
  const handleToggleActive = async (userItem) => {
    try {
      const newActiveState = !userItem.is_active;
      
      const response = await authFetch(`/admin/users/${userItem.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_active: newActiveState
        }),
      });

      if (response.ok) {
        // Mettre à jour l'état local après confirmation du serveur
        const updatedUsers = users.map(user => {
          if (user.id === userItem.id) {
            return { ...user, is_active: newActiveState };
          }
          return user;
        });
        
        setUsers(updatedUsers);
        
        // Mettre à jour les statistiques
        const today = new Date().toDateString();
        const todayRegistrations = updatedUsers.filter(u => {
          const userDate = new Date(u.date_joined).toDateString();
          return userDate === today;
        }).length;
        
        setStats({
          total_users: updatedUsers.length,
          active_users: updatedUsers.filter(u => u.is_active).length,
          inactive_users: updatedUsers.filter(u => !u.is_active).length,
          admins_count: updatedUsers.filter(u => u.is_staff || u.is_superuser).length,
          today_registrations: todayRegistrations
        });
        
        // Afficher la notification
        const action = userItem.is_active ? 'désactivé' : 'activé';
        setSnackbar({
          open: true,
          message: `Le compte de ${userItem.email} a été ${action} avec succès !`,
          severity: 'success',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Erreur lors de la modification');
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erreur: ' + err.message,
        severity: 'error',
      });
    }
  };

  // Gérer le clic sur les cartes de statistiques
  const handleStatClick = (type) => {
    setFilterType(type);
    setSearchTerm('');
  };

  const openEditDialogForUser = (user) => {
    setEditUser({
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      is_active: user.is_active,
      is_staff: user.is_staff,
      is_superuser: user.is_superuser,
      role: user.role || 'employe',
    });
    setOpenEditDialog(true);
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const resetFilters = () => {
    setFilterType('all');
    setSearchTerm('');
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'black',
      }}>
        <CircularProgress sx={{ color: '#3b82f6' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'black' }}>
      <SharedSidebar
        mobileOpen={mobileOpen}
        onMobileClose={handleDrawerToggle}
        selectedMenu="admin"
      />

      {/* Contenu principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          minHeight: '100vh',
          bgcolor: 'black',
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'rgba(15, 23, 42, 0.4)',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(59, 130, 246, 0.3)',
            borderRadius: '4px',
            '&:hover': {
              bgcolor: 'rgba(59, 130, 246, 0.5)',
            },
          },
        }}
      >
      {/* Header */}
<Box
  sx={{
    p: 1.2,
    borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 2,
  }}
>
  {/* Menu mobile icon */}
  {isMobile && (
    <IconButton
      onClick={handleDrawerToggle}
      sx={{
        color: 'white',
        mr: 1,
        '&:hover': {
          bgcolor: 'rgba(59, 130, 246, 0.1)',
        },
      }}
    >
      <MenuIcon />
    </IconButton>
  )}

  {/* Espace vide pour pousser l'avatar à droite */}
  <Box sx={{ flex: 1 }} />

  {/* Boutons d'action et profil - tout à droite */}
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <IconButton
      onClick={fetchAdminData}
      sx={{
        color: '#64748b',
        '&:hover': {
          bgcolor: 'rgba(59, 130, 246, 0.1)',
          color: '#3b82f6',
        },
      }}
    >
      <RefreshIcon />
    </IconButton>

    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
        <Typography
          variant="body2"
          sx={{
            color: 'white',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          {user?.first_name || user?.username}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: '#64748b',
            fontSize: '0.75rem',
          }}
        >
          Administrateur
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
</Box>

        {/* Contenu du dashboard */}
        <Box sx={{ p: 2, pb: 6 }}>
          {/* En-tête de la page avec indicateur de filtre */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    color: 'white',
                    fontWeight: 700,
                    mb: 0.5,
                  }}
                >
                  Panneau d'Administration
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#64748b',
                    fontSize: '0.95rem',
                  }}
                >
                  {filterType !== 'all' && (
                    <Chip
                      label={`Filtre actif: ${
                        filterType === 'active' ? 'Utilisateurs Actifs' :
                        filterType === 'today' ? 'Inscriptions du jour' :
                        'Administrateurs'
                      }`}
                      size="small"
                      onDelete={resetFilters}
                      sx={{
                        ml: 1,
                        bgcolor: 'rgba(59, 130, 246, 0.2)',
                        color: '#60a5fa',
                        '& .MuiChip-deleteIcon': {
                          color: '#60a5fa',
                        },
                      }}
                    />
                  )}
                </Typography>
              </Box>

              {/* Bouton Ajouter Utilisateur */}
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setOpenAddDialog(true)}
                sx={{
                  bgcolor: '#3b82f6',
                  color: 'white',
                  fontWeight: 600,
                  py: 1.2,
                  px: 3,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  '&:hover': {
                    bgcolor: '#2563eb',
                    boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
                  },
                }}
              >
                Ajouter Utilisateur
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                bgcolor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
              }}
            >
              {error}
            </Alert>
          )}

          {/* Statistiques cliquables */}
          {stats && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card
                  onClick={() => handleStatClick('all')}
                  sx={{
                    bgcolor: filterType === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                    border: filterType === 'all' ? '2px solid #3b82f6' : '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(59, 130, 246, 0.2)',
                      bgcolor: 'rgba(59, 130, 246, 0.15)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#94a3b8',
                          fontSize: '0.85rem',
                        }}
                      >
                        Total Utilisateurs
                      </Typography>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'rgba(59, 130, 246, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PeopleIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                      </Box>
                    </Box>
                    <Typography
                      variant="h3"
                      sx={{
                        color: 'white',
                        fontWeight: 700,
                        mb: 1,
                      }}
                    >
                      {stats.total_users}
                    </Typography>
                 
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card
                  onClick={() => handleStatClick('active')}
                  sx={{
                    bgcolor: filterType === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                    border: filterType === 'active' ? '2px solid #10b981' : '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#94a3b8',
                          fontSize: '0.85rem',
                        }}
                      >
                        Utilisateurs Actifs
                      </Typography>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'rgba(16, 185, 129, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PersonIcon sx={{ color: '#10b981', fontSize: 20 }} />
                      </Box>
                    </Box>
                    <Typography
                      variant="h3"
                      sx={{
                        color: 'white',
                        fontWeight: 700,
                        mb: 1,
                      }}
                    >
                      {stats.active_users}
                    </Typography>
                  
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card
                  onClick={() => handleStatClick('admins')}
                  sx={{
                    bgcolor: filterType === 'admins' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                    border: filterType === 'admins' ? '2px solid #ef4444' : '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)',
                      bgcolor: 'rgba(239, 68, 68, 0.1)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#94a3b8',
                          fontSize: '0.85rem',
                        }}
                      >
                        Administrateurs
                      </Typography>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'rgba(239, 68, 68, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AdminPanelSettingsIcon sx={{ color: '#ef4444', fontSize: 20 }} />
                      </Box>
                    </Box>
                    <Typography
                      variant="h3"
                      sx={{
                        color: 'white',
                        fontWeight: 700,
                        mb: 1,
                      }}
                    >
                      {stats.admins_count}
                    </Typography>
                  
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card
                  onClick={() => handleStatClick('today')}
                  sx={{
                    bgcolor: filterType === 'today' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                    border: filterType === 'today' ? '2px solid #fb923c' : '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(251, 146, 60, 0.2)',
                      bgcolor: 'rgba(251, 146, 60, 0.1)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#94a3b8',
                          fontSize: '0.85rem',
                        }}
                      >
                        Inscriptions Aujourd'hui
                      </Typography>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'rgba(251, 146, 60, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <TodayIcon sx={{ color: '#fb923c', fontSize: 20 }} />
                      </Box>
                    </Box>
                    <Typography
                      variant="h3"
                      sx={{
                        color: 'white',
                        fontWeight: 700,
                        mb: 1,
                      }}
                    >
                      {stats.today_registrations}
                    </Typography>
               
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tableau des utilisateurs */}
          <Card
            sx={{
              bgcolor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 3,
              p: 3,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                  }}
                >
                  Liste des Utilisateurs ({filteredUsers.length})
                </Typography>
                {user && (user.role === 'responsable_stock' || 
                         user.role === 'responsable_production' || 
                         user.role === 'responsable_facturation' || 
                         user.role === 'responsable_commandes') && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#94a3b8',
                      fontSize: '0.85rem',
                      mt: 0.5,
                      display: 'block',
                    }}
                  >
                    {user.role === 'responsable_stock' && '📦 Affichage des utilisateurs du module Stock uniquement'}
                    {user.role === 'responsable_production' && '🏭 Affichage des utilisateurs du module Production uniquement'}
                    {user.role === 'responsable_facturation' && '💰 Affichage des utilisateurs du module Facturation uniquement'}
                    {user.role === 'responsable_commandes' && '📋 Affichage des utilisateurs du module Commandes uniquement'}
                  </Typography>
                )}
              </Box>
                 {/* Barre de recherche */}
          <Box
            sx={{
              flex: 1,
              maxWidth: 500,
              position: 'relative',
            }}
          >
            <SearchIcon
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                fontSize: 20,
              }}
            />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 48px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '12px',
                color: '#94a3b8',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              }}
            />
          </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={resetFilters}
                  sx={{
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    color: '#3b82f6',
                    '&:hover': {
                      borderColor: '#3b82f6',
                      bgcolor: 'rgba(59, 130, 246, 0.1)',
                    },
                  }}
                >
                  Réinitialiser
                </Button>
              </Box>
            </Box>

            <TableContainer
              sx={{
                '& .MuiTable-root': {
                  borderCollapse: 'separate',
                  borderSpacing: '0 8px',
                },
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#94a3b8', borderBottom: 'none', fontSize: '0.85rem', fontWeight: 600 }}>ID</TableCell>
                    <TableCell sx={{ color: '#94a3b8', borderBottom: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ color: '#94a3b8', borderBottom: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Nom d'utilisateur</TableCell>
                    <TableCell sx={{ color: '#94a3b8', borderBottom: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Nom complet</TableCell>
                    <TableCell sx={{ color: '#94a3b8', borderBottom: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Statut</TableCell>
                    <TableCell sx={{ color: '#94a3b8', borderBottom: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Rôle</TableCell>
                    <TableCell sx={{ color: '#94a3b8', borderBottom: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Inscription</TableCell>
                    <TableCell align="right" sx={{ color: '#94a3b8', borderBottom: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(filteredUsers) && filteredUsers.length > 0 ? (
                    filteredUsers.map((userItem) => (
                      <TableRow 
                        key={userItem.id}
                        sx={{
                          bgcolor: 'rgba(15, 23, 42, 0.6)',
                          '&:hover': {
                            bgcolor: 'rgba(59, 130, 246, 0.05)',
                          },
                          '& td': {
                            borderTop: '1px solid rgba(59, 130, 246, 0.1)',
                            borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
                          },
                          '& td:first-of-type': {
                            borderLeft: '1px solid rgba(59, 130, 246, 0.1)',
                            borderTopLeftRadius: 8,
                            borderBottomLeftRadius: 8,
                          },
                          '& td:last-of-type': {
                            borderRight: '1px solid rgba(59, 130, 246, 0.1)',
                            borderTopRightRadius: 8,
                            borderBottomRightRadius: 8,
                          },
                        }}
                      >
                        <TableCell sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>{userItem.id}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Typography sx={{ color: 'white', fontSize: '0.85rem' }}>{userItem.email}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>{userItem.username}</TableCell>
                        <TableCell sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                          {userItem.first_name && userItem.last_name ? `${userItem.first_name} ${userItem.last_name}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={userItem.is_active ? "Actif" : "Inactif"}
                            size="small"
                            sx={{
                              bgcolor: userItem.is_active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: userItem.is_active ? '#10b981' : '#ef4444',  
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            {userItem.is_superuser && (
                              <Chip label="Super Admin" size="small" sx={{ bgcolor: '#ef4444', color: 'white', mr: 0.5, fontWeight: 600 }} />
                            )}
                            {userItem.is_staff && !userItem.is_superuser && (
                              <Chip label="Admin" size="small" sx={{ bgcolor: '#3b82f6', color: 'white', mr: 0.5, fontWeight: 600 }} />
                            )}
                            {!userItem.is_staff && !userItem.is_superuser && (
                              <Chip 
                                label={getRoleLabel(userItem.role)} 
                                size="small" 
                                sx={{ bgcolor: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8', fontWeight: 600 }} 
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                          {new Date(userItem.date_joined).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          {/* Bouton Activer/Désactiver */}
                          <Tooltip title={userItem.is_active ? "Désactiver le compte" : "Activer le compte"}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleActive(userItem)}
                              sx={{
                                color: userItem.is_active ? '#10b981' : '#ef4444',
                                '&:hover': {
                                  bgcolor: userItem.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                },
                              }}
                            >
                              {userItem.is_active ? <CheckCircleIcon /> : <BlockIcon />}
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Modifier">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialogForUser(userItem)}
                              sx={{
                                color: '#3b82f6',
                                '&:hover': {
                                  bgcolor: 'rgba(59, 130, 246, 0.1)',
                                },
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Plus d'actions">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, userItem)}
                              sx={{
                                color: '#64748b',
                                '&:hover': {
                                  bgcolor: 'rgba(59, 130, 246, 0.1)',
                                },
                              }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ color: '#64748b', py: 4 }}>
                        {!Array.isArray(filteredUsers) ? 
                          'Erreur de chargement des données' : 
                          'Aucun utilisateur trouvé'
                        }
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      </Box>

      {/* Dialog pour ajouter un utilisateur */}
      <Dialog 
        open={openAddDialog} 
        onClose={() => setOpenAddDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(59, 130, 246, 0.1)' }}>
           Ajouter un Nouvel Utilisateur
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#94a3b8',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nom d'utilisateur"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#94a3b8',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Prénom"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#94a3b8',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Nom"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#94a3b8',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Mot de passe"
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#94a3b8',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Confirmer le mot de passe"
                  type="password"
                  required
                  value={newUser.password2}
                  onChange={(e) => setNewUser({ ...newUser, password2: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#94a3b8',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#94a3b8' }}>Rôle</InputLabel>
                  <Select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    label="Rôle"
                    sx={{
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(59, 130, 246, 0.2)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3b82f6',
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#94a3b8',
                      },
                    }}
                  >
                    {getAvailableRoles(user).map((option) => (
                      <MenuItem key={option.value} value={option.value} sx={{ backgroundColor: '#1e293b', color: 'white', '&:hover': { backgroundColor: '#334155' } }}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newUser.is_staff}
                      onChange={(e) => setNewUser({ ...newUser, is_staff: e.target.checked })}
                      sx={{
                        color: '#64748b',
                        '&.Mui-checked': {
                          color: '#3b82f6',
                        },
                      }}
                    />
                  }
                  label={<Typography sx={{ color: '#94a3b8' }}>Administrateur (is_staff)</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newUser.is_superuser}
                      onChange={(e) => setNewUser({ ...newUser, is_superuser: e.target.checked })}
                      disabled={!newUser.is_staff}
                      sx={{
                        color: '#64748b',
                        '&.Mui-checked': {
                          color: '#ef4444',
                        },
                      }}
                    />
                  }
                  label={<Typography sx={{ color: '#94a3b8' }}>Super Administrateur (is_superuser)</Typography>}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(59, 130, 246, 0.1)', p: 2 }}>
          <Button 
            onClick={() => setOpenAddDialog(false)}
            sx={{ color: '#94a3b8' }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleAddUser} 
            variant="contained" 
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': {
                bgcolor: '#2563eb',
              },
            }}
          >
            Créer l'utilisateur
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu d'actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 2,
          }
        }}
      >
        <MenuItem 
          onClick={() => {
            if (menuUser) {
              handleToggleAdmin(menuUser.id, menuUser.is_staff);
            }
            handleMenuClose();
          }}
          sx={{ color: '#94a3b8', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' } }}
        >
          {menuUser?.is_staff ? 'Promovoir en administrateur' : 'Promouvoir en Admin'}
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (menuUser) {
              openEditDialogForUser(menuUser);
            }
            handleMenuClose();
          }}
          sx={{ color: '#94a3b8', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' } }}
        >
          Modifier
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (menuUser) {
              setSelectedUser(menuUser);
              setOpenDeleteDialog(true);
            }
            handleMenuClose();
          }}
          sx={{ color: '#ef4444', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
        >
          Supprimer
        </MenuItem>
      </Menu>

      {/* Dialog de suppression */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(59, 130, 246, 0.1)' }}>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ color: '#94a3b8' }}>
            Êtes-vous sûr de vouloir supprimer l'utilisateur <strong style={{ color: 'white' }}>{selectedUser?.email}</strong> ?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(59, 130, 246, 0.1)', p: 2 }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)}
            sx={{ color: '#94a3b8' }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleDeleteUser} 
            variant="contained" 
            sx={{
              bgcolor: '#ef4444',
              '&:hover': {
                bgcolor: '#dc2626',
              },
            }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour modifier un utilisateur */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(59, 130, 246, 0.1)' }}>
          Modifier un Utilisateur
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  required
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#94a3b8',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nom d'utilisateur"
                  required
                  value={editUser.username}
                  onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#94a3b8',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Prénom"
                  value={editUser.first_name}
                  onChange={(e) => setEditUser({ ...editUser, first_name: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#94a3b8',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Nom"
                  value={editUser.last_name}
                  onChange={(e) => setEditUser({ ...editUser, last_name: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#94a3b8',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#94a3b8' }}>Rôle</InputLabel>
                  <Select
                    value={editUser.role || 'employe'}
                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                    label="Rôle"
                    sx={{
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(59, 130, 246, 0.2)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(59, 130, 246, 0.4)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3b82f6',
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#94a3b8',
                      },
                    }}
                  >
                    {getAvailableRoles(user).map((option) => (
                      <MenuItem key={option.value} value={option.value} sx={{ backgroundColor: '#1e293b', color: 'white', '&:hover': { backgroundColor: '#334155' } }}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editUser.is_active}
                      onChange={(e) => setEditUser({ ...editUser, is_active: e.target.checked })}
                      sx={{
                        color: '#64748b',
                        '&.Mui-checked': {
                          color: '#10b981',
                        },
                      }}
                    />
                  }
                  label={<Typography sx={{ color: '#94a3b8' }}>Compte actif</Typography>}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editUser.is_staff}
                      onChange={(e) => setEditUser({ ...editUser, is_staff: e.target.checked })}
                      sx={{
                        color: '#64748b',
                        '&.Mui-checked': {
                          color: '#3b82f6',
                        },
                      }}
                    />
                  }
                  label={<Typography sx={{ color: '#94a3b8' }}>Administrateur (is_staff)</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editUser.is_superuser}
                      onChange={(e) => setEditUser({ ...editUser, is_superuser: e.target.checked })}
                      disabled={!editUser.is_staff}
                      sx={{
                        color: '#64748b',
                        '&.Mui-checked': {
                          color: '#ef4444',
                        },
                      }}
                    />
                  }
                  label={<Typography sx={{ color: '#94a3b8' }}>Super Administrateur (is_superuser)</Typography>}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(59, 130, 246, 0.1)', p: 2 }}>
          <Button 
            onClick={() => setOpenEditDialog(false)}
            sx={{ color: '#94a3b8' }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleEditUser} 
            variant="contained"
            sx={{
              bgcolor: '#3b82f6',
              '&:hover': {
                bgcolor: '#2563eb',
              },
            }}
          >
            Modifier l'utilisateur
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            bgcolor: snackbar.severity === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${snackbar.severity === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: snackbar.severity === 'success' ? '#10b981' : '#ef4444',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPaneau;