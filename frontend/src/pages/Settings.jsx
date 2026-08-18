import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box, useTheme, useMediaQuery, IconButton, AppBar, Toolbar, TextField, Button, Alert, CircularProgress, InputAdornment, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip as MuiChip, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Menu as MenuIcon, Lock as LockIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon, PersonAdd as PersonAddIcon, Edit as EditIcon, Settings as SettingsIcon, Security as SecurityIcon, Category as CategoryIcon, Notifications as NotificationsIcon, People as PeopleIcon, Business as BusinessIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import SharedSidebar from '../components/SharedSidebar';
import PillNav from '../components/PillNav';
import Aurora from '../components/Aurora/Aurora';
import notif from '../assets/notif.png';
import { useLanguage } from '../context/LanguageContext';

const Settings = () => {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const isAdmin = user?.is_superuser || user?.is_staff || user?.is_primary_admin;
  const canManageUsers = isAdmin || user?.role === 'responsable_appro';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('/settings/profile');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [accountInfo, setAccountInfo] = useState({
    company: '',
    currency: '',
    vatRate: '',
    stockAlertThreshold: ''
  });
  
  // État pour le formulaire d'ajout d'employé
  const [employeeData, setEmployeeData] = useState({
    email: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'user',
    company: '',
    authorized_pages: []
  });
  
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const usersList = Array.isArray(users) ? users : [];
  
  // Liste complète des pages - DOIT correspondre aux pages_by_role du backend
  const availablePages = [
    { slug: 'dashboard', label: 'Tableau de bord' },
    { slug: 'alertes', label: 'Alertes' },
    { slug: 'notifications', label: 'Notifications' },
    { slug: 'stock', label: 'Stock' },
    { slug: 'stock-movements', label: 'Mouvements de stock' },
    { slug: 'orders', label: 'Commandes' },
    { slug: 'categories', label: 'Catégories' },
    { slug: 'fournisseurs', label: 'Fournisseurs' },
    { slug: 'entrepots', label: 'Entrepôts' },
    { slug: 'facturation', label: 'Facturation' },
    { slug: 'modules', label: 'ERP Modules' },
    { slug: 'admin', label: 'Admin Panel' },
    { slug: 'Employes', label: 'Employés' },
    { slug: 'history', label: 'Historique' },
    { slug: 'profile', label: 'Profil' },
    { slug: 'settings', label: 'Paramètres' },
    { slug: 'deconnexion', label: 'Déconnexion' }
  ];
  
  // Liste des rôles disponibles - DOIT correspondre aux ROLE_CHOICES du backend
  const availableRoles = [
    { value: 'super_admin', label: 'Super Administrateur', is_staff: true, is_superuser: true },
    { value: 'responsable_stock', label: 'Responsable Stock', is_staff: true, is_superuser: false },
    { value: 'responsable_appro', label: 'Responsable Approvisionnement', is_staff: true, is_superuser: false },
    { value: 'responsable_production', label: 'Responsable Production', is_staff: true, is_superuser: false },
    { value: 'responsable_facturation', label: 'Responsable Facturation', is_staff: true, is_superuser: false },
    { value: 'responsable_commandes', label: 'Responsable Commandes', is_staff: true, is_superuser: false },
    { value: 'agent_stock', label: 'Agent Stock', is_staff: false, is_superuser: false },
    { value: 'agent_production', label: 'Agent Production', is_staff: false, is_superuser: false },
    { value: 'employe', label: 'Employé', is_staff: false, is_superuser: false }
  ];
  
  // Navigation items pour la sidebar
  const navigationItems = [
    {
      label: t('general'),
      href: '/settings/profile',
      icon: <BusinessIcon sx={{ fontSize: 24 }} />,
    },
  
    ...(canManageUsers ? [
      {
        label: t('users'),
        href: '/settings/preferences',
        icon: <PeopleIcon sx={{ fontSize: 24 }} />,
      }
    ] : []),
    {
      label: t('security'),
      href: '/settings/security',
      icon: <SecurityIcon sx={{ fontSize: 24 }} />,
    }
  ];
  
  // Charger les utilisateurs
  useEffect(() => {
    if (activeSection === '/settings/preferences') {
      if (!canManageUsers) {
        setErrorMessage('Accès réservé aux administrateurs');
        setSuccessMessage('');
        setActiveSection('/settings/profile');
        return;
      }
      fetchUsers();
    }
  }, [activeSection, canManageUsers]);
  
  useEffect(() => {
    const savedCurrency = localStorage.getItem('settings_currency') || '';
    const savedVatRate = localStorage.getItem('settings_vat_rate') || '';
    const savedThreshold = localStorage.getItem('settings_stock_threshold') || '';
    setAccountInfo((prev) => ({
      ...prev,
      currency: savedCurrency,
      vatRate: savedVatRate,
      stockAlertThreshold: savedThreshold
    }));
  }, []);
  
  useEffect(() => {
    if (user) {
      setAccountInfo((prev) => ({
        ...prev,
        company: user.company || ''
      }));
    }
  }, [user]);
  
  useEffect(() => {
    // Ajuster la sidebar en fonction de la taille de l'écran
    setSidebarOpen(!isMobile);
  }, [isMobile]);
  
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('Token:', token);
      console.log('Fetching users from: http://localhost:8000/api/admin/users/');
      const response = await fetch('http://localhost:8000/api/admin/users/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Users loaded:', data);
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (Array.isArray(data?.results)) {
          setUsers(data.results);
        } else if (Array.isArray(data?.users)) {
          setUsers(data.users);
        } else {
          setUsers([]);
        }
      } else {
        const errorData = await response.json();
        console.error('Erreur API:', response.status, errorData);
        setErrorMessage(`Erreur lors du chargement des utilisateurs: ${response.status} - ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setErrorMessage(`Erreur réseau: ${error.message}`);
    }
  };
  
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleSidebarToggle = () => setSidebarOpen(!sidebarOpen);

  
  const handleUpdateUserRole = async () => {
    if (!selectedUser) {
      setErrorMessage('Veuillez sélectionner un utilisateur');
      return;
    }
    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      const token = localStorage.getItem('access_token');
      
      // Trouver le rôle sélectionné pour récupérer is_staff et is_superuser
      const selectedRole = availableRoles.find(r => r.value === employeeData.role);
      const updateData = {
        role: employeeData.role,
        is_staff: selectedRole?.is_staff || false,
        is_superuser: selectedRole?.is_superuser || false,
        authorized_pages: employeeData.authorized_pages || []
      };
      
      console.log('Updating user role:', updateData);
      const response = await fetch(`http://localhost:8000/api/admin/users/${selectedUser}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur update rôle - Status:', response.status);
        console.error('Erreur update rôle - Data:', errorData);
        
        // Formater le message d'erreur en fonction de la structure
        let errorMsg = 'Erreur lors de la mise à jour du rôle: ';
        if (typeof errorData === 'object') {
          // Si c'est un objet avec des erreurs par champ
          const errorMessages = Object.entries(errorData)
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return `${key}: ${value.join(', ')}`;
              }
              return `${key}: ${value}`;
            })
            .join(' | ');
          errorMsg += errorMessages;
        } else {
          errorMsg += JSON.stringify(errorData);
        }
        
        console.error('Message d\'erreur complet:', errorMsg);
        setErrorMessage(errorMsg);
        return;
      }
      
      const result = await response.json();
      console.log('User role updated:', result);
      console.log('Updated user authorized_pages:', result.user?.authorized_pages);
      setSuccessMessage('Rôle mis à jour avec succès');
      
      // Recharger les utilisateurs et mettre à jour l'utilisateur sélectionné
      fetchUsers();
      
      // Mettre à jour les données locales avec les données retournées par l'API
      if (result.user) {
        setEmployeeData({
          ...employeeData,
          role: result.user.role || 'employe',
          authorized_pages: result.user.authorized_pages && Array.isArray(result.user.authorized_pages) 
            ? result.user.authorized_pages 
            : []
        });
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      setErrorMessage('Erreur réseau lors de la mise à jour: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordChange = async () => {
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      setErrorMessage('Tous les champs sont requis');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      setErrorMessage('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordData.new_password.length < 8) {
      setErrorMessage('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/auth/change-password/', {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          old_password: passwordData.current_password,
          new_password: passwordData.new_password,
          new_password2: passwordData.confirm_password,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur changement mot de passe:', errorData);
        if (errorData.old_password) {
          setErrorMessage(errorData.old_password[0] || errorData.old_password);
        } else if (errorData.new_password) {
          setErrorMessage(errorData.new_password[0] || errorData.new_password);
        } else if (errorData.detail) {
          setErrorMessage(errorData.detail);
        } else {
          setErrorMessage('Erreur lors du changement de mot de passe');
        }
        return;
      }
      const result = await response.json();
      setSuccessMessage(result.message || 'Mot de passe changé avec succès');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      console.error('Erreur réseau:', error);
      setErrorMessage('Erreur réseau lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };
  
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };
  
  const handleSaveAccountInfo = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      const result = await updateProfile({ company: accountInfo.company });
      if (!result.success) {
        setErrorMessage(result.error || t('saveError'));
        return;
      }
      localStorage.setItem('settings_currency', accountInfo.currency || '');
      localStorage.setItem('settings_vat_rate', accountInfo.vatRate || '');
      localStorage.setItem('settings_stock_threshold', accountInfo.stockAlertThreshold || '');
      setSuccessMessage(t('accountInfoSaved'));
    } catch (error) {
      setErrorMessage(t('networkSaveError'));
    } finally {
      setLoading(false);
    }
  };
  
  // Sidebar content with framed design - plus sombre
  const sidebarContent = (
    <Box
      sx={{
        height: '100%',
        bgcolor: '#0a0a0f',
        backdropFilter: 'blur(0px)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '24px',
        margin: '16px',
        border: '1px solid rgba(59,130,246,0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        overflow: 'hidden'
      }}
    >
      <List sx={{ px: 2, py: 2, flex: 1 }}>
        {navigationItems.map((item) => (
          <ListItem key={item.href} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => setActiveSection(item.href)}
              selected={activeSection === item.href}
              sx={{
                borderRadius: '12px',
                py: 1.5,
                px: 2,
                '&.Mui-selected': {
                  bgcolor: 'rgba(59,130,246,0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(59,130,246,0.25)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#3b82f6',
                  },
                  '& .MuiListItemText-primary': {
                    color: '#3b82f6',
                    fontWeight: 600,
                  },
                },
                '&:hover': {
                  bgcolor: 'rgba(59,130,246,0.1)',
                },
              }}
            >
              <ListItemIcon sx={{ color: activeSection === item.href ? '#3b82f6' : '#5a6e8c', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  sx: {
                    color: activeSection === item.href ? '#3b82f6' : '#8a9bb0',
                    fontWeight: activeSection === item.href ? 600 : 400,
                    fontSize: '0.95rem'
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#050507', position: 'relative' }}>
      {/* Aurora Background - rendu plus subtil */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.15,
        }}
      >
        <Aurora
          colorStops={["#2c4c9e", "#5e3a9e", "#2c1a4e"]}
          blend={0.3}
          amplitude={0.8}
          speed={0.8}
        />
      </Box>
      
      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={handleDrawerToggle} />
      
      {/* Sidebar de paramètres avec cadre - Desktop */}
      {!isMobile && (
        <Drawer
          variant="persistent"
          anchor="left"
          open={sidebarOpen}
          sx={{
            width: 320,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 320,
              boxSizing: 'border-box',
              position: 'relative',
              height: '100vh',
              bgcolor: 'transparent',
              border: 'none',
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
          }}
        >
          <Box sx={{ width: '100%', height: '100%', py: 2 }}>
            {sidebarContent}
          </Box>
        </Drawer>
      )}
      
      {/* Sidebar de paramètres - Mobile (Drawer temporaire) */}
      {isMobile && (
        <Drawer
          variant="temporary"
          anchor="left"
          open={sidebarOpen}
          onClose={handleSidebarToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 300,
              bgcolor: 'transparent',
              border: 'none',
              boxShadow: 'none',
            },
          }}
        >
          <Box sx={{ width: '100%', height: '100%', p: 2 }}>
            {sidebarContent}
          </Box>
        </Drawer>
      )}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: isMobile ? '100%' : sidebarOpen ? 'calc(100% - 320px)' : '100%',
          minHeight: '100vh',
          bgcolor: '#050507',
          position: 'relative',
          zIndex: 1,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* Header mobile avec bouton de menu */}
        <AppBar position="sticky" sx={{ bgcolor: '#0a0a0f', borderBottom: '1px solid rgba(59,130,246,0.15)', display: { xs: 'block', md: 'none' } }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleSidebarToggle}
              sx={{ mr: 2, color: '#94a3b8' }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ color: 'white' }}>
              Paramètres
            </Typography>
          </Toolbar>
        </AppBar>
        
        {/* Bouton pour basculer la sidebar - Desktop */}
        {!isMobile && (
          <IconButton
            onClick={handleSidebarToggle}
            sx={{
              position: 'fixed',
              left: sidebarOpen ? 300 : 20,
              top: 20,
              zIndex: 1200,
              bgcolor: '#0f0f14',
              color: '#3b82f6',
              '&:hover': {
                bgcolor: '#1a1a24',
              },
              transition: theme.transitions.create('left', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              border: '1px solid rgba(59,130,246,0.2)',
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Box sx={{ p: 3 }}>
          <Container maxWidth="md">
            {/* Sécurité Section */}
            {activeSection === '/settings/security' && (
              <Paper elevation={3} sx={{ p: 4, mt: 4, bgcolor: '#0a0a0f', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '20px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <LockIcon sx={{ color: '#3b82f6', fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white' }}>
                      Sécurité du compte
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      Gérez votre mot de passe et vos paramètres de sécurité
                    </Typography>
                  </Box>
                </Box>
                {successMessage && (
                  <Alert severity="success" sx={{ mb: 3, bgcolor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
                    {successMessage}
                  </Alert>
                )}
                {errorMessage && (
                  <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                    {errorMessage}
                  </Alert>
                )}
                
                {/* Formulaire de changement de mot de passe */}
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                    Changer votre mot de passe
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Mot de passe actuel */}
                    <TextField
                      label="Mot de passe actuel"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      fullWidth
                      size="medium"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => togglePasswordVisibility('current')}
                              edge="end"
                              sx={{ color: '#6b7280' }}
                            >
                              {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#e2e8f0',
                          '& fieldset': { borderColor: '#1f2937' },
                          '&:hover fieldset': { borderColor: '#374151' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                          bgcolor: '#111827',
                          borderRadius: '10px',
                        },
                        '& .MuiInputLabel-root': { color: '#6b7280' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
                      }}
                    />
                    {/* Nouveau mot de passe */}
                    <TextField
                      label="Nouveau mot de passe"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      fullWidth
                      size="medium"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => togglePasswordVisibility('new')}
                              edge="end"
                              sx={{ color: '#6b7280' }}
                            >
                              {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#e2e8f0',
                          '& fieldset': { borderColor: '#1f2937' },
                          '&:hover fieldset': { borderColor: '#374151' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                          bgcolor: '#111827',
                          borderRadius: '10px',
                        },
                        '& .MuiInputLabel-root': { color: '#6b7280' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
                      }}
                    />
                    {/* Confirmer mot de passe */}
                    <TextField
                      label="Confirmer le mot de passe"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      fullWidth
                      size="medium"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => togglePasswordVisibility('confirm')}
                              edge="end"
                              sx={{ color: '#6b7280' }}
                            >
                              {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#e2e8f0',
                          '& fieldset': { borderColor: '#1f2937' },
                          '&:hover fieldset': { borderColor: '#374151' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                          bgcolor: '#111827',
                          borderRadius: '10px',
                        },
                        '& .MuiInputLabel-root': { color: '#6b7280' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
                      }}
                    />
                    {/* Bouton Enregistrer */}
                    <Button
                      onClick={handlePasswordChange}
                      disabled={loading}
                      variant="contained"
                      sx={{
                        bgcolor: '#3b82f6',
                        color: 'white',
                        fontWeight: 600,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                        '&:hover': { bgcolor: '#2563eb' },
                        '&:disabled': { opacity: 0.6 },
                      }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Changer le mot de passe'}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}
            
            {/* Section Utilisateur - Gestion des employés */}
            {activeSection === '/settings/preferences' && canManageUsers && (
              <Paper elevation={3} sx={{ p: 4, mt: 4, bgcolor: '#0a0a0f', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '20px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <PersonAddIcon sx={{ color: '#3b82f6', fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white' }}>
                      Gestion des utilisateurs
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6b7280' }}>
                      Ajoutez et gérez les employés et leurs permissions
                    </Typography>
                  </Box>
                </Box>
                {successMessage && (
                  <Alert severity="success" sx={{ mb: 3, bgcolor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
                    {successMessage}
                  </Alert>
                )}
                {errorMessage && (
                  <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                    {errorMessage}
                  </Alert>
                )}
                
                {/* Gestion d'équipe - Tableau des employés */}
                <Box sx={{ mt: 4, mb: 6 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                   
                    <Button
                      startIcon={<PersonAddIcon />}
                      variant="contained"
                      sx={{
                        bgcolor: '#3b82f6',
                        color: 'white',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                        '&:hover': { bgcolor: '#2563eb' },
                      }}
                      onClick={() => navigate('/employees/new')}
                    >
                      Ajouter un employé
                    </Button>
                  </Box>         
                </Box>
                
              {/* Section de modification du rôle d'un utilisateur existant */}
<Box sx={{ mt: 6, pt: 4, borderTop: '1px solid rgba(59,130,246,0.2)' }} id="modify-role-section">
  <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
    Modifier le rôle d'un utilisateur
  </Typography>
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
    
    {/* Sélection utilisateur */}
    <FormControl fullWidth>
      <InputLabel sx={{ color: '#6b7280', '&.Mui-focused': { color: '#3b82f6' } }}>
        Sélectionner un utilisateur
      </InputLabel>
      <Select
        value={selectedUser}
        onChange={(e) => {
          setSelectedUser(e.target.value);
          // Charger les pages autorisées de l'utilisateur sélectionné
          const user = usersList.find(u => u.id === e.target.value);
          if (user) {
            console.log('User selected:', user);
            console.log('Authorized pages:', user.authorized_pages);
            setEmployeeData({
              ...employeeData,
              role: user.role || 'employe',
              authorized_pages: user.authorized_pages && Array.isArray(user.authorized_pages) ? user.authorized_pages : []
            });
          }
        }}
        label="Sélectionner un utilisateur"
        sx={{
          color: '#e2e8f0',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1f2937' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
          bgcolor: '#111827',
          borderRadius: '10px',
        }}
      >
        {usersList.map((user) => (
          <MenuItem key={user.id} value={user.id} sx={{ bgcolor: '#111827', color: '#e2e8f0' }}>
            {user.username} ({user.email}) - {user.role || 'user'}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
    
    {/* Nouveau rôle */}
    <FormControl fullWidth>
      <InputLabel sx={{ color: '#6b7280', '&.Mui-focused': { color: '#3b82f6' } }}>
        Nouveau rôle
      </InputLabel>
      <Select
        value={employeeData.role}
        onChange={(e) => setEmployeeData({ ...employeeData, role: e.target.value })}
        label="Nouveau rôle"
        sx={{
          color: '#e2e8f0',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1f2937' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
          bgcolor: '#111827',
          borderRadius: '10px',
        }}
      >
        {availableRoles.map((role) => (
          <MenuItem key={role.value} value={role.value} sx={{ bgcolor: '#111827', color: '#e2e8f0' }}>
            {role.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
    
    {/* Checkboxes pour les pages autorisées */}
    <Box sx={{ mt: 1 }}>
      <Typography variant="subtitle1" sx={{ color: '#94a3b8', mb: 2, fontWeight: 500 }}>
        Pages autorisées
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
        {availablePages.map((page) => (
          <Box key={page.slug} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              type="checkbox"
              id={`page-${page.slug}`}
              checked={employeeData.authorized_pages?.includes(page.slug) || false}
              onChange={(e) => {
                const currentPages = Array.isArray(employeeData.authorized_pages) 
                  ? employeeData.authorized_pages 
                  : [];
                
                let updatedPages;
                if (e.target.checked) {
                  updatedPages = [...currentPages, page.slug];
                } else {
                  updatedPages = currentPages.filter(p => p !== page.slug);
                }
                
                console.log(`[CHECKBOX] Page ${page.slug} - Checked: ${e.target.checked} - Updated pages:`, updatedPages);
                
                setEmployeeData({
                  ...employeeData,
                  authorized_pages: updatedPages
                });
              }}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: '#3b82f6',
                borderRadius: '4px',
                border: '1px solid rgba(59,130,246,0.3)',
                backgroundColor: '#1f2937'
              }}
            />
            <label 
              htmlFor={`page-${page.slug}`} 
              style={{ 
                color: '#e2e8f0', 
                cursor: 'pointer', 
                fontSize: '0.9rem',
                userSelect: 'none'
              }}
            >
              {page.label}
            </label>
          </Box>
        ))}
      </Box>
    </Box>
    
    {/* Bouton Mettre à jour */}
    <Button
      onClick={handleUpdateUserRole}
      disabled={loading}
      variant="contained"
      sx={{
        bgcolor: '#3b82f6',
        color: 'white',
        fontWeight: 600,
        py: 1.5,
        borderRadius: 2,
        textTransform: 'none',
        fontSize: '1rem',
        boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
        '&:hover': { bgcolor: '#2563eb' },
        '&:disabled': { opacity: 0.6 },
        mt: 2,
      }}
    >
      {loading ? <CircularProgress size={24} /> : 'Mettre à jour le rôle'}
    </Button>
  </Box>
</Box>
              </Paper>
            )}
            
            {activeSection === '/settings/preferences' && !canManageUsers && (
              <Paper elevation={3} sx={{ p: 4, mt: 4, bgcolor: '#0a0a0f', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '20px' }}>
                <Typography variant="h4" sx={{ color: 'white', mb: 2 }}>
                  Accès refusé
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  Cette section est réservée aux administrateurs.
                </Typography>
              </Paper>
            )}
            
            {/* Contenu par défaut - Général */}
            {activeSection !== '/settings/security' && activeSection !== '/settings/preferences' && (
              <Paper elevation={3} sx={{ p: 4, mt: 4, bgcolor: '#0a0a0f', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '20px' }}>
                <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 3 }}>
                  {t('accountInformation')}
                </Typography>
                <Typography variant="body1" sx={{ color: '#9ca3af', mb: 4 }}>
                  {t('configureBasicInformation')}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#9ca3af', mb: 1, fontWeight: 500 }}>
                      {t('language')}
                    </Typography>
                    <FormControl fullWidth>
                      <Select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        sx={{
                          color: '#e2e8f0',
                          bgcolor: '#111827',
                          borderRadius: '10px',
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1f2937' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#374151' },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                        }}
                      >
                        <MenuItem value="fr">{t('fr')}</MenuItem>
                        <MenuItem value="en">{t('en')}</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
                      {t('languageSettingHelp')}
                    </Typography>
                  </Box>
                  {/* Nom de l'entreprise */}
                  <Box>
                    <Typography variant="body2" sx={{ color: '#9ca3af', mb: 1, fontWeight: 500 }}>
                      {t('companyName')}
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder={t('companyNamePlaceholder')}
                      value={accountInfo.company}
                      onChange={(e) => setAccountInfo({ ...accountInfo, company: e.target.value })}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#e2e8f0',
                          '& fieldset': { borderColor: '#1f2937' },
                          '&:hover fieldset': { borderColor: '#374151' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                          bgcolor: '#111827',
                          borderRadius: '10px',
                        },
                      }}
                    />
                  </Box>
                  
                  {/* Devise */}
                  <Box>
                    <Typography variant="body2" sx={{ color: '#9ca3af', mb: 1, fontWeight: 500 }}>
                      {t('currency')}
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder={t('currencyPlaceholder')}
                      value={accountInfo.currency}
                      onChange={(e) => setAccountInfo({ ...accountInfo, currency: e.target.value })}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#e2e8f0',
                          '& fieldset': { borderColor: '#1f2937' },
                          '&:hover fieldset': { borderColor: '#374151' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                          bgcolor: '#111827',
                          borderRadius: '10px',
                        },
                      }}
                    />
                  </Box>
                  
                  {/* Taux TVA */}
                  <Box>
                    <Typography variant="body2" sx={{ color: '#9ca3af', mb: 1, fontWeight: 500 }}>
                      {t('vatRate')}
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      placeholder="19"
                      value={accountInfo.vatRate}
                      onChange={(e) => setAccountInfo({ ...accountInfo, vatRate: e.target.value })}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#e2e8f0',
                          '& fieldset': { borderColor: '#1f2937' },
                          '&:hover fieldset': { borderColor: '#374151' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                          bgcolor: '#111827',
                          borderRadius: '10px',
                        },
                      }}
                    />
                  </Box>
                  
                  {/* Seuil d'alerte stock */}
                  <Box>
                    <Typography variant="body2" sx={{ color: '#9ca3af', mb: 1, fontWeight: 500 }}>
                      {t('stockAlertThreshold')}
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      placeholder="10"
                      helperText={t('stockAlertThresholdHelp')}
                      value={accountInfo.stockAlertThreshold}
                      onChange={(e) => setAccountInfo({ ...accountInfo, stockAlertThreshold: e.target.value })}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#e2e8f0',
                          '& fieldset': { borderColor: '#1f2937' },
                          '&:hover fieldset': { borderColor: '#374151' },
                          '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                          bgcolor: '#111827',
                          borderRadius: '10px',
                        },
                        '& .MuiFormHelperText-root': {
                          color: '#6b7280',
                        },
                      }}
                    />
                  </Box>
                  
                  {/* Bouton Enregistrer */}
                  <Button
                    variant="contained"
                    onClick={handleSaveAccountInfo}
                    disabled={loading}
                    sx={{
                      bgcolor: '#3b82f6',
                      color: 'white',
                      fontWeight: 600,
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem',
                      boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                      '&:hover': { bgcolor: '#2563eb' },
                      '&:disabled': { opacity: 0.6 },
                      mt: 2,
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : t('saveChanges')}
                  </Button>
                </Box>
              </Paper>
            )}
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default Settings;
