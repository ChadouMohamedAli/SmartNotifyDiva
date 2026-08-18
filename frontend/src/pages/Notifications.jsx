import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
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
  Tabs,
  Tab,
  Divider,
  Menu,
  MenuItem,
  TextField,
  Avatar,
} from "@mui/material";
import { CiFilter } from "react-icons/ci";
import {
  NotificationsNone as NotificationsNoneIcon,
  Search as SearchIcon,
  Menu as MenuIcon,
  Refresh as RefreshIcon,
  MarkEmailRead as MarkEmailReadIcon,
  MarkEmailUnread as MarkEmailUnreadIcon,
  DoneAll as DoneAllIcon,
  Circle as CircleIcon,
  CalendarToday as CalendarTodayIcon,
  Check as CheckIcon,
  MarkEmailRead as ReadIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  PlayArrow as PlayArrowIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Inbox as InboxIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Telegram as TelegramIcon,
} from "@mui/icons-material";
import SharedSidebar from "../components/SharedSidebar";
import { authFetch } from "../utils/authFetch";

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
  text: "#f1f5f9",
  textMuted: "#64748b",
  textSub: "#94a3b8",
  unreadBg: "rgba(59,130,246,0.06)",
};

/* ─── Notification Config ──────────────────────────────────────────────── */
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

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (iso) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

// Mapper les modules backend aux noms d'affichage ERP
const MODULE_ERP_MAP = {
  'stock': { name: 'STOCK', color: '#3b82f6' },
  'crm': { name: 'CRM', color: '#8b5cf6' },
  'facturation': { name: 'FINANCE', color: '#ec4899' },
  'rh': { name: 'RH', color: '#06b6d4' },
  'gmao': { name: 'PRODUCTION', color: '#f59e0b' },
  'gpao': { name: 'PRODUCTION', color: '#f59e0b' },
  'fournisseur': { name: 'ACHATS', color: '#14b8a6' },
};

const getModuleERPLabel = (backendModule) => {
  return MODULE_ERP_MAP[backendModule] || { name: backendModule, color: '#64748b' };
};

const NOTIFICATIONS_API_BASE = "http://localhost:8000/api/notifications/";

const fmtFull = (iso) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

/* ─── StatCard ───────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, color, icon: Icon, iconColor, description, onClick }) => {
  // Convertir hex en rgba avec opacité
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
        flex: 1,
        minWidth: 200,
        bgcolor: hexToRgba(color, 0.1),
        border: `1px solid ${hexToRgba(color, 0.2)}`,
        borderRadius: 3,
        transition: "all 0.3s ease",
        cursor: onClick ? "pointer" : "default",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 24px ${hexToRgba(color, 0.2)}`,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#94a3b8", fontSize: "0.85rem" }}
          >
            {label}
          </Typography>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: hexToRgba(color, 0.15),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {Icon && <Icon sx={{ color: iconColor || color, fontSize: 20 }} />}
          </Box>
        </Box>
        <Typography
          variant="h3"
          sx={{ color: "white", fontWeight: 700, mb: 1 }}
        >
          {value}
        </Typography>
        {description && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {Icon && <Icon sx={{ color: iconColor || color, fontSize: 16 }} />}
            <Typography
              variant="caption"
              sx={{
                color: iconColor || color,
                fontSize: "0.8rem",
                fontWeight: 500,
              }}
            >
              {description}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/* ─── Filter menu helpers ────────────────────────────────────────────────── */
