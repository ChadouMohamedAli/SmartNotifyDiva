import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Typography,
  Collapse,
  Drawer,
  useTheme,
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
  Badge,
  Paper,
  Switch,
} from '@mui/material';
import { useTranslation } from 'react-i18next';


import {
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  CalendarToday as CalendarIcon,
  FlashOn as FlashOnIcon,
  PersonAdd as PersonAddIcon,
  Storage as StorageIcon,
  AdminPanelSettings as AdminIcon,
  Inventory as InventoryIcon,
  ExpandMore as ExpandMoreIcon,
  AddBox as AddBoxIcon,
  List as ListIcon,
  BarChart as BarChartIcon,
  Category as CategoryIcon,
  Warehouse as WarehouseIcon,
  AddBusiness as AddWarehouseIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  SwapHoriz as SwapHorizIcon,
  LocalShipping as LocalShippingIcon, 
} from '@mui/icons-material';
import notif from '../assets/notif.png';
import { useLanguage } from '../context/LanguageContext';

const desktopWidth = 280;
const collapsedWidth = 80;
const mobileWidth = 260;

const SharedSidebar = ({ mobileOpen, onMobileClose, selectedMenu }) => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));


  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const drawerWidth = isMobile ? mobileWidth : (sidebarCollapsed ? collapsedWidth : desktopWidth);

  // Aligné sur accounts.CustomUser.is_admin + rôle super_admin (API)
  const isAdmin =
    user?.is_superuser ||
    user?.is_staff ||
    user?.is_primary_admin ||
    user?.role === 'super_admin';
  const isStockManager = user?.role === 'responsable_stock';
  const isApproManager = user?.role === 'responsable_appro';
  const isProductionManager = user?.role === 'responsable_production';
  const isFacturationManager = user?.role === 'responsable_facturation';
  const isCommandesManager = user?.role === 'responsable_commandes';
  
  const [openMenus, setOpenMenus] = useState({ 
    stock: false,
    rawMaterials: false,
    productionOrders: false,
    finishedProducts: false,
    categories: false, 
    stockMovements: false,
    fournisseurs: false, 
    entrepots: false,
    facturation: false,
    orders: false,
    employees: false,
  });

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleMenu = (id) => setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  const handleNav = (path) => {
    if (path) navigate(path);
    if (isMobile && onMobileClose) onMobileClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ============================================================
  // CONFIGURATION DES MENUS POUR RESPONSABLE STOCK
  // ============================================================
 const stockManagerMenus = [
  {
    id: 'dashboard',
    label: 'dashboard',  // ← changé
    icon: <DashboardIcon />,
    path: '/stock-dashboard',
  },
  {
    id: 'alertes',
    label: 'alertes',  // ← changé
    icon: <FlashOnIcon />,
    path: '/alerts',
  },
  {
    id: 'notifications',
    label: 'notifications',  // ← changé
    icon: <NotificationsIcon />,
    path: '/notifications',
    badge: user?.unread_notifications || 0,
  },
  {
    id: 'stock',
    label: 'stock',  // ← changé
    icon: <InventoryIcon />,
    children: [
      { id: 'stock-list', label: 'stock-list', icon: <ListIcon />, path: '/stock' },  // ← changé
      { id: 'stock-new', label: 'stock-new', icon: <AddBoxIcon />, path: '/stock/new' },  // ← changé
    ],
  },
  {
    id: 'stockMovements',
    label: 'stockMovements',  // ← changé
    icon: <SwapHorizIcon />,
    children: [
      { id: 'movements-list', label: 'movements-list', icon: <ListIcon />, path: '/stock-movements' },  // ← changé
      { id: 'movements-new', label: 'movements-new', icon: <AddBoxIcon />, path: '/stock-movements/new' },  // ← changé
    ],
  },
  {
    id: 'orders',
    label: 'orders',  // ← changé
    icon: <ShoppingCartIcon />,
    children: [
      { id: 'orders-list', label: 'orders-list', icon: <ListIcon />, path: '/orders' },  // ← changé
      { id: 'orders-new', label: 'orders-new', icon: <AddBoxIcon />, path: '/orders/new' },  // ← changé
    ],
  },
  {
    id: 'categories',
    label: 'categories',  // ← changé
    icon: <CategoryIcon />,
    children: [
      { id: 'categories-list', label: 'categories-list', icon: <ListIcon />, path: '/categories' },  // ← changé
      { id: 'categories-new', label: 'categories-new', icon: <AddBoxIcon />, path: '/categories/new' },  // ← changé
    ],
  },
  {
    id: 'fournisseurs',
    label: 'fournisseurs',  // ← changé
    icon: <PeopleIcon />,
    children: [
      { id: 'fournisseur-list', label: 'fournisseur-list', icon: <ListIcon />, path: '/fournisseur' },  // ← changé
      { id: 'fournisseur-new', label: 'fournisseur-new', icon: <AddBoxIcon />, path: '/fournisseur/new' },  // ← changé
    ],
  },
  {
    id: 'entrepots',
    label: 'entrepots',  // ← changé
    icon: <WarehouseIcon />,
    children: [
      { id: 'entrepot-list', label: 'entrepot-list', icon: <ListIcon />, path: '/entrepots' },  // ← changé
      { id: 'entrepot-new', label: 'entrepot-new', icon: <AddWarehouseIcon />, path: '/entrepots/new' },  // ← changé
    ],
  },
  {
    id: 'facturation',
    label: 'facturation',  // ← changé
    icon: <ReceiptIcon />,
    children: [
      { id: 'facturation-list', label: 'facturation-list', icon: <ListIcon />, path: '/facturation' },  // ← changé
      { id: 'facturation-new', label: 'facturation-new', icon: <AddBoxIcon />, path: '/facturation/new' },  // ← changé
    ],
  },
  {
    id: 'modules',
    label: 'modules',  // ← changé
    icon: <StorageIcon />,
    path: '/modulesERP',
  },
  {
    id: 'history',
    label: 'history',  // ← changé
    icon: <HistoryIcon />,
    path: '/history',
  },
  {
    id: 'profile',
    label: 'profile',  // ← changé
    icon: <PersonIcon />,
    path: '/profile',
  },
  {
    id: 'settings',
    label: 'settings',  // ← changé
    icon: <SettingsIcon />,
    path: '/settings',
  },
  {
    id: 'deconnexion',
    label: 'deconnexion',  // ← changé
    icon: <LogoutIcon />,
    action: handleLogout,
  },
];

  // ============================================================
// CONFIGURATION DES MENUS POUR RESPONSABLE APPROVISIONNEMENT
// ============================================================
// Dans SharedSidebar.js, modifiez la section approManagerMenus :

const approManagerMenus = [
  {
    id: 'dashboard',
    label: 'dashboard',
    icon: <DashboardIcon />,
    path: '/appro-dashboard',
  },
   {
    id: 'alertes',
    label: 'alertes',
    icon: <FlashOnIcon />,
    path: '/alerts',
  },
   {
    id: 'notifications',
    label: 'notifications',
    icon: <NotificationsIcon />,
    path: '/notifications',
    badge: user?.unread_notifications || 0,
  },
   {
    id: 'stock',
    label: 'stock',
    icon: <InventoryIcon />,
    children: [
      { id: 'stock-list', label: 'stock-list', icon: <ListIcon />, path: '/stock' },
      { id: 'stock-new', label: 'stock-new', icon: <AddBoxIcon />, path: '/stock/new' },
    ],
  },
  {
    id: 'fournisseurs',
    label: 'fournisseurs',
    icon: <PeopleIcon />,
    path: '/appro/fournisseurs',
    children: [
      { id: 'fournisseurs-list', label: 'fournisseurs-list', icon: <ListIcon />, path: '/appro/fournisseurs' },
      { id: 'bon-achat', label: 'bon-achat', icon: <ReceiptIcon />, path: '/appro/bon-achat' },
    ],
  },
  {
    id: 'commandes_appro',
    label: 'orders',
    icon: <ShoppingCartIcon />,
    path: '/orders',
  },
  {
    id: 'livraisons',
    label: 'deliveries',
    icon: <LocalShippingIcon />,
    children: [
      { id: 'appro-livraisons-list', label: 'Suivi des livraisons', icon: <ListIcon />, path: '/stock-movements' },  // Changé ici
    ],
  },
   {
    id: 'facturation',
    label: 'facturation',
    icon: <ReceiptIcon />,
    children: [
      { id: 'facturation-list', label: 'facturation-list', icon: <ListIcon />, path: '/facturation' },
      { id: 'facturation-new', label: 'facturation-new', icon: <AddBoxIcon />, path: '/facturation/new' },
    ],
  },
  
  {
    id: 'history',
    label: 'history',
    icon: <HistoryIcon />,
    path: '/history',
  },
  {
    id: 'profile',
    label: 'profile',
    icon: <PersonIcon />,
    path: '/profile',
  },
  {
    id: 'settings',
    label: 'settings',
    icon: <SettingsIcon />,
    path: '/settings',
  },
  {
    id: 'deconnexion',
    label: 'deconnexion',
    icon: <LogoutIcon />,
    action: handleLogout,
  },
];
  // Configuration pour Admin (Admin Panel et Employés avant Historique)
const adminMenus = [
  // 1. Dashboard
  {
    id: 'dashboard',
    label: 'dashboard',
    icon: <DashboardIcon />,
    path: '/admin_dashboard',
  },
 
  // 4. Mes Alertes
  {
    id: 'alertes',
    label: 'alertes',
    icon: <FlashOnIcon />,
    path: '/alerts',
  },
  // 5. Notifications
  {
    id: 'notifications',
    label: 'notifications',
    icon: <NotificationsIcon />,
    path: '/notifications',
    badge: user?.unread_notifications || 0,
  },
  // 6. Stock
  {
    id: 'stock',
    label: 'stock',
    icon: <InventoryIcon />,
    children: [
      { id: 'stock-list', label: 'stock-list', icon: <ListIcon />, path: '/stock' },
      { id: 'stock-new', label: 'stock-new', icon: <AddBoxIcon />, path: '/stock/new' },
    ],
  },
  // 7. Mouvements
  {
    id: 'stockMovements',
    label: 'stockMovements',
    icon: <SwapHorizIcon />,
    children: [
      { id: 'movements-list', label: 'movements-list', icon: <ListIcon />, path: '/stock-movements' },
      { id: 'movements-new', label: 'movements-new', icon: <AddBoxIcon />, path: '/stock-movements/new' },
    ],
  },
  // 8. Commandes
  {
    id: 'orders',
    label: 'orders',
    icon: <ShoppingCartIcon />,
    children: [
      { id: 'orders-list', label: 'orders-list', icon: <ListIcon />, path: '/orders' },
      { id: 'orders-new', label: 'orders-new', icon: <AddBoxIcon />, path: '/orders/new' },
    ],
  },
  // 9. Catégories
  {
    id: 'categories',
    label: 'categories',
    icon: <CategoryIcon />,
    children: [
      { id: 'categories-list', label: 'categories-list', icon: <ListIcon />, path: '/categories' },
      { id: 'categories-new', label: 'categories-new', icon: <AddBoxIcon />, path: '/categories/new' },
    ],
  },
  // 10. Fournisseurs
  {
    id: 'fournisseurs',
    label: 'fournisseurs',
    icon: <PeopleIcon />,
    children: [
      { id: 'fournisseur-list', label: 'fournisseur-list', icon: <ListIcon />, path: '/fournisseur' },
      { id: 'fournisseur-new', label: 'fournisseur-new', icon: <AddBoxIcon />, path: '/fournisseur/new' },
      { id: 'bon-achat-list', label: 'bon-achat', icon: <ReceiptIcon />, path: '/appro/bon-achat/demande' },
    ],
  },
  // 11. Entrepôts
  {
    id: 'entrepots',
    label: 'Entrepôts',
    icon: <WarehouseIcon />,
    children: [
      { id: 'entrepot-list', label: 'Liste des entrepôts', icon: <ListIcon />, path: '/entrepots' },
      { id: 'entrepot-new', label: 'Nouvel entrepôt', icon: <AddWarehouseIcon />, path: '/entrepots/new' },
    ],
  },
  // 12. Facturation
  {
    id: 'facturation',
    label: 'facturation',
    icon: <ReceiptIcon />,
    children: [
      { id: 'facturation-list', label: 'facturation-list', icon: <ListIcon />, path: '/facturation' },
      { id: 'facturation-new', label: 'facturation-new', icon: <AddBoxIcon />, path: '/facturation/new' },
    ],
  },
  // 13. ERP Modules
  {
    id: 'modules',
    label: 'modules',
    icon: <StorageIcon />,
    path: '/modulesERP',
  },
   // 2. Admin Panel (juste après Dashboard)
   {
    id: 'admin_panel',
    label: 'admin_panel',
    icon: <AdminIcon />,
    path: '/admin_panel',
  },
  // 3. Employés (avec seulement Demandes et Ajouter, PAS Liste)
  {
    id: 'employees',
    label: 'employees',
    icon: <PeopleIcon />,
    children: [
      { id: 'employees-requests', label: 'employees-requests', icon: <PersonAddIcon />, path: '/employes_requests' },
      { id: 'employees-new', label: 'employees-new', icon: <AddBoxIcon />, path: '/employees/new' },
    ],
  },
  // 14. Historique
  {
    id: 'history',
    label: 'history',
    icon: <HistoryIcon />,
    path: '/history',
  },
  // 15. Mon Profil
  {
    id: 'profile',
    label: 'profile',
    icon: <PersonIcon />,
    path: '/profile',
  },
  // 16. Paramètres
  {
    id: 'settings',
    label: 'settings',
    icon: <SettingsIcon />,
    path: '/settings',
  },
  // 17. Déconnexion
  {
    id: 'deconnexion',
    label: 'deconnexion',
    icon: <LogoutIcon />,
    action: handleLogout,
  },
];

  // Configuration pour autres responsables
  const otherMenus = stockManagerMenus.map(m => {
    if (m.id === 'dashboard') {
      return { ...m, path: '/dashboard' };
    }
    return m;
  });

  // Fonction pour filtrer les menus en fonction des authorized_pages
  const filterMenusByAuthorizedPages = (menus, authorizedPages) => {
    if (!Array.isArray(authorizedPages) || authorizedPages.length === 0) {
      return menus;
    }

    const slugToMenuMap = {
      'dashboard': 'dashboard',
      'alertes': 'alertes',
      'notifications': 'notifications',
      'stock': 'stock',
      'stockMovements': 'stockMovements',
      'orders': 'orders',
      'fournisseurs': 'fournisseurs',
      'categories': 'categories',
      'entrepots': 'entrepots',
      'facturation': 'facturation',
      'modules': 'modules',
      'history': 'history',
      'profile': 'profile',
      'settings': 'settings',
      'admin': 'admin_panel',
      'employees': 'employees',
      // Enfants des menus (mapping vers leurs pages parents)
      'fournisseurs-list': 'fournisseurs',
      'bon-achat': 'orders',
      'stock-list': 'stock',
      'stock-new': 'stock',
      'movements-list': 'stockMovements',
      'movements-new': 'stockMovements',
      'orders-list': 'orders',
      'orders-new': 'orders',
      'categories-list': 'categories',
      'categories-new': 'categories',
      'fournisseur-list': 'fournisseurs',
      'fournisseur-new': 'fournisseurs',
      'bon-achat-list': 'orders',
      'entrepot-list': 'entrepots',
      'entrepot-new': 'entrepots',
      'facturation-list': 'facturation',
      'facturation-new': 'facturation',
      'employees-requests': 'employees',
      'employees-new': 'employees',
      'appro-livraisons-list': 'stockMovements',
    };

    return menus.filter(menu => {
      // Les éléments sans pages associées (logout) sont toujours affichés
      if (!menu.path && !menu.children && menu.action) {
        return true;
      }

      const menuPageId = slugToMenuMap[menu.id];
      
      // Si le menu est dans authorizedPages, l'afficher
      if (authorizedPages.includes(menu.id) || (menuPageId && authorizedPages.includes(menuPageId))) {
        return true;
      }

      // Montrer le menu si au moins un enfant est autorisé
      if (menu.children) {
        const hasAuthorizedChildren = menu.children.some(child => {
          const childPageId = slugToMenuMap[child.id];
          return authorizedPages.includes(child.id) || (childPageId && authorizedPages.includes(childPageId));
        });
        return hasAuthorizedChildren;
      }

      return false;
    }).map(menu => {
      // Filtrer aussi les enfants
      if (menu.children) {
        return {
          ...menu,
          children: menu.children.filter(child => {
            const childPageId = slugToMenuMap[child.id];
            return authorizedPages.includes(child.id) || (childPageId && authorizedPages.includes(childPageId));
          })
        };
      }
      return menu;
    });
  };

  // Sélectionner les menus selon le rôle
  const menuGroups = useMemo(() => {
    let baseMenus;
    if (isApproManager) {
      baseMenus = approManagerMenus;
    } else if (isAdmin) {
      baseMenus = adminMenus;
    } else if (isStockManager) {
      baseMenus = stockManagerMenus;
    } else {
      baseMenus = otherMenus;
    }

    // Appliquer le filtrage pour les rôles avec authorized_pages
    const authorizedPages = Array.isArray(user?.authorized_pages) ? user.authorized_pages : [];
    if ((isStockManager || isApproManager) && authorizedPages.length > 0) {
      return filterMenusByAuthorizedPages(baseMenus, authorizedPages);
    }

    return baseMenus;
  }, [isAdmin, isStockManager, isApproManager, user?.authorized_pages]);

  useEffect(() => {
    console.log('=== DEBUG SIDEBAR ===');
    console.log('User:', user);
    console.log('user?.role:', user?.role);
    console.log('user?.authorized_pages:', user?.authorized_pages);
    console.log('isStockManager:', isStockManager);
    console.log('isApproManager:', isApproManager);
    console.log('isAdmin:', isAdmin);
    console.log('Menu groups length:', menuGroups.length);
    console.log('Menu IDs:', menuGroups.map((g) => g.id));
  }, [user, isStockManager, isAdmin, menuGroups, isApproManager]);

  const parsePathWithQuery = (path) => {
    const [pathname, query = ''] = String(path || '').split('?');
    return { pathname, query: query ? `?${query}` : '' };
  };

  const isChildActive = (path) => {
    const { pathname, query } = parsePathWithQuery(path);
    if (location.pathname !== pathname) return false;
    if (!query) return !location.search || location.search === '?materialType=all';
    return location.search === query;
  };

  const isGroupActive = (group) => {
    if (group.path) {
      const { pathname } = parsePathWithQuery(group.path);
      return location.pathname === pathname;
    }
    if (group.children) {
      return group.children.some((c) => {
        const { pathname, query } = parsePathWithQuery(c.path);
        if (!query) return location.pathname === pathname || location.pathname.startsWith(pathname + '/');
        return location.pathname === pathname && location.search === query;
      });
    }
    return false;
  };

  // Bottom nav items for mobile
  const bottomNavItems = isApproManager ? [
    { label: 'dashboard', icon: <DashboardIcon />, path: '/appro-dashboard' },
    { label: 'fournisseurs', icon: <PeopleIcon />, path: '/appro/fournisseurs' },
    { label: 'alertes', icon: <FlashOnIcon />, path: '/alerts' },
    { label: 'notifications', icon: <NotificationsIcon />, path: '/notifications', badge: user?.unread_notifications || 0 },
    { label: 'plus', icon: <MenuIcon />, openDrawer: true },
  ] : isStockManager ? [
    { label: 'dashboard', icon: <DashboardIcon />, path: '/stock-dashboard' },
    { label: 'stock', icon: <InventoryIcon />, path: '/stock' },
    { label: 'alertes', icon: <FlashOnIcon />, path: '/alerts' },
    { label: 'notifications', icon: <NotificationsIcon />, path: '/notifications', badge: user?.unread_notifications || 0 },
    { label: 'plus', icon: <MenuIcon />, openDrawer: true },
  ] : (isAdmin ? [
    { label: 'dashboard', icon: <DashboardIcon />, path: '/admin_dashboard' },
    { label: 'adminShort', icon: <AdminIcon />, path: '/admin_panel' },
    { label: 'employees', icon: <PeopleIcon />, path: '/employees' },
    { label: 'alertes', icon: <FlashOnIcon />, path: '/alerts' },
    { label: 'plus', icon: <MenuIcon />, openDrawer: true },
  ] : [
    { label: 'dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'stock', icon: <InventoryIcon />, path: '/stock' },
    { label: 'alertes', icon: <FlashOnIcon />, path: '/alerts' },
    { label: 'notifications', icon: <NotificationsIcon />, path: '/notifications', badge: user?.unread_notifications || 0 },
    { label: 'plus', icon: <MenuIcon />, openDrawer: true },
  ]);

  const [bottomNavValue, setBottomNavValue] = useState(() => {
    const activeItem = bottomNavItems.findIndex(item => item.path && location.pathname.startsWith(item.path));
    return activeItem !== -1 ? activeItem : 0;
  });

  const handleBottomNavChange = (event, newValue) => {
    setBottomNavValue(newValue);
    const item = bottomNavItems[newValue];
    if (item.openDrawer) {
      if (onMobileClose) onMobileClose();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'black', borderRight: '1px solid rgba(59,130,246,0.1)', position: 'relative' }}>
      {/* Logo */}
      <Box sx={{ p: isMobile ? 1.5 : 2.5, borderBottom: '1px solid rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'flex-start', gap: isMobile ? 1 : 1.5, position: 'relative', zIndex: 1 }}>
        <Box sx={{ width: isMobile ? 40 : (sidebarCollapsed ? 40 : 50), height: isMobile ? 40 : (sidebarCollapsed ? 40 : 50), borderRadius: '50%', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          <img src={notif} alt="Logo" width={isMobile ? "60" : (sidebarCollapsed ? "60" : "80")} height={isMobile ? "60" : (sidebarCollapsed ? "60" : "80")} />
        </Box>
        {(!sidebarCollapsed || isMobile) && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: isMobile ? '1rem' : '1.25rem', color: 'white', lineHeight: 1 }}>
              SmartNotify
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: isMobile ? '0.6rem' : '0.7rem', letterSpacing: '0.5px' }}>
              {isAdmin ? t('adminMode') : isStockManager ? t('stockMode') : isApproManager ? t('approMode') : t('userMode')}
            </Typography>
          

          </Box>
        )}
      </Box>

      {/* Menu */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: isMobile ? 1 : 2, px: isMobile ? 1.5 : 2, scrollbarWidth: 'none', msOverflowStyle: 'none', '&::-webkit-scrollbar': { display: 'none' }, position: 'relative', zIndex: 1 }}>
        {menuGroups.map((group) => {
          const active = isGroupActive(group);
          const isOpen = openMenus[group.id];
          const hasChildren = Boolean(group.children?.length);

          return (
            <Box key={group.id} sx={{ mb: 0.5 }}>
              <Box
                onClick={() => {
                  if (hasChildren) toggleMenu(group.id);
                  else if (group.action) group.action();
                  else handleNav(group.path);
                }}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'space-between',
                  px: isMobile ? 1.5 : (sidebarCollapsed ? 1.5 : 2), py: isMobile ? 0.7 : 1, borderRadius: 2, cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  bgcolor: active && !hasChildren ? 'rgba(59,130,246,0.15)' : 'transparent',
                  '&:hover': { bgcolor: active && !hasChildren ? '#3B82F633' : 'rgba(59,130,246,0.08)' },
                  position: 'relative',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 1.5 }}>
                  <Box sx={{
                    color: active ? '#3b82f6' : isOpen && hasChildren ? '#3b82f6' : '#64748b',
                    display: 'flex', alignItems: 'center',
                    '& svg': { fontSize: isMobile ? 18 : 20 },
                  }}>
                    {group.icon}
                  </Box>
                  {(!sidebarCollapsed || isMobile) && (
                    <Typography sx={{
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      fontWeight: active || (hasChildren && isOpen) ? 600 : 400,
                      color: active ? '#60a5fa' : hasChildren && isOpen ? '#60a5fa' : '#94a3b8',
                    }}>
                      {t(group.label)}
                    </Typography>
                  )}
                </Box>

                {(!sidebarCollapsed || isMobile) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {group.badge > 0 && (
                      <Box sx={{ bgcolor: '#ef4444', color: 'white', fontSize: isMobile ? '0.6rem' : '0.7rem', fontWeight: 600, px: 0.75, py: 0.25, borderRadius: 2, minWidth: isMobile ? 16 : 20, textAlign: 'center' }}>
                        {group.badge}
                      </Box>
                    )}
                    {hasChildren && (
                      <Box sx={{
                        color: '#64748b', display: 'flex',
                        transition: 'transform 0.2s ease',
                        transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                        '& svg': { fontSize: isMobile ? 16 : 18 },
                      }}>
                        <ExpandMoreIcon />
                      </Box>
                    )}
                  </Box>
                )}
                {sidebarCollapsed && !isMobile && group.badge > 0 && (
                  <Box sx={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, bgcolor: '#ef4444', borderRadius: '50%', boxShadow: '0 0 6px rgba(239,68,68,0.6)' }} />
                )}
              </Box>

              {hasChildren && !sidebarCollapsed && (
                <Collapse in={isOpen} timeout={200}>
                  <Box sx={{ ml: isMobile ? 1 : 2, pl: isMobile ? 1 : 1.5, borderLeft: '1px solid rgba(59,130,246,0.18)', mt: 0.3, mb: 0.5 }}>
                    {group.children.map((child) => {
                      const childActive = isChildActive(child.path);
                      return (
                        <Box
                          key={child.id}
                          onClick={() => handleNav(child.path)}
                          sx={{
                            display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 1.5,
                            px: isMobile ? 1 : 1.5, py: isMobile ? 0.5 : 0.7, mb: 0.2, borderRadius: '8px', cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            bgcolor: childActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                            '&:hover': { bgcolor: childActive ? '#3B82F62E' : 'rgba(59,130,246,0.05)' },
                          }}
                        >
                          <Box sx={{ color: childActive ? '#3b82f6' : '#64748b', display: 'flex', '& svg': { fontSize: isMobile ? 13 : 15 } }}>
                            {child.icon}
                          </Box>
                          <Typography sx={{
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            fontWeight: childActive ? 600 : 400,
                            color: childActive ? '#60a5fa' : '#94a3b8',
                          }}>
                            {t(child.label)}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Collapse>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Footer */}
      {(!sidebarCollapsed || isMobile) && (
        <Box sx={{ p: isMobile ? 1.5 : 2, m: isMobile ? 1 : 2, bgcolor: 'rgba(16,185,129,0.1)', borderRadius: 2, border: '1px solid rgba(16,185,129,0.2)', position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.75 : 1 }}>
            <Box sx={{ width: isMobile ? 6 : 8, height: isMobile ? 6 : 8, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.5)', flexShrink: 0 }} />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', fontSize: isMobile ? '0.7rem' : '0.85rem', color: '#10b981' }}>
{t('System Active')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: isMobile ? '0.65rem' : '0.75rem' }}>
                {isStockManager ? t('stockMode') : isAdmin ? t('adminMode') : isApproManager ? t('approMode') : t('userMode')}
              </Typography>
            </Box>
              {(!sidebarCollapsed || isMobile) && (
              <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
                  sx={{
                    p: 0.5,
                    borderRadius: 1,
                    cursor: 'pointer',
                    bgcolor: 'rgba(59,130,246,0.15)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(59,130,246,0.25)',
                      transform: 'scale(1.05)'
                    },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 32,
                    height: 32
                  }}
                  title={language === 'fr' ? t('fr') : t('en')}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#3b82f6' }}>
                    {language === 'fr' ? 'FR' : 'EN'}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      )}
      {sidebarCollapsed && !isMobile && (
        <Box sx={{ p: 2, m: 2, display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
        </Box>
      )}
    </Box>
  );

  return (
    <>
      {/* Desktop */}
      {!isMobile && (
        <Box sx={{ width: drawerWidth, flexShrink: 0, position: 'relative' }}>
          <Box sx={{
            width: drawerWidth, height: '100vh', position: 'fixed', left: 0, top: 0,
            bgcolor: 'black', borderRight: '1px solid rgba(59,130,246,0.1)',
            overflowY: 'auto', overflowX: 'hidden', zIndex: 1200,
            transition: 'width 0.3s ease',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}>
            {drawerContent}
          </Box>
          
          <Box
            onClick={toggleSidebar}
            sx={{
              position: 'fixed',
              left: sidebarCollapsed ? collapsedWidth - 20 : drawerWidth - 20,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: '#3b82f6',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 1300,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: '#2563eb',
                boxShadow: '0 6px 16px rgba(59, 130, 246, 0.6)',
                transform: 'translateY(-50%) scale(1.1)',
              },
            }}
          >
            {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </Box>
        </Box>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer variant="temporary" open={mobileOpen} onClose={onMobileClose}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth, 
              boxSizing: 'border-box', 
              border: 'none', 
              bgcolor: 'black',
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1300,
            bgcolor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(59, 130, 246, 0.2)',
            boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)',
          }}
          elevation={3}
        >
          <BottomNavigation
            value={bottomNavValue}
            onChange={handleBottomNavChange}
            showLabels
            sx={{
              bgcolor: 'transparent',
              height: 65,
              '& .MuiBottomNavigationAction-root': {
                color: '#64748b',
                minWidth: 'auto',
                padding: '6px 12px',
                '&.Mui-selected': {
                  color: '#3b82f6',
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  },
                },
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.65rem',
                  marginTop: '4px',
                },
              },
            }}
          >
            {bottomNavItems.map((item, index) => (
              <BottomNavigationAction
                key={index}
                label={t(item.label)}
                icon={
                  item.badge > 0 ? (
                    <Badge
                      badgeContent={item.badge}
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.6rem',
                          height: 16,
                          minWidth: 16,
                          padding: '0 4px',
                        },
                      }}
                    >
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )
                }
                sx={{
                  '& .MuiSvgIcon-root': {
                    fontSize: 24,
                  },
                }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </>
  );
};

export default SharedSidebar;
