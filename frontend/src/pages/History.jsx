import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  History as HistoryIcon,
  Inventory as InventoryIcon,
  SwapHoriz as SwapHorizIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  ShoppingCart as ShoppingCartIcon,
  Store as StoreIcon,
  LocalShipping as LocalShippingIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import SharedSidebar from '../components/SharedSidebar';
import { authFetch } from '../utils/authFetch';
import { useTranslation } from 'react-i18next';

const History = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tabValue, setTabValue] = useState(0);

  // Vérifier le rôle
  const isApproManager = user?.role === 'responsable_appro';
  const isStockManager = user?.role === 'responsable_stock';
  const isAdmin = user?.is_staff || user?.is_superuser;

  // Générer l'historique local
  const generateLocalHistory = async () => {
    setLoading(true);
    setError('');
    
    try {
      let allHistory = [];
      const now = new Date();
      
      // 1. Récupérer les commandes (pour tous les rôles)
      try {
        const ordersResponse = await authFetch('/api/orders/orders/');
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          const orders = Array.isArray(ordersData) ? ordersData : ordersData.results || [];
          
          orders.forEach(order => {
            allHistory.push({
              id: `order-${order.id}`,
              type: 'order',
              type_display: t('order'),
              description: t('orderDescription', { id: order.id, count: order.items?.length || 0, total: order.total_amount || 0 }),
              user_name: order.user?.username || order.user_name || t('system'),
              created_at: order.created_at || order.createdAt || new Date().toISOString(),
            });
          });
        }
      } catch (err) {
        console.error(t('errorLoadingOrders'), err);
      }
      
      // 2. Récupérer les fournisseurs
      try {
        const suppliersResponse = await authFetch('/api/fournisseurs/');
        if (suppliersResponse.ok) {
          const suppliersData = await suppliersResponse.json();
          const suppliers = Array.isArray(suppliersData) ? suppliersData : suppliersData.results || [];
          
          suppliers.forEach(supplier => {
            allHistory.push({
              id: `supplier-${supplier.id}`,
              type: 'supplier',
              type_display: t('supplier'),
              description: t('supplierDescription', { name: supplier.name, contact: supplier.contact_name || 'N/A', email: supplier.email || 'N/A' }),
              user_name: supplier.user?.username || supplier.user_name || user?.first_name || user?.username,
              created_at: supplier.created_at || supplier.createdAt || new Date().toISOString(),
            });
          });
        }
      } catch (err) {
        console.error(t('errorLoadingSuppliers'), err);
      }
      
      // 3. Récupérer les alertes
      try {
        const alertsResponse = await authFetch('/api/alerts/');
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          const alerts = Array.isArray(alertsData) ? alertsData : alertsData.results || [];
          
          alerts.forEach(alert => {
            allHistory.push({
              id: `alert-${alert.id}`,
              type: 'alert',
              type_display: t('alert'),
              description: t('alertDescription', { name: alert.name, description: alert.description || t('noDescription'), status: alert.is_active ? t('active') : t('inactive') }),
              user_name: alert.user?.username || alert.user_name || user?.first_name || user?.username,
              created_at: alert.created_at || alert.createdAt || new Date().toISOString(),
            });
          });
        }
      } catch (err) {
        console.error(t('errorLoadingAlerts'), err);
      }
      
      // 4. Récupérer les mouvements de stock (optionnel)
      try {
        const movementsResponse = await authFetch('/api/stock-movements/');
        if (movementsResponse.ok) {
          const movementsData = await movementsResponse.json();
          const movements = Array.isArray(movementsData) ? movementsData : movementsData.results || [];
          
          movements.forEach(movement => {
            allHistory.push({
              id: `movement-${movement.id}`,
              type: 'movement',
              type_display: t('stockMovement'),
              description: t('movementDescription', { type: movement.type || t('movement'), quantity: movement.quantity || 0, product: movement.product?.name || 'N/A' }),
              user_name: movement.user?.username || movement.user_name || user?.first_name || user?.username,
              created_at: movement.created_at || movement.createdAt || new Date().toISOString(),
            });
          });
        }
      } catch (err) {
        console.error(t('errorLoadingMovements'), err);
      }
      
      // 5. Actions récentes simulées (pour démonstration)
      const recentActions = [
        {
          id: 'action-1',
          type: 'view',
          type_display: t('view'),
          description: t('viewOrderList'),
          user_name: user?.first_name || user?.username,
          created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'action-2',
          type: 'create',
          type_display: t('creation'),
          description: t('createNewStockAlert'),
          user_name: user?.first_name || user?.username,
          created_at: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'action-3',
          type: 'export',
          type_display: t('export'),
          description: t('exportOrderReport'),
          user_name: user?.first_name || user?.username,
          created_at: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      allHistory.push(...recentActions);
      
      // Trier par date (du plus récent au plus ancien)
      allHistory.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Filtrer par type d'activité
      let filtered = allHistory;
      if (filterType !== 'all') {
        filtered = allHistory.filter(item => item.type === filterType);
      }
      
      // Filtrer par onglet (tab)
      if (tabValue === 1) { // Fournisseurs
        filtered = filtered.filter(item => item.type === 'supplier');
      } else if (tabValue === 2) { // Alertes
        filtered = filtered.filter(item => item.type === 'alert');
      } else if (tabValue === 3) { // Commandes
        filtered = filtered.filter(item => item.type === 'order');
      }
      
      // Filtrer par recherche
      if (searchTerm) {
        filtered = filtered.filter(item =>
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Pagination
      const itemsPerPage = 10;
      const start = (page - 1) * itemsPerPage;
      const paginatedItems = filtered.slice(start, start + itemsPerPage);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
      setHistory(paginatedItems);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError(t('errorLoadingHistory'));
    } finally {
      setLoading(false);
    }
};
useEffect(() => {
  if (!loading) {
    generateLocalHistory();
  }
}, [page, filterType, tabValue, searchTerm]);
useEffect(() => {
  generateLocalHistory();
}, []);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'stock': return <InventoryIcon sx={{ fontSize: 16, color: '#3b82f6' }} />;
      case 'movement': return <SwapHorizIcon sx={{ fontSize: 16, color: '#8b5cf6' }} />;
      case 'alert': return <WarningIcon sx={{ fontSize: 16, color: '#f59e0b' }} />;
      case 'order': return <ShoppingCartIcon sx={{ fontSize: 16, color: '#10b981' }} />;
      case 'supplier': return <StoreIcon sx={{ fontSize: 16, color: '#a78bfa' }} />;
      case 'view': return <VisibilityIcon sx={{ fontSize: 16, color: '#3b82f6' }} />;
      case 'create': return <AddIcon sx={{ fontSize: 16, color: '#10b981' }} />;
      case 'export': return <DownloadIcon sx={{ fontSize: 16, color: '#f59e0b' }} />;
      default: return <HistoryIcon sx={{ fontSize: 16, color: '#64748b' }} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'stock': return '#3b82f6';
      case 'movement': return '#8b5cf6';
      case 'alert': return '#f59e0b';
      case 'order': return '#10b981';
      case 'supplier': return '#a78bfa';
      case 'view': return '#3b82f6';
      case 'create': return '#10b981';
      case 'export': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const filteredHistory = history.filter(item =>
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(1);
  };

  if (loading && history.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'black' }}>
        <CircularProgress sx={{ color: '#3b82f6' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'black' }}>
      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} selectedMenu="history" />

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%', overflowY: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
            {t('activityHistory')}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {t('allSystemActions')}
          </Typography>
          {isApproManager && (
            <Chip 
              label={t('procurementManager')}
              size="small" 
              sx={{ mt: 1, bgcolor: 'rgba(59,130,246,0.15)', color: '#3b82f6' }} 
            />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: '1px solid rgba(59,130,246,0.2)', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ '& .MuiTab-root': { color: '#94a3b8', '&.Mui-selected': { color: '#3b82f6' } } }}>
            <Tab label={t('all')} />
            <Tab label={t('suppliers')} />
            <Tab label={t('alerts')} />
            <Tab label={t('orders')} />
          </Tabs>
        </Box>

        {/* Filtres */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{
              flex: 1,
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(59,130,246,0.2)' },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#64748b' }} />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: '#94a3b8' }}>{t('activityType')}</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label={t('activityType')}
              sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(59,130,246,0.2)' } }}
            >
              <MenuItem value="all">{t('all')}</MenuItem>
              <MenuItem value="order">{t('orders')}</MenuItem>
              <MenuItem value="supplier">{t('suppliers')}</MenuItem>
              <MenuItem value="create">{t('creations')}</MenuItem>
              <MenuItem value="view">{t('views')}</MenuItem>
              <MenuItem value="export">{t('exports')}</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title={t('refresh')}>
            <IconButton onClick={generateLocalHistory} sx={{ color: '#3b82f6' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Tableau */}
        <Card sx={{ bgcolor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(59,130,246,0.1)' }}>{t('type')}</TableCell>
                  <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(59,130,246,0.1)' }}>{t('description')}</TableCell>
                  <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(59,130,246,0.1)' }}>{t('user')}</TableCell>
                  <TableCell sx={{ color: '#94a3b8', borderBottom: '1px solid rgba(59,130,246,0.1)' }}>{t('date')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ color: '#64748b', py: 4 }}>
                      {t('noActivityFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((item) => (
                    <TableRow key={item.id} sx={{ '&:hover': { bgcolor: 'rgba(59,130,246,0.05)' } }}>
                      <TableCell>
                        <Chip
                          icon={getTypeIcon(item.type)}
                          label={item.type_display}
                          size="small"
                          sx={{ bgcolor: `${getTypeColor(item.type)}15`, color: getTypeColor(item.type), fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>{item.description}</TableCell>
                      <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#94a3b8' }}>
                        <PersonIcon sx={{ fontSize: 14 }} />
                        {item.user_name || t('system')}
                      </TableCell>
                      <TableCell sx={{ color: '#64748b' }}>
                        {new Date(item.created_at).toLocaleString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              sx={{ '& .MuiPaginationItem-root': { color: '#94a3b8', '&.Mui-selected': { bgcolor: '#3b82f6', color: 'white' } } }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default History;