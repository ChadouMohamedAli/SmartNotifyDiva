import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Badge,
  Divider,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  TextField,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { CiFilter } from "react-icons/ci";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Email as EmailIcon,
  Telegram as TelegramIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
} from "@mui/icons-material";
import SharedSidebar from "../../components/SharedSidebar";
import NewAlert from "./NewAlert";
import EditAlert from "./EditAlert";

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const C = {
  bg: "#070b14",
  surface: "#0d1321",
  surfaceHi: "#111827",
  border: "#1e2d42",
  borderHi: "#2d4a6e",
  accent: "#3b82f6",
  accentDim: "rgba(59,130,246,0.12)",
  accentHi: "#60a5fa",
  success: "#10b981",
  successDim: "rgba(16,185,129,0.12)",
  danger: "#ef4444",
  dangerDim: "rgba(239,68,68,0.12)",
  warning: "#f59e0b",
  warningDim: "rgba(245,158,11,0.12)",
  info: "#8b5cf6",
  infoDim: "rgba(139,92,246,0.12)",
  text: "#f1f5f9",
  textMuted: "#64748b",
  textSub: "#94a3b8",
};

const MODULES = [
  { value: "stock", label: "Stock", color: "#3b82f6", icon: "📦" },
  { value: "crm", label: "CRM", color: "#8b5cf6", icon: "👥" },
  { value: "facturation", label: "Facturation", color: "#ec4899", icon: "💰" },
  { value: "rh", label: "Ressources Humaines", color: "#06b6d4", icon: "👤" },
  { value: "gmao", label: "GMAO", color: "#f59e0b", icon: "🔧" },
  { value: "gpao", label: "GPAO", color: "#f59e0b", icon: "⚙️" },
  { value: "fournisseur", label: "Fournisseurs", color: "#14b8a6", icon: "🏭" },
];

const SEVERITY_LEVELS = [
  { value: "critical", label: "Critique", color: "#ef4444" },
  { value: "high", label: "Haute", color: "#f97316" },
  { value: "medium", label: "Moyenne", color: "#eab308" },
  { value: "low", label: "Basse", color: "#10b981" },
];

const notificationChannels = [
  { value: 'email', label: 'Email', icon: EmailIcon, color: '#ef4444' },
  { value: 'in-app', label: 'In-App', icon: NotificationsIcon, color: '#3b82f6' },
  { value: 'telegram', label: 'Telegram', icon: TelegramIcon, color: '#26A5E4' },
];

const scheduleOptions = [
  { value: 'realtime', label: 'Temps réel', description: 'Vérification continue' },
  { value: 'hourly', label: 'Toutes les heures', description: 'Vérification horaire' },
  { value: 'daily', label: 'Quotidien', description: 'Une fois par jour' },
  { value: 'weekly', label: 'Hebdomadaire', description: 'Une fois par semaine' },
  { value: 'monthly', label: 'Mensuel', description: 'Une fois par mois' },
];

const FIELD_LABELS = {
  quantity: "Quantité",
  min_stock: "Seuil critique",
  threshold: "Seuil critique",
  stock_value: "Valeur du stock",
  replenishment_delay: "Délai réapprovisionnement",
  lead_score: "Score du lead",
  days_since_last_contact: "Jours depuis dernier contact",
  potential_value: "Valeur potentielle",
  status: "Statut",
  source: "Source",
  amount: "Montant",
  days_overdue: "Jours de retard",
  due_date: "Date d'échéance",
  invoice_status: "Statut facture",
  maintenance_due_date: "Date de maintenance",
  task_priority: "Priorité de la tâche",
  equipment_status: "Statut équipement",
  maintenance_cost: "Coût de maintenance",
  production_delay: "Délai de production",
  defect_rate: "Taux de défaut",
  raw_material_stock: "Stock matière première",
  machine_capacity: "Capacité machine",
  contract_end_date: "Date fin de contrat",
  leave_balance: "Solde de congés",
  absence_days: "Jours d'absence",
  certification_expiry: "Expiration certification",
  value: "Valeur",
  count: "Compteur",
};

const OPERATOR_LABELS = {
  eq: "=",
  neq: "≠",
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
  contains: "contient",
  greater_than: ">",
  less_than: "<",
  equal_to: "=",
  not_equal: "≠",
  greater_equal: "≥",
  less_equal: "≤",
};

