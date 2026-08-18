import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useActivityContext } from "../../context/ActivityContext";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
  Chip,
  Badge,
  CircularProgress,
  Tooltip,
  Paper,
  Grid,
  Card,
  CardContent,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Menu as MenuIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
  Warehouse as WarehouseIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  SwapHoriz as SwapHorizIcon,
  ArrowForward as ArrowForwardIcon,
  FlashOn as FlashOnIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
  PersonAdd as PersonAddIcon,
  ShoppingCart as ShoppingCartIcon,
  Download as DownloadIcon,
  PriorityHigh as PriorityHighIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

import SharedSidebar from "../../components/SharedSidebar";
import { authFetch } from "../../utils/authFetch";

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
          Connecté en tant que Gestionnaire de Stock
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

// ─────────────────────────────────────────────
// Stock Movement Activity Chart (Canvas)
// ─────────────────────────────────────────────
const StockActivityChart = ({ movements = [] }) => {
  const canvasRef = useRef(null);
  const animProgress = useRef(0);
  const rafRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const getWeeklyData = () => {
    const now = new Date();
    const weekData = { entries: [0,0,0,0,0,0,0], exits: [0,0,0,0,0,0,0], transfers: [0,0,0,0,0,0,0] };
    
    movements.forEach(m => {
      const date = new Date(m.created_at || m.entry_date || m.exit_date);
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        const idx = 6 - diffDays;
        const type = m.movement_type || (m.entry_date ? 'entry' : 'exit');
        if (type === 'entry') weekData.entries[idx] += m.quantity || 1;
        else if (type === 'exit') weekData.exits[idx] += m.quantity || 1;
        else weekData.transfers[idx] += m.quantity || 1;
      }
    });
    return weekData;
  };

  const weeklyData = getWeeklyData();
  const datasets = [
    { label: "Entrées", color: "#22c55e", fillColor: "rgba(34, 197, 94, 0.15)", data: weeklyData.entries },
    { label: "Sorties", color: "#ef4444", fillColor: "rgba(239, 68, 68, 0.12)", data: weeklyData.exits },
    { label: "Transferts", color: "#3b82f6", fillColor: "rgba(59, 130, 246, 0.12)", data: weeklyData.transfers },
  ];

  const maxVal = Math.max(10, ...datasets.flatMap(d => d.data)) * 1.2;
  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((maxVal / 4) * i));

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
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [movements]);

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
    const padL = 44;
    const padR = 20;
    const chartW = W - padL - padR;

    let closestDay = null;
    let closestDist = Infinity;
    datasets[0].data.forEach((_, i) => {
      const x = padL + (i / (days.length - 1)) * chartW;
      const dist = Math.abs(mouseX - x);
      if (dist < closestDist && dist < 30) { closestDist = dist; closestDay = i; }
    });

    if (closestDay !== null) {
      const dayData = datasets.map((ds) => ({ label: ds.label, value: ds.data[closestDay], color: ds.color }));
      setTooltip({ day: days[closestDay], data: dayData, x: e.clientX, y: e.clientY });
    } else {
      setTooltip(null);
    }
  };

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
        <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
          Activité du Stock
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.82rem", mb: 1.5 }}>
        Mouvements sur les 7 derniers jours
      </Typography>

      <Box sx={{ width: "100%", height: 220, position: "relative" }}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        />
        {tooltip && (
          <Box sx={{
            position: "fixed", left: tooltip.x + 15, top: tooltip.y - 10,
            bgcolor: "rgba(15, 23, 42, 0.98)", border: "1px solid rgba(59, 130, 246, 0.3)",
            borderRadius: 2, p: 1.5, minWidth: 140, boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
            zIndex: 9999, pointerEvents: "none",
          }}>
            <Typography sx={{ color: "white", fontWeight: 700, fontSize: "0.85rem", mb: 1 }}>{tooltip.day}</Typography>
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
              <Box sx={{
                position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
                width: 7, height: 7, borderRadius: "50%", bgcolor: ds.color, border: "1.5px solid #0f172a",
              }} />
            </Box>
            <Typography sx={{ fontSize: "0.8rem", color: ds.color, fontWeight: 500 }}>{ds.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// ─────────────────────────────────────────────
// StockManagerDashboard - Design inspiré de AdminDashboard
// ─────────────────────────────────────────────
const StockManagerDashboard = () => {
  const { user } = useAuth();
  const { activityRefreshTrigger } = useActivityContext();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarMenuAnchorEl, setAvatarMenuAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [notifMenuPage, setNotifMenuPage] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [openUrgentModal, setOpenUrgentModal] = useState(true);
  const [productsPage, setProductsPage] = useState(1);

  // Data states
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const fetchWithAuth = async (path) => {
    const p = path.startsWith("/api") ? path.replace(/^\/api/, "/") : path;
    const res = await authFetch(p, { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || data.data || [];
  };

  // Main data fetch
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [prods, movs, cats, supps, whs, invs, alts, notifs] = await Promise.all([
          fetchWithAuth("/stock/products/"),
          fetchWithAuth("/stock/movements/"),
          fetchWithAuth("/categories/"),
          fetchWithAuth("/fournisseurs/"),
          fetchWithAuth("/entrepots/entrepots/"),
          fetchWithAuth("/facturation/invoices/"),
          fetchWithAuth("/alerts/"),
          fetchWithAuth("/notifications/"),
        ]);
        setProducts(prods);
        setMovements(movs);
        setCategories(cats);
        setSuppliers(supps);
        setWarehouses(whs);
        setInvoices(invs);
        setAlerts(alts);
        setNotifications(notifs);
        setUnreadNotifications(notifs.filter(n => n?.is_read === false));
      } catch (err) {
        console.error("Erreur chargement dashboard stock:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Polling notifications
  useEffect(() => {
    const poll = async () => {
      const notifs = await fetchWithAuth("/notifications/");
      setNotifications(notifs);
      setUnreadNotifications(notifs.filter(n => n?.is_read === false));
    };
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, []);

  // Polling recent activity
  useEffect(() => {
    const fetchAct = async () => {
      const acts = await fetchWithAuth("/activity/recent/?limit=6");
      setRecentActivity(acts);
    };
    fetchAct();
    const interval = setInterval(fetchAct, 5000);
    return () => clearInterval(interval);
  }, [activityRefreshTrigger]);

  // Computed stats
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.status === "low" || (p.quantity <= p.min_quantity && p.quantity > 0));
  const outOfStockProducts = products.filter(p => p.status === "out_of_stock" || p.status === "rupture" || p.quantity === 0);
  const stockValue = products.reduce((sum, p) => sum + (parseFloat(p.price) || 0) * (p.quantity || 0), 0);
  const totalEntries = movements.filter(m => m.movement_type === "entry").length;
  const totalExits = movements.filter(m => m.movement_type === "exit").length;
  const activeAlerts = alerts.filter(a => a.is_active === true || a.status === "active" || a.status === "ACTIVE");

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleOpenNotifications = (e) => setNotificationsAnchorEl(e.currentTarget);
  const handleCloseNotifications = () => {
    setNotificationsAnchorEl(null);
    setNotifMenuPage(0);
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const res = await authFetch("/notifications/mark_all_as_read/", { method: "POST" });
      if (res.ok) {
        const notifs = await fetchWithAuth("/notifications/");
        setNotifications(notifs);
        setUnreadNotifications(notifs.filter(n => n?.is_read === false));
        setSuccessMessage("Toutes les notifications ont été marquées comme lues");
      }
    } catch (err) {
      console.log("Erreur marquage notifications:", err);
    }
  };

  const handleExportData = async () => {
    try {
      const stats = {
        totalProducts,
        lowStockProducts: lowStockProducts.length,
        outOfStockProducts: outOfStockProducts.length,
        stockValue,
        totalEntries,
        totalExits,
        activeAlerts: activeAlerts.length,
        categories: categories.length,
        suppliers: suppliers.length,
        warehouses: warehouses.length,
        invoices: invoices.length,
      };
      
      const exportDate = new Date().toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "medium" });
      const recentProducts = products.slice(0, 10);
      const recentAlerts = activeAlerts.slice(0, 10);

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: "Rapport Dashboard Responsable Stock", bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: `Exporté le : ${exportDate}` })] }),
            new Paragraph({ text: "" }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Statistiques Générales" })] }),
            new Paragraph({ text: `• Total Produits : ${stats.totalProducts}` }),
            new Paragraph({ text: `• Stock Faible : ${stats.lowStockProducts}` }),
            new Paragraph({ text: `• Rupture de Stock : ${stats.outOfStockProducts}` }),
            new Paragraph({ text: `• Valeur du Stock : ${(stats.stockValue / 1000).toFixed(1)} K` }),
            new Paragraph({ text: `• Entrées : ${stats.totalEntries}` }),
            new Paragraph({ text: `• Sorties : ${stats.totalExits}` }),
            new Paragraph({ text: `• Alertes Actives : ${stats.activeAlerts}` }),
            new Paragraph({ text: `• Catégories : ${stats.categories}` }),
            new Paragraph({ text: `• Fournisseurs : ${stats.suppliers}` }),
            new Paragraph({ text: `• Entrepôts : ${stats.warehouses}` }),
            new Paragraph({ text: `• Factures : ${stats.invoices}` }),
            new Paragraph({ text: "" }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Produits Récents" })] }),
            ...recentProducts.map((product, index) => new Paragraph({ text: `${index + 1}. ${product.name} - ${product.quantity} unités - ${product.price} €` })),
            new Paragraph({ text: "" }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Alertes Actives" })] }),
            ...recentAlerts.map((alert, index) => new Paragraph({ text: `${index + 1}. ${alert.name || alert.title || "Alerte"} - ${alert.condition_type || "Stock"}` })),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `stock_dashboard_rapport_${new Date().toISOString().slice(0, 10)}.docx`;
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

  const handleStatCardClick = (path) => {
    if (path) navigate(path);
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

  const getStatusColor = (status) => {
    switch (status) {
      case "optimal": return "success";
      case "low": return "warning";
      case "out_of_stock": return "error";
      default: return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "optimal": return <CheckCircleIcon fontSize="small" />;
      case "low": return <WarningIcon fontSize="small" />;
      case "out_of_stock": return <ErrorIcon fontSize="small" />;
      default: return <WarningIcon fontSize="small" />;
    }
  };

  const moduleDistribution = (() => {
    const counts = {};
    (alerts || []).forEach((alert) => {
      const key = String(alert?.module || "Stock").trim().toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    const entries = Object.entries(counts).map(([key, value]) => ({ key, label: key, value })).sort((a, b) => b.value - a.value);
    const top = entries.slice(0, 5);
    const restTotal = entries.slice(5).reduce((s, i) => s + i.value, 0);
    if (restTotal > 0) top.push({ key: "autres", label: "Autres", value: restTotal });
    const total = entries.reduce((s, i) => s + i.value, 0);
    const modulePalette = ["#1e88e5", "#a855f7", "#22c55e", "#fb923c", "#06b6d4", "#ef4444"];
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

  const formatActivityTime = (value) => {
    if (!value) return "Récemment";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  };

  const getActivityIcon = (iconType) => {
    switch (iconType) {
      case "warning": return <ErrorIcon sx={{ fontSize: 18 }} />;
      case "check": return <CheckCircleIcon sx={{ fontSize: 18 }} />;
      case "notification": return <NotificationsIcon sx={{ fontSize: 18 }} />;
      case "sync": return <SyncIcon sx={{ fontSize: 18 }} />;
      case "user": return <PersonAddIcon sx={{ fontSize: 18 }} />;
      case "settings": return <SettingsIcon sx={{ fontSize: 18 }} />;
      case "package": return <InventoryIcon sx={{ fontSize: 18 }} />;
      case "category": return <CategoryIcon sx={{ fontSize: 18 }} />;
      default: return <NotificationsIcon sx={{ fontSize: 18 }} />;
    }
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
    } else if (actionType === "movement_created") {
      icon = "sync"; color = "#8b5cf6";
      title = activity?.title || "Nouveau mouvement";
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

  const timelineActivities = recentActivity.map(mapActivityToTimeline);

  if (!user) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", bgcolor: "black" }}>
        <Typography variant="h4" sx={{ color: "white" }}>Chargement...</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", bgcolor: "black" }}>
        <CircularProgress sx={{ color: "#3b82f6" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "black", position: "relative" }}>
      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={handleDrawerToggle} />

      <Box
        component="main"
        sx={{
          flexGrow: 1, width: 0, minWidth: 0, minHeight: "100vh",
          position: "relative", zIndex: 1, bgcolor: "black",
          overflowY: "auto", overflowX: "clip",
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-track": { bgcolor: "rgba(15, 23, 42, 0.4)" },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "rgba(59, 130, 246, 0.3)", borderRadius: "4px",
            "&:hover": { bgcolor: "rgba(59, 130, 246, 0.5)" },
          },
        }}
      >
        {/* ── Navbar ── */}
        <Box sx={{ width: "100%", borderBottom: "1px solid rgba(59, 130, 246, 0.1)", py: 1.5, px: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {isMobile && (
                <IconButton onClick={handleDrawerToggle} sx={{ color: "white", mr: 1, "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" } }}>
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h6" sx={{ color: "white", fontWeight: 600, fontSize: { xs: "1.5rem", md: "2.5rem" } }}>
                Tableau de bord
              </Typography>
            </Box>

            <Box sx={{ flex: 1, maxWidth: 500, mx: 3, position: "relative", display: { xs: "none", md: "block" } }}>
              <SearchIcon sx={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 20 }} />
              <input
                type="text" placeholder="Rechercher un produit..."
                style={{
                  width: "100%", padding: "10px 16px 10px 48px",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                  borderRadius: "8px", color: "#94a3b8", fontSize: "0.9rem",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#3b82f6"; e.target.style.backgroundColor = "rgba(59, 130, 246, 0.2)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(59, 130, 246, 0.2)"; e.target.style.backgroundColor = "rgba(59, 130, 246, 0.1)"; }}
              />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton sx={{ color: "#64748b", "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" } }} onClick={handleOpenNotifications}>
                <Badge badgeContent={unreadNotifications.length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>

              {/* Avatar avec SM pour Stock Manager */}
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

              {/* Menu de l'avatar */}
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
        <Box >
          <Typography variant="h5" sx={{ color: "white", fontWeight: 600 }}>
            Bienvenue, {user?.first_name || user?.username} !
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            Voici un aperçu de votre gestion de stock
          </Typography> 
        </Box>

        {/* ── Dashboard content ── */}
        <Box sx={{ width: "100%", px: 2, pt: 3, pb: { xs: 10, md: 6 }, boxSizing: "border-box" }}>

          {/* ── Stats Cards ── */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            {[
              {
                label: "Total Produits", value: totalProducts,
                bg: "rgba(59, 130, 246, 0.1)", border: "rgba(59, 130, 246, 0.2)", iconBg: "rgba(59, 130, 246, 0.15)",
                icon: <InventoryIcon sx={{ color: "#3b82f6", fontSize: 20 }} />, shadow: "rgba(59, 130, 246, 0.2)",
                subIcon: <CategoryIcon sx={{ color: "#3b82f6", fontSize: 16 }} />, subText: `${categories.length} catégories`, subColor: "#3b82f6",
                path: "/stock",
              },
              {
                label: "Stock Faible", value: lowStockProducts.length,
                bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.2)", iconBg: "rgba(245, 158, 11, 0.15)",
                icon: <WarningIcon sx={{ color: "#f59e0b", fontSize: 20 }} />, shadow: "rgba(245, 158, 11, 0.2)",
                subIcon: <ErrorIcon sx={{ color: "#ef4444", fontSize: 16 }} />, subText: `${outOfStockProducts.length} en rupture`, subColor: "#ef4444",
                path: "/stock",
              },
              {
                label: "Mouvements", value: movements.length,
                bg: "rgba(139, 92, 246, 0.1)", border: "rgba(139, 92, 246, 0.2)", iconBg: "rgba(139, 92, 246, 0.15)",
                icon: <SwapHorizIcon sx={{ color: "#8b5cf6", fontSize: 20 }} />, shadow: "rgba(139, 92, 246, 0.2)",
                subIcon: <TrendingUpIcon sx={{ color: "#22c55e", fontSize: 16 }} />, subText: `${totalEntries} entrées · ${totalExits} sorties`, subColor: "#8b5cf6",
                path: "/stock-movements",
              },
              {
                label: "Valeur Stock", value: `${(stockValue / 1000).toFixed(1)}K`,
                bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.2)", iconBg: "rgba(16, 185, 129, 0.15)",
                icon: <AssessmentIcon sx={{ color: "#10b981", fontSize: 20 }} />, shadow: "rgba(16, 185, 129, 0.2)",
                subIcon: <PeopleIcon sx={{ color: "#10b981", fontSize: 16 }} />, subText: `${suppliers.length} fournisseurs`, subColor: "#10b981",
                path: "/fournisseur",
              },
              {
                label: "Alertes Actives", value: activeAlerts.length,
                bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.2)", iconBg: "rgba(239, 68, 68, 0.15)",
                icon: <FlashOnIcon sx={{ color: "#ef4444", fontSize: 20 }} />, shadow: "rgba(239, 68, 68, 0.2)",
                subIcon: <ErrorIcon sx={{ color: "#ef4444", fontSize: 16 }} />, subText: "Nécessite attention", subColor: "#ef4444",
                path: "/alerts",
              },
            ].map((card) => (
              <Box
                key={card.label}
                role="button"
                tabIndex={0}
                onClick={() => handleStatCardClick(card.path)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleStatCardClick(card.path);
                  }
                }}
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

          {/* ── Row 1: Produits + Activité du Stock (Chart) ── */}
          <Box sx={{ display: "flex", width: "100%", gap: 2, mb: 3, alignItems: "stretch", flexWrap: { xs: "wrap", md: "nowrap" } }}>
            {/* Liste des Produits */}
            <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 calc(50% - 8px)" }, maxWidth: { xs: "100%", md: "calc(50% - 8px)" }, minWidth: 0 }}>
              <Card sx={{ bgcolor: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(59, 130, 246, 0.1)", borderRadius: 3, height: "100%" }}>
                <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>Liste des Produits</Typography>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={handleExportData}
                      sx={{ color: "#3b82f6", textTransform: "none", fontSize: "0.75rem" }}
                    >
                      Exporter
                    </Button>
                  </Box>
                  <Box sx={{ overflowX: "auto", flexGrow: 1 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(59, 130, 246, 0.2)" }}>
                          {["Produit", "Catégorie", "Quantité", "Statut", "Prix"].map((h) => (
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
                              <td style={{ padding: "12px" }}>
                                <Chip
                                  label={product.category?.name || "—"}
                                  size="small"
                                  sx={{ bgcolor: "rgba(59,130,246,0.15)", color: "#60a5fa", fontWeight: 500, fontSize: "0.7rem" }}
                                />
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
                              <td style={{ padding: "12px", color: "#10b981", fontSize: "0.9rem", fontWeight: 600 }}>{product.price || "0.00"} €</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Aucun produit disponible</td>
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

            {/* Activité du Stock (Chart) */}
            <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 calc(50% - 8px)" }, maxWidth: { xs: "100%", md: "calc(50% - 8px)" }, minWidth: 0 }}>
              <Card sx={{ bgcolor: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(59, 130, 246, 0.1)", borderRadius: 3, height: "100%" }}>
                <CardContent sx={{ p: 2, height: "100%" }}>
                  <StockActivityChart movements={movements} />
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* ── Row 2: Répartition des alertes + Alertes Récentes ── */}
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
                    <Badge badgeContent={activeAlerts.length} color="error">
                      <Button size="small" startIcon={<DownloadIcon />} onClick={handleExportData} sx={{ color: "#3b82f6", textTransform: "none", fontSize: "0.875rem" }}>
                        Exporter
                      </Button>
                    </Badge>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {activeAlerts.length > 0 ? (
                      activeAlerts.slice(0, 2).map((alert) => (
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
                                <Typography variant="subtitle2" sx={{ color: "white", fontWeight: 600 }}>{alert.module || "Stock"}</Typography>
                                <Chip label={alert.type === "critical" ? "Critique" : alert.type === "warning" ? "Avertissement" : "Info"} size="small" color={getStatusColor(alert.type)} sx={{ height: 20, fontSize: "0.65rem" }} />
                              </Box>
                              <Typography variant="body2" sx={{ color: "#94a3b8", mb: 1 }}>{alert.message || alert.name || "Alerte stock"}</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: "#64748b" }}>{formatRelativeTime(alert.created_at)}</Typography>
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                            <Typography variant="caption" sx={{ color: "#64748b" }}>Seuil: {alert.threshold_value || "—"}</Typography>
                            <Button size="small" onClick={() => navigate("/alerts")} sx={{ fontSize: "0.75rem", color: "#3b82f6", "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" } }}>
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

          {/* ── Produits à Surveiller ── */}
          {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
            <Card sx={{ bgcolor: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: 3, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <WarningIcon sx={{ color: "#f59e0b", fontSize: 22 }} />
                    <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>Produits à Surveiller</Typography>
                  </Box>
                  <Chip
                    label={`${lowStockProducts.length + outOfStockProducts.length} produits`}
                    size="small"
                    sx={{ bgcolor: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", fontWeight: 700 }}
                  />
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.5 }}>
                  {[...outOfStockProducts, ...lowStockProducts].slice(0, 8).map((prod, idx) => {
                    const isOut = prod.quantity === 0 || prod.status === "out_of_stock" || prod.status === "rupture";
                    return (
                      <Box
                        key={prod.id || idx}
                        onClick={() => navigate("/stock")}
                        sx={{
                          display: "flex", alignItems: "center", gap: 1.5, p: 1.5,
                          borderRadius: 2, cursor: "pointer",
                          bgcolor: isOut ? "rgba(239, 68, 68, 0.06)" : "rgba(245, 158, 11, 0.06)",
                          border: `1px solid ${isOut ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)"}`,
                          transition: "all 0.2s ease",
                          "&:hover": { bgcolor: isOut ? "rgba(239, 68, 68, 0.12)" : "rgba(245, 158, 11, 0.12)" },
                        }}
                      >
                        <Box sx={{
                          width: 36, height: 36, borderRadius: 2,
                          bgcolor: isOut ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {isOut ?
                            <ErrorIcon sx={{ fontSize: 18, color: "#ef4444" }} /> :
                            <WarningIcon sx={{ fontSize: 18, color: "#f59e0b" }} />
                          }
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ color: "white", fontSize: "0.82rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {prod.name}
                          </Typography>
                          <Typography sx={{ color: isOut ? "#ef4444" : "#f59e0b", fontSize: "0.72rem", fontWeight: 500 }}>
                            {isOut ? "Rupture de stock" : `Stock: ${prod.quantity} / Min: ${prod.min_quantity}`}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* ── Activités récentes ── */}
          <Card sx={{ bgcolor: "rgba(30, 41, 59, 0.5)", border: "1px solid rgba(59, 130, 246, 0.1)", borderRadius: 3, width: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ color: "white", fontWeight: 600, mb: 0.5 }}>
                    Mes activités récentes
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.875rem" }}>
                    Ce que vous avez fait récemment
                  </Typography>
                </Box>
                <Button
                  onClick={() => navigate("/history")}
                  sx={{ color: "#3b82f6", fontSize: "0.8rem", textTransform: "none", "&:hover": { bgcolor: "rgba(59, 130, 246, 0.08)" } }}
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                >
                  Historique complet
                </Button>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {timelineActivities.length > 0 ? (
                  timelineActivities.slice(0, 6).map((activity, idx) => (
                    <Box
                      key={activity.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        py: 1,
                        px: 2,
                        borderRadius: 2,
                        borderBottom: idx < timelineActivities.length - 1
                          ? "1px solid rgba(59, 130, 246, 0.07)"
                          : "none",
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

                      {activity.description && (
                        <Typography sx={{ color: "#64748b", fontSize: "0.8rem", whiteSpace: "nowrap", flexShrink: 0 }}>
                          {activity.description}
                        </Typography>
                      )}

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
                    <Button size="small" disabled={notifMenuPage === 0} onClick={() => setNotifMenuPage(notifMenuPage - 1)}
                      sx={{ color: "#3b82f6", fontSize: "0.7rem", textTransform: "none" }}>
                      ← Prev
                    </Button>
                    <Typography sx={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                      {notifMenuPage + 1} / {Math.ceil(unreadNotifications.length / 3)}
                    </Typography>
                    <Button size="small" disabled={notifMenuPage >= Math.ceil(unreadNotifications.length / 3) - 1} onClick={() => setNotifMenuPage(notifMenuPage + 1)}
                      sx={{ color: "#3b82f6", fontSize: "0.7rem", textTransform: "none" }}>
                      Next →
                    </Button>
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

        {/* ── Snackbars ── */}
        <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
          <Alert severity="success" sx={{ width: "100%", bgcolor: "rgba(16,185,129,0.15)", color: "#10b981" }}>{successMessage}</Alert>
        </Snackbar>
        <Snackbar open={!!errorMessage} autoHideDuration={3000} onClose={() => setErrorMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
          <Alert severity="error" sx={{ width: "100%", bgcolor: "rgba(239,68,68,0.15)", color: "#ef4444" }}>{errorMessage}</Alert>
        </Snackbar>

        <UrgentAlertsModal 
          open={openUrgentModal} 
          onClose={() => setOpenUrgentModal(false)} 
          alerts={alerts} 
        />
      </Box>
    </Box>
  );
};

export default StockManagerDashboard;