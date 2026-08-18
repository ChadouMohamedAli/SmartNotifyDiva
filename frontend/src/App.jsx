import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Container, Box } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ActivityProvider } from './context/ActivityContext';
import { LanguageProvider } from './context/LanguageContext';
import './i18n';
import PrivateRoute from './components/PrivateRoute';
import RequirePageAccess from './components/RequirePageAccess';
import VerificationPending from './pages/auth/VerificationPending';
import LoginOtpVerification from './pages/auth/LoginOtpVerification';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import GoogleCallback from './pages/auth/GoogleCallback';
import TelegramLoginPage from './pages/auth/TelegramLoginPage';
import ForgotPassword from './pages/profile/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ChangePassword from './pages/profile/ChangePassword';
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/profile/profile';
import EditProfile from './pages/profile/editProfile';
import ModulesERP from './pages/ModulesERP';
import Notifications from './pages/Notifications';
import DashboardStock from './pages/stock/Stock';
import StockMovements from './pages/stock/StockMovements';
import Orders from './pages/orders/Orders';
import NewOrder from './pages/orders/NewOrder';
import NewAlert from './pages/alerts/NewAlert';
import Fournisseur from './pages/stock/fournisseur';
import Categories from './pages/stock/categories';
import Entrepots from './pages/stock/Entrepots';
import Facturation from './pages/stock/Facturation';
import Production from './pages/production/Production';
import MatierePremiere from './pages/production/MatierePremiere';
import OrdreProduction from './pages/production/OrdreProduction';
import ProduitFini from './pages/production/ProduitFini';
import History from './pages/History';
import AlertRules from './pages/alerts/AlertRules';
import EditAlert from './pages/alerts/EditAlert';
import Settings from './pages/Settings';
import SharedSidebar from './components/SharedSidebar';
import Aurora from './components/Aurora/Aurora';
// IMPORTANT: Utilisez AdminPanel (qui vient de adminpaneau.jsx)
import AdminPanel from './pages/dashboard/adminpaneau';
import AdminDashboard from './pages/dashboard/adminDashboard';
import StockManagerDashboard from './pages/dashboard/StockManagerDashboard';
import ApproManagerDashboard from './pages/dashboard/ApproManagerDashboard';
import ClientsRequests from './pages/employes_requests';
import EmployeesNew from './pages/EmployeesNew';

// Pages pour le responsable approvisionnement
import ApproFournisseurs from './pages/appro/ApproFournisseurs';
import FournisseurTable from "./pages/appro/FournisseurTable";
import BonAchat from "./pages/appro/BonAchat";
import BonAchatForm from "./pages/appro/BonAchatForm";
import BonAchatDemande from "./pages/appro/BonAchatDemande";
import ApproOrders from './pages/appro/ApproOrders';
import ApproAlertes from './pages/appro/ApproAlertes';


const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  components: {
    MuiSelect: {
      defaultProps: {
        MenuProps: {
          PaperProps: {
            sx: {
              bgcolor: '#3B82F633',
              border: '1px solid #3B82F633',
              borderRadius: '10px',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              '& .MuiMenuItem-root': {
                color: '#ffffff',
              },
              '& .MuiMenuItem-root.Mui-disabled': {
                color: '#94a3b8',
                opacity: 1,
              },
              '& .MuiTypography-root': {
                color: 'inherit',
              },
            },
          },
        },
      },
      styleOverrides: {
        select: {
          color: '#f1f5f9',
        },
        icon: {
          color: '#94a3b8',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: '#ffffff',
          '&.Mui-disabled': {
            color: '#94a3b8',
            opacity: 1,
          },
        },
      },
    },
  },
});

const DebugApp = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    console.log(' DEBUG APP - User:', user);
    if (user) {
      console.log('is_superuser:', user.is_superuser);
      console.log('is_primary_admin:', user.is_primary_admin);
      console.log('is_staff:', user.is_staff);
    }
  }, [user]);
  
  return null;
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LanguageProvider>
        <AuthProvider>
          <ActivityProvider>
            <DebugApp />
            <Router>
              <InnerRoutes />
            </Router>
          </ActivityProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );

};

const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.is_active) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.is_superuser || user.is_staff;
  if (isAdmin) return <Navigate to="/admin_dashboard" replace />;
  if (user.role === 'responsable_stock') return <Navigate to="/stock-dashboard" replace />;
  if (user.role === 'responsable_appro') return <Navigate to="/appro-dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