const getSeverityColor = (severity) => {
  const found = SEVERITY_LEVELS.find(s => s.value === severity);
  return found ? found.color : C.textMuted;
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const safeDisplay = (v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try { return JSON.stringify(v); } catch { return String(v); }
};

const parseConditionData = (checkCondition) => {
  if (!checkCondition) return { logic: "AND", conditions: [] };
  try {
    const parsed = typeof checkCondition === "string" ? JSON.parse(checkCondition) : checkCondition;
    if (parsed && Array.isArray(parsed.conditions)) {
      return { logic: parsed.logic === "OR" ? "OR" : "AND", conditions: parsed.conditions };
    }
    if (Array.isArray(parsed)) return { logic: "AND", conditions: parsed };
    if (typeof parsed === "object" && parsed !== null && "field" in parsed) {
      return { logic: "AND", conditions: [parsed] };
    }
  } catch {
    return { logic: "AND", conditions: [], raw: safeDisplay(checkCondition) };
  }
  return { logic: "AND", conditions: [], raw: safeDisplay(checkCondition) };
};

const formatSingleCondition = (condition) => {
  const fieldLabel = FIELD_LABELS[condition?.field] || condition?.field || "Champ";
  const operatorLabel = OPERATOR_LABELS[condition?.operator] || condition?.operator || "=";
  const value = condition?.value === 0 ? "0" : condition?.value ? String(condition.value) : "—";
  return `${fieldLabel} ${operatorLabel} ${value}`;
};

const formatCondition = (checkCondition) => {
  if (!checkCondition) return "—";
  const parsed = parseConditionData(checkCondition);
  if (parsed.conditions.length > 0) {
    if (parsed.conditions.length === 1) return formatSingleCondition(parsed.conditions[0]);
    const logicLabel = parsed.logic === "OR" ? "OU" : "ET";
    return parsed.conditions.map(formatSingleCondition).join(` ${logicLabel} `);
  }
  if (parsed.raw && typeof parsed.raw === "string") {
    try {
      const single = JSON.parse(parsed.raw);
      if (single.field && single.operator) return formatSingleCondition(single);
    } catch { return parsed.raw; }
  }
  return safeDisplay(parsed.raw) || "—";
};

const formatConditionFromThresholdFields = (alert) => {
  const fieldKey = alert?.condition_field || alert?.conditionField;
  const opKey = alert?.comparison_operator || alert?.comparisonOperator;
  const threshold = alert?.threshold_value ?? alert?.thresholdValue;
  if (!fieldKey || !opKey || threshold === undefined || threshold === null || threshold === "") return "—";
  const fieldLabel = FIELD_LABELS[fieldKey] || fieldKey;
  const opLabel = OPERATOR_LABELS[opKey] || opKey;
  const valueTxt = threshold === 0 ? "0" : String(threshold);
  return `${fieldLabel} ${opLabel} ${valueTxt}`;
};

/* ─── StatCard ───────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, color, icon: Icon, onClick }) => {
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
        flex: 1, minWidth: 180,
        bgcolor: hexToRgba(color, 0.1),
        border: `1px solid ${hexToRgba(color, 0.2)}`,
        borderRadius: 3, transition: "all 0.3s ease",
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick ? { transform: "translateY(-4px)", boxShadow: `0 8px 24px ${hexToRgba(color, 0.2)}` } : {},
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
          <Typography variant="body2" sx={{ color: C.textMuted, fontSize: "0.75rem", fontWeight: 500 }}>
            {label}
          </Typography>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: hexToRgba(color, 0.15), display: "flex", alignItems: "center", justifyContent: "center" }}>
            {Icon && <Icon sx={{ color, fontSize: 18 }} />}
          </Box>
        </Box>
        <Typography variant="h3" sx={{ color: "white", fontWeight: 700, mb: 0.5 }}>{value}</Typography>
      </CardContent>
    </Card>
  );
};

/* ─── Filter menu helpers ────────────────────────────────────────────────── */
const SectionLabel = ({ icon, text }) => (
  <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
    <Box sx={{ color: C.accent, display: "flex", fontSize: 14 }}>{icon}</Box>
    <Typography variant="caption" sx={{ color: C.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.7rem" }}>
      {text}
    </Typography>
  </Box>
);

const FilterItem = ({ label, active, onClick }) => (
  <MenuItem
    onClick={onClick}
    sx={{
      px: 2, py: 0.8, fontSize: "0.875rem",
      color: active ? C.accent : C.textSub,
      bgcolor: active ? C.accentDim : "transparent",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      "&:hover": { bgcolor: "rgba(59, 130, 246, 0.3)", color: "white" },
    }}
  >
    {label}
    {active && <CheckCircleIcon sx={{ fontSize: 16, color: C.accent }} />}
  </MenuItem>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const Alerts = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { t } = useTranslation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [employeeAlerts, setEmployeeAlerts] = useState([]);
  const [activeAlertTab, setActiveAlertTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState(null);

  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filterModule, setFilterModule] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [page, setPage] = useState(0);
  const [empAlertPage, setEmpAlertPage] = useState(0);
  const ITEMS_PER_PAGE = 8;

  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    inAppEnabled: true,
    telegramEnabled: false,
    schedule: "realtime",
    emailAddresses: [],
    telegramChatId: "",
  });
  
  const [emailInput, setEmailInput] = useState("");

  const [notifStates, setNotifStates] = useState(() => {
    try {
      const saved = localStorage.getItem("alert_notif_states");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const filterOptions = {
    modules: [{ value: "all", label: t("All modules") }, ...MODULES],
    severities: [{ value: "all", label: t("All severities") }, ...SEVERITY_LEVELS],
    statuses: [
      { value: "all", label: t("All statuses") },
      { value: "active", label: t("Active") },
      { value: "paused", label: t("Paused") },
      { value: "inactive", label: t("Inactive") },
    ],
  };

  const activeFiltersCount =
    (filterModule !== "all" ? 1 : 0) +
    (filterSeverity !== "all" ? 1 : 0) +
    (filterStatus !== "all" ? 1 : 0);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  });

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const isAdmin = user?.is_superuser;
      
      if (isAdmin) {
        // For admins, fetch both sets of alerts from specific endpoints
        const myAlertsUrl = "http://localhost:8000/api/alerts/my_alerts/";
        const employeeAlertsUrl = "http://localhost:8000/api/alerts/employee_alerts/";

        const [myAlertsRes, employeeAlertsRes] = await Promise.all([
          fetch(myAlertsUrl, { headers: authHeaders() }),
          fetch(employeeAlertsUrl, { headers: authHeaders() })
        ]);

        if (!myAlertsRes.ok || !employeeAlertsRes.ok) {
          throw new Error('Failed to fetch one or more alert sets');
        }

        const myAlertsData = await myAlertsRes.json();
        const employeeAlertsData = await employeeAlertsRes.json();

        const myAlerts = Array.isArray(myAlertsData.results) ? myAlertsData.results : Array.isArray(myAlertsData) ? myAlertsData : [];
        const empAlerts = Array.isArray(employeeAlertsData.results) ? employeeAlertsData.results : Array.isArray(employeeAlertsData) ? employeeAlertsData : [];

        setAlerts(myAlerts);
        setEmployeeAlerts(empAlerts);

      } else {
        // For regular users, fetch just their alerts
        const url = "http://localhost:8000/api/alerts/";
        const res = await fetch(url, { headers: authHeaders() });
        if (!res.ok) throw new Error('Failed to fetch alerts');
        const data = await res.json();
        const userAlerts = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
        setAlerts(userAlerts);
        setEmployeeAlerts([]);
      }
    } catch (error) {
      setErrorMessage(error.message || "Erreur lors du chargement des alertes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchAlerts(); }, [user]);
  
  useEffect(() => { 
    setPage(0); 
    setEmpAlertPage(0);
  }, [searchTerm, filterModule, filterSeverity, filterStatus]);

  const handleDeleteAlert = async () => {
    if (!alertToDelete) return;
    try {
      const res = await fetch(`http://localhost:8000/api/alerts/${alertToDelete.id}/`, {
        method: "DELETE", headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      setSuccessMessage("Alerte supprimée avec succès");
      setDeleteDialogOpen(false);
      setAlertToDelete(null);
      fetchAlerts();
    } catch {
      setErrorMessage("Erreur lors de la suppression");
    }
  };

  const handleToggleStatus = async (alert) => {
    try {
      const res = await fetch(`http://localhost:8000/api/alerts/${alert.id}/toggle_status/`, {
        method: "POST", headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      fetchAlerts();
    } catch {
      setErrorMessage("Erreur lors du changement de statut");
    }
  };

  const handleTogglePause = async (alert) => {
    if (!alert.is_active) {
      setErrorMessage("Impossible de mettre en pause une alerte inactive. Activez-la d'abord.");
      return;
    }
    
    try {
      const newPausedState = !alert.is_paused;
      const res = await fetch(`http://localhost:8000/api/alerts/${alert.id}/`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ is_paused: newPausedState }),
      });
      if (!res.ok) throw new Error();
      fetchAlerts();
    } catch {
      setErrorMessage("Erreur lors du changement d'état de l'alerte");
    }
  };

  const handleToggleNotifications = (alert) => {
    const current = notifStates[alert.id] ?? alert.notifications_enabled ?? false;
    const newValue = !current;
    const updated = { ...notifStates, [alert.id]: newValue };
    setNotifStates(updated);
    try {
      localStorage.setItem("alert_notif_states", JSON.stringify(updated));
    } catch {}
  };

  const handleEditAlert = (alert) => {
    setSelectedAlert(alert);
    setEditModalOpen(true);
  };

  const handleSaveSettings = () => {
    localStorage.setItem("alert_settings", JSON.stringify(notificationSettings));
    setSuccessMessage(t("Settings saved successfully"));
  };

  const handleExportAlerts = () => {
    const dataToExport = activeAlertTab === 0 ? alerts : employeeAlerts;
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `alertes_${new Date().toISOString()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    setSuccessMessage(t("Alert export successful"));
  };

  const handleToggleChannel = (channel) => {
    if (channel === 'email') {
      setNotificationSettings({ ...notificationSettings, emailEnabled: !notificationSettings.emailEnabled });
    } else if (channel === 'in-app') {
      setNotificationSettings({ ...notificationSettings, inAppEnabled: !notificationSettings.inAppEnabled });
    } else if (channel === 'telegram') {
      setNotificationSettings({ ...notificationSettings, telegramEnabled: !notificationSettings.telegramEnabled });
    }
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const parseEmailList = (raw) =>
    raw
      .split(/[,;\n]/)
      .map((email) => email.trim())
      .filter(Boolean);

  const handleAddEmail = () => {
    const candidates = parseEmailList(emailInput);
    if (candidates.length === 0) return;

    const invalid = candidates.filter((email) => !isValidEmail(email));
    if (invalid.length > 0) {
      setErrorMessage(`Adresse(s) email invalide(s): ${invalid.join(", ")}`);
      return;
    }

    const merged = Array.from(
      new Set([...(notificationSettings.emailAddresses || []), ...candidates])
    );
    setNotificationSettings({ ...notificationSettings, emailAddresses: merged });
    setEmailInput("");
  };

  const handleRemoveEmail = (email) => {
    const next = (notificationSettings.emailAddresses || []).filter((item) => item !== email);
    setNotificationSettings({ ...notificationSettings, emailAddresses: next });
  };

  // Filtrer mes alertes
  const filteredAlerts = alerts
    .filter(a => filterModule === "all" || a.module === filterModule)
    .filter(a => filterSeverity === "all" || a.severity === filterSeverity)
    .filter(a => {
      if (filterStatus === "all") return true;
      if (filterStatus === "active") return a.is_active === true && a.is_paused !== true;
      if (filterStatus === "paused") return a.is_active === true && a.is_paused === true;
      if (filterStatus === "inactive") return a.is_active === false;
      return true;
    })
    .filter(a => {
      const q = searchTerm.toLowerCase();
      return !q || a.name.toLowerCase().includes(q) || (a.description && a.description.toLowerCase().includes(q));
    });

  // Filtrer les alertes des employés
  const filteredEmployeeAlerts = employeeAlerts
    .filter(a => filterModule === "all" || a.module === filterModule)
    .filter(a => filterSeverity === "all" || a.severity === filterSeverity)
    .filter(a => {
      if (filterStatus === "all") return true;
      if (filterStatus === "active") return a.is_active === true && a.is_paused !== true;
      if (filterStatus === "paused") return a.is_active === true && a.is_paused === true;
      if (filterStatus === "inactive") return a.is_active === false;
      return true;
    })
    .filter(a => {
      const q = searchTerm.toLowerCase();
      return !q || 
        a.name.toLowerCase().includes(q) || 
        (a.description && a.description.toLowerCase().includes(q)) ||
        (a.user?.username && a.user.username.toLowerCase().includes(q)) ||
        (a.user?.email && a.user.email.toLowerCase().includes(q)) ||
        (a.user_name && a.user_name.toLowerCase().includes(q));
    });

  const paginatedAlerts = filteredAlerts.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const paginatedEmployeeAlerts = filteredEmployeeAlerts.slice(empAlertPage * ITEMS_PER_PAGE, (empAlertPage + 1) * ITEMS_PER_PAGE);
  
  const totalPages = Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE);
  const empAlertTotalPages = Math.ceil(filteredEmployeeAlerts.length / ITEMS_PER_PAGE);

  // Statistiques
  const activeCount = alerts.filter(a => a.is_active === true && !a.is_paused).length;
  const pausedCount = alerts.filter(a => a.is_active === true && a.is_paused === true).length;
  const inactiveCount = alerts.filter(a => a.is_active === false).length;
  const criticalCount = alerts.filter(a => a.severity === "critical" && a.is_active === true && !a.is_paused).length;
  const employeeActiveCount = employeeAlerts.filter(a => a.is_active === true && !a.is_paused).length;
  const employeePausedCount = employeeAlerts.filter(a => a.is_active === true && a.is_paused === true).length;
  const employeeInactiveCount = employeeAlerts.filter(a => a.is_active === false).length;

  const isAdmin = user?.is_superuser;

  useEffect(() => {
    const savedSettings = localStorage.getItem("alert_settings");
    if (savedSettings) {
      try {
        setNotificationSettings(JSON.parse(savedSettings));
      } catch {}
    }
  }, []);

  if (!user) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", bgcolor: "black" }}>
        <CircularProgress sx={{ color: C.accent }} />
      </Box>
    );
  }

  const getStatusLabel = (alert) => {
    if (!alert.is_active) return { label: "Inactif", color: C.danger };
    if (alert.is_paused) return { label: "En pause", color: C.warning };
    return { label: "Actif", color: C.success };
  };

  const AlertsTable = ({ paginatedList, currentPage, setCurrentPage, totalPagesCount, isEmployeeView = false }) => (
    <>
      <TableContainer component={Box} sx={{ bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: C.surfaceHi }}>
              {[t("Rule"), isEmployeeView && t("User"), t("Module"), t("Priority"), t("Status"), t("Pause"), t("Notifications"), t("Condition"), t("Creation Date"), t("Actions")].filter(Boolean).map(h => (
                <TableCell key={h} sx={{ color: C.textMuted, fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", borderColor: C.border, py: "12px", px: 2 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedList.map((alert, index) => {
              const module = MODULES.find(m => m.value === alert.module);
              const severityColor = getSeverityColor(alert.severity);
              const notifOn = notifStates[alert.id] ?? alert.notifications_enabled ?? false;
              const status = getStatusLabel(alert);

              return (
                <TableRow
                  key={alert.id}
                  sx={{
                    bgcolor: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.012)",
                    "&:hover": { bgcolor: C.surfaceHi },
                    "& td": { borderColor: C.border, py: "14px", px: 2 },
                    opacity: alert.is_paused ? 0.7 : 1,
                  }}
                >
                  <TableCell>
                    <Typography sx={{ color: C.text, fontWeight: 600, fontSize: "0.9rem" }}>{alert.name}</Typography>
                    {alert.description && (
                      <Typography sx={{ color: C.textMuted, fontSize: "0.75rem", mt: 0.25, maxWidth: 300 }}>
                        {alert.description.length > 60 ? alert.description.substring(0, 60) + "..." : alert.description}
                      </Typography>
                    )}
                  </TableCell>

                  {isEmployeeView && (
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 14, color: C.textMuted }} />
                        <Box>
                          <Typography sx={{ color: C.text, fontSize: "0.8rem", fontWeight: 500 }}>
                            {alert.user?.username || alert.user_name || "—"}
                          </Typography>
                          {alert.user?.email && (
                            <Typography sx={{ color: C.textMuted, fontSize: "0.7rem" }}>
                              {alert.user.email}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                  )}

                  <TableCell>
                    <Chip label={module?.label || alert.module} size="small"
                      sx={{ height: 24, fontSize: "0.7rem", fontWeight: 600, bgcolor: `${module?.color || C.accent}20`, color: module?.color || C.accent, borderRadius: "6px" }} />
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={SEVERITY_LEVELS.find(s => s.value === alert.severity)?.label || alert.severity}
                      size="small"
                      sx={{ height: 24, fontSize: "0.7rem", fontWeight: 700, borderRadius: "6px", bgcolor: `${severityColor}20`, color: severityColor }}
                    />
                  </TableCell>

                  <TableCell>
                    <Tooltip title={alert.is_active ? "Désactiver" : "Activer"}>
                      <Box
                        onClick={() => handleToggleStatus(alert)}
                        sx={{
                          display: "inline-flex", alignItems: "center", px: 1.5, py: 0.5, borderRadius: "20px",
                          fontSize: "0.7rem", fontWeight: 700,
                          bgcolor: alert.is_active ? C.successDim : C.dangerDim,
                          color: alert.is_active ? C.success : C.danger,
                          border: `1px solid ${alert.is_active ? C.success : C.danger}`,
                          cursor: "pointer", transition: "all 0.2s ease",
                          "&:hover": { bgcolor: alert.is_active ? C.success : C.danger, color: "white" },
                        }}
                      >
                        {alert.is_active ? "Actif" : "Inactif"}
                      </Box>
                    </Tooltip>
                  </TableCell>

                  <TableCell>
                    <Tooltip title={alert.is_paused ? "Réactiver l'alerte" : "Mettre en pause l'alerte"}>
                      <Box
                        onClick={() => handleTogglePause(alert)}
                        sx={{
                          display: "inline-flex", alignItems: "center", px: 1.5, py: 0.5, borderRadius: "20px",
                          fontSize: "0.7rem", fontWeight: 700,
                          bgcolor: alert.is_paused ? C.warningDim : C.infoDim,
                          color: alert.is_paused ? C.warning : C.info,
                          border: `1px solid ${alert.is_paused ? C.warning : C.info}`,
                          cursor: alert.is_active ? "pointer" : "not-allowed",
                          opacity: alert.is_active ? 1 : 0.5,
                          transition: "all 0.2s ease",
                          "&:hover": alert.is_active ? { bgcolor: alert.is_paused ? C.warning : C.info, color: "white" } : {},
                        }}
                      >
                        {alert.is_paused ? "⏸ En pause" : "▶ Actif"}
                      </Box>
                    </Tooltip>
                  </TableCell>

                  <TableCell>
                    <Tooltip title={notifOn ? "Désactiver les notifications" : "Activer les notifications"}>
                      <Box
                        onClick={() => handleToggleNotifications(alert)}
                        sx={{
                          width: 56, height: 30, borderRadius: "15px",
                          bgcolor: notifOn ? "#4ade80" : C.border,
                          position: "relative", cursor: "pointer",
                          transition: "background-color 0.25s ease",
                          flexShrink: 0,
                          "&:hover": { opacity: 0.85 },
                        }}
                      >
                        <Box sx={{
                          width: 24, height: 24, borderRadius: "50%",
                          bgcolor: "white",
                          position: "absolute",
                          top: 3,
                          left: notifOn ? "calc(100% - 27px)" : 3,
                          transition: "left 0.25s ease",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                        }} />
                      </Box>
                    </Tooltip>
                  </TableCell>

                  <TableCell>
                    {(() => {
                      const parsedCondition = parseConditionData(alert.check_condition);
                      const tooltipContent = parsedCondition.conditions.length > 0 ? (
                        <Box sx={{ whiteSpace: "pre-wrap", p: 0.5 }}>
                          {parsedCondition.conditions.map((condition, conditionIndex) => (
                            <Box key={conditionIndex} sx={{ mb: conditionIndex === parsedCondition.conditions.length - 1 ? 0 : 0.5 }}>
                              {conditionIndex > 0 && (
                                <Box component="span" sx={{ color: C.accent, fontWeight: 700, mr: 0.75 }}>
                                  {parsedCondition.logic === "OR" ? "OU" : "ET"}
                                </Box>
                              )}
                              {formatSingleCondition(condition)}
                            </Box>
                          ))}
                        </Box>
                      ) : (parsedCondition.raw || "Aucune condition");

                      return (
                        <Tooltip title={tooltipContent} arrow>
                          <Typography
                            sx={{ color: alert.check_condition ? C.accent : C.textMuted, fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", "&:hover": { color: C.accentHi } }}
                          >
                            {(() => {
                              const check = alert?.check_condition;
                              const looksEmptyObject = check && typeof check === "object" && !Array.isArray(check) && Object.keys(check).length === 0;
                              const fromCheck = !looksEmptyObject ? formatCondition(check) : "—";
                              if (fromCheck && fromCheck !== "—") return fromCheck;
                              return formatConditionFromThresholdFields(alert);
                            })()}
                          </Typography>
                        </Tooltip>
                      );
                    })()}
                  </TableCell>

                  <TableCell sx={{ color: C.textMuted, fontSize: "0.78rem" }}>
                    {fmtDate(alert.created_at)}
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => handleEditAlert(alert)} sx={{ color: C.textMuted, "&:hover": { color: C.accent } }}>
                          <EditIcon sx={{ fontSize: "1.1rem" }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton size="small" onClick={() => { setAlertToDelete(alert); setDeleteDialogOpen(true); }} sx={{ color: C.textMuted, "&:hover": { color: C.danger } }}>
                          <DeleteIcon sx={{ fontSize: "1.1rem" }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPagesCount > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1.5, mt: 3, pt: 2, borderTop: `1px solid ${C.border}` }}>
          <Button size="small" disabled={currentPage === 0} onClick={() => setCurrentPage(currentPage - 1)} sx={{ textTransform: "none", color: C.accent, fontSize: "0.8rem" }}>
            ← {t('Previous')}
          </Button>
          <Typography sx={{ color: C.textMuted, fontSize: "0.8rem" }}>
            {t('Page')} <strong style={{ color: C.text }}>{currentPage + 1}</strong> {t('of')} {totalPagesCount}
          </Typography>
          <Button size="small" disabled={currentPage >= totalPagesCount - 1} onClick={() => setCurrentPage(currentPage + 1)} sx={{ textTransform: "none", color: C.accent, fontSize: "0.8rem" }}>
            {t('Next')} →
          </Button>
        </Box>
      )}
    </>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "black", position: "relative" }}>
      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(!mobileOpen)} />

      <Box component="main" sx={{ flexGrow: 1, minHeight: "100vh", overflowY: "auto", p: isMobile ? "20px 16px" : "32px 40px", position: "relative", zIndex: 1 }}>

        {isMobile && (
          <IconButton onClick={() => setMobileOpen(!mobileOpen)} sx={{ color: C.accentHi, mb: 2, p: 0 }}>
            <MenuIcon />
          </IconButton>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.75 }}>
              <Typography sx={{ color: C.text, fontSize: isMobile ? "1.4rem" : "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {t('Alerts')}
              </Typography>
              {criticalCount > 0 && (
                <Box sx={{ bgcolor: C.danger, color: "white", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700, px: 1, py: "2px", lineHeight: 1.4 }}>
                  {criticalCount} {t('critical')}{criticalCount > 1 ? t('s') : ""}
                </Box>
              )}
            </Box>
            <Typography sx={{ color: C.textMuted, fontSize: "0.875rem" }}>
              {t('Manage your alerts and system monitoring rules')}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Tooltip title={t('Refresh')}>
              <IconButton onClick={fetchAlerts} sx={{ color: C.textMuted, border: "1px solid rgba(59,130,246,0.15)", borderRadius: "10px", "&:hover": { color: C.accent, borderColor: "rgba(59,130,246,0.4)" } }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateModalOpen(true)}
              sx={{ bgcolor: C.accent, color: "white", fontWeight: 600, py: 1.2, px: 3, borderRadius: 2, textTransform: "none", fontSize: "0.95rem", boxShadow: "0 4px 12px rgba(59,130,246,0.3)", "&:hover": { bgcolor: "#2563eb" } }}>
              {t('New Alert')}
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
          <StatCard label={t('Total Alerts')} value={alerts.length + employeeAlerts.length} color={C.accent} icon={WarningIcon} onClick={() => { setFilterStatus("all"); setFilterModule("all"); setFilterSeverity("all"); setActiveAlertTab(0); }} />
          <StatCard label={t('Active Alerts')} value={activeCount} color={C.success} icon={CheckCircleIcon} onClick={() => { setActiveAlertTab(0); setFilterStatus("active"); }} />
          <StatCard label={t('Paused Alerts')} value={pausedCount} color={C.warning} icon={PauseIcon} onClick={() => { setActiveAlertTab(0); setFilterStatus("paused"); }} />
          <StatCard label={t('Inactive Alerts')} value={inactiveCount} color={C.textMuted} icon={CancelIcon} onClick={() => { setActiveAlertTab(0); setFilterStatus("inactive"); }} />
          {isAdmin && (
            <>
              <StatCard label={t('Employee Alerts')} value={employeeAlerts.length} color={C.info} icon={PeopleIcon} onClick={() => setActiveAlertTab(1)} />
              <StatCard label={t('Active Employees')} value={employeeActiveCount} color={C.success} icon={CheckCircleIcon} onClick={() => { setActiveAlertTab(1); setFilterStatus("active"); }} />
              <StatCard label={t('Paused Employees')} value={employeePausedCount} color={C.warning} icon={PauseIcon} onClick={() => { setActiveAlertTab(1); setFilterStatus("paused"); }} />
              <StatCard label={t('Inactive Employees')} value={employeeInactiveCount} color={C.textMuted} icon={CancelIcon} onClick={() => { setActiveAlertTab(1); setFilterStatus("inactive"); }} />
            </>
          )}
        </Box>

        <Box sx={{ borderBottom: `1px solid ${C.border}`, mb: 3 }}>
          <Tabs
            value={activeAlertTab}
            onChange={(_, v) => {
              setPage(0);
              setEmpAlertPage(0);
              setActiveAlertTab(v);
            }}
            sx={{
              minHeight: 40,
              "& .MuiTabs-indicator": { backgroundColor: C.accent, height: "2px" },
              "& .MuiTab-root": {
                color: C.textMuted,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.85rem",
                minHeight: 40,
                px: 2,
                py: 0,
              },
              "& .Mui-selected": { color: C.accentHi },
            }}
          >
            <Tab label={t('my_alerts_count', { count: alerts.length })} />
            {isAdmin && <Tab label={t('employee_alerts_count', { count: employeeAlerts.length })} />}
            <Tab label={t('Settings')} />
          </Tabs>
        </Box>

        {activeAlertTab !== (isAdmin ? 2 : 1) && (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: activeFiltersCount > 0 ? 1.5 : 3 }}>
              <Tooltip title={t('Advanced Filters')}>
                <Badge badgeContent={activeFiltersCount} sx={{ "& .MuiBadge-badge": { bgcolor: C.accent, color: "white", fontSize: "0.65rem", minWidth: 16, height: 16 } }}>
                  <IconButton
                    onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                    sx={{
                      color: activeFiltersCount > 0 ? C.accent : C.textMuted,
                      bgcolor: activeFiltersCount > 0 ? C.accentDim : "rgba(59,130,246,0.05)",
                      border: `1px solid ${activeFiltersCount > 0 ? "rgba(59,130,246,0.4)" : "rgba(59,130,246,0.15)"}`,
                      borderRadius: "10px", width: 44, height: 44, flexShrink: 0,
                      "&:hover": { bgcolor: C.accentDim },
                    }}
                  >
                    <CiFilter size={22} />
                  </IconButton>
                </Badge>
              </Tooltip>
              <Box sx={{ flex: 1, position: "relative" }}>
                <SearchIcon sx={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: C.textMuted, fontSize: 20 }} />
                <input
                  type="text"
                  placeholder={t(activeAlertTab === 0 ? "Search by name or description..." : "Search by name, description, or user...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: "100%", padding: "11px 16px 11px 48px", backgroundColor: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.18)", borderRadius: "10px", color: "#94a3b8", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.18)")}
                />
              </Box>
              {activeAlertTab === 0 && (
                <Tooltip title={t('Export my alerts')}>
                  <IconButton onClick={handleExportAlerts} sx={{ color: C.textMuted, border: "1px solid rgba(59,130,246,0.15)", borderRadius: "10px", "&:hover": { color: C.accent } }}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {activeFiltersCount > 0 && (
              <Box sx={{ display: "flex", gap: 1, mb: 2.5, flexWrap: "wrap", alignItems: "center" }}>
                {filterModule !== "all" && (
                  <Chip label={MODULES.find(m => m.value === filterModule)?.label || filterModule} onDelete={() => setFilterModule("all")} size="small"
                    sx={{ bgcolor: C.accentDim, color: C.accent, border: `1px solid rgba(59,130,246,0.3)`, fontWeight: 500 }} />
                )}
                {filterSeverity !== "all" && (
                  <Chip label={SEVERITY_LEVELS.find(s => s.value === filterSeverity)?.label || filterSeverity} onDelete={() => setFilterSeverity("all")} size="small"
                    sx={{ bgcolor: C.accentDim, color: C.accent, border: `1px solid rgba(59,130,246,0.3)`, fontWeight: 500 }} />
                )}
                {filterStatus !== "all" && (
                  <Chip label={filterOptions.statuses.find(s => s.value === filterStatus)?.label || filterStatus} onDelete={() => setFilterStatus("all")} size="small"
                    sx={{ bgcolor: C.accentDim, color: C.accent, border: `1px solid rgba(59,130,246,0.3)`, fontWeight: 500 }} />
                )}
                <Button size="small" onClick={() => { setFilterModule("all"); setFilterSeverity("all"); setFilterStatus("all"); }}
                  sx={{ color: C.textMuted, fontSize: "0.75rem", textTransform: "none", py: 0, minHeight: 0, "&:hover": { color: C.danger } }}>
                  {t('Clear all')}
                </Button>
              </Box>
            )}

            <Menu anchorEl={filterAnchorEl} open={Boolean(filterAnchorEl)} onClose={() => setFilterAnchorEl(null)}
              PaperProps={{ sx: { bgcolor: "rgba(13,19,33,0.98)", border: `1px solid ${C.borderHi}`, borderRadius: "12px", backdropFilter: "blur(12px)", minWidth: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", mt: 0.5 } }}>
              <SectionLabel icon={<WarningIcon sx={{ fontSize: 14 }} />} text={t('Module')} />
              {filterOptions.modules.map(opt => <FilterItem key={opt.value} label={opt.label} active={filterModule === opt.value} onClick={() => setFilterModule(opt.value)} />)}
              <Divider sx={{ borderColor: C.border, my: 1 }} />
              <SectionLabel icon={<ErrorIcon sx={{ fontSize: 14 }} />} text={t('Severity')} />
              {filterOptions.severities.map(opt => <FilterItem key={opt.value} label={opt.label} active={filterSeverity === opt.value} onClick={() => setFilterSeverity(opt.value)} />)}
              <Divider sx={{ borderColor: C.border, my: 1 }} />
              <SectionLabel icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} text={t('Status')} />
              {filterOptions.statuses.map(opt => <FilterItem key={opt.value} label={opt.label} active={filterStatus === opt.value} onClick={() => setFilterStatus(opt.value)} />)}
              {activeFiltersCount > 0 && (
                <>
                  <Divider sx={{ borderColor: C.border, mt: 1 }} />
                  <Box sx={{ p: 1.5 }}>
                    <Button fullWidth size="small"
                      onClick={() => { setFilterModule("all"); setFilterSeverity("all"); setFilterStatus("all"); setFilterAnchorEl(null); }}
                      sx={{ color: C.danger, fontSize: "0.8rem", textTransform: "none", border: `1px solid rgba(239,68,68,0.3)`, borderRadius: "6px", "&:hover": { bgcolor: C.dangerDim } }}>
                      {t('Reset filters')}
                    </Button>
                  </Box>
                </>
              )}
            </Menu>
          </>
        )}

        {loading && alerts.length === 0 && employeeAlerts.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: C.accent }} />
          </Box>
        ) : (
          <>
            {activeAlertTab === 0 && (
              filteredAlerts.length > 0 ? (
                <AlertsTable
                  paginatedList={paginatedAlerts}
                  currentPage={page}
                  setCurrentPage={setPage}
                  totalPagesCount={totalPages}
                  isEmployeeView={false}
                />
              ) : (
                <Box sx={{ textAlign: "center", py: 10, bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px" }}>
                  <WarningIcon sx={{ fontSize: 48, color: C.border, mb: 2 }} />
                  <Typography sx={{ color: C.text, fontWeight: 600, mb: 0.5 }}>{t('No alerts')}</Typography>
                  <Typography sx={{ color: C.textMuted, fontSize: "0.85rem" }}>
                    {searchTerm || activeFiltersCount > 0 ? t('No results for this search or these filters') : t('Start by creating your first alert')}
                  </Typography>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateModalOpen(true)}
                    sx={{ mt: 2, bgcolor: C.accent, color: "white", textTransform: "none", fontWeight: 600 }}>
                    {t('Create an alert')}
                  </Button>
                </Box>
              )
            )}

            {activeAlertTab === 1 && isAdmin && (
              filteredEmployeeAlerts.length > 0 ? (
                <AlertsTable
                  paginatedList={paginatedEmployeeAlerts}
                  currentPage={empAlertPage}
                  setCurrentPage={setEmpAlertPage}
                  totalPagesCount={empAlertTotalPages}
                  isEmployeeView={true}
                />
              ) : (
                <Box sx={{ textAlign: "center", py: 10, bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px" }}>
                  <PeopleIcon sx={{ fontSize: 48, color: C.border, mb: 2 }} />
                  <Typography sx={{ color: C.text, fontWeight: 600, mb: 0.5 }}>{t('No employee alerts')}</Typography>
                  <Typography sx={{ color: C.textMuted, fontSize: "0.85rem" }}>
                    {searchTerm || activeFiltersCount > 0 ? t('No results for this search or these filters') : t('Employees have not created any alerts yet')}
                  </Typography>
                </Box>
              )
            )}

            {activeAlertTab === (isAdmin ? 2 : 1) && (
              <Box sx={{ maxWidth: 10000 }}>
                <Box sx={{ mb: 4, p: 3, bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                    <NotificationsIcon sx={{ color: C.accent, fontSize: 24 }} />
                    <Typography sx={{ color: C.text, fontWeight: 700, fontSize: "1.1rem" }}>{t('Notification Channels')}</Typography>
                  </Box>
                  <Typography sx={{ color: C.textMuted, fontSize: "0.85rem", mb: 2 }}>{t('Choose the channels through which you want to receive notifications')}</Typography>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {notificationChannels.map((channel) => (
                      <Box
                        key={channel.value}
                        onClick={() => handleToggleChannel(channel.value)}
                        sx={{
                          display: "flex", alignItems: "center", gap: 2,
                          p: 2, bgcolor: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: "10px",
                          cursor: "pointer", transition: "all 0.18s ease",
                          "&:hover": { borderColor: C.borderHi, bgcolor: "rgba(59,130,246,0.08)" },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {channel.value === 'email' && <EmailIcon sx={{ fontSize: 28, color: channel.color }} />}
                          {channel.value === 'in-app' && <NotificationsIcon sx={{ fontSize: 28, color: channel.color }} />}
                          {channel.value === 'telegram' && <TelegramIcon sx={{ fontSize: 28, color: channel.color }} />}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ color: C.text, fontWeight: 600, fontSize: "0.95rem" }}>{t(channel.label)}</Typography>
                          <Typography sx={{ color: C.textMuted, fontSize: "0.75rem", mt: 0.25 }}>
                            {t(channel.value === 'email' ? 'Receive notifications by email' :
                              channel.value === 'in-app' ? 'Receive notifications in the application' :
                              'Receive notifications on Telegram')}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            width: 48, height: 28, borderRadius: "14px", flexShrink: 0,
                            bgcolor: channel.value === 'email' ? (notificationSettings.emailEnabled ? C.success : C.textMuted) : 
                                     channel.value === 'in-app' ? (notificationSettings.inAppEnabled ? C.success : C.textMuted) :
                                     (notificationSettings.telegramEnabled ? C.success : C.textMuted),
                            display: "flex", alignItems: "center", justifyContent: channel.value === 'email' ? (notificationSettings.emailEnabled ? "flex-end" : "flex-start") : 
                                     channel.value === 'in-app' ? (notificationSettings.inAppEnabled ? "flex-end" : "flex-start") :
                                     (notificationSettings.telegramEnabled ? "flex-end" : "flex-start"),
                            p: "2px",
                          }}
                        >
                          <Box sx={{ width: 24, height: 24, borderRadius: "12px", bgcolor: "white" }} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box sx={{ mb: 4, p: 3, bgcolor: C.surface, border: `1px solid ${C.borderHi}`, borderRadius: "12px", borderLeft: `3px solid ${C.accent}` }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                    <ScheduleIcon sx={{ color: C.accent, fontSize: 24 }} />
                    <Typography sx={{ color: C.text, fontWeight: 700, fontSize: "1.1rem" }}>{t('Verification Frequency')}</Typography>
                  </Box>
                  <Typography sx={{ color: C.textMuted, fontSize: "0.85rem", mb: 2 }}>{t('Define how often alerts are checked')}</Typography>

                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    {scheduleOptions.map((option) => (
                      <Box
                        key={option.value}
                        onClick={() => setNotificationSettings({ ...notificationSettings, schedule: option.value })}
                        sx={{
                          p: 2.5, bgcolor: notificationSettings.schedule === option.value ? "rgba(59,130,246,0.15)" : C.surfaceHi,
                          border: `1px solid ${notificationSettings.schedule === option.value ? C.accent : C.border}`,
                          borderRadius: "10px", cursor: "pointer", transition: "all 0.18s ease",
                          "&:hover": { borderColor: C.accent, bgcolor: "rgba(59,130,246,0.1)" },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: notificationSettings.schedule === option.value ? C.accent : C.textMuted }} />
                          <Typography sx={{ color: C.text, fontWeight: 600, fontSize: "0.9rem" }}>{t(option.label)}</Typography>
                        </Box>
                        <Typography sx={{ color: C.textMuted, fontSize: "0.75rem", pl: 3 }}>{t(option.description)}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {notificationSettings.emailEnabled && (
                  <Box sx={{ mb: 4, p: 3, bgcolor: C.surface, border: `1px solid ${C.borderHi}`, borderRadius: "12px", borderLeft: `3px solid ${C.accent}` }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                      <EmailIcon sx={{ color: C.accent, fontSize: 24 }} />
                      <Typography sx={{ color: C.text, fontWeight: 700, fontSize: "1.1rem" }}>{t('Email Configuration')}</Typography>
                    </Box>
                    <Typography sx={{ color: C.textMuted, fontSize: "0.85rem", mb: 3 }}>{t('Add one or more email addresses to receive notifications')}</Typography>

                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                      <TextField
                        fullWidth
                        label={t('Add an address')}
                        type="text"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="admin@example.com, manager@example.com"
                        helperText={t('Separate with a comma, semicolon, or new line.')}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            color: C.text,
                            borderColor: C.border,
                            "& fieldset": { borderColor: C.border },
                            "&:hover fieldset": { borderColor: C.borderHi },
                            "&.Mui-focused fieldset": { borderColor: C.accent },
                          },
                          "& .MuiInputLabel-root": { color: C.textMuted },
                        }}
                        variant="outlined"
                      />
                      <Button
                        variant="contained"
                        onClick={handleAddEmail}
                        sx={{
                          mt: 0.5,
                          bgcolor: C.accent,
                          color: "white",
                          textTransform: "none",
                          fontWeight: 600,
                          px: 2.5,
                          borderRadius: "8px",
                          boxShadow: "none",
                          "&:hover": { bgcolor: "#2563eb", boxShadow: "none" },
                        }}
                      >
                        {t('Add')}
                      </Button>
                    </Box>

                    {(notificationSettings.emailAddresses || []).length > 0 && (
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                        {(notificationSettings.emailAddresses || []).map((email) => (
                          <Chip
                            key={email}
                            label={email}
                            onDelete={() => handleRemoveEmail(email)}
                            size="small"
                            sx={{
                              bgcolor: C.surfaceHi,
                              color: C.text,
                              border: `1px solid ${C.border}`,
                              fontWeight: 600,
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                )}

                {notificationSettings.telegramEnabled && (
                  <Box sx={{ mb: 4, p: 3, bgcolor: C.surface, border: `1px solid ${C.borderHi}`, borderRadius: "12px", borderLeft: `3px solid #26A5E4` }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                      <TelegramIcon sx={{ color: '#26A5E4', fontSize: 24 }} />
                      <Typography sx={{ color: C.text, fontWeight: 700, fontSize: "1.1rem" }}>{t('Telegram Configuration')}</Typography>
                    </Box>
                    <Typography sx={{ color: C.textMuted, fontSize: "0.85rem", mb: 3 }}>
                      {t('Configure your Telegram bot to receive notifications')}
                    </Typography>

                    <TextField
                      fullWidth
                      label={t('Telegram Chat ID')}
                      type="text"
                      value={notificationSettings.telegramChatId}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, telegramChatId: e.target.value })}
                      placeholder={t('Ex: 123456789 or @username')}
                      helperText={t('Your Telegram chat ID to receive notifications')}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          color: C.text,
                          borderColor: C.border,
                          "& fieldset": { borderColor: C.border },
                          "&:hover fieldset": { borderColor: C.borderHi },
                          "&.Mui-focused fieldset": { borderColor: '#26A5E4' },
                        },
                        "& .MuiInputLabel-root": { color: C.textMuted },
                      }}
                      variant="outlined"
                    />

                    <Alert 
                      severity="info" 
                      sx={{ 
                        mt: 2, 
                        bgcolor: 'rgba(38,165,228,0.1)', 
                        color: '#26A5E4',
                        border: `1px solid rgba(38,165,228,0.3)`
                      }}
                    >
                      <Typography variant="caption">
                        {t('To get your Telegram chat ID, send a message to @BotFather to create a bot, then to @userinfobot to get your user ID.')}
                      </Typography>
                    </Alert>
                  </Box>
                )}

                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                  <Button
                    variant="outlined"
                    sx={{
                      color: C.textMuted,
                      borderColor: C.border,
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      px: 3,
                      "&:hover": { borderColor: C.borderHi, bgcolor: C.accentDim }
                    }}
                  >
                    {t('Cancel')}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon sx={{ fontSize: "1rem" }} />}
                    onClick={handleSaveSettings}
                    sx={{
                      bgcolor: C.accent,
                      color: "white",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      px: 3,
                      borderRadius: "8px",
                      boxShadow: "none",
                      "&:hover": { bgcolor: "#2563eb", boxShadow: "none" }
                    }}
                  >
                    {t('Save')}
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>

      <NewAlert isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} onSuccess={() => fetchAlerts()} />
      <EditAlert isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} alert={selectedAlert}
        onSuccess={() => {
          setEditModalOpen(false);
          fetchAlerts();
        }} />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "14px" } }}>
        <DialogTitle sx={{ color: C.text, fontWeight: 700, borderBottom: `1px solid ${C.border}`, py: 2, px: 3 }}>
          {t('Confirm deletion')}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography sx={{ color: C.textSub }}>
            {t('Are you sure you want to delete the alert')} <strong style={{ color: C.text }}>"{alertToDelete?.name}"</strong>? {t('This action is irreversible.')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${C.border}`, gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: C.textMuted, textTransform: "none", fontWeight: 600 }}>{t('Cancel')}</Button>
          <Button onClick={handleDeleteAlert} sx={{ color: C.danger, textTransform: "none", fontWeight: 600 }}>{t('Delete')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity="success" sx={{ borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem" }}>{t(successMessage)}</Alert>
      </Snackbar>
      <Snackbar open={!!errorMessage} autoHideDuration={3000} onClose={() => setErrorMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity="error" sx={{ borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem" }}>{t(errorMessage)}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Alerts;