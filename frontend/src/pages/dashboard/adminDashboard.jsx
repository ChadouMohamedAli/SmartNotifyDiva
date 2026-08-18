import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useActivityContext } from "../../context/ActivityContext";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
  Paper,
  Chip,
  Menu,
  MenuItem,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  Menu as MenuIcon,
  People as PeopleIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  PersonAdd as PersonAddIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  PriorityHigh as PriorityHighIcon,
} from "@mui/icons-material";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

import SharedSidebar from "../../components/SharedSidebar";
import { authFetch } from "../../utils/authFetch";

// ─────────────────────────────────────────────
// NotificationActivityChart (Canvas Area Chart)
// ─────────────────────────────────────────────
const NotificationActivityChart = () => {
  const canvasRef = useRef(null);
  const animProgress = useRef(0);
  const rafRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const datasets = [
    {
      label: "envoyées",
      color: "#3b82f6",
      fillColor: "rgba(59, 130, 246, 0.15)",
      data: [45, 52, 60, 44, 72, 24, 18],
    },
    {
      label: "résolues",
      color: "#22c55e",
      fillColor: "rgba(34, 197, 94, 0.15)",
      data: [38, 44, 54, 43, 60, 22, 17],
    },
    {
      label: "critiques",
      color: "#ef4444",
      fillColor: "rgba(239, 68, 68, 0.1)",
      data: [6, 8, 7, 3, 12, 5, 1],
    },
  ];

  const maxVal = 80;
  const yTicks = [0, 20, 40, 60, 80];

  const catmullRomPoints = (pts, tension = 0.4) => {
    const result = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      result.push({
        cp1x: p1.x + (p2.x - p0.x) * tension,
        cp1y: p1.y + (p2.y - p0.y) * tension,
        cp2x: p2.x - (p3.x - p1.x) * tension,
        cp2y: p2.y - (p3.y - p1.y) * tension,
      });
    }
    return result;
  };

  const drawChart = (progress = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const displayW = canvas.offsetWidth;
    const displayH = canvas.offsetHeight;
    if (displayW === 0 || displayH === 0) return;
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    ctx.scale(dpr, dpr);

    const W = displayW;
    const H = displayH;
    const padL = 44;
    const padR = 20;
    const padT = 16;
    const padB = 40;
    const chartH = H - padT - padB;
    const chartW = W - padL - padR;

    ctx.clearRect(0, 0, W, H);

    ctx.font = "11px 'DM Sans', sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "right";
    yTicks.forEach((tick) => {
      const y = padT + chartH - (tick / maxVal) * chartH;
      ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      ctx.fillText(tick, padL - 8, y + 4);
    });

    ctx.textAlign = "center";
    days.forEach((day, i) => {
      const x = padL + (i / (days.length - 1)) * chartW;
      ctx.fillText(day, x, H - padB + 18);
    });

    [...datasets].reverse().forEach((ds) => {
      const points = ds.data.map((val, i) => ({
        x: padL + (i / (days.length - 1)) * chartW,
        y: padT + chartH - ((val * progress) / maxVal) * chartH,
      }));

      const cps = catmullRomPoints(points);
      const bottomY = padT + chartH;

      ctx.beginPath();
      ctx.moveTo(points[0].x, bottomY);
      ctx.lineTo(points[0].x, points[0].y);
      cps.forEach(({ cp1x, cp1y, cp2x, cp2y }, i) => {
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i + 1].x, points[i + 1].y);
      });
      ctx.lineTo(points[points.length - 1].x, bottomY);
      ctx.closePath();
      ctx.fillStyle = ds.fillColor;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      cps.forEach(({ cp1x, cp1y, cp2x, cp2y }, i) => {
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i + 1].x, points[i + 1].y);
      });
      ctx.strokeStyle = ds.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.stroke();

      points.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = ds.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = "#0f172a";
        ctx.fill();
      });
    });
  };

  useEffect(() => {
    const startTime = performance.now();
    const duration = 1000;
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      animProgress.current = eased;
      drawChart(eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => drawChart(animProgress.current);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const W = rect.width;
    const H = rect.height;
    const padL = 44;
    const padR = 20;
    const padT = 16;
    const padB = 40;
    const chartH = H - padT - padB;
    const chartW = W - padL - padR;

    let closestDay = null;
    let closestDist = Infinity;
    datasets[0].data.forEach((_, i) => {
      const x = padL + (i / (days.length - 1)) * chartW;
      const dist = Math.abs(mouseX - x);
      if (dist < closestDist && dist < 30) {
        closestDist = dist;
        closestDay = i;
      }
    });

    if (closestDay !== null) {
      const dayData = datasets.map((ds) => ({
        label: ds.label,
        value: ds.data[closestDay],
        color: ds.color,
      }));
      setTooltip({ day: days[closestDay], data: dayData, x: e.clientX, y: e.clientY });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => setTooltip(null);

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
        <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
          Activité des notifications
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.82rem", mb: 1.5 }}>
        Tendance sur les 7 derniers jours
      </Typography>

      <Box sx={{ width: "100%", height: 220, position: "relative" }}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {tooltip && (
          <Box
            sx={{
              position: "fixed",
              left: tooltip.x + 15,
              top: tooltip.y - 10,
              bgcolor: "rgba(15, 23, 42, 0.98)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: 2,
              p: 1.5,
              minWidth: 140,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
              zIndex: 9999,
              pointerEvents: "none",
            }}
          >
            <Typography sx={{ color: "white", fontWeight: 700, fontSize: "0.85rem", mb: 1 }}>
              {tooltip.day}
            </Typography>
            {tooltip.data.map((item) => (
              <Box key={item.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: item.color }} />
                  <Typography sx={{ color: "#94a3b8", fontSize: "0.75rem" }}>{item.label}</Typography>
                </Box>
                <Typography sx={{ color: "white", fontWeight: 700, fontSize: "0.8rem" }}>{item.value}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 3, justifyContent: "center", mt: 2 }}>
        {datasets.map((ds) => (
          <Box key={ds.label} sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Box sx={{ position: "relative", width: 24, height: 12, display: "flex", alignItems: "center" }}>
              <Box sx={{ width: "100%", height: 2, bgcolor: ds.color, borderRadius: 1 }} />
              <Box
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  bgcolor: ds.color,
                  border: "1.5px solid #0f172a",
                }}
              />
            </Box>
            <Typography sx={{ fontSize: "0.8rem", color: ds.color, fontWeight: 500 }}>{ds.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────
// UrgentAlertsModal
// ─────────────────────────────────────────────
const UrgentAlertsModal = ({ open, onClose, alerts }) => {
  const urgentAlerts = alerts.filter(
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
            sx={{ color: "#64748b", "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.1)" } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{
        p: 0, maxHeight: 420, overflowY: "auto",
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
                    "&:hover": { bgcolor: `${bg}`, borderColor: `${color}60`, transform: "translateX(2px)" },
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
                        bgcolor: `${color}20`, color, fontWeight: 700, fontSize: "0.65rem",
                        height: 20, border: `1px solid ${color}40`,
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
                      {new Date(alert.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
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
          px: 3, py: 2,
          borderTop: "1px solid rgba(239, 68, 68, 0.15)",
          background: "rgba(15,23,42,0.4)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <Typography sx={{ color: "#475569", fontSize: "0.78rem" }}>
          Connecté en tant qu'administrateur
        </Typography>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: "#ef4444", color: "white", fontWeight: 600, fontSize: "0.85rem",
            px: 3, py: 0.8, borderRadius: 2, textTransform: "none",
            "&:hover": { bgcolor: "#dc2626", boxShadow: "0 4px 16px rgba(239,68,68,0.4)" },
          }}
        >
          Accéder au tableau de bord
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────
// AdminDashboard principal
// ─────────────────────────────────────────────
const AdminDashboard = () => {
  const { user } = useAuth();
  const { activityRefreshTrigger } = useActivityContext();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [avatarMenuAnchorEl, setAvatarMenuAnchorEl] = useState(null); // ← NEW
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alertDetailsOpen, setAlertDetailsOpen] = useState(false);
  const [notificationsData, setNotificationsData] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [onlineUsersOpen, setOnlineUsersOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({ count: 0, users: [] });
  const [productsPage, setProductsPage] = useState(1);
  const [notifMenuPage, setNotifMenuPage] = useState(0);
  const [products, setProducts] = useState([]);
  const [openUrgentModal, setOpenUrgentModal] = useState(true);

  const [dashboardData, setDashboardData] = useState({
    stats: {
      activeAlerts: 0,
      sentNotifications: 0,
      resolvedAlerts: 0,
      pendingOrders: 0,
      configuredRules: 0,
      systemStatus: "active",
      totalUsers: 0,
      activeUsers: 0,
    },
    users: [],
    alerts: [],
    notifications: [],
    alertTrend: [],
    moduleDistribution: [],
    recentActivity: [],
  });

  const formatActivityTime = (value) => {
    if (!value) return "Récemment";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  };

  const formatRelativeTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return "Maintenant";
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}j`;
  };

  const getNotificationDotColor = (notif) => {
    const type = String(notif?.notification_type || "").toLowerCase();
    if (type.includes("alert")) return "#ef4444";
    if (type.includes("warning")) return "#f59e0b";
    return "#10b981";
  };

  const isResolvedNotification = (notif) => {
    const title = String(notif?.title || "").toLowerCase();
    const message = String(notif?.message || "").toLowerCase();
    const type = String(notif?.notification_type || "").toLowerCase();
    return (
      type.includes("resolved") ||
      title.includes("résol") ||
      title.includes("resol") ||
      message.includes("[resolved]") ||
      message.includes("condition résolue") ||
      message.includes("alerte résolue")
    );
  };

  const mapActivityToTimeline = (activity) => {
    const actionType = activity?.action_type;
    let icon = "notification";
    let color = "#8b5cf6";
    let title = activity?.title || "Activité système";
    let description = activity?.description || "";

    if (actionType === "product_created") {
      icon = "package"; color = "#3b82f6";
      title = activity?.title || "Nouveau produit";
    } else if (actionType === "user_created") {
      icon = "user"; color = "#10b981";
      title = activity?.title || "Nouvel utilisateur";
    } else if (actionType === "category_created") {
      icon = "category"; color = "#f59e0b";
      title = activity?.title || "Nouvelle catégorie";
    } else if (actionType === "alert_created") {
      icon = "notification"; color = "#ef4444";
      title = activity?.title || "Nouvelle alerte";
    }

    return {
      id: activity?.id || `${actionType}-${activity?.created_at || Math.random()}`,
      icon, color, title, description,
      time: formatActivityTime(activity?.created_at),
    };
  };

  const getActivityIcon = (iconType) => {
    switch (iconType) {
      case "warning":      return <ErrorIcon sx={{ fontSize: 18 }} />;
      case "check":        return <CheckCircleIcon sx={{ fontSize: 18 }} />;
      case "notification": return <NotificationsIcon sx={{ fontSize: 18 }} />;
      case "sync":         return <SyncIcon sx={{ fontSize: 18 }} />;
      case "user":         return <PersonAddIcon sx={{ fontSize: 18 }} />;
      case "settings":     return <SettingsIcon sx={{ fontSize: 18 }} />;
      case "package":      return <InventoryIcon sx={{ fontSize: 18 }} />;
      case "category":     return <CategoryIcon sx={{ fontSize: 18 }} />;
      default:             return <NotificationsIcon sx={{ fontSize: 18 }} />;
    }
  };

  // Fetch principale
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersResponse, alertsResponse, productsResponse, ordersStatsResponse] = await Promise.all([
          authFetch("/admin/users/"),
          authFetch("/alerts/"),
          authFetch("/stock/products/"),
          authFetch("/orders/orders/statistics/"),
        ]);

        const usersData = usersResponse.ok ? await usersResponse.json() : {};
        const alertsData = alertsResponse.ok ? await alertsResponse.json() : {};
        const productsData = productsResponse.ok ? await productsResponse.json() : {};
        const ordersStatsData = ordersStatsResponse.ok ? await ordersStatsResponse.json() : {};

        const users = Array.isArray(usersData) ? usersData : usersData.results || [];
        let allAlerts = [];
        if (Array.isArray(alertsData)) allAlerts = alertsData;
        else if (alertsData.results) allAlerts = alertsData.results;
        else if (alertsData.data) allAlerts = alertsData.data;

        let allProducts = [];
        if (Array.isArray(productsData)) allProducts = productsData;
        else if (productsData.results) allProducts = productsData.results;
        else if (productsData.data) allProducts = productsData.data;

        setProducts(allProducts);

        const totalUsers = users.length;
        const activeUsers = users.filter((u) => u.is_active === true).length;
        const activeAlerts = allAlerts.filter(
          (a) => a.is_active === true || a.status === "active" || a.status === "ACTIVE" || a.active === true
        ).length;
        const resolvedAlerts = allAlerts.filter(
          (a) => a.is_active === false || a.status === "resolved" || a.status === "RESOLVED"
        ).length;
        const pendingOrders = Number(ordersStatsData?.pending) || 0;

        setDashboardData((prev) => ({
          ...prev,
          stats: {
            activeAlerts, sentNotifications: 0, resolvedAlerts, pendingOrders,
            configuredRules: allAlerts.length, totalUsers, activeUsers,
          },
          users,
          alerts: allAlerts,
        }));
      } catch (err) {
        console.log("Erreur dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Polling activités récentes
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await authFetch("/activity/recent/?limit=6");
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data?.results || [];
          setDashboardData((prev) => ({
            ...prev,
            recentActivity: items.map(mapActivityToTimeline),
          }));
        }
      } catch (err) {
        console.log("Erreur activités:", err);
      }
    };
    fetchActivities();
    const interval = setInterval(fetchActivities, 3000);
    return () => clearInterval(interval);
  }, [activityRefreshTrigger]);

  // Polling notifications
  const fetchNotifications = async () => {
    try {
      const res = await authFetch("/notifications/");
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json?.results || [];
        setNotificationsData(items);
        setUnreadNotifications(items.filter((i) => i?.is_read === false));
        const sentNotifications = items.length;
        const resolvedFromNotifications = items.filter(isResolvedNotification).length;
        setDashboardData((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            sentNotifications,
            resolvedAlerts: Math.max(prev?.stats?.resolvedAlerts || 0, resolvedFromNotifications),
          },
        }));
      }
    } catch (err) {
      console.log("Erreur notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch online users
  const fetchOnlineUsers = async () => {
    try {
      const res = await authFetch("/auth/users/online/", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setOnlineUsers(data);
      }
    } catch (err) {
      console.log("Erreur récupération utilisateurs en ligne:", err);
    }
  };

  useEffect(() => {
    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuClick = (event, user) => { setAnchorEl(event.currentTarget); setSelectedUser(user); };
  const handleMenuClose = () => { setAnchorEl(null); setSelectedUser(null); };
  const handleEditUser = () => {
    if (selectedUser?.id) { navigate(`/admin/users/${selectedUser.id}/edit`); handleMenuClose(); }
  };
  const handleDeleteUser = () => { setDeleteDialogOpen(true); handleMenuClose(); };
  const handleOpenOnlineUsers = () => { fetchOnlineUsers(); setOnlineUsersOpen(true); };
  const handleCloseOnlineUsers = () => setOnlineUsersOpen(false);
  const confirmDeleteUser = () => {
    if (selectedUser?.name) setSuccessMessage(`Utilisateur "${selectedUser.name}" supprimé avec succès`);
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleExportData = async () => {
    try {
      const stats = dashboardData?.stats || {};
      const recentAlerts = (dashboardData?.alerts || []).slice(0, 10);
      const recentNotifications = (notificationsData || []).slice(0, 10);
      const exportDate = new Date().toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "medium" });

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: "Rapport Dashboard Administrateur", bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: `Exporté le : ${exportDate}` })] }),
            new Paragraph({ text: "" }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Statistiques" })] }),
            new Paragraph({ text: `• Alertes Actives : ${stats.activeAlerts || 0}` }),
            new Paragraph({ text: `• Notifications Envoyées : ${stats.sentNotifications || 0}` }),
            new Paragraph({ text: `• Alertes Résolues : ${stats.resolvedAlerts || 0}` }),
            new Paragraph({ text: `• Règles Configurées : ${stats.configuredRules || 0}` }),
            new Paragraph({ text: `• Utilisateurs Totaux : ${stats.totalUsers || 0}` }),
            new Paragraph({ text: `• Utilisateurs Actifs : ${stats.activeUsers || 0}` }),
            new Paragraph({ text: "" }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Alertes Récentes" })] }),
            ...(recentAlerts.length > 0
              ? recentAlerts.map((alert, index) => new Paragraph({ text: `${index + 1}. [${alert?.module || "Système"}] ${alert?.name || "Alerte"} - ${alert?.is_active ? "Active" : "Inactive"}` }))
              : [new Paragraph({ text: "Aucune alerte disponible" })]),
            new Paragraph({ text: "" }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Notifications Récentes" })] }),
            ...(recentNotifications.length > 0
              ? recentNotifications.map((notification, index) => new Paragraph({ text: `${index + 1}. ${notification?.title || "Sans titre"} - ${notification?.is_read ? "Lue" : "Non lue"}` }))
              : [new Paragraph({ text: "Aucune notification disponible" })]),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `admin_dashboard_rapport_${new Date().toISOString().slice(0, 10)}.docx`;
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSuccessMessage(`Rapport Word exporté : ${fileName}`);
    } catch (error) {
      console.error("Erreur export Word:", error);
      setErrorMessage(`Erreur lors de la génération du document Word: ${error?.message || "inconnue"}`);
    }
  };

  const handleOpenNotifications = (e) => setNotificationsAnchorEl(e.currentTarget);
  const handleCloseNotifications = () => { setNotificationsAnchorEl(null); setNotifMenuPage(0); };
  const handleStatCardClick = (path) => { if (path) navigate(path); };
  const handleMarkAllNotificationsRead = async () => {
    try {
      const res = await authFetch("/notifications/mark_all_as_read/", { method: "POST" });
      if (res.ok) await fetchNotifications();
    } catch (err) {
      console.log("Erreur marquage notifications:", err);
    }
  };
  const handleViewAlertDetails = (alert) => { setSelectedAlert(alert); setAlertDetailsOpen(true); };
  const handleCloseAlertDetails = () => { setAlertDetailsOpen(false); setSelectedAlert(null); };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":   return "success";
      case "inactive": return "warning";
      case "critical": return "error";
      case "warning":  return "warning";
      case "info":     return "info";
      default:         return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":   return <CheckCircleIcon fontSize="small" />;
      case "critical": return <ErrorIcon fontSize="small" />;
      case "warning":  return <WarningIcon fontSize="small" />;
      default:         return <WarningIcon fontSize="small" />;
    }
  };

  const modulePalette = ["#1e88e5", "#a855f7", "#22c55e", "#fb923c", "#06b6d4", "#ef4444"];

  const moduleDistribution = (() => {
    const counts = {};
    (dashboardData.alerts || []).forEach((alert) => {
      const key = String(alert?.module || "Système").trim().toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    const entries = Object.entries(counts).map(([key, value]) => ({ key, label: key, value })).sort((a, b) => b.value - a.value);
    const top = entries.slice(0, 5);
    const restTotal = entries.slice(5).reduce((s, i) => s + i.value, 0);
    if (restTotal > 0) top.push({ key: "autres", label: "Autres", value: restTotal });
    const total = entries.reduce((s, i) => s + i.value, 0);
    const items = top.map((item, idx) => ({
      ...item,
      label: item.label.charAt(0).toUpperCase() + item.label.slice(1),
      color: modulePalette[idx % modulePalette.length],
    }));
    return { total, items };
  })();

  const moduleDistributionItems = moduleDistribution.items.map((item) => ({
    ...item,
    percent: moduleDistribution.total > 0 ? Math.round((item.value / moduleDistribution.total) * 100) : 0,
  }));

  const moduleConicGradient = (() => {
    if (moduleDistribution.total === 0) return "rgba(148, 163, 184, 0.2) 0% 100%";
    let acc = 0;
    return moduleDistribution.items.map((item) => {
      const pct = (item.value / moduleDistribution.total) * 100;
      const start = acc;
      acc += pct;
      return `${item.color} ${start}% ${acc}%`;
    }).join(", ");
  })();

  if (!user) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", bgcolor: "black" }}>
        <Typography variant="h4" sx={{ color: "white" }}>Chargement...</Typography>
      </Box>
    );
  }

  const isAdmin = user?.is_superuser || user?.is_staff;
  if (!isAdmin) { navigate("/admin_dashboard"); return null; }

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", bgcolor: "black" }}>
        <CircularProgress sx={{ color: "#3b82f6" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "black", position: "relative" }}>

      <UrgentAlertsModal
        open={openUrgentModal}
        onClose={() => setOpenUrgentModal(false)}
        alerts={dashboardData.alerts}
      />

      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={handleDrawerToggle} />

      <Box
        component="main"
        sx={{
          flexGrow: 1, width: 0, minWidth: 0, minHeight: "100vh", bgcolor: "black",
          overflowY: "auto", overflowX: "clip", position: "relative",
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-track": { bgcolor: "rgba(15, 23, 42, 0.4)" },
          "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(59, 130, 246, 0.3)", borderRadius: "4px", "&:hover": { bgcolor: "rgba(59, 130, 246, 0.5)" } },
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1, width: "100%" }}>

          {/* ── Navbar ── */}
          <Box sx={{ width: "100%", borderBottom: "1px solid rgba(59, 130, 246, 0.1)", py: 1.5, px: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>

              {/* Left: title */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {isMobile && (
                  <IconButton onClick={handleDrawerToggle} sx={{ color: "white", mr: 1, "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" } }}>
                    <MenuIcon />
                  </IconButton>
                )}
                <Typography variant="h6" sx={{ color: "white", fontWeight: 600, fontSize: "2.5rem" }}>
                  Tableau de bord
                </Typography>
              </Box>

              {/* Center: search */}
              <Box sx={{ flex: 1, maxWidth: 500, mx: 3, position: "relative", display: { xs: "none", md: "block" } }}>
                <SearchIcon sx={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 20 }} />
                <input
                  type="text"
                  placeholder="Search"
                  style={{
                    width: "100%", padding: "10px 16px 10px 48px",
                    backgroundColor: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)",
                    borderRadius: "8px", color: "#94a3b8", fontSize: "0.9rem", outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#3b82f6"; e.target.style.backgroundColor = "rgba(59, 130, 246, 0.2)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(59, 130, 246, 0.2)"; e.target.style.backgroundColor = "rgba(59, 130, 246, 0.1)"; }}
                />
              </Box>

              {/* Right: notifications + avatar */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton sx={{ color: "#64748b", "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" } }} onClick={handleOpenNotifications}>
                  <Badge badgeContent={unreadNotifications.length} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>

                {/* ── Avatar menu (own state) ── */}
                <Box
                  onClick={(e) => setAvatarMenuAnchorEl(e.currentTarget)}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1,
                    cursor: "pointer", px: 1, py: 0.5, borderRadius: 2,
                    "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                  }}
                >
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </Box>

                <Menu
                  anchorEl={avatarMenuAnchorEl}
                  open={Boolean(avatarMenuAnchorEl)}
                  onClose={() => setAvatarMenuAnchorEl(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  PaperProps={{
                    sx: {
                      mt: 1, minWidth: 180,
                      bgcolor: "white",
                      border: "1px solid #00000014",
                      borderRadius: 2,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      overflow: "hidden",
                    },
                  }}
                >
                  <MenuItem
                    onClick={() => { setAvatarMenuAnchorEl(null); navigate("/profile"); }}
                    sx={{ color: "#1e293b", fontSize: "0.95rem", py: 1.5, px: 2.5, "&:hover": { bgcolor: "#00000014" } }}
                  >
                    Mon compte
                  </MenuItem>
                  <MenuItem
                    onClick={() => { setAvatarMenuAnchorEl(null); navigate("/logout") }}
                    sx={{ color: "#1e293b", fontSize: "0.95rem", py: 1.5, px: 2.5, "&:hover": { bgcolor: "#00000014" } }}
                  >
                    Se déconnecter
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          </Box>

          {/* ── Welcome Section ── */}
          <Box sx={{ width: "100%", py: 2, px: 2, borderBottom: "1px solid rgba(59, 130, 246, 0.1)" }}>
            <Typography variant="h5" sx={{ color: "white", fontWeight: 600 }}>
              Welcome, {user?.first_name || user?.username}!
            </Typography>
          </Box>

          {/* ── Dashboard content ── */}
          <Box sx={{ width: "100%", px: 2, pt: 3, pb: 6, boxSizing: "border-box" }}>

            {/* ── Stats cards ── */}
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
              {[
                {
                  label: "Alertes Actives", value: dashboardData.stats.activeAlerts,
                  bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.2)", iconBg: "rgba(239, 68, 68, 0.15)",
                  icon: <WarningIcon sx={{ color: "#ef4444", fontSize: 20 }} />, shadow: "rgba(239, 68, 68, 0.2)",
                  subIcon: <ErrorIcon sx={{ color: "#ef4444", fontSize: 16 }} />, subText: "Nécessite attention", subColor: "#ef4444",
                  path: "/alerts",
                },
                {
                  label: "Notifications Totales", value: notificationsData.length.toLocaleString(),
                  bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.2)", iconBg: "rgba(59, 130, 246, 0.15)",
                  icon: <NotificationsIcon sx={{ color: "#3b82f6", fontSize: 20 }} />, shadow: "rgba(59, 130, 246, 0.2)",
                  subIcon: <TrendingUpIcon sx={{ color: "#10b981", fontSize: 16 }} />, subText: `${unreadNotifications.length} non lues`, subColor: "#10b981",
                  path: "/notifications",
                },
                {
                  label: "Alertes Résolues", value: dashboardData.stats.resolvedAlerts,
                  bg: "rgba(16, 185, 129, 0.1)", border: "#10B98133", iconBg: "rgba(16, 185, 129, 0.15)",
                  icon: <CheckCircleIcon sx={{ color: "#10b981", fontSize: 20 }} />, shadow: "rgba(16, 185, 129, 0.2)",
                  subIcon: <TrendingUpIcon sx={{ color: "#10b981", fontSize: 16 }} />, subText: "Alertes résolues", subColor: "#10b981",
                  path: "/alerts",
                },
                {
                  label: "Utilisateurs Totaux", value: dashboardData.stats.totalUsers || 0,
                  bg: "rgba(139, 92, 246, 0.1)", border: "rgba(139, 92, 246, 0.2)", iconBg: "rgba(139, 92, 246, 0.15)",
                  icon: <PeopleIcon sx={{ color: "#8b5cf6", fontSize: 20 }} />, shadow: "rgba(139, 92, 246, 0.2)",
                  subIcon: <PeopleIcon sx={{ color: "#8b5cf6", fontSize: 16 }} />, subText: `${dashboardData.stats.activeUsers || 0} actifs`, subColor: "#8b5cf6",
                  path: "/employes_requests",
                },
                {
                  label: "Les commandes en attentes", value: dashboardData.stats.pendingOrders || 0,
                  bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)", iconBg: "rgba(245, 158, 11, 0.2)",
                  icon: <ShoppingCartIcon sx={{ color: "#f59e0b", fontSize: 20 }} />, shadow: "rgba(245, 158, 11, 0.25)",
                  subIcon: <ShoppingCartIcon sx={{ color: "#f59e0b", fontSize: 16 }} />, subText: "Statut: en attente", subColor: "#fbbf24",
                  path: "/orders",
                },
              ].map((card) => (
                <Box
                  key={card.label}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleStatCardClick(card.path)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleStatCardClick(card.path); } }}
                  sx={{ flex: "1 1 0", minWidth: { xs: "calc(50% - 8px)", md: 0 }, cursor: "pointer" }}
                >
                  <Card sx={{
                    bgcolor: card.bg, border: `1px solid ${card.border}`, borderRadius: 3,
                    width: "100%", height: "100%", display: "flex", flexDirection: "column",
                    transition: "all 0.3s ease", "&:hover": { transform: "translateY(-4px)", boxShadow: `0 8px 24px ${card.shadow}` },
                  }}>
                    <CardContent sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
                        <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.85rem" }}>{card.label}</Typography>
                        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: card.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {card.icon}
                        </Box>
                      </Box>
                      <Typography variant="h3" sx={{ color: "white", fontWeight: 700, mb: 1 }}>{card.value}</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {card.subIcon}
                        <Typography variant="caption" sx={{ color: card.subColor, fontSize: "0.8rem", fontWeight: 500 }}>{card.subText}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>

            {/* ── Row 1: Produits + Activité ── */}
            <Box sx={{ display: "flex", width: "100%", gap: 2, mb: 3, alignItems: "stretch", flexWrap: { xs: "wrap", md: "nowrap" } }}>
              {/* Liste des Produits */}
              <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 calc(50% - 8px)" }, maxWidth: { xs: "100%", md: "calc(50% - 8px)" }, minWidth: 0 }}>
                <Card sx={{ bgcolor: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(59, 130, 246, 0.1)", borderRadius: 3, height: "100%" }}>
                  <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>Liste des Produits</Typography>
                    </Box>
                    <Box sx={{ overflowX: "auto", flexGrow: 1 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)" }}>
                            {["Produit", "Nomenclature", "Catégorie", "Quantité", "Statut", "Prix"].map((h) => (
                              <th key={h} style={{ padding: "12px", textAlign: "left", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {products && products.length > 0 ? (
                            products.slice((productsPage - 1) * 5, productsPage * 5).map((product, index) => (
                              <tr
                                key={product.id || index}
                                style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.1)", transition: "all 0.2s ease" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.05)")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                              >
                                <td style={{ padding: "12px", color: "white", fontSize: "0.9rem" }}>{product.name || "N/A"}</td>
                                <td style={{ padding: "12px", color: "#94a3b8", fontSize: "0.9rem" }}>{product.Nomenclature || "N/A"}</td>
                                <td style={{ padding: "12px" }}>
                                  {(() => {
                                    const materialTypeOptions = [
                                      { value: "matiere_premiere", label: "Matiere premiere", color: "#082633" },
                                      { value: "matiere_consommable", label: "Matiere consommable", color: "#082633" },
                                      { value: "matiere_chimique", label: "Matiere chimique", color: "#082633" },
                                      { value: "matiere_dangereuse", label: "Matiere dangereuse", color: "#082633" },
                                      { value: "matiere_emballage", label: "Matiere emballage", color: "#082633" },
                                      { value: "fourniture_bureau", label: "Fournitures bureau", color: "#082633" },
                                    ];
                                    const materialType = product.material_type || product.materialType;
                                    const typeObj = materialTypeOptions.find(opt => opt.value === materialType);
                                    const label = typeObj ? typeObj.label : materialType || "-";
                                    const color = typeObj ? typeObj.color : "#64748b";
                                    return label && label !== "-" ? (
                                      <Chip
                                        label={label}
                                        size="small"
                                        sx={{
                                          bgcolor: color, color: '#fff', fontWeight: 600, fontSize: '0.85rem',
                                          borderRadius: '6px', px: 2, py: 0.2, letterSpacing: 0.2,
                                          textTransform: 'capitalize', border: 'none', minWidth: 0,
                                          whiteSpace: 'normal', overflow: 'visible',
                                        }}
                                      />
                                    ) : (
                                      <span style={{ color: '#64748b' }}>-</span>
                                    );
                                  })()}
                                </td>
                                <td style={{ padding: "12px", color: "#94a3b8", fontSize: "0.9rem" }}>{product.quantity || "0"}</td>
                                <td style={{ padding: "12px" }}>
                                  <Chip
                                    label={product.status === "optimal" ? "Optimal" : product.status === "low" ? "Faible" : product.status === "out_of_stock" ? "Rupture" : product.status || "N/A"}
                                    size="small"
                                    sx={{
                                      bgcolor: product.status === "optimal" ? "rgba(16, 185, 129, 0.15)" : product.status === "low" ? "rgba(251, 146, 60, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                      color: product.status === "optimal" ? "#10b981" : product.status === "low" ? "#f59e0b" : "#ef4444",
                                      fontWeight: 600, fontSize: "0.75rem",
                                    }}
                                  />
                                </td>
                                <td style={{ padding: "12px", color: "#10b981", fontSize: "0.9rem", fontWeight: 600 }}>${product.price || "0.00"}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Aucun produit disponible</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </Box>
                    {products && products.length > 0 && (
                      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, mt: "auto", pt: 2, borderTop: "1px solid rgba(59, 130, 246, 0.1)" }}>
                        <IconButton onClick={() => setProductsPage(Math.max(1, productsPage - 1))} disabled={productsPage === 1} sx={{ color: productsPage === 1 ? "#64748b" : "#3b82f6", "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" } }}>
                          &lt;
                        </IconButton>
                        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                          {(() => {
                            const totalPages = Math.ceil(products.length / 5);
                            const pages = [1];
                            const start = Math.max(2, productsPage - 1);
                            const end = Math.min(totalPages - 1, productsPage + 1);
                            if (start > 2) pages.push("...");
                            for (let i = start; i <= end; i++) { if (!pages.includes(i)) pages.push(i); }
                            if (end < totalPages - 1) pages.push("...");
                            if (totalPages > 1) pages.push(totalPages);
                            return pages.map((page, idx) =>
                              page === "..." ? (
                                <Typography key={idx} sx={{ color: "#64748b", px: 1 }}>...</Typography>
                              ) : (
                                <Button key={page} onClick={() => setProductsPage(page)} sx={{
                                  minWidth: 36, height: 36, borderRadius: "6px", fontSize: "0.9rem",
                                  fontWeight: page === productsPage ? 600 : 400,
                                  bgcolor: page === productsPage ? "#3b82f6" : "transparent",
                                  color: page === productsPage ? "white" : "#94a3b8",
                                  border: "1px solid rgba(59, 130, 246, 0.3)",
                                  "&:hover": { bgcolor: page === productsPage ? "#3b82f6" : "rgba(59, 130, 246, 0.1)", borderColor: "#3b82f6" },
                                }}>{page}</Button>
                              )
                            );
                          })()}
                        </Box>
                        <IconButton onClick={() => setProductsPage(Math.min(Math.ceil(products.length / 5), productsPage + 1))} disabled={productsPage >= Math.ceil(products.length / 5)} sx={{ color: productsPage >= Math.ceil(products.length / 5) ? "#64748b" : "#3b82f6", "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" } }}>
                          &gt;
                        </IconButton>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>

              {/* Activité des notifications */}
              <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 calc(50% - 8px)" }, maxWidth: { xs: "100%", md: "calc(50% - 8px)" }, minWidth: 0 }}>
                <Card sx={{ bgcolor: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(59, 130, 246, 0.1)", borderRadius: 3, height: "100%" }}>
                  <CardContent sx={{ p: 2, height: "100%" }}>
                    <NotificationActivityChart />
                  </CardContent>
                </Card>
              </Box>
            </Box>

            {/* ── Row 2: Répartition + Alertes Récentes ── */}
            <Box sx={{ display: "flex", width: "100%", gap: 2, mb: 3, alignItems: "stretch", flexWrap: { xs: "wrap", md: "nowrap" } }}>
              {/* Répartition des alertes */}
              <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 calc(50% - 8px)" }, maxWidth: { xs: "100%", md: "calc(50% - 8px)" }, minWidth: 0 }}>
                <Card sx={{ bgcolor: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(59, 130, 246, 0.1)", borderRadius: 3, height: "100%" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ color: "white", fontWeight: 600, mb: 3 }}>Répartition des alertes</Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
                      {moduleDistribution.total > 0 ? (
                        <>
                          <Box sx={{
                            width: 160, height: 160, borderRadius: "50%",
                            background: `conic-gradient(${moduleConicGradient})`,
                            position: "relative", boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
                            animation: "alertDonutIn 0.8s ease-out",
                            "@keyframes alertDonutIn": { "0%": { transform: "scale(0.85)", opacity: 0 }, "100%": { transform: "scale(1)", opacity: 1 } },
                          }}>
                            <Box sx={{
                              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                              width: 100, height: 100, borderRadius: "50%", bgcolor: "rgba(15, 23, 42, 0.95)",
                              display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
                            }}>
                              <Typography sx={{ color: "white", fontWeight: 700, fontSize: "1.5rem" }}>{moduleDistribution.items.length}</Typography>
                              <Typography sx={{ color: "#94a3b8", fontSize: "0.75rem" }}>modules</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center" }}>
                            {moduleDistributionItems.map((item) => (
                              <Box key={item.key} sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.color }} />
                                <Typography sx={{ color: "#94a3b8", fontSize: "0.78rem" }}>{item.label} ({item.percent}%)</Typography>
                              </Box>
                            ))}
                          </Box>
                        </>
                      ) : (
                        <Typography sx={{ color: "#64748b", textAlign: "center", py: 4 }}>Aucune donnée disponible</Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              {/* Alertes Récentes */}
              <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 calc(50% - 8px)" }, maxWidth: { xs: "100%", md: "calc(50% - 8px)" }, minWidth: 0 }}>
                <Card sx={{ bgcolor: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(59, 130, 246, 0.1)", borderRadius: 3, height: "100%" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                      <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>Alertes Récentes</Typography>
                      <Badge badgeContent={dashboardData.stats.activeAlerts} color="error">
                        <Button size="small" startIcon={<DownloadIcon />} onClick={handleExportData} sx={{ color: "#3b82f6", textTransform: "none", fontSize: "0.875rem" }}>
                          Exporter
                        </Button>
                      </Badge>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {dashboardData.alerts && dashboardData.alerts.length > 0 ? (
                        dashboardData.alerts.slice(0, 2).map((alert) => (
                          <Paper key={alert.id} sx={{
                            p: 2, bgcolor: "rgba(30, 41, 59, 0.3)", border: "1px solid",
                            borderColor: alert.type === "critical" ? "rgba(239, 68, 68, 0.2)" : alert.type === "warning" ? "rgba(251, 146, 60, 0.2)" : "rgba(59, 130, 246, 0.2)",
                            borderRadius: 2, transition: "all 0.2s ease",
                            "&:hover": { transform: "translateX(4px)", borderColor: alert.type === "critical" ? "#ef4444" : alert.type === "warning" ? "#f59e0b" : "#3b82f6" },
                          }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                  {getStatusIcon(alert.type)}
                                  <Typography variant="subtitle2" sx={{ color: "white", fontWeight: 600 }}>{alert.module || "Système"}</Typography>
                                  <Chip label={alert.type === "critical" ? "Critique" : alert.type === "warning" ? "Avertissement" : "Info"} size="small" color={getStatusColor(alert.type)} sx={{ height: 20, fontSize: "0.65rem" }} />
                                </Box>
                                <Typography variant="body2" sx={{ color: "#94a3b8", mb: 1 }}>{alert.message || "Alerte système"}</Typography>
                              </Box>
                              <Typography variant="caption" sx={{ color: "#64748b" }}>{alert.time || "Récemment"}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                              <Typography variant="caption" sx={{ color: "#64748b" }}>Status: {alert.status === "active" ? "Actif" : "Résolu"}</Typography>
                              <Button size="small" onClick={() => handleViewAlertDetails(alert)} sx={{ fontSize: "0.75rem", color: "#3b82f6", "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" } }}>
                                Voir les détails
                              </Button>
                            </Box>
                          </Paper>
                        ))
                      ) : (
                        <Typography sx={{ color: "#64748b", textAlign: "center", py: 4 }}>Aucune alerte récente</Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>

            {/* ── Activités récentes (pleine largeur) ── */}
            <Box sx={{ width: "calc(100% + 32px)", ml: -2, mr: -2 }}>
              <Card sx={{ bgcolor: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(59, 130, 246, 0.1)", borderRadius: 3, width: "100%" }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ color: "white", fontWeight: 600, mb: 0.5 }}>
                      Mes activités récentes
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.875rem" }}>
                      Ce que vous avez fait récemment
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    {dashboardData.recentActivity.length > 0 ? (
                      dashboardData.recentActivity.map((activity, idx) => (
                        <Box
                          key={activity.id}
                          sx={{
                            display: "flex", alignItems: "center", gap: 2,
                            py: 1, px: 2, borderRadius: 2,
                            borderBottom: idx < dashboardData.recentActivity.length - 1 ? "1px solid rgba(59, 130, 246, 0.07)" : "none",
                            transition: "background 0.15s ease",
                            "&:hover": { bgcolor: "rgba(59, 130, 246, 0.05)" },
                          }}
                        >
                          <Box
                            sx={{
                              width: 32, height: 32, borderRadius: "50%",
                              bgcolor: `${activity.color}15`,
                              border: `1.5px solid ${activity.color}40`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: activity.color, flexShrink: 0,
                            }}
                          >
                            {getActivityIcon(activity.icon)}
                          </Box>
                          <Typography
                            sx={{
                              color: "white", fontWeight: 600, fontSize: "0.88rem",
                              flex: 1, minWidth: 0, overflow: "hidden",
                              textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}
                          >
                            {activity.title}
                          </Typography>
                          {activity.description && (() => {
                            const text = String(activity.description);
                            const parts = text.split("|").map((p) => p.trim()).filter(Boolean);
                            const isNomenclatureQty =
                              parts.length === 2 &&
                              /Nomenclature\s*:/i.test(parts[0]) &&
                              /quantit[eé]\s*:/i.test(parts[1]);
                            return (
                              <Typography sx={{ color: "#64748b", fontSize: "0.8rem", whiteSpace: "nowrap", flexShrink: 0 }}>
                                {isNomenclatureQty ? `${parts[0]}  ·  ${parts[1]}` : text}
                              </Typography>
                            );
                          })()}
                          <Typography sx={{ color: "#475569", fontSize: "0.75rem", whiteSpace: "nowrap", flexShrink: 0, ml: 1 }}>
                            {activity.time}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Box sx={{ textAlign: "center", py: 4 }}>
                        <NotificationsIcon sx={{ fontSize: 40, color: "#334155", mb: 1.5 }} />
                        <Typography variant="body2" sx={{ color: "#64748b" }}>Aucune activité récente</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>

          </Box>

          {/* ── Context menu (for user table rows) ── */}
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}
            PaperProps={{ sx: { bgcolor: "#1e293b", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: 2, minWidth: 180 } }}>
            <MenuItem onClick={handleEditUser} sx={{ color: "#94a3b8", "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" } }}>
              <EditIcon sx={{ mr: 1, fontSize: 20, color: "#3b82f6" }} /> Modifier
            </MenuItem>
            <MenuItem onClick={handleDeleteUser} sx={{ color: "#94a3b8", "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" } }}>
              <DeleteIcon sx={{ mr: 1, fontSize: 20, color: "#ef4444" }} /> Supprimer
            </MenuItem>
          </Menu>

          {/* ── Alert details dialog ── */}
          <Dialog open={alertDetailsOpen} onClose={handleCloseAlertDetails} maxWidth="md" fullWidth
            PaperProps={{ sx: { bgcolor: "black", border: "1px solid #3B82F633", borderRadius: 3 } }}>
            <DialogTitle sx={{ color: "white", borderBottom: "1px solid rgba(59, 130, 246, 0.1)", pb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: selectedAlert?.type === "critical" ? "rgba(239, 68, 68, 0.15)" : "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {getStatusIcon(selectedAlert?.type)}
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>Détails de l'alerte</Typography>
                  <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.875rem" }}>{selectedAlert?.module || "Système"}</Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              {selectedAlert && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: "white", display: "block", mb: 1 }}>Type et statut</Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Chip label={selectedAlert.type === "critical" ? "Critique" : selectedAlert.type === "warning" ? "Avertissement" : "Info"} color={getStatusColor(selectedAlert.type)} sx={{ fontWeight: 600 }} />
                      <Chip label={selectedAlert.status === "active" ? "Actif" : "Résolu"} variant="outlined" sx={{ fontWeight: 600, color: "white", borderColor: "rgba(59,130,246,0.4)" }} />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1 }}>Message</Typography>
                    <Paper sx={{ p: 2, bgcolor: "rgba(30, 41, 59, 0.3)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: 2 }}>
                      <Typography sx={{ color: "#94a3b8" }}>{selectedAlert.message || "Alerte système"}</Typography>
                    </Paper>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1.5 }}>Informations détaillées</Typography>
                    <Grid container spacing={2}>
                      {[
                        { label: "Module", value: selectedAlert.module || "N/A" },
                        { label: "Date/Heure", value: selectedAlert.time || "Récemment" },
                        { label: "ID Alerte", value: `#${selectedAlert.id || "N/A"}`, mono: true },
                        { label: "Priorité", value: selectedAlert.type === "critical" ? "Haute" : selectedAlert.type === "warning" ? "Moyenne" : "Basse" },
                      ].map(({ label, value, mono }) => (
                        <Grid item xs={6} key={label}>
                          <Box sx={{ p: 2, bgcolor: "rgba(30, 41, 59, 0.3)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 0.5 }}>{label}</Typography>
                            <Typography sx={{ color: "white", fontWeight: 600, fontFamily: mono ? "monospace" : "inherit" }}>{value}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1 }}>Actions recommandées</Typography>
                    <Alert severity={selectedAlert.type === "critical" ? "error" : selectedAlert.type === "warning" ? "warning" : "info"}>
                      {selectedAlert.type === "critical"
                        ? "Action immédiate requise - Vérifiez les logs système et contactez l'équipe technique."
                        : selectedAlert.type === "warning"
                        ? "Surveillance recommandée - Vérifiez les métriques et planifiez une intervention si nécessaire."
                        : "Notification informative - Aucune action immédiate requise."}
                    </Alert>
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: "1px solid rgba(59, 130, 246, 0.1)" }}>
              <Button onClick={handleCloseAlertDetails} sx={{ color: "#94a3b8", "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" } }}>Fermer</Button>
              <Button variant="contained" sx={{ bgcolor: "#3b82f6", color: "white", fontWeight: 600, "&:hover": { bgcolor: "#2563eb" } }}
                onClick={() => { handleCloseAlertDetails(); setSuccessMessage("Alerte marquée comme traitée"); }}>
                Marquer comme traitée
              </Button>
            </DialogActions>
          </Dialog>

          {/* ── Notifications menu ── */}
          <Menu anchorEl={notificationsAnchorEl} open={Boolean(notificationsAnchorEl)} onClose={handleCloseNotifications}
            PaperProps={{ sx: { mt: 1, width: 360, bgcolor: "#0f172a", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: 2, overflow: "hidden" } }}>
            <Box sx={{ p: 2, borderBottom: "1px solid rgba(59, 130, 246, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ color: "white", fontWeight: 700 }}>Notifications</Typography>
              <Button size="small" onClick={handleMarkAllNotificationsRead} sx={{ color: "#3b82f6", textTransform: "none", fontSize: "0.75rem" }}>
                Tout marquer comme lu
              </Button>
            </Box>
            <Box>
              {unreadNotifications.length > 0 ? (
                <>
                  {unreadNotifications.slice(notifMenuPage * 3, (notifMenuPage + 1) * 3).map((notif) => (
                    <Box key={notif.id} sx={{ px: 2, py: 1.5, display: "flex", gap: 1.5, borderBottom: "1px solid rgba(59, 130, 246, 0.08)" }}>
                      <Box sx={{ pt: 0.6 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: getNotificationDotColor(notif) }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                          <Typography sx={{ color: "white", fontWeight: 600, fontSize: "0.9rem" }}>{notif.title}</Typography>
                          <Typography sx={{ color: "#94a3b8", fontSize: "0.75rem", whiteSpace: "nowrap" }}>{formatRelativeTime(notif.created_at)}</Typography>
                        </Box>
                        <Typography sx={{ color: "#94a3b8", fontSize: "0.8rem" }}>{notif.message}</Typography>
                      </Box>
                    </Box>
                  ))}
                  {Math.ceil(unreadNotifications.length / 3) > 1 && (
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, py: 1.5, borderTop: "1px solid rgba(59, 130, 246, 0.1)" }}>
                      <Button size="small" disabled={notifMenuPage === 0} onClick={() => setNotifMenuPage(notifMenuPage - 1)} sx={{ color: "#3b82f6", fontSize: "0.7rem", textTransform: "none" }}>← Prev</Button>
                      <Typography sx={{ color: "#94a3b8", fontSize: "0.75rem" }}>{notifMenuPage + 1} / {Math.ceil(unreadNotifications.length / 3)}</Typography>
                      <Button size="small" disabled={notifMenuPage >= Math.ceil(unreadNotifications.length / 3) - 1} onClick={() => setNotifMenuPage(notifMenuPage + 1)} sx={{ color: "#3b82f6", fontSize: "0.7rem", textTransform: "none" }}>Next →</Button>
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ p: 2 }}>
                  <Typography sx={{ color: "#94a3b8", fontSize: "0.85rem" }}>Aucune notification non lue</Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ p: 1.5, borderTop: "1px solid rgba(59, 130, 246, 0.1)", textAlign: "center" }}>
              <Button size="small" onClick={() => { handleCloseNotifications(); navigate("/notifications"); }} sx={{ color: "#3b82f6", textTransform: "none", fontSize: "0.85rem" }}>
                Voir toutes les notifications
              </Button>
            </Box>
          </Menu>

          {/* ── Delete dialog ── */}
          <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}
            PaperProps={{ sx: { bgcolor: "#1e293b", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 3 } }}>
            <DialogTitle sx={{ color: "white", borderBottom: "1px solid rgba(239, 68, 68, 0.1)" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ErrorIcon sx={{ color: "#ef4444" }} /> Confirmer la suppression
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Typography sx={{ color: "#94a3b8", mb: 2 }}>
                Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
                <strong style={{ color: "white" }}>{selectedUser?.name}</strong> ?
              </Typography>
              <Alert severity="warning" sx={{ bgcolor: "rgba(251, 146, 60, 0.1)", border: "1px solid rgba(251, 146, 60, 0.2)" }}>
                Cette action est irréversible. Toutes les données associées seront également supprimées.
              </Alert>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: "1px solid rgba(239, 68, 68, 0.1)" }}>
              <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: "#94a3b8", "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" } }}>Annuler</Button>
              <Button onClick={confirmDeleteUser} variant="contained" sx={{ bgcolor: "#ef4444", color: "white", fontWeight: 600, "&:hover": { bgcolor: "#dc2626" } }}>Supprimer</Button>
            </DialogActions>
          </Dialog>

          {/* ── Online Users Dialog ── */}
          <Dialog open={onlineUsersOpen} onClose={handleCloseOnlineUsers} maxWidth="md" fullWidth
            PaperProps={{ sx: { bgcolor: "#1e293b", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: 3 } }}>
            <DialogTitle sx={{ color: "white", borderBottom: "1px solid rgba(34, 197, 94, 0.1)", pb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PeopleIcon sx={{ color: "#64748b" }} />
                <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>Utilisateurs en ligne ({onlineUsers.count})</Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              {onlineUsers.users.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography sx={{ color: "#64748b" }}>Aucun utilisateur en ligne pour le moment</Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {onlineUsers.users.map((u) => (
                    <Grid item xs={12} key={u.id}>
                      <Card sx={{ bgcolor: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(59, 130, 246, 0.1)", borderRadius: 2, "&:hover": { bgcolor: "rgba(30, 41, 59, 0.8)", borderColor: "rgba(59, 130, 246, 0.3)" } }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                <Typography variant="body1" sx={{ color: "white", fontWeight: 600 }}>
                                  {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username}
                                </Typography>
                                <Chip
                                  label={u.role || (u.is_staff || u.is_superuser ? "Admin" : "Utilisateur")}
                                  size="small"
                                  sx={{ bgcolor: u.is_staff || u.is_superuser ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)", color: u.is_staff || u.is_superuser ? "#ef4444" : "#3b82f6", fontWeight: 600, fontSize: "0.7rem" }}
                                />
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#64748b", boxShadow: "0 0 8px #64748b" }} />
                              </Box>
                              <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.85rem" }}>{u.email}</Typography>
                              {u.last_login && (
                                <Typography variant="caption" sx={{ color: "#475569", fontSize: "0.75rem" }}>
                                  Dernière connexion: {new Date(u.last_login).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: "1px solid rgba(34, 197, 94, 0.1)" }}>
              <Button onClick={handleCloseOnlineUsers} sx={{ color: "#94a3b8", "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" } }}>Fermer</Button>
              <Button onClick={fetchOnlineUsers} startIcon={<SyncIcon />} variant="contained" sx={{ bgcolor: "#64748b", color: "white", fontWeight: 600, "&:hover": { bgcolor: "#64748b" } }}>Actualiser</Button>
            </DialogActions>
          </Dialog>

          {/* ── Snackbars ── */}
          <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
            <Alert severity="success" sx={{ width: "100%" }}>{successMessage}</Alert>
          </Snackbar>
          <Snackbar open={!!errorMessage} autoHideDuration={3000} onClose={() => setErrorMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
            <Alert severity="error" sx={{ width: "100%" }}>{errorMessage}</Alert>
          </Snackbar>

        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;