const RequireAdmin = ({ children }) => {
  const { user } = useAuth();
  const isAdmin = user?.is_superuser || user?.is_staff;

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const RequireSuperAdmin = ({ children }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.is_superuser || user?.is_staff || user?.role === 'super_admin';

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};


const RequireUser = ({ children }) => {
  const { user } = useAuth();
  const isAdmin = user?.is_superuser || user?.is_staff;

  if (isAdmin) {
    return <Navigate to="/admin_dashboard" replace />;
  }

  // Responsable stock has their own dashboard
  if (user?.role === 'responsable_stock' && window.location.pathname === '/dashboard') {
    return <Navigate to="/stock-dashboard" replace />;
  }
  if (user?.role === 'responsable_appro' && window.location.pathname === '/dashboard') {
    return <Navigate to="/appro-dashboard" replace />;
  }

  return children;
};

/** Accès au tableau de bord stock : uniquement le rôle responsable_stock */
const RequireStockManager = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'responsable_stock') {
    return children;
  }
  const isAdmin = user?.is_superuser || user?.is_staff;
  if (isAdmin) {
    return <Navigate to="/admin_dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

/** Accès au tableau de bord appro : uniquement le rôle responsable_appro */
const RequireApproManager = ({ children }) => {
    const { user } = useAuth();
    if (user?.role === 'responsable_appro') {
        return children;
    }
    const isAdmin = user?.is_superuser || user?.is_staff;
    if (isAdmin) {
        return <Navigate to="/admin_dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
};

const RequireApproOrAdmin = ({ children }) => {
  const { user } = useAuth();
  const isAdmin = user?.is_superuser || user?.is_staff;

  if (user?.role === 'responsable_appro' || isAdmin) {
    return children;
  }

  if (user?.role === 'responsable_stock') {
    return <Navigate to="/stock-dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

const InnerRoutes = () => {
  const location = useLocation();
  const authPaths = ['/login', '/register', '/forgot-password'];
  const isAuthPage = authPaths.includes(location.pathname);

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', bgcolor: 'black' }}>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.28,
        }}
      >
        <Aurora
          colorStops={['#66a1ff', '#B19EEF', '#5227FF']}
          blend={0.5}
          amplitude={1.0}
          speed={1}
        />
      </Box>

      <Container
        maxWidth={false}
        disableGutters={true}
        sx={{
          mt: 0,
          mb: 0,
          p: 0,
          pl: 0,
          ml: 0,
          width: '100%',
          maxWidth: '100%',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<Login />} />
        <Route path="/login-otp" element={<LoginOtpVerification />} />
        <Route path="/register" element={<Register />} />
        <Route path="/telegram-login" element={<TelegramLoginPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/verification-pending" element={<VerificationPending />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
        <Route path="/change-password" element={
          <PrivateRoute>
            <ChangePassword />
          </PrivateRoute>
        } />
        
        {/* Route racine */}
        <Route path="/" element={<RoleBasedRedirect />} />

        {/* Routes protégées - Dashboard utilisateur */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <RequireUser>
              <Dashboard />
            </RequireUser>
          </PrivateRoute>
        } />
        {/* Dashboard Responsable Stock */}
        <Route path="/stock-dashboard" element={
          <PrivateRoute>
            <RequireStockManager>
              <StockManagerDashboard />
            </RequireStockManager>
          </PrivateRoute>
        } />
        {/* Dashboard Responsable Approvisionnement */}
        <Route path="/appro-dashboard" element={
            <PrivateRoute>
                <RequireApproManager>
                    <ApproManagerDashboard />
                </RequireApproManager>
            </PrivateRoute>
        } />
        {/* Routes admin */}
        <Route path="/admin_panel" element={
          <PrivateRoute>
            <RequireAdmin>
              <AdminPanel />
            </RequireAdmin>
          </PrivateRoute>
        } />

        {/* Autres routes */}
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />

        <Route path="/edit_profile" element={
          <PrivateRoute>
            <EditProfile />
          </PrivateRoute>
        } />
  
        <Route path="/modulesERP" element={
          <PrivateRoute>
            <ModulesERP />
          </PrivateRoute>
        } />

        <Route path="/notifications" element={
          <PrivateRoute>
            <Notifications />
          </PrivateRoute>
        } />

        {/* Route pour le dashboard stock */}
        <Route path="/stock" element={
          <PrivateRoute>
            <DashboardStock />
          </PrivateRoute>
        } />
        <Route path="/stock/new" element={
          <PrivateRoute>
            <DashboardStock />
          </PrivateRoute>
        } />
        {/* Route pour l'historique des mouvements de stock */}
        <Route path="/stock-movements" element={
          <PrivateRoute>
            <StockMovements />
          </PrivateRoute>
        } />
        <Route path="/stock-movements/new" element={
          <PrivateRoute>
            <StockMovements />
          </PrivateRoute>
        } />
        
        {/* Route pour les commandes */}
        <Route path="/orders" element={
          <PrivateRoute>
            <Orders />
          </PrivateRoute>
        } />
        <Route path="/orders/new" element={
          <PrivateRoute>
            <NewOrder />
          </PrivateRoute>
        } />
        {/* Route pour le dashboard stock */}
        <Route path="/fournisseur" element={
          <PrivateRoute>
            <Fournisseur />
          </PrivateRoute>
        } />
          <Route path="/fournisseur/new" element={
          <PrivateRoute>
            <Fournisseur />
          </PrivateRoute>
        } />
        <Route path="/categories" element={
          <PrivateRoute>
            <Categories />
          </PrivateRoute>
        } />
        <Route path="/categories/new" element={
          <PrivateRoute>
            <Categories />
          </PrivateRoute>
        } />
        <Route path="/entrepots" element={
          <PrivateRoute>
            <Entrepots />
          </PrivateRoute>
        } />
        <Route path="/entrepots/new" element={
          <PrivateRoute>
            <Entrepots />
          </PrivateRoute>
        } />
        {/* Route pour la facturation */}
        <Route path="/facturation" element={
          <PrivateRoute>
            <Facturation />
          </PrivateRoute>
        } />
        <Route path="/facturation/new" element={
          <PrivateRoute>
            <Facturation />
          </PrivateRoute>
        } />
      
       
        {/* Route pour créer une Nouvelle alerte */}
        <Route path="/new-alert" element={
          <PrivateRoute>
            <NewAlert />
          </PrivateRoute>
        } />

        {/* Route pour éditer une alerte */}
        <Route path="/edit-alert/:id" element={
          <PrivateRoute>
            <EditAlert />
          </PrivateRoute>
        } />

<Route path="/employes_requests" element={
  <PrivateRoute>
    <RequireAdmin>
      <ClientsRequests />
    </RequireAdmin>
  </PrivateRoute>
} />

        <Route path="/employees/new" element={
          <PrivateRoute>
            <RequireAdmin>
              <EmployeesNew />
            </RequireAdmin>
          </PrivateRoute>
        } />

        {/* Route pour les alertes - fonctionne pour admin et utilisateurs */}
        {/* Les alertes affichées varient selon le rôle de l'utilisateur */}
        <Route path="/alerts" element={
          <PrivateRoute>
            <AlertRules />
          </PrivateRoute>
        } />

        {/* Alias pour la compatibilité */}
        <Route path="/alert_rules" element={
          <PrivateRoute>
            <AlertRules />
          </PrivateRoute>
        } />

        {/* Dashboard admin (version graphiques) */}
        <Route path="/admin_dashboard" element={
          <PrivateRoute>
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          </PrivateRoute>
        } />

       

        <Route path="/settings" element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        } />

        <Route path="/history" element={
          <PrivateRoute>
            <History />
          </PrivateRoute>
        } />
{/* Routes pour Bon d'Achat */}
<Route path="/appro/bon-achat" element={
  <PrivateRoute>
    <RequireApproOrAdmin>
      <BonAchat />
    </RequireApproOrAdmin>
  </PrivateRoute>
} />
<Route path="/appro/bon-achat/demande" element={
  <PrivateRoute>
    <RequireSuperAdmin>
      <BonAchatDemande />
    </RequireSuperAdmin>
  </PrivateRoute>
} />
<Route path="/appro/bon-achat/new" element={
  <PrivateRoute>
    <RequireApproOrAdmin>
      <BonAchatForm />
    </RequireApproOrAdmin>
  </PrivateRoute>
} />

        {/* Routes pour Responsable Approvisionnement */}
<Route path="/appro/fournisseurs" element={
  <PrivateRoute>
    <RequireApproManager>
      <RequirePageAccess pageSlug="fournisseurs">
        <ApproFournisseurs />
      </RequirePageAccess>
    </RequireApproManager>
  </PrivateRoute>
} />
<Route path="/appro/fournisseurs/:familyKey" element={
  <PrivateRoute>
    <RequireApproManager>
      <RequirePageAccess pageSlug="fournisseurs">
        <FournisseurTable />
      </RequirePageAccess>
    </RequireApproManager>
  </PrivateRoute>
} />

   {/* Route pour les commandes */}
        <Route path="/orders" element={
          <PrivateRoute>
            <Orders />
          </PrivateRoute>
        } />

<Route path="/appro/alertes" element={
  <PrivateRoute>
    <RequireApproManager>
      <ApproAlertes />
    </RequireApproManager>
  </PrivateRoute>
} />


        {/* Route de fallback */}
        <Route path="*" element={<RoleBasedRedirect />} />
        </Routes>
      </Container>
    </Box>
  );
};

export default App;
