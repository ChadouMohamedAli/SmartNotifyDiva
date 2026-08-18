import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  Avatar,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Add as AddIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  DeleteOutline as DeleteOutlineIcon,
  Info as InfoIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SharedSidebar from '../components/SharedSidebar';

const initialModules = [
  { 
    id: 1, 
    name: 'STOCK Gestion des Stocks', 
    status: 'Active', 
    services: 'All services running',
    version: '2.4.1',
    lastUpdate: '2024-01-15',
    uptime: '99.8%',
    description: 'Gestion complète des stocks et inventaire',
    activeUsers: 45,
    notificationsCount: 5,
    logs: ['Service démarré', 'Synchronisation OK', 'Backup effectué'],
  },
  { 
    id: 2, 
    name: 'CRM Relation Client', 
    status: 'Active', 
    services: 'All services running',
    version: '3.1.0',
    lastUpdate: '2024-01-10',
    uptime: '99.5%',
    description: 'Gestion de la relation client et des ventes',
    activeUsers: 32,
    notificationsCount: 12,
    logs: ['Connexion établie', 'Cache vidé', 'Jobs schedulés'],
  },
  { 
    id: 3, 
    name: 'FINANCE', 
    status: 'Active', 
    services: 'All services running',
    version: '1.8.3',
    lastUpdate: '2024-01-05',
    uptime: '99.9%',
    description: 'Gestion financière et comptabilité',
    activeUsers: 28,
    notificationsCount: 2,
    logs: ['Rapports générés', 'Clôture mensuelle OK', 'Audit trail actif'],
  },
  { 
    id: 4, 
    name: 'RH', 
    status: 'Active', 
    services: 'All services running',
    version: '2.0.1',
    lastUpdate: '2024-01-12',
    uptime: '99.7%',
    description: 'Gestion des ressources humaines',
    activeUsers: 38,
    notificationsCount: 8,
    logs: ['Paie calculée', 'Congés mis à jour', 'Notifications envoyées'],
  },
  { 
    id: 5, 
    name: 'PRODUCTION', 
    status: 'Inactive', 
    services: '3/5 services running',
    version: '1.5.2',
    lastUpdate: '2023-12-20',
    uptime: '85.2%',
    description: 'Gestion de la production et planification',
    activeUsers: 18,
    notificationsCount: 3,
    logs: ['Service arrêté', '2 services KO', 'En attente redémarrage'],
  },
  { 
    id: 6, 
    name: 'ACHATS', 
    status: 'Maintenance', 
    services: 'Service en maintenance',
    version: '1.2.0',
    lastUpdate: '2024-01-18',
    uptime: '0%',
    description: 'Gestion des achats et fournisseurs',
    activeUsers: 0,
    notificationsCount: 0,
    logs: ['Maintenance planifiée', 'Migration BDD en cours', 'ETA: 2h'],
  }
];