const SectionLabel = ({ icon, text }) => (
  <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
    <Box sx={{ color: C.accent, display: "flex", fontSize: 14 }}>{icon}</Box>
    <Typography variant="caption" sx={{
      color: C.accent, fontWeight: 700, textTransform: "uppercase",
      letterSpacing: 0.8, fontSize: "0.7rem",
    }}>
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
    {active && <CheckIcon sx={{ fontSize: 16, color: C.accent }} />}
  </MenuItem>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [employeeAlerts, setEmployeeAlerts] = useState([]);
  const [employeeNotifications, setEmployeeNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [notificationForm, setNotificationForm] = useState({ title: "", message: "", notification_type: "alert_triggered", priority: "medium", channels: ["inapp"] });
  const [emailTemplate, setEmailTemplate] = useState({ subject: "", body: "" });
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    inAppEnabled: true,
    telegramEnabled: false,
    schedule: "realtime",
    emailAddresses: [],
    telegramChatId: user?.telegram_chat_id || "",
  });
  const [emailInput, setEmailInput] = useState("");

  /* filter state — notifications */
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filterDate, setFilterDate] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  /* filter state — alerts */
  const [alertFilterAnchorEl, setAlertFilterAnchorEl] = useState(null);
  const [alertFilterDate, setAlertFilterDate] = useState("all");
  const [alertFilterStatus, setAlertFilterStatus] = useState("all");

  /* filter state — employee notifications */
  const [empNotifFilterAnchorEl, setEmpNotifFilterAnchorEl] = useState(null);
  const [empNotifFilterDate, setEmpNotifFilterDate] = useState("all");
  const [empNotifFilterStatus, setEmpNotifFilterStatus] = useState("all");

  /* pagination state */
  const [notifPage, setNotifPage] = useState(0);
  const [alertPage, setAlertPage] = useState(0);
  const [empNotifPage, setEmpNotifPage] = useState(0);
  const [empAlertPage, setEmpAlertPage] = useState(0);
  const ITEMS_PER_PAGE = 6;

  /* option lists */
  const dateOptions = [
    { value: "all", label: "Toutes les dates" },
    { value: "today", label: "Aujourd'hui" },
    { value: "this_week", label: "Cette semaine" },
    { value: "this_month", label: "Ce mois" },
  ];
  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "unread", label: "Non lues" },
    { value: "read", label: "Lues" },
  ];
  const alertStatusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "active", label: "Actif" },
    { value: "inactive", label: "Inactif" },
  ];

  const activeFiltersCount = (filterDate !== "all" ? 1 : 0) + (filterStatus !== "all" ? 1 : 0);
  const activeAlertFiltersCount = (alertFilterDate !== "all" ? 1 : 0) + (alertFilterStatus !== "all" ? 1 : 0);
  const activeEmpNotifFiltersCount = (empNotifFilterDate !== "all" ? 1 : 0) + (empNotifFilterStatus !== "all" ? 1 : 0);

  /* ── auth helper */
  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  });

  /* ── date range helper */
  const passesDateFilter = (isoDate, filter) => {
    if (filter === "all") return true;
    const d = new Date(isoDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (filter === "today") return d >= today;
    if (filter === "this_week") { const w = new Date(today); w.setDate(w.getDate() - 7); return d >= w; }
    if (filter === "this_month") { const m = new Date(today); m.setMonth(m.getMonth() - 1); return d >= m; }
    return true;
  };

  /* ─── Fetch ──────────────────────────────────────────────────────────── */
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(NOTIFICATIONS_API_BASE, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      const allNotifications = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];

      if (user?.is_superuser) {
        const currentUserId = user?.id != null ? String(user.id) : null;
        const normalizeNotifUserId = (notif) => {
          const raw = notif?.user?.id ?? notif?.user;
          return raw != null ? String(raw) : null;
        };

        const myNotifications = allNotifications.filter((n) => normalizeNotifUserId(n) === currentUserId);
        const empNotifications = allNotifications.filter((n) => normalizeNotifUserId(n) !== currentUserId);

        setNotifications(myNotifications);
        setEmployeeNotifications(empNotifications);
      } else {
        setNotifications(allNotifications);
        setEmployeeNotifications([]);
      }
    } catch (error) { 
      setErrorMessage(error.message || "Erreur lors du chargement des notifications");
    } finally { 
      setLoading(false); 
    }
  };

  const fetchAlerts = async () => {
    try {
      const isAdmin = user?.is_superuser;
      
      if (isAdmin) {
        const myAlertsUrl = "http://localhost:8000/api/alerts/my_alerts/";
        const employeeAlertsUrl = "http://localhost:8000/api/alerts/employee_alerts/";

        const [myAlertsRes, employeeAlertsRes] = await Promise.all([
          authFetch(myAlertsUrl),
          authFetch(employeeAlertsUrl)
        ]);

        if (!myAlertsRes.ok || !employeeAlertsRes.ok) {
          throw new Error('Failed to fetch one or more alert sets');
        }

        const myAlertsData = await myAlertsRes.json();
        const employeeAlertsData = await employeeAlertsRes.json();

        // Gérer à la fois la réponse paginée (results) et le tableau brut
        const myAlerts = Array.isArray(myAlertsData.results) ? myAlertsData.results : Array.isArray(myAlertsData) ? myAlertsData : [];
        const empAlerts = Array.isArray(employeeAlertsData.results) ? employeeAlertsData.results : Array.isArray(employeeAlertsData) ? employeeAlertsData : [];

        setAlerts(myAlerts);
        setEmployeeAlerts(empAlerts);

      } else {
        const url = "http://localhost:8000/api/alerts/";
        const res = await authFetch(url);
        if (!res.ok) throw new Error('Failed to fetch alerts');
        const data = await res.json();
        // Gérer la pagination DRF : data.results contient les alertes
        const userAlerts = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
        setAlerts(userAlerts);
        setEmployeeAlerts([]);
      }
    } catch (error) {
      setErrorMessage(error.message || "Erreur lors du chargement des alertes");
    }
  };

  const fetchEmailRecipients = async () => {
    try {
      const res = await fetch(`${NOTIFICATIONS_API_BASE}email_recipients/`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const emails = Array.isArray(data.emails) ? data.emails : [];
      setNotificationSettings((prev) => ({ ...prev, emailAddresses: emails }));
    } catch {
      // Keep UI usable even if the API is unavailable
    }
  };

  const fetchChannelPreferences = async () => {
    try {
      const res = await fetch(`${NOTIFICATIONS_API_BASE}channel_preferences/`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNotificationSettings((prev) => ({
        ...prev,
        emailEnabled: data.email_enabled ?? true,
        inAppEnabled: data.in_app_enabled ?? true,
        telegramEnabled: data.telegram_enabled ?? false,
        schedule: data.schedule || "realtime",
        telegramChatId: prev.telegramChatId || user?.telegram_chat_id || "",
      }));
    } catch {
      // Keep UI usable even if the API is unavailable
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem("notificationEmailTemplate");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setEmailTemplate({
        subject: typeof parsed?.subject === "string" ? parsed.subject : "",
        body: typeof parsed?.body === "string" ? parsed.body : "",
      });
    } catch {
      // Ignore malformed local storage data
    }
  }, []);

  useEffect(() => {
    if (user) {
      setNotificationSettings((prev) => ({
        ...prev,
        telegramChatId: user.telegram_chat_id || prev.telegramChatId || "",
      }));
      fetchNotifications();
      fetchAlerts();
      fetchEmailRecipients();
      fetchChannelPreferences();
    }
  }, [user]);

  /* Reset pagination when filters/search changes */
  useEffect(() => {
    setNotifPage(0);
    setAlertPage(0);
    setEmpNotifPage(0);
    setEmpAlertPage(0);
  }, [searchTerm, filterDate, filterStatus, alertFilterDate, alertFilterStatus, empNotifFilterDate, empNotifFilterStatus]);

  /* ─── Actions ────────────────────────────────────────────────────────── */
  const patchNotification = async (id, action) => {
    const res = await fetch(`${NOTIFICATIONS_API_BASE}${id}/${action}/`, {
      method: "POST", headers: authHeaders(),
    });
    if (!res.ok) throw new Error();
    return res.json();
  };

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      const updated = await patchNotification(id, "mark_as_read");
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, ...updated } : n));
      setEmployeeNotifications((prev) => prev.map((n) => n.id === id ? { ...n, ...updated } : n));
      setSuccessMessage("Notification marquée comme lue");
    } catch { setErrorMessage("Erreur lors de la mise à jour"); }
  };

  const handleMarkAsUnread = async (id, e) => {
    e?.stopPropagation();
    try {
      const updated = await patchNotification(id, "mark_as_unread");
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, ...updated } : n));
      setEmployeeNotifications((prev) => prev.map((n) => n.id === id ? { ...n, ...updated } : n));
      setSuccessMessage("Notification marquée comme non lue");
    } catch { setErrorMessage("Erreur lors de la mise à jour"); }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch(`${NOTIFICATIONS_API_BASE}mark_all_as_read/`, {
        method: "POST", headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      fetchNotifications();
      setSuccessMessage(`${result.count} notification(s) marquée(s) comme lue(s)`);
    } catch { setErrorMessage("Erreur lors de la mise à jour"); }
  };

  const handleOpenNotificationForm = (alert) => {
    if (!alert.is_active || alert.is_paused) {
      setErrorMessage("Cette alerte est en pause ou inactive. Activez-la pour envoyer une notification.");
      return;
    }
    setSelectedAlert(alert);
    const defaultTitle = alert.custom_subject || `Alerte: ${alert.name}`;
    const defaultTemplate = alert.custom_body || `Bonjour {{user}}, l'alerte '{{alert}}' a été déclenchée dans le module {{module}} le {{date}}.`;
    setNotificationForm({
      title: defaultTitle,
      message: defaultTemplate,
      notification_type: "alert_triggered",
      priority: alert.severity || "medium",
      channels: ["inapp"]
    });
    setIsCustomizing(false);
    setNotificationDialogOpen(true);
  };

  const insertToken = (field, token) => {
    if (field === "title") {
      setNotificationForm((prev) => ({
        ...prev,
        title: `${prev.title}${prev.title ? " " : ""}${token}`,
      }));
      return;
    }
    if (field === "message") {
      setNotificationForm((prev) => ({
        ...prev,
        message: `${prev.message}${prev.message ? " " : ""}${token}`,
      }));
    }
  };

  const resolveTemplate = (text, context) =>
    String(text || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => context[key] ?? "");

  const buildTemplateContext = () => {
    const targetUser = selectedAlert?.user || user || {};
    const nowIso = new Date().toISOString();
    return {
      user: targetUser.username || targetUser.email || "",
      email: targetUser.email || "",
      alert: selectedAlert?.name || "",
      module: selectedAlert?.module || "",
      title: notificationForm.title || "",
      message: notificationForm.message || "",
      date: fmtFull(nowIso),
    };
  };

  const handleSaveTemplate = () => {
    localStorage.setItem("notificationEmailTemplate", JSON.stringify(emailTemplate));
    setSuccessMessage("Modele email sauvegarde");
  };

  const handleCreateNotification = async () => {
    try {
      const context = buildTemplateContext();
      const resolvedTitle = resolveTemplate(notificationForm.title, context);
      const resolvedMessage = resolveTemplate(notificationForm.message, context);
      const resolvedEmailSubject = resolveTemplate(
        emailTemplate.subject || notificationForm.title,
        context
      );
      const resolvedEmailBody = resolveTemplate(
        emailTemplate.body || notificationForm.message,
        context
      );
      const payload = {
        title: resolvedTitle,
        message: resolvedMessage,
        notification_type: notificationForm.notification_type,
        priority: notificationForm.priority,
        channels: notificationForm.channels,
        email_subject: resolvedEmailSubject,
        email_body: resolvedEmailBody,
      };

      // Ajouter alert et user seulement s'ils existent
      if (selectedAlert?.id) payload.alert = selectedAlert.id;
      if (selectedAlert?.user?.id) payload.user = selectedAlert.user.id;

      console.log("Payload envoyé:", payload);

      const res = await fetch(NOTIFICATIONS_API_BASE, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      let responseData = null;
      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch {
        responseData = null;
      }
      console.log("Réponse du serveur (status", res.status, "):", responseData);

      if (!res.ok) {
        let errorMsg = "Erreur serveur non identifiée";

        if (responseData && responseData.detail) {
          errorMsg = responseData.detail;
        } else if (responseData && typeof responseData === 'object') {
          // Extraire les messages d'erreur de chaque champ
          const errorMessages = Object.entries(responseData)
            .map(([field, messages]) => {
              const msg = Array.isArray(messages) ? messages[0] : messages;
              return `${field}: ${msg}`;
            })
            .join(" | ");
          errorMsg = errorMessages || "Erreur lors de la création";
        } else if (responseText) {
          errorMsg = responseText;
        }

        console.error("Détails de l'erreur:", responseData);
        throw new Error(errorMsg);
      }

      // Patch the alert to save custom subject and body permanently if customized
      if (isCustomizing && selectedAlert?.id) {
        try {
          await fetch(`http://localhost:8000/api/alerts/${selectedAlert.id}/`, {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify({
              custom_subject: notificationForm.title,
              custom_body: notificationForm.message,
            }),
          });
        } catch (error) {
          console.error("Failed to patch alert customization:", error);
        }
      }

      setSuccessMessage("Notification créée et envoyée avec succès");
      setNotificationDialogOpen(false);
      setNotificationForm({ title: "", message: "", notification_type: "alert_triggered", priority: "medium" });
      fetchNotifications();
    } catch (error) {
      console.error("Erreur complète:", error);
      setErrorMessage(error.message || "Erreur lors de la création de la notification");
    }
  };

  const parseEmailList = (raw) =>
    raw
      .split(/[,;\n]/)
      .map((email) => email.trim())
      .filter(Boolean);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

  const handleToggleChannel = (channel) => {
    if (channel === 'email') {
      setNotificationSettings({ ...notificationSettings, emailEnabled: !notificationSettings.emailEnabled });
    } else if (channel === 'in-app') {
      setNotificationSettings({ ...notificationSettings, inAppEnabled: !notificationSettings.inAppEnabled });
    } else if (channel === 'telegram') {
      setNotificationSettings({ ...notificationSettings, telegramEnabled: !notificationSettings.telegramEnabled });
    }
  };

  const handleSaveSettings = () => {
    const { emailEnabled, inAppEnabled, telegramEnabled, emailAddresses, telegramChatId, schedule } = notificationSettings;

    if (!emailEnabled && !inAppEnabled && !telegramEnabled) {
      setErrorMessage("Veuillez activer au moins un canal de notification");
      return;
    }

    if (emailEnabled) {
      const emails = emailAddresses || [];
      if (emails.length === 0) {
        setErrorMessage("Veuillez entrer au moins une adresse email");
        return;
      }

      const invalid = emails.filter((email) => !isValidEmail(email));
      if (invalid.length > 0) {
        setErrorMessage(`Adresse(s) email invalide(s): ${invalid.join(", ")}`);
        return;
      }
    }

    if (telegramEnabled && !telegramChatId) {
      setErrorMessage("Veuillez entrer un ID de chat Telegram");
      return;
    }

    const saveSettings = async () => {
      try {
        if (telegramEnabled && telegramChatId !== (user?.telegram_chat_id || "")) {
          const telegramRes = await fetch(`${NOTIFICATIONS_API_BASE}register_telegram/`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ chat_id: telegramChatId }),
          });
          if (!telegramRes.ok) throw new Error();
        }

        const recipientsRes = await fetch(`${NOTIFICATIONS_API_BASE}email_recipients/`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({
            emails: emailEnabled ? emailAddresses || [] : [],
          }),
        });
        if (!recipientsRes.ok) throw new Error();
        const recipientsData = await recipientsRes.json();

        const prefsRes = await fetch(`${NOTIFICATIONS_API_BASE}channel_preferences/`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({
            email_enabled: !!emailEnabled,
            in_app_enabled: !!inAppEnabled,
            telegram_enabled: !!telegramEnabled,
            schedule: schedule || "realtime",
          }),
        });
        if (!prefsRes.ok) throw new Error();
        const prefsData = await prefsRes.json();

        setNotificationSettings((prev) => ({
          ...prev,
          emailEnabled: prefsData.email_enabled ?? prev.emailEnabled,
          inAppEnabled: prefsData.in_app_enabled ?? prev.inAppEnabled,
          telegramEnabled: prefsData.telegram_enabled ?? prev.telegramEnabled,
          schedule: prefsData.schedule || prev.schedule,
          emailAddresses: Array.isArray(recipientsData.emails) ? recipientsData.emails : prev.emailAddresses,
        }));
        setSuccessMessage("paramètre de notification sauvegardés");
      } catch {
        setErrorMessage("Erreur lors de l'enregistrement des paramètres");
      }
    };

    saveSettings();
  };

  /* ─── Filtered lists ─────────────────────────────────────────────────── */
  const filteredNotifications = notifications
    .filter((n) => passesDateFilter(n.created_at, filterDate))
    .filter((n) => filterStatus === "all" || (filterStatus === "unread" ? !n.is_read : n.is_read))
    .filter((n) => {
      const q = searchTerm.toLowerCase();
      return !q || [n.title, n.message, n.user?.username, n.user?.email].some((v) => v?.toLowerCase().includes(q));
    });

  const paginatedNotifications = filteredNotifications.slice(notifPage * ITEMS_PER_PAGE, (notifPage + 1) * ITEMS_PER_PAGE);
  const notifTotalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);

  // Filtrer les alertes de l'utilisateur connecté (admin ou user normal)
  const filteredAlerts = alerts
    .filter((a) => passesDateFilter(a.created_at, alertFilterDate))
    .filter((a) => alertFilterStatus === "all" || (alertFilterStatus === "active" ? a.is_active : !a.is_active))
    .filter((a) => {
      const q = searchTerm.toLowerCase();
      return !q || [a.name, a.description, a.module, a.user?.username, a.user?.email].some((v) => v?.toLowerCase().includes(q));
    });

  const paginatedAlerts = filteredAlerts.slice(alertPage * ITEMS_PER_PAGE, (alertPage + 1) * ITEMS_PER_PAGE);
  const alertTotalPages = Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE);

  // Filtrer les alertes des employés (pour admin seulement)
  const filteredEmployeeAlerts = employeeAlerts
    .filter((a) => passesDateFilter(a.created_at, alertFilterDate))
    .filter((a) => alertFilterStatus === "all" || (alertFilterStatus === "active" ? a.is_active : !a.is_active))
    .filter((a) => {
      const q = searchTerm.toLowerCase();
      return !q || [a.name, a.description, a.module, a.user?.username, a.user?.email].some((v) => v?.toLowerCase().includes(q));
    });

  const paginatedEmployeeAlerts = filteredEmployeeAlerts.slice(empAlertPage * ITEMS_PER_PAGE, (empAlertPage + 1) * ITEMS_PER_PAGE);
  const empAlertTotalPages = Math.ceil(filteredEmployeeAlerts.length / ITEMS_PER_PAGE);

  // Filtrer les notifications des employés (pour admin seulement)
  const filteredEmployeeNotifications = employeeNotifications
    .filter((n) => passesDateFilter(n.created_at, empNotifFilterDate))
    .filter((n) => empNotifFilterStatus === "all" || (empNotifFilterStatus === "unread" ? !n.is_read : n.is_read))
    .filter((n) => {
      const q = searchTerm.toLowerCase();
      return !q || [n.title, n.message, n.user?.username, n.user?.email].some((v) => v?.toLowerCase().includes(q));
    });

  const paginatedEmployeeNotifications = filteredEmployeeNotifications.slice(empNotifPage * ITEMS_PER_PAGE, (empNotifPage + 1) * ITEMS_PER_PAGE);
  const empNotifTotalPages = Math.ceil(filteredEmployeeNotifications.length / ITEMS_PER_PAGE);

  const unreadTotal = notifications.filter((n) => !n.is_read).length;
  const readTotal = notifications.filter((n) => n.is_read).length;

  /* ─── Guards ─────────────────────────────────────────────────────────── */
  if (!user) return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", bgcolor: "black" }}>
      <CircularProgress sx={{ color: C.accent }} />
    </Box>
  );

  if (loading && notifications.length === 0 && alerts.length === 0) return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", bgcolor: "black" }}>
      <CircularProgress sx={{ color: C.accent }} />
    </Box>
  );

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "black", position: "relative" }}>
      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(!mobileOpen)} />

      <Box component="main" sx={{ flexGrow: 1, minHeight: "100vh", overflowY: "auto", p: isMobile ? "20px 16px" : "32px 40px", position: "relative", zIndex: 1 }}>

        {isMobile && (
          <IconButton onClick={() => setMobileOpen(!mobileOpen)} sx={{ color: C.accentHi, mb: 2, p: 0 }}>
            <MenuIcon />
          </IconButton>
        )}

        {/* ── Page header ──────────────────────────────────────────── */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.75 }}>
              <Typography sx={{ color: C.text, fontSize: isMobile ? "1.4rem" : "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>
                Notifications
              </Typography>
              {unreadTotal > 0 && (
                <Box sx={{ bgcolor: C.danger, color: "white", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700, px: 1, py: "2px", lineHeight: 1.4 }}>
                  {unreadTotal} non lue{unreadTotal > 1 ? "s" : ""}
                </Box>
              )}
            </Box>
            <Typography sx={{ color: C.textMuted, fontSize: "0.875rem" }}>
              Gérez vos notifications et alertes système
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Tooltip title="Actualiser">
              <IconButton
                onClick={() => { fetchNotifications(); fetchAlerts(); }}
                sx={{
                  color: C.textMuted,
                  border: "1px solid rgba(59,130,246,0.15)",
                  borderRadius: "10px",
                  "&:hover": { color: C.accent, borderColor: "rgba(59,130,246,0.4)" }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Paramètres de notification">
              <IconButton
                onClick={() => setActiveTab(user?.is_superuser ? 4 : 2)}
                sx={{
                  color: C.textMuted,
                  border: "1px solid rgba(59,130,246,0.15)",
                  borderRadius: "10px",
                  "&:hover": { color: C.accent, borderColor: "rgba(59,130,246,0.4)" }
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            {unreadTotal > 0 && (
              <Button
                variant="contained"
                startIcon={<DoneAllIcon />}
                onClick={handleMarkAllAsRead}
                sx={{
                  bgcolor: C.accent,
                  color: "white",
                  fontWeight: 600,
                  py: 1.2,
                  px: 3,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "0.95rem",
                  boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
                  "&:hover": { bgcolor: "#2563eb" }
                }}
              >
                Tout marquer comme lu
              </Button>
            )}
          </Box>
        </Box>

        {/* ── Stat strip ───────────────────────────────────────────── */}
        <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
          <StatCard
            label="Total Notifications"
            value={notifications.length}
            color="#3b82f6"
            icon={InboxIcon}
            iconColor="#3b82f6"
            description="Toutes notifications"
            onClick={() => { setActiveTab(0); setFilterStatus("all"); }}
          />
          <StatCard
            label="Non lues"
            value={unreadTotal}
            color={unreadTotal > 0 ? "#ef4444" : "#94a3b8"}
            icon={ErrorIcon}
            iconColor={unreadTotal > 0 ? "#ef4444" : "#94a3b8"}
            description={unreadTotal > 0 ? "Nécessite attention" : "Aucune notification"}
            onClick={() => { setActiveTab(0); setFilterStatus("unread"); }}
          />
          <StatCard
            label="Lues"
            value={readTotal}
            color="#10b981"
            icon={CheckCircleIcon}
            iconColor="#10b981"
            description="Notifications lues"
            onClick={() => { setActiveTab(0); setFilterStatus("read"); }}
          />
          <StatCard
            label="Alertes Actives"
            value={alerts.length + employeeAlerts.length}
            color="#8b5cf6"
            icon={WarningIcon}
            iconColor="#8b5cf6"
            description={`${alerts.length + employeeAlerts.length} alertes actives`}
            onClick={() => { setActiveTab(1); }}
          />
        </Box>

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <Box sx={{ borderBottom: `1px solid ${C.border}`, mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => { setActiveTab(v); setSearchTerm(""); }}
            sx={{
              minHeight: 40,
              "& .MuiTabs-indicator": { backgroundColor: C.accent, height: "2px" },
              "& .MuiTab-root": { color: C.textMuted, textTransform: "none", fontWeight: 600, fontSize: "0.85rem", minHeight: 40, px: 2, py: 0 },
              "& .Mui-selected": { color: C.accentHi },
            }}
          >
            <Tab label={`Mes Notifications (${notifications.length})`} />
            {user?.is_superuser && <Tab label={`Notifications Employés (${employeeNotifications.length})`} />}
            <Tab label={`Mes Alertes (${alerts.length})`} />
            {user?.is_superuser && <Tab label={`Alertes des employés (${employeeAlerts.length})`} />}
            <Tab label="Paramètres" />
          </Tabs>
        </Box>

        {/* ══════════════════════════════════════════════════════════
            TAB 0 — NOTIFICATIONS
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 0 && (
          <>
            {/* Toolbar */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: activeFiltersCount > 0 ? 1.5 : 3 }}>
              <Tooltip title="Filtres avancés">
                <Badge
                  badgeContent={activeFiltersCount}
                  sx={{ "& .MuiBadge-badge": { bgcolor: C.accent, color: "white", fontSize: "0.65rem", minWidth: 16, height: 16 } }}
                >
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
                  placeholder="Rechercher par titre, message, utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%", padding: "11px 16px 11px 48px",
                    backgroundColor: "rgba(59,130,246,0.06)",
                    border: "1px solid rgba(59,130,246,0.18)",
                    borderRadius: "10px", color: "#94a3b8", fontSize: "0.875rem",
                    outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.18)")}
                />
              </Box>
            </Box>

            {/* Active chips */}
            {activeFiltersCount > 0 && (
              <Box sx={{ display: "flex", gap: 1, mb: 2.5, flexWrap: "wrap", alignItems: "center" }}>
                {filterDate !== "all" && (
                  <Chip label={dateOptions.find((d) => d.value === filterDate)?.label}
                    onDelete={() => setFilterDate("all")} size="small"
                    sx={{ bgcolor: C.accentDim, color: C.accent, border: `1px solid rgba(59,130,246,0.3)`, fontWeight: 500 }}
                  />
                )}
                {filterStatus !== "all" && (
                  <Chip label={statusOptions.find((s) => s.value === filterStatus)?.label}
                    onDelete={() => setFilterStatus("all")} size="small"
                    sx={{ bgcolor: C.accentDim, color: C.accent, border: `1px solid rgba(59,130,246,0.3)`, fontWeight: 500 }}
                  />
                )}
                <Button size="small" onClick={() => { setFilterDate("all"); setFilterStatus("all"); }}
                  sx={{ color: C.textMuted, fontSize: "0.75rem", textTransform: "none", py: 0, minHeight: 0, "&:hover": { color: C.danger } }}
                >
                  Tout effacer
                </Button>
              </Box>
            )}

            {/* Filter dropdown */}
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={() => setFilterAnchorEl(null)}
              PaperProps={{
                sx: {
                  bgcolor: "rgba(13,19,33,0.98)", border: `1px solid ${C.borderHi}`,
                  borderRadius: "12px", backdropFilter: "blur(12px)",
                  minWidth: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", mt: 0.5,
                },
              }}
            >
              <SectionLabel icon={<CalendarTodayIcon sx={{ fontSize: 14 }} />} text="Date de réception" />
              {dateOptions.map((opt) => (
                <FilterItem key={opt.value} label={opt.label} active={filterDate === opt.value} onClick={() => setFilterDate(opt.value)} />
              ))}

              <Divider sx={{ borderColor: C.border, my: 1 }} />

              <SectionLabel icon={<ReadIcon sx={{ fontSize: 14 }} />} text="Statut de lecture" />
              {statusOptions.map((opt) => (
                <FilterItem key={opt.value} label={opt.label} active={filterStatus === opt.value} onClick={() => setFilterStatus(opt.value)} />
              ))}

              {activeFiltersCount > 0 && (
                <>
                  <Divider sx={{ borderColor: C.border, mt: 1 }} />
                  <Box sx={{ p: 1.5 }}>
                    <Button fullWidth size="small"
                      onClick={() => { setFilterDate("all"); setFilterStatus("all"); setFilterAnchorEl(null); }}
                      sx={{ color: C.danger, fontSize: "0.8rem", textTransform: "none", border: `1px solid rgba(239,68,68,0.3)`, borderRadius: "6px", "&:hover": { bgcolor: C.dangerDim } }}
                    >
                      Réinitialiser les filtres
                    </Button>
                  </Box>
                </>
              )}
            </Menu>

            {/* List */}
            {filteredNotifications.length > 0 ? (
              <>
                <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {paginatedNotifications.map((notif) => (
                    <Box
                      key={notif.id}
                      onClick={() => { setSelectedNotification(notif); setDetailDialogOpen(true); }}
                      sx={{
                        display: "flex", alignItems: "flex-start", gap: 2,
                        bgcolor: notif.is_read ? C.surface : C.unreadBg,
                        border: `1px solid ${notif.is_read ? C.border : C.borderHi}`,
                        borderLeft: `3px solid ${notif.is_read ? "transparent" : C.accent}`,
                        borderRadius: "10px", p: "14px 18px",
                        cursor: "pointer", transition: "all 0.18s ease",
                        "&:hover": { bgcolor: notif.is_read ? C.surfaceHi : "rgba(59,130,246,0.1)", borderColor: C.accent },
                      }}
                    >
                      <Box sx={{ pt: "5px", flexShrink: 0 }}>
                        <CircleIcon sx={{ fontSize: 8, color: notif.is_read ? C.textMuted : C.accent, opacity: notif.is_read ? 0.35 : 1 }} />
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 0.5 }}>
                          <Typography sx={{ color: C.text, fontWeight: notif.is_read ? 500 : 700, fontSize: "0.9rem", lineHeight: 1.4 }} noWrap>
                            {notif.title}
                          </Typography>
                          <Typography sx={{ color: C.textMuted, fontSize: "0.75rem", flexShrink: 0, pt: "2px" }}>
                            {fmt(notif.created_at)}
                          </Typography>
                        </Box>
                        <Typography sx={{ color: C.textSub, fontSize: "0.82rem", lineHeight: 1.5, mb: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "90%" }}>
                          {notif.message}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                          {notif.alert && notif.alert.module && (
                            <Chip
                              label={getModuleERPLabel(notif.alert.module).name}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.68rem",
                                fontWeight: 600,
                                bgcolor: `${getModuleERPLabel(notif.alert.module).color}20`,
                                color: getModuleERPLabel(notif.alert.module).color,
                                borderRadius: "4px"
                              }}
                            />
                          )}
                          <Chip
                            label={notif.notification_type === "alert_triggered" ? "Alerte" : notif.notification_type}
                            size="small"
                            sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600, bgcolor: C.accentDim, color: C.accentHi, borderRadius: "4px" }}
                          />
                          {notif.priority && (
                            <Chip
                              label={notif.priority === "critical" ? "Critique" : notif.priority === "high" ? "Haute" : notif.priority === "medium" ? "Moyenne" : "Basse"}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.68rem",
                                fontWeight: 600,
                                borderRadius: "4px",
                                bgcolor: notif.priority === "critical" ? "rgba(239,68,68,0.15)" : notif.priority === "high" ? "rgba(249,115,22,0.15)" : notif.priority === "medium" ? "rgba(234,179,8,0.15)" : "rgba(34,197,94,0.15)",
                                color: notif.priority === "critical" ? "#ef4444" : notif.priority === "high" ? "#f97316" : notif.priority === "medium" ? "#eab308" : "#22c55e",
                              }}
                            />
                          )}
                          {notif.user && (
                            <Typography sx={{ color: C.textMuted, fontSize: "0.75rem" }}>
                              {notif.user.username || notif.user.email}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                        {!notif.is_read ? (
                          <Tooltip title="Marquer comme lue" placement="left">
                            <IconButton size="small" onClick={(e) => handleMarkAsRead(notif.id, e)}
                              sx={{ color: C.textMuted, "&:hover": { color: C.success, bgcolor: C.successDim }, borderRadius: "6px", p: "5px" }}
                            >
                              <MarkEmailReadIcon sx={{ fontSize: "1rem" }} />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Marquer comme non lue" placement="left">
                            <IconButton size="small" onClick={(e) => handleMarkAsUnread(notif.id, e)}
                              sx={{ color: C.textMuted, "&:hover": { color: C.accent, bgcolor: C.accentDim }, borderRadius: "6px", p: "5px" }}
                            >
                              <MarkEmailUnreadIcon sx={{ fontSize: "1rem" }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
                {notifTotalPages > 1 && (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1.5, mt: 3, pt: 2, borderTop: `1px solid ${C.border}` }}>
                    <Button size="small" disabled={notifPage === 0} onClick={() => setNotifPage(notifPage - 1)}
                      sx={{ textTransform: "none", color: C.accent, fontSize: "0.8rem" }}>
                      ← Précédent
                    </Button>
                    <Typography sx={{ color: C.textMuted, fontSize: "0.8rem" }}>
                      Page <strong style={{ color: C.text }}>{notifPage + 1}</strong> / {notifTotalPages}
                    </Typography>
                    <Button size="small" disabled={notifPage >= notifTotalPages - 1} onClick={() => setNotifPage(notifPage + 1)}
                      sx={{ textTransform: "none", color: C.accent, fontSize: "0.8rem" }}>
                      Suivant →
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: "center", py: 10, bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px" }}>
                <NotificationsNoneIcon sx={{ fontSize: 48, color: C.border, mb: 2 }} />
                <Typography sx={{ color: C.text, fontWeight: 600, mb: 0.5 }}>Aucune notification</Typography>
                <Typography sx={{ color: C.textMuted, fontSize: "0.85rem" }}>
                  {searchTerm || activeFiltersCount > 0
                    ? "Aucun résultat pour cette recherche ou ces filtres"
                    : "Vous êtes à jour — rien de nouveau pour l'instant"}
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 1 — NOTIFICATIONS DES EMPLOYÉS (Admin uniquement)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 1 && user?.is_superuser && (
          <>
            {/* Toolbar */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: activeEmpNotifFiltersCount > 0 ? 1.5 : 3 }}>
              <Tooltip title="Filtres avancés">
                <Badge
                  badgeContent={activeEmpNotifFiltersCount}
                  sx={{ "& .MuiBadge-badge": { bgcolor: C.accent, color: "white", fontSize: "0.65rem", minWidth: 16, height: 16 } }}
                >
                  <IconButton
                    onClick={(e) => setEmpNotifFilterAnchorEl(e.currentTarget)}
                    sx={{
                      color: activeEmpNotifFiltersCount > 0 ? C.accent : C.textMuted,
                      bgcolor: activeEmpNotifFiltersCount > 0 ? C.accentDim : "rgba(59,130,246,0.05)",
                      border: `1px solid ${activeEmpNotifFiltersCount > 0 ? "rgba(59,130,246,0.4)" : "rgba(59,130,246,0.15)"}`,
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
                  placeholder="Rechercher par titre, message, utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%", padding: "11px 16px 11px 48px",
                    backgroundColor: "rgba(59,130,246,0.06)",
                    border: "1px solid rgba(59,130,246,0.18)",
                    borderRadius: "10px", color: "#94a3b8", fontSize: "0.875rem",
                    outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.18)")}
                />
              </Box>
            </Box>

            {/* Active chips */}
            {activeEmpNotifFiltersCount > 0 && (
              <Box sx={{ display: "flex", gap: 1, mb: 2.5, flexWrap: "wrap", alignItems: "center" }}>
                {empNotifFilterDate !== "all" && (
                  <Chip label={dateOptions.find((d) => d.value === empNotifFilterDate)?.label}
                    onDelete={() => setEmpNotifFilterDate("all")} size="small"
                    sx={{ bgcolor: C.accentDim, color: C.accent, border: `1px solid rgba(59,130,246,0.3)`, fontWeight: 500 }}
                  />
                )}
                {empNotifFilterStatus !== "all" && (
                  <Chip label={statusOptions.find((s) => s.value === empNotifFilterStatus)?.label}
                    onDelete={() => setEmpNotifFilterStatus("all")} size="small"
                    sx={{ bgcolor: C.accentDim, color: C.accent, border: `1px solid rgba(59,130,246,0.3)`, fontWeight: 500 }}
                  />
                )}
                <Button size="small" onClick={() => { setEmpNotifFilterDate("all"); setEmpNotifFilterStatus("all"); }}
                  sx={{ color: C.textMuted, fontSize: "0.75rem", textTransform: "none", py: 0, minHeight: 0, "&:hover": { color: C.danger } }}
                >
                  Tout effacer
                </Button>
              </Box>
            )}

            {/* Filter dropdown */}
            <Menu
              anchorEl={empNotifFilterAnchorEl}
              open={Boolean(empNotifFilterAnchorEl)}
              onClose={() => setEmpNotifFilterAnchorEl(null)}
              PaperProps={{
                sx: {
                  bgcolor: "rgba(13,19,33,0.98)", border: `1px solid ${C.borderHi}`,
                  borderRadius: "12px", backdropFilter: "blur(12px)",
                  minWidth: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", mt: 0.5,
                },
              }}
            >
              <SectionLabel icon={<CalendarTodayIcon sx={{ fontSize: 14 }} />} text="Date de réception" />
              {dateOptions.map((opt) => (
                <FilterItem key={opt.value} label={opt.label} active={empNotifFilterDate === opt.value} onClick={() => setEmpNotifFilterDate(opt.value)} />
              ))}

              <Divider sx={{ borderColor: C.border, my: 1 }} />

              <SectionLabel icon={<ReadIcon sx={{ fontSize: 14 }} />} text="Statut de lecture" />
              {statusOptions.map((opt) => (
                <FilterItem key={opt.value} label={opt.label} active={empNotifFilterStatus === opt.value} onClick={() => setEmpNotifFilterStatus(opt.value)} />
              ))}

              {activeEmpNotifFiltersCount > 0 && (
                <>
                  <Divider sx={{ borderColor: C.border, mt: 1 }} />
                  <Box sx={{ p: 1.5 }}>
                    <Button fullWidth size="small"
                      onClick={() => { setEmpNotifFilterDate("all"); setEmpNotifFilterStatus("all"); setEmpNotifFilterAnchorEl(null); }}
                      sx={{ color: C.danger, fontSize: "0.8rem", textTransform: "none", border: `1px solid rgba(239,68,68,0.3)`, borderRadius: "6px", "&:hover": { bgcolor: C.dangerDim } }}
                    >
                      Réinitialiser les filtres
                    </Button>
                  </Box>
                </>
              )}
            </Menu>

            {/* List */}
            {filteredEmployeeNotifications.length > 0 ? (
              <>
                <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {paginatedEmployeeNotifications.map((notif) => (
                    <Box
                      key={notif.id}
                      onClick={() => { setSelectedNotification(notif); setDetailDialogOpen(true); }}
                      sx={{
                        display: "flex", alignItems: "flex-start", gap: 2,
                        bgcolor: notif.is_read ? C.surface : C.unreadBg,
                        border: `1px solid ${notif.is_read ? C.border : C.borderHi}`,
                        borderLeft: `3px solid ${notif.is_read ? "transparent" : C.accent}`,
                        borderRadius: "10px", p: "14px 18px",
                        cursor: "pointer", transition: "all 0.18s ease",
                        "&:hover": { bgcolor: notif.is_read ? C.surfaceHi : "rgba(59,130,246,0.1)", borderColor: C.accent },
                      }}
                    >
                      <Box sx={{ pt: "5px", flexShrink: 0 }}>
                        <CircleIcon sx={{ fontSize: 8, color: notif.is_read ? C.textMuted : C.accent, opacity: notif.is_read ? 0.35 : 1 }} />
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 0.5 }}>
                          <Typography sx={{ color: C.text, fontWeight: notif.is_read ? 500 : 700, fontSize: "0.9rem", lineHeight: 1.4 }} noWrap>
                            {notif.title}
                          </Typography>
                          <Typography sx={{ color: C.textMuted, fontSize: "0.75rem", flexShrink: 0, pt: "2px" }}>
                            {fmt(notif.created_at)}
                          </Typography>
                        </Box>
                        <Typography sx={{ color: C.textSub, fontSize: "0.82rem", lineHeight: 1.5, mb: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "90%" }}>
                          {notif.message}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                          {notif.alert && notif.alert.module && (
                            <Chip
                              label={getModuleERPLabel(notif.alert.module).name}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.68rem",
                                fontWeight: 600,
                                bgcolor: `${getModuleERPLabel(notif.alert.module).color}20`,
                                color: getModuleERPLabel(notif.alert.module).color,
                                borderRadius: "4px"
                              }}
                            />
                          )}
                          <Chip
                            label={notif.notification_type === "alert_triggered" ? "Alerte" : notif.notification_type}
                            size="small"
                            sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600, bgcolor: C.accentDim, color: C.accentHi, borderRadius: "4px" }}
                          />
                          {notif.priority && (
                            <Chip
                              label={notif.priority === "critical" ? "Critique" : notif.priority === "high" ? "Haute" : notif.priority === "medium" ? "Moyenne" : "Basse"}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.68rem",
                                fontWeight: 600,
                                borderRadius: "4px",
                                bgcolor: notif.priority === "critical" ? "rgba(239,68,68,0.15)" : notif.priority === "high" ? "rgba(249,115,22,0.15)" : notif.priority === "medium" ? "rgba(234,179,8,0.15)" : "rgba(34,197,94,0.15)",
                                color: notif.priority === "critical" ? "#ef4444" : notif.priority === "high" ? "#f97316" : notif.priority === "medium" ? "#eab308" : "#22c55e",
                              }}
                            />
                          )}
                          {notif.user && (
                            <Typography sx={{ color: C.textMuted, fontSize: "0.75rem" }}>
                              {notif.user.username || notif.user.email}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                        {!notif.is_read ? (
                          <Tooltip title="Marquer comme lue" placement="left">
                            <IconButton size="small" onClick={(e) => handleMarkAsRead(notif.id, e)}
                              sx={{ color: C.textMuted, "&:hover": { color: C.success, bgcolor: C.successDim }, borderRadius: "6px", p: "5px" }}
                            >
                              <MarkEmailReadIcon sx={{ fontSize: "1rem" }} />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Marquer comme non lue" placement="left">
                            <IconButton size="small" onClick={(e) => handleMarkAsUnread(notif.id, e)}
                              sx={{ color: C.textMuted, "&:hover": { color: C.accent, bgcolor: C.accentDim }, borderRadius: "6px", p: "5px" }}
                            >
                              <MarkEmailUnreadIcon sx={{ fontSize: "1rem" }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
                {empNotifTotalPages > 1 && (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1.5, mt: 3, pt: 2, borderTop: `1px solid ${C.border}` }}>
                    <Button size="small" disabled={empNotifPage === 0} onClick={() => setEmpNotifPage(empNotifPage - 1)}
                      sx={{ textTransform: "none", color: C.accent, fontSize: "0.8rem" }}>
                      ← Précédent
                    </Button>
                    <Typography sx={{ color: C.textMuted, fontSize: "0.8rem" }}>
                      Page <strong style={{ color: C.text }}>{empNotifPage + 1}</strong> / {empNotifTotalPages}
                    </Typography>
                    <Button size="small" disabled={empNotifPage >= empNotifTotalPages - 1} onClick={() => setEmpNotifPage(empNotifPage + 1)}
                      sx={{ textTransform: "none", color: C.accent, fontSize: "0.8rem" }}>
                      Suivant →
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: "center", py: 10, bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px" }}>
                <NotificationsNoneIcon sx={{ fontSize: 48, color: C.border, mb: 2 }} />
                <Typography sx={{ color: C.text, fontWeight: 600, mb: 0.5 }}>Aucune notification des employés</Typography>
                <Typography sx={{ color: C.textMuted, fontSize: "0.85rem" }}>
                  {searchTerm || activeEmpNotifFiltersCount > 0
                    ? "Aucun résultat pour cette recherche ou ces filtres"
                    : "Aucune notification des employés à afficher"}
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB — MES ALERTES (Admin ou utilisateur normal)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === (user?.is_superuser ? 2 : 1) && (
          <>
            {/* Toolbar */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: activeAlertFiltersCount > 0 ? 1.5 : 3 }}>
              <Tooltip title="Filtres avancés">
                <Badge
                  badgeContent={activeAlertFiltersCount}
                  sx={{ "& .MuiBadge-badge": { bgcolor: C.accent, color: "white", fontSize: "0.65rem", minWidth: 16, height: 16 } }}
                >
                  <IconButton
                    onClick={(e) => setAlertFilterAnchorEl(e.currentTarget)}
                    sx={{
                      color: activeAlertFiltersCount > 0 ? C.accent : C.textMuted,
                      bgcolor: activeAlertFiltersCount > 0 ? C.accentDim : "rgba(59,130,246,0.05)",
                      border: `1px solid ${activeAlertFiltersCount > 0 ? "rgba(59,130,246,0.4)" : "rgba(59,130,246,0.15)"}`,
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
                  placeholder="Rechercher par nom, module, utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%", padding: "11px 16px 11px 48px",
                    backgroundColor: "rgba(59,130,246,0.06)",
                    border: "1px solid rgba(59,130,246,0.18)",
                    borderRadius: "10px", color: "#94a3b8", fontSize: "0.875rem",
                    outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.18)")}
                />
              </Box>
            </Box>

            {/* Active chips — alerts */}
            {activeAlertFiltersCount > 0 && (
              <Box sx={{ display: "flex", gap: 1, mb: 2.5, flexWrap: "wrap", alignItems: "center" }}>
                {alertFilterDate !== "all" && (
                  <Chip label={dateOptions.find((d) => d.value === alertFilterDate)?.label}
                    onDelete={() => setAlertFilterDate("all")} size="small"
                    sx={{ bgcolor: C.accentDim, color: C.accent, border: `1px solid rgba(59,130,246,0.3)`, fontWeight: 500 }}
                  />
                )}
                {alertFilterStatus !== "all" && (
                  <Chip label={alertStatusOptions.find((s) => s.value === alertFilterStatus)?.label}
                    onDelete={() => setAlertFilterStatus("all")} size="small"
                    sx={{ bgcolor: C.accentDim, color: C.accent, border: `1px solid rgba(59,130,246,0.3)`, fontWeight: 500 }}
                  />
                )}
                <Button size="small" onClick={() => { setAlertFilterDate("all"); setAlertFilterStatus("all"); }}
                  sx={{ color: C.textMuted, fontSize: "0.75rem", textTransform: "none", py: 0, minHeight: 0, "&:hover": { color: C.danger } }}
                >
                  Tout effacer
                </Button>
              </Box>
            )}

            {/* Alert filter dropdown */}
            <Menu
              anchorEl={alertFilterAnchorEl}
              open={Boolean(alertFilterAnchorEl)}
              onClose={() => setAlertFilterAnchorEl(null)}
              PaperProps={{
                sx: {
                  bgcolor: "rgba(13,19,33,0.98)", border: `1px solid ${C.borderHi}`,
                  borderRadius: "12px", backdropFilter: "blur(12px)",
                  minWidth: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", mt: 0.5,
                },
              }}
            >
              <SectionLabel icon={<CalendarTodayIcon sx={{ fontSize: 14 }} />} text="Date de création" />
              {dateOptions.map((opt) => (
                <FilterItem key={opt.value} label={opt.label} active={alertFilterDate === opt.value} onClick={() => setAlertFilterDate(opt.value)} />
              ))}

              <Divider sx={{ borderColor: C.border, my: 1 }} />

              <SectionLabel icon={<ReadIcon sx={{ fontSize: 14 }} />} text="Statut" />
              {alertStatusOptions.map((opt) => (
                <FilterItem key={opt.value} label={opt.label} active={alertFilterStatus === opt.value} onClick={() => setAlertFilterStatus(opt.value)} />
              ))}

              {activeAlertFiltersCount > 0 && (
                <>
                  <Divider sx={{ borderColor: C.border, mt: 1 }} />
                  <Box sx={{ p: 1.5 }}>
                    <Button fullWidth size="small"
                      onClick={() => { setAlertFilterDate("all"); setAlertFilterStatus("all"); setAlertFilterAnchorEl(null); }}
                      sx={{ color: C.danger, fontSize: "0.8rem", textTransform: "none", border: `1px solid rgba(239,68,68,0.3)`, borderRadius: "6px", "&:hover": { bgcolor: C.dangerDim } }}
                    >
                      Réinitialiser les filtres
                    </Button>
                  </Box>
                </>
              )}
            </Menu>

            {/* Alerts table */}
            {filteredAlerts.length > 0 ? (
              <>
                <TableContainer component={Box} sx={{ bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: C.surfaceHi }}>
                        {["Alerte", "Utilisateur", "Module", "Statut", "Date"].map((h) => (
                          <TableCell key={h} sx={{ color: C.textMuted, fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", borderColor: C.border, py: "10px", px: 2 }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedAlerts.map((alert, i) => (
                        <TableRow
                          key={alert.id}
                          onClick={() => handleOpenNotificationForm(alert)}
                          sx={{
                            bgcolor: (!alert.is_active || alert.is_paused)
                              ? "rgba(100, 116, 139, 0.05)" // Gris léger pour l'alerte en pause ou inactive
                              : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.012)",
                            opacity: (alert.is_active && !alert.is_paused) ? 1 : 0.6, // Plus terne si en pause ou inactive
                            "&:hover": { 
                              bgcolor: (alert.is_active && !alert.is_paused) ? C.surfaceHi : "rgba(100, 116, 139, 0.1)", 
                              cursor: (alert.is_active && !alert.is_paused) ? "pointer" : "not-allowed" 
                            },
                            "& td": { borderColor: C.border, py: "12px", px: 2 }
                          }}
                        >
                          <TableCell>
                            <Typography sx={{ color: C.text, fontWeight: 600, fontSize: "0.85rem" }}>{alert.name}</Typography>
                            {alert.description && <Typography sx={{ color: C.textMuted, fontSize: "0.75rem", mt: 0.25 }}>{alert.description}</Typography>}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: C.textSub, fontSize: "0.82rem", fontWeight: 500 }}>{alert.user_name || "—"}</Typography>
                            {alert.user_email && <Typography sx={{ color: C.textMuted, fontSize: "0.72rem" }}>{alert.user_email}</Typography>}
                          </TableCell>
                          <TableCell>
                            <Chip label={alert.module} size="small" sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600, bgcolor: C.accentDim, color: C.accentHi, borderRadius: "5px" }} />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={!alert.is_active ? "Inactif" : alert.is_paused ? "En pause" : "Actif"}
                              size="small"
                              sx={{
                                height: 22, fontSize: "0.7rem", fontWeight: 700, borderRadius: "5px",
                                bgcolor: !alert.is_active ? C.dangerDim : alert.is_paused ? "rgba(245, 158, 11, 0.15)" : C.successDim,
                                color: !alert.is_active ? C.danger : alert.is_paused ? "#f59e0b" : C.success,
                                border: `1px solid ${!alert.is_active ? "rgba(239, 68, 68, 0.3)" : alert.is_paused ? "rgba(245, 158, 11, 0.3)" : "rgba(16, 185, 129, 0.3)"}`
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: C.textMuted, fontSize: "0.78rem" }}>{fmt(alert.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {alertTotalPages > 1 && (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1.5, mt: 2, pt: 2, borderTop: `1px solid ${C.border}` }}>
                    <Button size="small" disabled={alertPage === 0} onClick={() => setAlertPage(alertPage - 1)}
                      sx={{ textTransform: "none", color: C.accent, fontSize: "0.8rem" }}>
                      ← Précédent
                    </Button>
                    <Typography sx={{ color: C.textMuted, fontSize: "0.8rem" }}>
                      Page <strong style={{ color: C.text }}>{alertPage + 1}</strong> / {alertTotalPages}
                    </Typography>
                    <Button size="small" disabled={alertPage >= alertTotalPages - 1} onClick={() => setAlertPage(alertPage + 1)}
                      sx={{ textTransform: "none", color: C.accent, fontSize: "0.8rem" }}>
                      Suivant →
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: "center", py: 10, bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px" }}>
                <NotificationsNoneIcon sx={{ fontSize: 48, color: C.border, mb: 2 }} />
                <Typography sx={{ color: C.text, fontWeight: 600, mb: 0.5 }}>Aucune alerte</Typography>
                <Typography sx={{ color: C.textMuted, fontSize: "0.85rem" }}>
                  {searchTerm || activeAlertFiltersCount > 0
                    ? "Aucun résultat pour cette recherche ou ces filtres"
                    : user?.is_superuser
                      ? "Vous n'avez pas encore créé d'alerte"
                      : "Vous n'avez pas encore créé d'alerte"}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate("/new-alert")}
                  sx={{ mt: 2, bgcolor: C.accent, color: "white", textTransform: "none", fontWeight: 600 }}
                >
                  Créer une alerte
                </Button>
              </Box>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB — ALERTES DES EMPLOYÉS (Admin uniquement)
        ══════════════════════════════════════════════════════════ */}
        {user?.is_superuser && activeTab === 3 && (
          <>
            {/* Toolbar */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: activeAlertFiltersCount > 0 ? 1.5 : 3 }}>
              <Tooltip title="Filtres avancés">
                <Badge
                  badgeContent={activeAlertFiltersCount}
                  sx={{ "& .MuiBadge-badge": { bgcolor: C.accent, color: "white", fontSize: "0.65rem", minWidth: 16, height: 16 } }}
                >
                  <IconButton
                    onClick={(e) => setAlertFilterAnchorEl(e.currentTarget)}
                    sx={{
                      color: activeAlertFiltersCount > 0 ? C.accent : C.textMuted,
                      bgcolor: activeAlertFiltersCount > 0 ? C.accentDim : "rgba(59,130,246,0.05)",
                      border: `1px solid ${activeAlertFiltersCount > 0 ? "rgba(59,130,246,0.4)" : "rgba(59,130,246,0.15)"}`,
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
                  placeholder="Rechercher par nom, module, utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%", padding: "11px 16px 11px 48px",
                    backgroundColor: "rgba(59,130,246,0.06)",
                    border: "1px solid rgba(59,130,246,0.18)",
                    borderRadius: "10px", color: "#94a3b8", fontSize: "0.875rem",
                    outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.18)")}
                />
              </Box>
            </Box>

            {/* Active chips — alerts */}
            {activeAlertFiltersCount > 0 && (
              <Box sx={{ display: "flex", gap: 1, mb: 2.5, flexWrap: "wrap", alignItems: "center" }}>
                {alertFilterDate !== "all" && (
                  <Chip label={dateOptions.find((d) => d.value === alertFilterDate)?.label}
                    onDelete={() => setAlertFilterDate("all")} size="small"
                    sx={{ bgcolor: C.accentDim, color: C.accent, border: `1px solid rgba(59,130,246,0.3)`, fontWeight: 500 }}
                  />
                )}
                {alertFilterStatus !== "all" && (
                  <Chip label={alertStatusOptions.find((s) => s.value === alertFilterStatus)?.label}
                    onDelete={() => setAlertFilterStatus("all")} size="small"
                    sx={{ bgcolor: C.accentDim, color: C.accent, border: `1px solid rgba(59,130,246,0.3)`, fontWeight: 500 }}
                  />
                )}
                <Button size="small" onClick={() => { setAlertFilterDate("all"); setAlertFilterStatus("all"); }}
                  sx={{ color: C.textMuted, fontSize: "0.75rem", textTransform: "none", py: 0, minHeight: 0, "&:hover": { color: C.danger } }}
                >
                  Tout effacer
                </Button>
              </Box>
            )}

            {/* Alertes des employés table */}
            {filteredEmployeeAlerts.length > 0 ? (
              <>
                <TableContainer component={Box} sx={{ bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: C.surfaceHi }}>
                        {["Alerte", "Utilisateur", "Module", "Statut", "Date"].map((h) => (
                          <TableCell key={h} sx={{ color: C.textMuted, fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", borderColor: C.border, py: "10px", px: 2 }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedEmployeeAlerts.map((alert, i) => (
                        <TableRow
                          key={alert.id}
                          onClick={() => handleOpenNotificationForm(alert)}
                          sx={{
                            bgcolor: (!alert.is_active || alert.is_paused)
                              ? "rgba(100, 116, 139, 0.05)" 
                              : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.012)",
                            opacity: (alert.is_active && !alert.is_paused) ? 1 : 0.6,
                            "&:hover": { 
                              bgcolor: (alert.is_active && !alert.is_paused) ? C.surfaceHi : "rgba(100, 116, 139, 0.1)", 
                              cursor: (alert.is_active && !alert.is_paused) ? "pointer" : "not-allowed" 
                            },
                            "& td": { borderColor: C.border, py: "12px", px: 2 }
                          }}
                        >
                          <TableCell>
                            <Typography sx={{ color: C.text, fontWeight: 600, fontSize: "0.85rem" }}>{alert.name}</Typography>
                            {alert.description && <Typography sx={{ color: C.textMuted, fontSize: "0.75rem", mt: 0.25 }}>{alert.description}</Typography>}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: C.textSub, fontSize: "0.82rem", fontWeight: 500 }}>{alert.user_name || "—"}</Typography>
                            {alert.user_email && <Typography sx={{ color: C.textMuted, fontSize: "0.72rem" }}>{alert.user_email}</Typography>}
                          </TableCell>
                          <TableCell>
                            <Chip label={alert.module} size="small" sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600, bgcolor: C.accentDim, color: C.accentHi, borderRadius: "5px" }} />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={!alert.is_active ? "Inactif" : alert.is_paused ? "En pause" : "Actif"}
                              size="small"
                              sx={{
                                height: 22, fontSize: "0.7rem", fontWeight: 700, borderRadius: "5px",
                                bgcolor: !alert.is_active ? C.dangerDim : alert.is_paused ? "rgba(245, 158, 11, 0.15)" : C.successDim,
                                color: !alert.is_active ? C.danger : alert.is_paused ? "#f59e0b" : C.success,
                                border: `1px solid ${!alert.is_active ? "rgba(239, 68, 68, 0.3)" : alert.is_paused ? "rgba(245, 158, 11, 0.3)" : "rgba(16, 185, 129, 0.3)"}`
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: C.textMuted, fontSize: "0.78rem" }}>{fmt(alert.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {empAlertTotalPages > 1 && (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1.5, mt: 2, pt: 2, borderTop: `1px solid ${C.border}` }}>
                    <Button size="small" disabled={empAlertPage === 0} onClick={() => setEmpAlertPage(empAlertPage - 1)}
                      sx={{ textTransform: "none", color: C.accent, fontSize: "0.8rem" }}>
                      ← Précédent
                    </Button>
                    <Typography sx={{ color: C.textMuted, fontSize: "0.8rem" }}>
                      Page <strong style={{ color: C.text }}>{empAlertPage + 1}</strong> / {empAlertTotalPages}
                    </Typography>
                    <Button size="small" disabled={empAlertPage >= empAlertTotalPages - 1} onClick={() => setEmpAlertPage(empAlertPage + 1)}
                      sx={{ textTransform: "none", color: C.accent, fontSize: "0.8rem" }}>
                      Suivant →
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: "center", py: 10, bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px" }}>
                <NotificationsNoneIcon sx={{ fontSize: 48, color: C.border, mb: 2 }} />
                <Typography sx={{ color: C.text, fontWeight: 600, mb: 0.5 }}>Aucune alerte</Typography>
                <Typography sx={{ color: C.textMuted, fontSize: "0.85rem" }}>
                  {searchTerm || activeAlertFiltersCount > 0
                    ? "Aucun résultat pour cette recherche ou ces filtres"
                    : "Aucune alerte des employés à afficher"}
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB — PARAMÈTRES (selon le rôle)
        ══════════════════════════════════════════════════════════ */}
        {(user?.is_superuser ? activeTab === 4 : activeTab === 2) && (
          <Box sx={{ maxWidth: 10000 }}>
            {/* Canaux de notification */}
            <Box sx={{ mb: 4, p: 3, bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <NotificationsIcon sx={{ color: C.accent, fontSize: 24 }} />
                <Typography sx={{ color: C.text, fontWeight: 700, fontSize: "1.1rem" }}>Canaux de notification</Typography>
              </Box>
              <Typography sx={{ color: C.textMuted, fontSize: "0.85rem", mb: 2 }}>Choisissez les canaux par lesquels vous souhaitez recevoir les notifications</Typography>

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
                      <Typography sx={{ color: C.text, fontWeight: 600, fontSize: "0.95rem" }}>{channel.label}</Typography>
                      <Typography sx={{ color: C.textMuted, fontSize: "0.75rem", mt: 0.25 }}>
                        {channel.value === 'email' && 'Recevoir les notifications par email'}
                        {channel.value === 'in-app' && 'Recevoir les notifications dans l\'application'}
                        {channel.value === 'telegram' && 'Recevoir les notifications sur Telegram'}
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

            {/* Planification */}
            <Box sx={{ mb: 4, p: 3, bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                <ScheduleIcon sx={{ color: C.accent, fontSize: 24 }} />
                <Typography sx={{ color: C.text, fontWeight: 700, fontSize: "1.1rem" }}>Fréquence de vérification</Typography>
              </Box>
              <Typography sx={{ color: C.textMuted, fontSize: "0.85rem", mb: 2 }}>Définissez la fréquence à laquelle les alertes sont vérifiées</Typography>

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
                      <Typography sx={{ color: C.text, fontWeight: 600, fontSize: "0.9rem" }}>{option.label}</Typography>
                    </Box>
                    <Typography sx={{ color: C.textMuted, fontSize: "0.75rem", pl: 3 }}>{option.description}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Section Email */}
            {notificationSettings.emailEnabled && (
              <Box sx={{ mb: 4, p: 3, bgcolor: C.surface, border: `1px solid ${C.borderHi}`, borderRadius: "12px", borderLeft: `3px solid ${C.accent}` }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <EmailIcon sx={{ color: C.accent, fontSize: 24 }} />
                  <Typography sx={{ color: C.text, fontWeight: 700, fontSize: "1.1rem" }}>Configuration email</Typography>
                </Box>
                <Typography sx={{ color: C.textMuted, fontSize: "0.85rem", mb: 3 }}>Ajoutez une ou plusieurs adresses email pour recevoir les notifications</Typography>

                <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                  <TextField
                    fullWidth
                    label="Ajouter une adresse"
                    type="text"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="admin@example.com, manager@example.com"
                    helperText="Séparez par une virgule, un point-virgule ou un retour à la ligne."
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
                    Ajouter
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

            {/* Section Telegram */}
            {notificationSettings.telegramEnabled && (
              <Box sx={{ mb: 4, p: 3, bgcolor: C.surface, border: `1px solid ${C.borderHi}`, borderRadius: "12px", borderLeft: `3px solid #26A5E4` }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <TelegramIcon sx={{ color: '#26A5E4', fontSize: 24 }} />
                  <Typography sx={{ color: C.text, fontWeight: 700, fontSize: "1.1rem" }}>Configuration Telegram</Typography>
                </Box>
                <Typography sx={{ color: C.textMuted, fontSize: "0.85rem", mb: 3 }}>
                  Configurez votre bot Telegram pour recevoir les notifications
                </Typography>

                <TextField
                  fullWidth
                  label="ID du Chat Telegram"
                  type="text"
                  value={notificationSettings.telegramChatId}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, telegramChatId: e.target.value })}
                  placeholder="Ex: 123456789 ou @username"
                  helperText="L'ID de votre chat Telegram pour recevoir les notifications"
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
                    Pour obtenir votre ID de chat Telegram, envoyez un message à @BotFather pour créer un bot, 
                    puis à @userinfobot pour obtenir votre ID utilisateur.
                  </Typography>
                </Alert>
              </Box>
            )}

            {/* Action buttons */}
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
                Annuler
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
                Enregistrer
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* ── Detail Dialog ────────────────────────────────────────────────── */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "14px", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" } }}
      >
        {selectedNotification && (
          <>
            <DialogTitle sx={{ color: C.text, fontWeight: 700, fontSize: "1rem", borderBottom: `1px solid ${C.border}`, py: 2, px: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              Détail de la notification
              <Chip label={selectedNotification.is_read ? "Lue" : "Non lue"} size="small"
                sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700, borderRadius: "5px", bgcolor: selectedNotification.is_read ? C.successDim : C.dangerDim, color: selectedNotification.is_read ? C.success : C.danger }}
              />
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
              <Typography sx={{ color: C.textMuted, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.5 }}>Titre</Typography>
              <Typography sx={{ color: C.text, fontWeight: 700, fontSize: "1.05rem", mb: 2.5 }}>{selectedNotification.title}</Typography>

              <Typography sx={{ color: C.textMuted, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.5 }}>Message</Typography>
              <Typography sx={{ color: C.textSub, lineHeight: 1.7, mb: 2.5, fontSize: "0.875rem" }}>{selectedNotification.message}</Typography>

              <Divider sx={{ borderColor: C.border, my: 2 }} />

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5 }}>
                <Box>
                  <Typography sx={{ color: C.textMuted, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.75 }}>Type</Typography>
                  <Chip label={selectedNotification.notification_type} size="small" sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600, bgcolor: C.accentDim, color: C.accentHi, borderRadius: "5px" }} />
                </Box>
                {selectedNotification.user && (
                  <Box>
                    <Typography sx={{ color: C.textMuted, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.75 }}>Utilisateur</Typography>
                    <Typography sx={{ color: C.text, fontWeight: 600, fontSize: "0.85rem" }}>{selectedNotification.user.username}</Typography>
                    <Typography sx={{ color: C.textMuted, fontSize: "0.75rem" }}>{selectedNotification.user.email}</Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ mt: 2.5 }}>
                <Typography sx={{ color: C.textMuted, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.5 }}>Reçue le</Typography>
                <Typography sx={{ color: C.textSub, fontSize: "0.82rem" }}>{fmtFull(selectedNotification.created_at)}</Typography>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: `1px solid ${C.border}`, gap: 1 }}>
              <Button onClick={() => setDetailDialogOpen(false)} sx={{ color: C.textMuted, textTransform: "none", fontWeight: 600, fontSize: "0.82rem", px: 2 }}>Fermer</Button>
              {!selectedNotification.is_read ? (
                <Button variant="contained" startIcon={<MarkEmailReadIcon sx={{ fontSize: "1rem" }} />}
                  onClick={(e) => { handleMarkAsRead(selectedNotification.id, e); setDetailDialogOpen(false); }}
                  sx={{ bgcolor: C.success, color: "white", textTransform: "none", fontWeight: 600, fontSize: "0.82rem", px: 2, borderRadius: "8px", boxShadow: "none", "&:hover": { bgcolor: "#059669", boxShadow: "none" } }}
                >
                  Marquer comme lue
                </Button>
              ) : (
                <Button variant="contained" startIcon={<MarkEmailUnreadIcon sx={{ fontSize: "1rem" }} />}
                  onClick={(e) => { handleMarkAsUnread(selectedNotification.id, e); setDetailDialogOpen(false); }}
                  sx={{ bgcolor: C.accent, color: "white", textTransform: "none", fontWeight: 600, fontSize: "0.82rem", px: 2, borderRadius: "8px", boxShadow: "none", "&:hover": { bgcolor: "#2563eb", boxShadow: "none" } }}
                >
                  Marquer comme non lue
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Notification Form Dialog ───────────────────────────────────── */}
      <Dialog open={notificationDialogOpen} onClose={() => setNotificationDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: "14px", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" } }}
      >
        <DialogTitle sx={{ color: C.text, fontWeight: 700, fontSize: "1rem", borderBottom: `1px solid ${C.border}`, py: 2, px: 3 }}>
          Créer une notification
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {selectedAlert && (
            <Box sx={{ mb: 3, p: 2, bgcolor: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: "8px" }}>
              <Typography sx={{ color: C.textMuted, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", mb: 0.75 }}>
                Alerte associée
              </Typography>
              <Typography sx={{ color: C.text, fontWeight: 600, fontSize: "0.95rem", mb: 0.5 }}>{selectedAlert.name}</Typography>
              <Typography sx={{ color: C.textSub, fontSize: "0.8rem" }}>{selectedAlert.user?.username} ({selectedAlert.user?.email})</Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              label="Titre"
              value={notificationForm.title}
              onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
              sx={{
                "& .MuiOutlinedInput-root": { color: "white", borderColor: C.border },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: C.border },
                "& .MuiInputBase-input::placeholder": { color: C.textMuted, opacity: 0.7 },
                "& .MuiInputLabel-root": { color: C.textMuted },
                "& .MuiInputBase-input:disabled": { color: "white", WebkitTextFillColor: "white" },
              }}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Message"
              value={notificationForm.message}
              onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
              multiline
              rows={4}
              disabled={!isCustomizing}
              sx={{
                "& .MuiOutlinedInput-root": { color: "white", borderColor: C.border },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: C.border },
                "& .MuiInputBase-input::placeholder": { color: C.textMuted, opacity: 0.7 },
                "& .MuiInputLabel-root": { color: C.textMuted },
                "& .MuiInputBase-input:disabled": { color: "white", WebkitTextFillColor: "white" },
              }}
              variant="outlined"
            />

            <Box>
              <Typography sx={{ color: C.textMuted, fontSize: "0.75rem", fontWeight: 700, mb: 1.5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Variables de personnalisation
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                {[
                  { token: "{{user}}", label: "Nom" },
                  { token: "{{email}}", label: "Email" },
                  { token: "{{alert}}", label: "Nom d'alerte" },
                  { token: "{{module}}", label: "Module" },
                  { token: "{{date}}", label: "Date" },
                ].map((t) => (
                  <Chip
                    key={t.token}
                    label={t.label}
                    onClick={() => insertToken("message", t.token)}
                    sx={{
                      bgcolor: "rgba(59,130,246,0.08)",
                      color: C.accentHi,
                      border: `1px dashed ${C.borderHi}`,
                      fontSize: "0.75rem",
                      height: 26,
                      "&:hover": { bgcolor: C.accentDim, borderColor: C.accent },
                    }}
                  />
                ))}
              </Box>
              <Typography variant="caption" sx={{ color: C.textMuted, fontStyle: "italic", fontSize: "0.7rem" }}>
                Cliquez sur une variable pour l'insérer dans le message. Les variables seront remplacées dynamiquement lors de l'envoi.
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ color: C.textMuted, fontSize: "0.75rem", fontWeight: 700, mb: 1, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Type de notification
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {[  
                  { value: "alert_triggered", label: "Alerte déclenchée" },
                  { value: "alert_updated", label: "Alerte mise à jour" },
                  { value: "system", label: "Système" },
                ].map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    onClick={() => setNotificationForm({ ...notificationForm, notification_type: opt.value })}
                    sx={{
                      bgcolor: notificationForm.notification_type === opt.value ? C.accent : C.surfaceHi,
                      color: notificationForm.notification_type === opt.value ? "white" : C.textMuted,
                      border: `1px solid ${notificationForm.notification_type === opt.value ? C.accent : C.border}`,
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      "&:hover": { bgcolor: notificationForm.notification_type === opt.value ? "#2563eb" : C.borderHi },
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography sx={{ color: C.textMuted, fontSize: "0.75rem", fontWeight: 700, mb: 1, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Niveau de priorité
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {[
                  { value: "critical", label: "Critique", color: "#ef4444" },
                  { value: "high", label: "Haute", color: "#f97316" },
                  { value: "medium", label: "Moyenne", color: "#3b82f6" },
                  { value: "low", label: "Basse", color: "#10b981" },
                ].map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    onClick={() => setNotificationForm({ ...notificationForm, priority: opt.value })}
                    sx={{
                      bgcolor: notificationForm.priority === opt.value ? opt.color : C.surfaceHi,
                      color: notificationForm.priority === opt.value ? "white" : C.textMuted,
                      border: `1px solid ${notificationForm.priority === opt.value ? opt.color : C.border}`,
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      "&:hover": { bgcolor: notificationForm.priority === opt.value ? opt.color : C.borderHi },
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography sx={{ color: C.textMuted, fontSize: "0.75rem", fontWeight: 700, mb: 1, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Canaux d'envoi
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {[
                  { value: "email", label: "Email" },
                  { value: "inapp", label: "In-App" },
                  { value: "telegram", label: "Telegram" },
                ].map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    onClick={() => {
                        const currentChannels = notificationForm.channels || [];
                        const nextChannels = currentChannels.includes(opt.value)
                          ? currentChannels.filter(c => c !== opt.value)
                          : [...currentChannels, opt.value];
                        setNotificationForm({ ...notificationForm, channels: nextChannels });
                    }}
                    sx={{
                      bgcolor: notificationForm.channels?.includes(opt.value) ? C.accent : C.surfaceHi,
                      color: notificationForm.channels?.includes(opt.value) ? "white" : C.textMuted,
                      border: `1px solid ${notificationForm.channels?.includes(opt.value) ? C.accent : C.border}`,
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      "&:hover": { bgcolor: notificationForm.channels?.includes(opt.value) ? "#2563eb" : C.borderHi },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: `1px solid ${C.border}`, gap: 1 }}>
          <Button 
            variant="outlined"
            onClick={() => {
              setIsCustomizing(true);
              setSuccessMessage("Mode personnalisation activé !");
            }}
            disabled={isCustomizing}
            sx={{ 
              color: isCustomizing ? C.textMuted : C.accentHi, 
              borderColor: isCustomizing ? C.border : C.borderHi, 
              textTransform: "none", 
              fontWeight: 600, 
              fontSize: "0.82rem", 
              px: 2,
              borderRadius: "8px",
              "&:hover": { borderColor: C.accent, bgcolor: C.accentDim }
            }}
          >
         Personnaliser
          </Button>
          <Button onClick={() => setNotificationDialogOpen(false)} sx={{ color: C.textMuted, textTransform: "none", fontWeight: 600, fontSize: "0.82rem", px: 2 }}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateNotification}
            sx={{ bgcolor: C.accent, color: "white", textTransform: "none", fontWeight: 600, fontSize: "0.82rem", px: 2.5, borderRadius: "8px", boxShadow: "none", "&:hover": { bgcolor: "#2563eb", boxShadow: "none" } }}
          >
            Créer et envoyer
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Toasts ─────────────────────────────────────────────────────────── */}
      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity="success" sx={{ borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem" }}>{successMessage}</Alert>
      </Snackbar>
      <Snackbar open={!!errorMessage} autoHideDuration={3000} onClose={() => setErrorMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity="error" sx={{ borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem" }}>{errorMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Notifications;