const ModulesERP = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [modules, setModules] = useState(initialModules);
  const [detailModule, setDetailModule] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newModule, setNewModule] = useState({
    name: '', description: '', version: '1.0.0', status: 'Inactive'
  });

  const isAdmin = user?.is_superuser || user?.is_staff || false;

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleTabChange = (event, newValue) => setSelectedTab(newValue);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'success';
      case 'Inactive': return 'warning';
      case 'Maintenance': return 'info';
      default: return 'default';
    }
  };

  const handleToggleStatus = (moduleId) => {
    setModules(prev => prev.map(m => {
      if (m.id !== moduleId) return m;
      const newStatus = m.status === 'Active' ? 'Inactive' : 'Active';
      const newUptime = newStatus === 'Inactive' ? '0%' : '99.0%';
      return {
        ...m,
        status: newStatus,
        uptime: newUptime,
        logs: [...m.logs, newStatus === 'Active' ? '▶ Module démarré' : '⏸ Module mis en pause'],
      };
    }));
  };

  const handleCreateModule = () => {
    if (!newModule.name.trim()) return;
    const created = {
      ...newModule,
      id: Date.now(),
      services: 'Service initialisé',
      lastUpdate: new Date().toISOString().split('T')[0],
      uptime: '0%',
      activeUsers: 0,
      notificationsCount: 0,
      logs: ['Module créé', 'En attente de démarrage'],
    };
    setModules(prev => [...prev, created]);
    setCreateOpen(false);
    setNewModule({ name: '', description: '', version: '1.0.0', status: 'Inactive' });
  };

  const handleDeleteModule = (moduleId) => {
    const moduleToDelete = modules.find(m => m.id === moduleId);
    if (!moduleToDelete) return;

    const confirmed = window.confirm(`Supprimer le module "${moduleToDelete.name}" ?`);
    if (!confirmed) return;

    setModules(prev => prev.filter(m => m.id !== moduleId));
    if (detailModule === moduleId) {
      setDetailModule(null);
    }
  };

  const filteredModules = modules.filter(m => {
    if (selectedTab === 1) return m.status === 'Active';
    if (selectedTab === 2) return m.status === 'Maintenance';
    return true;
  });

  if (!user) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: 'black' }}>
        <Typography variant="h4" sx={{ color: 'white' }}>Chargement...</Typography>
      </Box>
    );
  }

  // ─── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (detailModule !== null) {
    const mod = modules.find(m => m.id === detailModule);
    if (!mod) { setDetailModule(null); return null; }

    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'black' }}>
        <SharedSidebar mobileOpen={mobileOpen} onMobileClose={handleDrawerToggle} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: '100%',
            minHeight: '100vh',
            bgcolor: 'black',
            overflowY: 'auto',
            overflowX: 'hidden',
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { bgcolor: 'rgba(15, 23, 42, 0.4)' },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(59, 130, 246, 0.3)', borderRadius: '4px', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.5)' } },
          }}
        >
          {/* Header */}
          <Box sx={{ p: 1.2, borderBottom: '1px solid rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            {isMobile && (
              <IconButton onClick={handleDrawerToggle} sx={{ color: 'white', mr: 1, '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' } }}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                  {user?.first_name || user?.username}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                  {isAdmin ? 'Administrateur' : 'Utilisateur'}
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

          {/* Detail content */}
          <Box sx={{ p: 3, pb: 6 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => setDetailModule(null)}
              sx={{ color: '#94a3b8', mb: 3, textTransform: 'none', '&:hover': { color: 'white', bgcolor: 'rgba(59, 130, 246, 0.1)' } }}
            >
              Retour aux modules
            </Button>

            {/* Module header */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 60, height: 60, borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <StorageIcon sx={{ color: '#3b82f6', fontSize: 34 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
                      {mod.name.split(' ')[0]}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.95rem' }}>
                      {mod.name.split(' ').slice(1).join(' ')}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip label={mod.status} color={getStatusColor(mod.status)} sx={{ fontWeight: 600 }} />
                  {isAdmin && mod.status !== 'Maintenance' && (
                    <IconButton
                      onClick={() => handleToggleStatus(mod.id)}
                      sx={{
                        color: mod.status === 'Active' ? '#ef4444' : '#10b981',
                        bgcolor: mod.status === 'Active' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                        border: `1px solid ${mod.status === 'Active' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                        '&:hover': { bgcolor: mod.status === 'Active' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)' }
                      }}
                    >
                      {mod.status === 'Active' ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                  )}
                  {isAdmin && (
                    <IconButton
                      onClick={() => handleDeleteModule(mod.id)}
                      sx={{
                        color: '#ef4444',
                        bgcolor: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        '&:hover': { bgcolor: 'rgba(239,68,68,0.2)' }
                      }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Description */}
            <Card sx={{ bgcolor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: 2, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>Description</Typography>
                <Typography variant="body1" sx={{ color: '#cbd5e1', lineHeight: 1.7 }}>{mod.description}</Typography>
              </CardContent>
            </Card>

            {/* Info grid */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {[
                { label: 'Version', value: mod.version },
                { label: 'Dernière mise à jour', value: mod.lastUpdate },
                { label: 'Utilisateurs actifs', value: `${mod.activeUsers} actifs` },
                { label: 'Uptime', value: mod.uptime },
              ].map((info, i) => (
                <Grid item xs={6} md={3} key={i}>
                  <Card sx={{
                    bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 2,
                    transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.2)' }
                  }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>{info.label}</Typography>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>{info.value}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Performance */}
            <Card sx={{ bgcolor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: 2, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>Performance</Typography>
                <Box sx={{ mb: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>Uptime global</Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>{mod.uptime}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(mod.uptime)}
                    sx={{
                      height: 8, borderRadius: 4, bgcolor: 'rgba(59, 130, 246, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: mod.uptime === '99.9%' ? '#10b981' : mod.uptime === '99.8%' ? '#3b82f6' : mod.uptime === '99.5%' ? '#f59e0b' : '#ef4444'
                      }
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', mt: 2 }}>
                  Services: <span style={{ color: 'white' }}>{mod.services}</span>
                </Typography>
              </CardContent>
            </Card>

            {/* Logs */}
            <Card sx={{ bgcolor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>Journal système</Typography>
                <Box sx={{ bgcolor: 'rgba(0,0,0,0.4)', borderRadius: 1.5, p: 2, fontFamily: 'monospace' }}>
                  {mod.logs.map((log, i) => (
                    <Box key={i} sx={{ mb: 0.75, display: 'flex', gap: 1.5 }}>
                      <Typography sx={{ color: '#475569', fontSize: '0.78rem' }}>
                        [{new Date().toLocaleTimeString('fr-FR')}]
                      </Typography>
                      <Typography sx={{ color: '#a5f3fc', fontSize: '0.78rem' }}>{log}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    );
  }

  // ─── MAIN LIST VIEW ───────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'black' }}>
      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={handleDrawerToggle} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          minHeight: '100vh',
          bgcolor: 'black',
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { bgcolor: 'rgba(15, 23, 42, 0.4)' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(59, 130, 246, 0.3)', borderRadius: '4px', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.5)' } },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 1.2, borderBottom: '1px solid rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          {isMobile && (
            <IconButton onClick={handleDrawerToggle} sx={{ color: 'white', mr: 1, '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' } }}>
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ flex: 1, maxWidth: 500, position: 'relative' }}>
            <SearchIcon sx={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 20 }} />
            <input
              type="text"
              placeholder="Rechercher un module..."
              style={{
                width: '100%', padding: '12px 16px 12px 48px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '12px', color: '#94a3b8', fontSize: '0.9rem', outline: 'none', transition: 'all 0.2s ease',
              }}
              onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)'; e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'; }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                  {user?.first_name || user?.username}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                  {isAdmin ? 'Administrateur' : 'Utilisateur'}
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

        {/* Page content */}
        <Box sx={{ p: 3, pb: 6 }}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
                  Modules ERP
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.95rem' }}>
                  Gérez et surveillez tous vos modules ERP
                </Typography>
              </Box>
              {isAdmin && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateOpen(true)}
                  sx={{
                    bgcolor: '#3b82f6', color: 'white', fontWeight: 600, py: 1.2, px: 3,
                    borderRadius: 2, textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    '&:hover': { bgcolor: '#2563eb', boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)' }
                  }}
                >
                  Ajouter un Module
                </Button>
              )}
            </Box>
          </Box>

          {/* Tabs */}
          <Paper sx={{ bgcolor: 'rgba(30, 41, 59, 0.5)', mb: 3, borderRadius: 2, border: '1px solid rgba(59, 130, 246, 0.1)' }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': { color: '#94a3b8', fontWeight: 500, '&.Mui-selected': { color: '#3b82f6' } },
                '& .MuiTabs-indicator': { bgcolor: '#3b82f6' }
              }}
            >
              <Tab label="Tous les Modules" />
              <Tab label="Actifs" />
              <Tab label="En Maintenance" />
              <Tab label="Statistiques" />
            </Tabs>
          </Paper>

          {/* Stats cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 2, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.2)' } }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>{modules.length}</Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Modules Totaux</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 2, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)' } }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>{modules.filter(m => m.status === 'Active').length}</Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Modules Actifs</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'rgba(251, 146, 60, 0.1)', border: '1px solid rgba(251, 146, 60, 0.2)', borderRadius: 2, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(251, 146, 60, 0.2)' } }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>{modules.filter(m => m.status === 'Inactive').length}</Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Modules Inactifs</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 2, transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(139, 92, 246, 0.2)' } }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>{modules.filter(m => m.status === 'Maintenance').length}</Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>En Maintenance</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Modules list or stats */}
          {selectedTab === 3 ? (

            <Card sx={{ bgcolor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 3 }}>Statistiques Uptime</Typography>
                {modules.map(mod => (
                  <Box key={mod.id} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>{mod.name.split(' ')[0]}</Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>{mod.uptime}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(mod.uptime)}
                      sx={{
                        height: 6, borderRadius: 3, bgcolor: 'rgba(59, 130, 246, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: mod.uptime === '99.9%' ? '#10b981' : mod.uptime === '99.8%' ? '#3b82f6' : mod.uptime === '99.5%' ? '#f59e0b' : '#ef4444'
                        }
                      }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3} alignItems="stretch">
              {filteredModules.map((module) => (
                <Grid item xs={12} sm={6} md={4} key={module.id} sx={{ display: 'flex' }}>
                  <Card sx={{
                    bgcolor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: 2,
                    transition: 'all 0.3s ease', width: '100%', display: 'flex', flexDirection: 'column',
                    '&:hover': { borderColor: 'rgba(59, 130, 246, 0.3)', transform: 'translateY(-2px)', boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)' }
                  }}>
                    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', flex: 1, height: '100%', '&:last-child': { pb: 3 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ width: 50, height: 50, borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <StorageIcon sx={{ color: '#3b82f6', fontSize: 28 }} />
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                              {module.name.split(' ')[0]}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              {module.name.split(' ').slice(1).join(' ')}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip label={module.status} color={getStatusColor(module.status)} size="small" sx={{ fontWeight: 600 }} />
                      </Box>

                      <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2, fontSize: '0.9rem', flexGrow: 1 }}>
                        {module.description}
                      </Typography>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Version</Typography>
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>{module.version}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Uptime</Typography>
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>{module.uptime}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>Utilisateurs</Typography>
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>{module.activeUsers} actifs</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: module.notificationsCount > 10 ? '#ef4444' : '#3b82f6', fontWeight: 500 }}>
                            {module.notificationsCount}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>Performance</Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>{module.uptime}</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={parseFloat(module.uptime)}
                          sx={{
                            height: 6, borderRadius: 3, bgcolor: 'rgba(59, 130, 246, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: module.uptime === '99.9%' ? '#10b981' : module.uptime === '99.8%' ? '#3b82f6' : module.uptime === '99.5%' ? '#f59e0b' : '#ef4444'
                            }
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid rgba(59, 130, 246, 0.1)', mt: 'auto' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {isAdmin && module.status !== 'Maintenance' && (
                            <IconButton
                              size="small"
                              onClick={() => handleToggleStatus(module.id)}
                              sx={{ color: module.status === 'Active' ? '#ef4444' : '#10b981' }}
                            >
                              {module.status === 'Active' ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                            </IconButton>
                          )}
                          {isAdmin && (
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteModule(module.id)}
                              sx={{ color: '#ef4444' }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>

                        <Button
                          variant="outlined"
                          size="small"
                          endIcon={<InfoIcon />}
                          sx={{
                            color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.3)', fontSize: '0.75rem',
                            '&:hover': { borderColor: '#3b82f6', bgcolor: 'rgba(59, 130, 246, 0.1)' }
                          }}
                          onClick={() => setDetailModule(module.id)}
                        >
                          Détails
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(30, 41, 59, 0.5)', borderRadius: 2, border: '1px solid rgba(59, 130, 246, 0.1)' }}>
            <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center' }}>
              Système ERP • Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')} • Tous les services sont surveillés en temps réel
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ─── CREATE DIALOG ────────────────────────────────────────────────────── */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 3,
            boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
          }
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>Ajouter un Module ERP</Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.8rem', mt: 0.3 }}>Configurez les paramètres du nouveau module</Typography>
          </Box>
          <IconButton onClick={() => setCreateOpen(false)} sx={{ color: '#64748b', '&:hover': { color: 'white', bgcolor: 'rgba(59, 130, 246, 0.1)' } }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider sx={{ borderColor: 'rgba(59, 130, 246, 0.1)' }} />

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.82rem', mb: 1, fontWeight: 500 }}>Nom du module *</Typography>
              <input
                value={newModule.name}
                onChange={e => setNewModule(p => ({ ...p, name: e.target.value }))}
                placeholder="ex: LOGISTIQUE Gestion des livraisons"
                style={{
                  width: '100%', padding: '11px 14px',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '10px', color: '#94a3b8', fontSize: '0.9rem', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box', transition: 'all 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.15)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)'; e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.08)'; }}
              />
            </Box>

            <Box>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.82rem', mb: 1, fontWeight: 500 }}>Description</Typography>
              <textarea
                value={newModule.description}
                onChange={e => setNewModule(p => ({ ...p, description: e.target.value }))}
                placeholder="Décrivez brièvement le rôle de ce module..."
                rows={3}
                style={{
                  width: '100%', padding: '11px 14px',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '10px', color: '#94a3b8', fontSize: '0.9rem', outline: 'none',
                  fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', transition: 'all 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.15)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)'; e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.08)'; }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.82rem', mb: 1, fontWeight: 500 }}>Version initiale</Typography>
                <input
                  value={newModule.version}
                  onChange={e => setNewModule(p => ({ ...p, version: e.target.value }))}
                  placeholder="1.0.0"
                  style={{
                    width: '100%', padding: '11px 14px',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '10px', color: '#94a3b8', fontSize: '0.9rem', outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box', transition: 'all 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)'; e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.08)'; }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.82rem', mb: 1, fontWeight: 500 }}>Statut initial</Typography>
                <select
                  value={newModule.status}
                  onChange={e => setNewModule(p => ({ ...p, status: e.target.value }))}
                  style={{
                    width: '100%', padding: '11px 14px',
                    backgroundColor: 'rgba(15, 23, 42, 0.98)', border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '10px', color: '#94a3b8', fontSize: '0.9rem', outline: 'none',
                    fontFamily: 'inherit', cursor: 'pointer', boxSizing: 'border-box',
                  }}
                >
                  <option value="Inactive">Inactif</option>
                  <option value="Active">Actif</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <Divider sx={{ borderColor: 'rgba(59, 130, 246, 0.1)' }} />

        <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
          <Button
            onClick={() => setCreateOpen(false)}
            sx={{ color: '#64748b', textTransform: 'none', '&:hover': { color: 'white', bgcolor: 'rgba(59, 130, 246, 0.08)' } }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateModule}
            disabled={!newModule.name.trim()}
            sx={{
              bgcolor: '#3b82f6', color: 'white', fontWeight: 600, textTransform: 'none', px: 3,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              '&:hover': { bgcolor: '#2563eb', boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)' },
              '&.Mui-disabled': { bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#475569' }
            }}
          >
            Créer le module
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModulesERP;