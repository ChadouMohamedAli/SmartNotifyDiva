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
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  AdminPanelSettings as AdminIcon,
  Download as DownloadIcon,
  Menu as MenuIcon,
  People as PeopleIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
  Inventory as InventoryIcon,
  PersonAdd as PersonAddIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  TableRow,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
} from "docx";

import SharedSidebar from "../../components/SharedSidebar";

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

    // Y grid + labels
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

    // X labels
    ctx.textAlign = "center";
    days.forEach((day, i) => {
      const x = padL + (i / (days.length - 1)) * chartW;
      ctx.fillText(day, x, H - padB + 18);
    });

    // Draw datasets (reversed so "envoyées" is on top)
    [...datasets].reverse().forEach((ds) => {
      const points = ds.data.map((val, i) => ({
        x: padL + (i / (days.length - 1)) * chartW,
        y: padT + chartH - ((val * progress) / maxVal) * chartH,
      }));

      const cps = catmullRomPoints(points);
      const bottomY = padT + chartH;

      // Filled area
      ctx.beginPath();
      ctx.moveTo(points[0].x, bottomY);
      ctx.lineTo(points[0].x, points[0].y);
      cps.forEach(({ cp1x, cp1y, cp2x, cp2y }, i) => {
        ctx.bezierCurveTo(
          cp1x,
          cp1y,
          cp2x,
          cp2y,
          points[i + 1].x,
          points[i + 1].y,
        );
      });
      ctx.lineTo(points[points.length - 1].x, bottomY);
      ctx.closePath();
      ctx.fillStyle = ds.fillColor;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      cps.forEach(({ cp1x, cp1y, cp2x, cp2y }, i) => {
        ctx.bezierCurveTo(
          cp1x,
          cp1y,
          cp2x,
          cp2y,
          points[i + 1].x,
          points[i + 1].y,
        );
      });
      ctx.strokeStyle = ds.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.stroke();

      // Dots
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
    const mouseY = e.clientY - rect.top;

    const W = rect.width;
    const H = rect.height;
    const padL = 44;
    const padR = 20;
    const padT = 16;
    const padB = 40;
    const chartH = H - padT - padB;
    const chartW = W - padL - padR;

    // Trouver le point le plus proche
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
      setTooltip({
        day: days[closestDay],
        data: dayData,
        x: e.clientX,
        y: e.clientY,
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
  <Box sx={{ width: "100%", height: "100%" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
         
        <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
          Activité des notifications
        </Typography>
      </Box>
      <Typography
        variant="body2"
        sx={{ color: "#64748b", fontSize: "0.82rem", mb: 1.5 }}
      >
        Tendance sur les 7 derniers jours
      </Typography>

      {/* Canvas */}
      <Box sx={{ width: "100%", height: 220, position: "relative" }}>
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            cursor: "crosshair",
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />

        {/* Tooltip */}
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
            <Typography
              sx={{
                color: "white",
                fontWeight: 700,
                fontSize: "0.85rem",
                mb: 1,
              }}
            >
              {tooltip.day}
            </Typography>
            {tooltip.data.map((item) => (
              <Box
                key={item.label}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  mb: 0.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: item.color,
                    }}
                  />
                  <Typography sx={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                    {item.label}
                  </Typography>
                </Box>
                <Typography
                  sx={{ color: "white", fontWeight: 700, fontSize: "0.8rem" }}
                >
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Legend */}
      <Box sx={{ display: "flex", gap: 3, justifyContent: "center", mt: 2 }}>
        {datasets.map((ds) => (
          <Box
            key={ds.label}
            sx={{ display: "flex", alignItems: "center", gap: 0.8 }}
          >
            <Box
              sx={{
                position: "relative",
                width: 24,
                height: 12,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  height: 2,
                  bgcolor: ds.color,
                  borderRadius: 1,
                }}
              />
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
            <Typography
              sx={{ fontSize: "0.8rem", color: ds.color, fontWeight: 500 }}
            >
              {ds.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
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

  const [dashboardData, setDashboardData] = useState({
    stats: {
      activeAlerts: 0,
      sentNotifications: 0,
      resolvedAlerts: 0,
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

  const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];
  const isAdmin = user?.is_superuser || user?.is_staff;

  const formatActivityTime = (value) => {
    if (!value) return "Récemment";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
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

  const mapActivityToTimeline = (activity) => {
    const actionType = activity?.action_type;
    let icon = "notification";
    let color = "#8b5cf6";
    let title = activity?.title || "Activité système";
    let description = activity?.description || "";

    if (actionType === "product_created") {
      icon = "package";
      color = "#3b82f6";
      title = activity?.title || "Nouveau produit";
    } else if (actionType === "user_created") {
      icon = "user";
      color = "#10b981";
      title = activity?.title || "Nouvel utilisateur";
    } else if (actionType === "category_created") {
      icon = "category";
      color = "#f59e0b";
      title = activity?.title || "Nouvelle catégorie";
    } else if (actionType === "alert_created") {
      icon = "notification";
      color = "#ef4444";
      title = activity?.title || "Nouvelle alerte";
    }

    return {
      id:
        activity?.id ||
        `${actionType}-${activity?.created_at || Math.random()}`,
      icon,
      color,
      title,
      description,
      time: formatActivityTime(activity?.created_at),
    };
  };

  const getActivityIcon = (iconType) => {
    switch (iconType) {
      case "warning":
        return <ErrorIcon sx={{ fontSize: 20 }} />;
      case "check":
        return <CheckCircleIcon sx={{ fontSize: 20 }} />;
      case "notification":
        return <NotificationsIcon sx={{ fontSize: 20 }} />;
      case "sync":
        return <SyncIcon sx={{ fontSize: 20 }} />;
      case "user":
        return <PersonAddIcon sx={{ fontSize: 20 }} />;
      case "settings":
        return <SettingsIcon sx={{ fontSize: 20 }} />;
      case "package":
        return <InventoryIcon sx={{ fontSize: 20 }} />;
      case "category":
        return <CategoryIcon sx={{ fontSize: 20 }} />;
      default:
        return <NotificationsIcon sx={{ fontSize: 20 }} />;
    }
  };

  // Fetch principale
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("access_token");

        const [usersResponse, alertsResponse, notificationsResponse] =
          await Promise.all([
            fetch("http://localhost:8000/api/admin/users/", {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              credentials: "include",
            }),
            fetch("http://localhost:8000/api/alerts/", {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              credentials: "include",
            }),
            fetch("http://localhost:8000/api/notifications/", {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              credentials: "include",
            }),
          ]);

        const usersData = usersResponse.ok ? await usersResponse.json() : {};
        const alertsData = alertsResponse.ok ? await alertsResponse.json() : {};
        const notificationsPayload = notificationsResponse.ok
          ? await notificationsResponse.json()
          : {};

        const users = Array.isArray(usersData)
          ? usersData
          : usersData.results || [];
        let allAlerts = [];
        if (Array.isArray(alertsData)) allAlerts = alertsData;
        else if (alertsData.results) allAlerts = alertsData.results;
        else if (alertsData.data) allAlerts = alertsData.data;

        let allNotifications = [];
        if (Array.isArray(notificationsPayload))
          allNotifications = notificationsPayload;
        else if (notificationsPayload.results)
          allNotifications = notificationsPayload.results;
        else if (notificationsPayload.data)
          allNotifications = notificationsPayload.data;

        // Filtrer selon le rôle
        const isUserAdmin = user?.is_superuser || user?.is_staff;
        let filteredAlerts = allAlerts;
        let filteredNotifications = allNotifications;

        if (!isUserAdmin) {
          // Pour un utilisateur normal: afficher seulement ses alertes
          filteredAlerts = allAlerts.filter(
            (a) => a.user?.id === user?.id || a.user === user?.id,
          );
          // Afficher seulement ses notifications
          filteredNotifications = allNotifications.filter(
            (n) => !n.user || n.user?.id === user?.id || n.user === user?.id,
          );
        }

        const totalUsers = isUserAdmin ? users.length : 1;
        const activeUsers = isUserAdmin
          ? users.filter((u) => u.is_active === true).length
          : user?.is_active
            ? 1
            : 0;
        const activeAlerts = filteredAlerts.filter(
          (a) =>
            a.is_active === true ||
            a.status === "active" ||
            a.status === "ACTIVE" ||
            a.active === true,
        ).length;
        const resolvedAlerts = filteredAlerts.filter(
          (a) =>
            a.is_active === false ||
            a.status === "resolved" ||
            a.status === "RESOLVED",
        ).length;
        const sentNotifications = filteredNotifications.length;

        setDashboardData((prev) => ({
          ...prev,
          stats: {
            activeAlerts,
            sentNotifications,
            resolvedAlerts,
            configuredRules: filteredAlerts.length,
            totalUsers,
            activeUsers,
          },
          users: isUserAdmin ? users : [user],
          alerts: filteredAlerts,
          notifications: filteredNotifications,
        }));
        setNotificationsData(filteredNotifications);
        setUnreadNotifications(
          filteredNotifications.filter((i) => i?.is_read === false),
        );
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
        const token = localStorage.getItem("access_token");
        const res = await fetch(
          "http://localhost:8000/api/activity/recent/?limit=6",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
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
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/notifications/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json?.results || [];
        setNotificationsData(items);
        setUnreadNotifications(items.filter((i) => i?.is_read === false));
        setDashboardData((prev) => ({
          ...prev,
          notifications: items,
          stats: {
            ...prev.stats,
            sentNotifications: items.length,
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
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/api/users/online/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
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
    const interval = setInterval(fetchOnlineUsers, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuClick = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };
  const handleEditUser = () => {
    if (selectedUser?.id) {
      navigate(`/admin/users/${selectedUser.id}/edit`);
      handleMenuClose();
    }
  };
  const handleDeleteUser = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };
  const handleOpenOnlineUsers = () => {
    fetchOnlineUsers();
    setOnlineUsersOpen(true);
  };
  const handleCloseOnlineUsers = () => setOnlineUsersOpen(false);
  const confirmDeleteUser = () => {
    if (selectedUser?.name)
      setSuccessMessage(
        `Utilisateur "${selectedUser.name}" supprimé avec succès`,
      );
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };
  const exportToDashboardWord = async () => {
    try {
      const borderStyle = {
        style: BorderStyle.SINGLE,
        size: 1,
        color: "CCCCCC",
      };
      const borders = {
        top: borderStyle,
        bottom: borderStyle,
        left: borderStyle,
        right: borderStyle,
      };
      const headerBg = { fill: "1E3A5F", type: ShadingType.CLEAR };
      const altRowBg = { fill: "F0F4FA", type: ShadingType.CLEAR };
      const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

      const notificationsForExport = dashboardData?.notifications || [];

      const titleParagraph = new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 300 },
        children: [
          new TextRun({
            text: "Rapport du Tableau de Bord",
            bold: true,
            size: 40,
            font: "Arial",
            color: "1E3A5F",
          }),
        ],
      });

      const exportTimestamp = new Date().toLocaleString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const dateParagraph = new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 600 },
        children: [
          new TextRun({
            text: `Exporté le ${exportTimestamp}`,
            size: 22,
            font: "Arial",
            color: "666666",
          }),
        ],
      });

      const userInfoTitle = new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        children: [
          new TextRun({
            text: "Informations Utilisateur",
            bold: true,
            size: 30,
            font: "Arial",
            color: "1E3A5F",
          }),
        ],
      });

      const userInfoRows = [
        ["Champ", "Valeur"],
        ["Nom", user?.first_name || "N/A"],
        ["Nom d'utilisateur", user?.username || "N/A"],
        ["Email", user?.email || "N/A"],
        ["Rôle", isAdmin ? "Administrateur" : "Utilisateur"],
        ["Actif", user?.is_active ? "Oui" : "Non"],
      ];

      const userInfoTable = new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3000, 6360],
        rows: userInfoRows.map(
          (row, rowIdx) =>
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    borders,
                    width: { size: 3000, type: WidthType.DXA },
                    shading:
                      rowIdx === 0
                        ? headerBg
                        : rowIdx % 2 === 0
                          ? altRowBg
                          : undefined,
                    margins: cellMargins,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: String(cell),
                            bold: rowIdx === 0,
                            font: "Arial",
                            size: 22,
                            color: rowIdx === 0 ? "FFFFFF" : "333333",
                          }),
                        ],
                      }),
                    ],
                  }),
              ),
            }),
        ),
      });

      const statsTitle = new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 200 },
        children: [
          new TextRun({
            text: "Statistiques Générales",
            bold: true,
            size: 30,
            font: "Arial",
            color: "1E3A5F",
          }),
        ],
      });

      const statsRows = [
        ["Indicateur", "Valeur"],
        ["Alertes Actives", String(dashboardData.stats.activeAlerts || 0)],
        ["Alertes Résolues", String(dashboardData.stats.resolvedAlerts || 0)],
        [
          "Notifications Totales",
          String(dashboardData.stats.sentNotifications || 0),
        ],
        ["Notifications Non Lues", String(unreadNotifications?.length || 0)],
        ...(isAdmin
          ? [
              [
                "Utilisateurs Totaux",
                String(dashboardData.stats.totalUsers || 0),
              ],
              [
                "Utilisateurs Actifs",
                String(dashboardData.stats.activeUsers || 0),
              ],
            ]
          : []),
      ];

      const statsTable = new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [5760, 3600],
        rows: statsRows.map(
          (row, rowIdx) =>
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    borders,
                    width: { size: 5760, type: WidthType.DXA },
                    shading:
                      rowIdx === 0
                        ? headerBg
                        : rowIdx % 2 === 0
                          ? altRowBg
                          : undefined,
                    margins: cellMargins,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: String(cell),
                            bold: rowIdx === 0,
                            font: "Arial",
                            size: 22,
                            color: rowIdx === 0 ? "FFFFFF" : "333333",
                          }),
                        ],
                      }),
                    ],
                  }),
              ),
            }),
        ),
      });

      const alertsTitle = new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 200 },
        children: [
          new TextRun({
            text: "Alertes Récentes",
            bold: true,
            size: 30,
            font: "Arial",
            color: "1E3A5F",
          }),
        ],
      });

      const alertHeaders = ["ID", "Module", "Message", "Type", "Statut"];
      const alertRows = [
        alertHeaders,
        ...(dashboardData?.alerts && dashboardData.alerts.length > 0
          ? dashboardData.alerts
              .slice(0, 10)
              .map((alert) => [
                String(alert.id || "N/A"),
                String(alert.module || "Système"),
                String(alert.message || "Alerte système").slice(0, 60),
                String(alert.alert_type || alert.type || "info"),
                alert.is_active || alert.status === "active"
                  ? "Actif"
                  : "Résolu",
              ])
          : [["Aucune alerte", "", "", "", ""]]),
      ];

      const colWidthsAlerts = [900, 1700, 3660, 1300, 1800];

      const alertsTable = new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: colWidthsAlerts,
        rows: alertRows.map(
          (row, rowIdx) =>
            new TableRow({
              children: row.map(
                (cell, colIdx) =>
                  new TableCell({
                    borders,
                    width: {
                      size: colWidthsAlerts[colIdx],
                      type: WidthType.DXA,
                    },
                    shading:
                      rowIdx === 0
                        ? headerBg
                        : rowIdx % 2 === 0
                          ? altRowBg
                          : undefined,
                    margins: cellMargins,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: String(cell),
                            bold: rowIdx === 0,
                            font: "Arial",
                            size: 20,
                            color: rowIdx === 0 ? "FFFFFF" : "333333",
                          }),
                        ],
                      }),
                    ],
                  }),
              ),
            }),
        ),
      });

      const notifTitle = new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 200 },
        children: [
          new TextRun({
            text: "Notifications Récentes",
            bold: true,
            size: 30,
            font: "Arial",
            color: "1E3A5F",
          }),
        ],
      });

      const notifHeaders = ["ID", "Titre", "Message", "Lu", "Date"];
      const notifDataRows = [
        notifHeaders,
        ...(notificationsForExport.length > 0
          ? notificationsForExport
              .slice(0, 10)
              .map((notif) => [
                String(notif.id || "N/A"),
                String(notif.title || "").slice(0, 30),
                String(notif.message || "").slice(0, 50),
                notif.is_read ? "Oui" : "Non",
                notif.created_at
                  ? new Date(notif.created_at).toLocaleString("fr-FR")
                  : "N/A",
              ])
          : [["Aucune notification", "", "", "", ""]]),
      ];

      const colWidthsNotif = [700, 1900, 3460, 700, 2600];

      const notifTable = new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: colWidthsNotif,
        rows: notifDataRows.map(
          (row, rowIdx) =>
            new TableRow({
              children: row.map(
                (cell, colIdx) =>
                  new TableCell({
                    borders,
                    width: {
                      size: colWidthsNotif[colIdx],
                      type: WidthType.DXA,
                    },
                    shading:
                      rowIdx === 0
                        ? headerBg
                        : rowIdx % 2 === 0
                          ? altRowBg
                          : undefined,
                    margins: cellMargins,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: String(cell),
                            bold: rowIdx === 0,
                            font: "Arial",
                            size: 20,
                            color: rowIdx === 0 ? "FFFFFF" : "333333",
                          }),
                        ],
                      }),
                    ],
                  }),
              ),
            }),
        ),
      });

      const footerParagraph = new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 600 },
        children: [
          new TextRun({
            text: " © 2026 DIVA Software. Tous droits réservés.",
            size: 18,
            font: "Arial",
            color: "999999",
            italics: true,
          }),
        ],
      });

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: { font: "Arial", size: 22 },
            },
          },
        },
        sections: [
          {
            properties: {
              page: {
                size: { width: 12240, height: 15840 },
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
              },
            },
            children: [
              titleParagraph,
              dateParagraph,
              userInfoTitle,
              userInfoTable,
              statsTitle,
              statsTable,
              alertsTitle,
              alertsTable,
              notifTitle,
              notifTable,
              footerParagraph,
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `dashboard_rapport_${new Date().toISOString().slice(0, 10)}.docx`;
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMessage(`Rapport Word exporté : ${fileName}`);
    } catch (err) {
      console.error("Erreur export Word:", err);
      setErrorMessage(
        `Erreur lors de la génération du document Word: ${err.message || "inconnue"}`,
      );
    }
  };

  const handleExportData = async () => {
    await exportToDashboardWord();
  };
  const handleOpenNotifications = (e) =>
    setNotificationsAnchorEl(e.currentTarget);
  const handleCloseNotifications = () => setNotificationsAnchorEl(null);
  const handleMarkAllNotificationsRead = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(
        "http://localhost:8000/api/notifications/mark_all_as_read/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (res.ok) await fetchNotifications();
    } catch (err) {
      console.log("Erreur marquage notifications:", err);
    }
  };
  const handleViewAlertDetails = (alert) => {
    setSelectedAlert(alert);
    setAlertDetailsOpen(true);
  };
  const handleCloseAlertDetails = () => {
    setAlertDetailsOpen(false);
    setSelectedAlert(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "warning";
      case "critical":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircleIcon fontSize="small" />;
      case "critical":
        return <ErrorIcon fontSize="small" />;
      case "warning":
        return <WarningIcon fontSize="small" />;
      default:
        return <WarningIcon fontSize="small" />;
    }
  };

  const modulePalette = [
    "#1e88e5",
    "#a855f7",
    "#22c55e",
    "#fb923c",
    "#06b6d4",
    "#ef4444",
  ];

  const moduleDistribution = (() => {
    const counts = {};
    (dashboardData.alerts || []).forEach((alert) => {
      const key = String(alert?.module || "Système")
        .trim()
        .toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    const entries = Object.entries(counts)
      .map(([key, value]) => ({ key, label: key, value }))
      .sort((a, b) => b.value - a.value);
    const top = entries.slice(0, 5);
    const restTotal = entries.slice(5).reduce((s, i) => s + i.value, 0);
    if (restTotal > 0)
      top.push({ key: "autres", label: "Autres", value: restTotal });
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
    percent:
      moduleDistribution.total > 0
        ? Math.round((item.value / moduleDistribution.total) * 100)
        : 0,
  }));

  const moduleConicGradient = (() => {
    if (moduleDistribution.total === 0)
      return "rgba(148, 163, 184, 0.2) 0% 100%";
    let acc = 0;
    return moduleDistribution.items
      .map((item) => {
        const pct = (item.value / moduleDistribution.total) * 100;
        const start = acc;
        acc += pct;
        return `${item.color} ${start}% ${acc}%`;
      })
      .join(", ");
  })();

  if (!user) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "black",
        }}
      >
        <Typography variant="h4" sx={{ color: "white" }}>
          Chargement...
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "black",
        }}
      >
        <CircularProgress sx={{ color: "#3b82f6" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "black", position: "relative" }}>
     

      <SharedSidebar
        mobileOpen={mobileOpen}
        onMobileClose={handleDrawerToggle}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: 0,
          minWidth: 0,
          minHeight: "100vh",
          position: "relative",
          zIndex: 1,
          bgcolor: "black",
          overflowY: "auto",
          overflowX: "clip",
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-track": { bgcolor: "rgba(15, 23, 42, 0.4)" },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "rgba(59, 130, 246, 0.3)",
            borderRadius: "4px",
            "&:hover": { bgcolor: "rgba(59, 130, 246, 0.5)" },
          },
        }}
      >
        {/* ── Navbar ── */}
        <Box
          sx={{
            width: "100%",
            borderBottom: "1px solid rgba(59, 130, 246, 0.1)",
            py: 1.5,
            px: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {isMobile && (
                <IconButton
                  onClick={handleDrawerToggle}
                  sx={{
                    color: "white",
                    mr: 1,
                    "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" },
                  }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Typography
                variant="h6"
                sx={{ color: "white", fontWeight: 600, fontSize: "2.5rem" }}
              >
                Tableau de bord
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                maxWidth: 500,
                mx: 3,
                position: "relative",
                display: { xs: "none", md: "block" },
              }}
            >
              <SearchIcon
                sx={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                  fontSize: 20,
                }}
              />
              <input
                type="text"
                placeholder="Search"
                style={{
                  width: "100%",
                  padding: "10px 16px 10px 48px",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                  borderRadius: "8px",
                  color: "#94a3b8",
                  fontSize: "0.9rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.backgroundColor = "rgba(59, 130, 246, 0.2)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(59, 130, 246, 0.2)";
                  e.target.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
                }}
              />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton
                sx={{
                  color: "#64748b",
                  "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" },
                }}
                onClick={handleOpenNotifications}
              >
                <Badge badgeContent={unreadNotifications.length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
             
                <Box
                  sx={{
                    textAlign: "left",
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "white", fontWeight: 600, fontSize: "0.9rem" }}
                  >
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.username}
                  </Typography>
                </Box>
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

        {/* ── Welcome Section ── */}
        <Box
          sx={{
            width: "100%",
            py: 2,
            px: 2,
            borderBottom: "1px solid rgba(59, 130, 246, 0.1)",
          }}
        >
          <Typography variant="h5" sx={{ color: "white", fontWeight: 600 }}>
            Welcome, {user?.first_name || user?.username}!
          </Typography>
        </Box>

        {/* ── Dashboard content ── */}
        <Box
          sx={{ width: "100%", px: 2, pt: 3, pb: 6, boxSizing: "border-box" }}
        >
          {/* ── Stats cards ── */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            {[
              {
                label: "Alertes Actives",
                value: dashboardData.stats.activeAlerts,
                bg: "rgba(239, 68, 68, 0.1)",
                border: "rgba(239, 68, 68, 0.2)",
                iconBg: "rgba(239, 68, 68, 0.15)",
                icon: <WarningIcon sx={{ color: "#ef4444", fontSize: 20 }} />,
                shadow: "rgba(239, 68, 68, 0.2)",
                subIcon: <ErrorIcon sx={{ color: "#ef4444", fontSize: 16 }} />,
                subText: "Nécessite attention",
                subColor: "#ef4444",
              },
              {
                label: "Notifications Totales",
                value: notificationsData.length.toLocaleString(),
                bg: "rgba(59, 130, 246, 0.1)",
                border: "rgba(59, 130, 246, 0.2)",
                iconBg: "rgba(59, 130, 246, 0.15)",
                icon: (
                  <NotificationsIcon sx={{ color: "#3b82f6", fontSize: 20 }} />
                ),
                shadow: "rgba(59, 130, 246, 0.2)",
                subIcon: (
                  <TrendingUpIcon sx={{ color: "#10b981", fontSize: 16 }} />
                ),
                subText: `${unreadNotifications.length} non lues`,
                subColor: "#10b981",
              },
              {
                label: "Alertes Résolues",
                value: dashboardData.stats.resolvedAlerts,
                bg: "rgba(16, 185, 129, 0.1)",
                border: "#10B98133",
                iconBg: "rgba(16, 185, 129, 0.15)",
                icon: (
                  <CheckCircleIcon sx={{ color: "#10b981", fontSize: 20 }} />
                ),
                shadow: "rgba(16, 185, 129, 0.2)",
                subIcon: (
                  <TrendingUpIcon sx={{ color: "#10b981", fontSize: 16 }} />
                ),
                subText: "Alertes résolues",
                subColor: "#10b981",
              },
              ...(isAdmin
                ? [
                    {
                      label: "Utilisateurs Totaux",
                      value: dashboardData.stats.totalUsers || 0,
                      bg: "rgba(139, 92, 246, 0.1)",
                      border: "rgba(139, 92, 246, 0.2)",
                      iconBg: "rgba(139, 92, 246, 0.15)",
                      icon: (
                        <PeopleIcon sx={{ color: "#8b5cf6", fontSize: 20 }} />
                      ),
                      shadow: "rgba(139, 92, 246, 0.2)",
                      subIcon: (
                        <PeopleIcon sx={{ color: "#8b5cf6", fontSize: 16 }} />
                      ),
                      subText: `${dashboardData.stats.activeUsers || 0} actifs`,
                      subColor: "#8b5cf6",
                    },
                  ]
                : []),
            ].map((card) => (
              <Box
                key={card.label}
                sx={{
                  flex: "1 1 0",
                  minWidth: { xs: "calc(50% - 8px)", md: 0 },
                }}
              >
                <Card
                  sx={{
                    bgcolor: card.bg,
                    border: `1px solid ${card.border}`,
                    borderRadius: 3,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: `0 8px 24px ${card.shadow}`,
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      p: 3,
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
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
                        {card.label}
                      </Typography>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: card.iconBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {card.icon}
                      </Box>
                    </Box>
                    <Typography
                      variant="h3"
                      sx={{ color: "white", fontWeight: 700, mb: 1 }}
                    >
                      {card.value}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {card.subIcon}
                      <Typography
                        variant="caption"
                        sx={{
                          color: card.subColor,
                          fontSize: "0.8rem",
                          fontWeight: 500,
                        }}
                      >
                        {card.subText}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>

          {/* Charts row */}
          <Box
            sx={{
              mb: 4,
              width: "100%",
              display: "flex",
              gap: 3,
              flexWrap: { xs: "wrap", md: "nowrap" },
            }}
          >
            {/*  Activité des notifications - 50% */}
            <Box
              sx={{
                flex: { xs: "1 1 100%", md: "1 1 50%" },
                maxWidth: { xs: "100%", md: "50%" },
                minWidth: 0,
              }}
            >
              <Card
                sx={{
                  bgcolor: "rgba(30, 41, 59, 0.5)",
                  border: "1px solid rgba(59, 130, 246, 0.1)",
                  borderRadius: 3,
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3, height: "100%" }}>
                  <NotificationActivityChart />
                </CardContent>
              </Card>
            </Box>

            {/* Activités récentes - Timeline */}
            <Box
              sx={{
                flex: { xs: "1 1 100%", md: "1 1 50%" },
                maxWidth: { xs: "100%", md: "50%" },
                minWidth: 0,
              }}
            >
                <Card
                  sx={{
                    bgcolor: "rgba(30, 41, 59, 0.5)",
                    border: "1px solid rgba(59, 130, 246, 0.1)",
                    borderRadius: 3,
                  }}
                >
                  <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="h6"
                        sx={{ color: "white", fontWeight: 600, mb: 0.5 }}
                      >
                        Mes activités récentes
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "#64748b", fontSize: "0.875rem" }}
                      >
                        Ce que vous avez fait récemment
                      </Typography>
                    </Box>

                    <Box sx={{ position: "relative", pl: 4, flex: 1, display: "flex", flexDirection: "column" }}>
                      <Box
                        sx={{
                          position: "absolute",
                          left: "18px",
                          top: "12px",
                          bottom: "12px",
                          width: "2px",
                          bgcolor: "rgba(59, 130, 246, 0.2)",
                        }}
                      />

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 3.5,
                          flex: 1,
                        }}
                      >
                        {dashboardData.recentActivity.length > 0 ? (
                          dashboardData.recentActivity.map((activity) => (
                            <Box
                              key={activity.id}
                              sx={{
                                position: "relative",
                                transition: "all 0.2s ease",
                                "&:hover": { transform: "translateX(4px)" },
                              }}
                            >
                              <Box
                                sx={{
                                  position: "absolute",
                                  left: "-34px",
                                  top: "2px",
                                  width: 36,
                                  height: 36,
                                  borderRadius: "50%",
                                  bgcolor: `${activity.color}15`,
                                  border: `2px solid ${activity.color}`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: activity.color,
                                  zIndex: 1,
                                }}
                              >
                                {getActivityIcon(activity.icon)}
                              </Box>

                              <Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    mb: 0.5,
                                  }}
                                >
                                  <Typography
                                    variant="subtitle2"
                                    sx={{
                                      color: "white",
                                      fontWeight: 600,
                                      fontSize: "0.9rem",
                                    }}
                                  >
                                    {activity.title}
                                  </Typography>

                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "#64748b",
                                      fontSize: "0.75rem",
                                      whiteSpace: "nowrap",
                                      ml: 2,
                                    }}
                                  >
                                    {activity.time}
                                  </Typography>
                                </Box>

                                <Typography
                                  variant="body2"
                                  sx={{ color: "#94a3b8", fontSize: "0.85rem" }}
                                >
                                  {activity.description}
                                </Typography>
                              </Box>
                            </Box>
                          ))
                        ) : (
                          <Box sx={{ textAlign: "center", py: 6 }}>
                            <NotificationsIcon
                              sx={{ fontSize: 48, color: "#64748b", mb: 2 }}
                            />
                            <Typography
                              variant="body1"
                              sx={{ color: "#94a3b8", mb: 1 }}
                            >
                              Aucune activité récente
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: "#64748b", fontSize: "0.85rem" }}
                            >
                              Vos actions apparaîtront ici
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
            </Box>
          </Box>

          {/* Bottom row */}
          <Grid container spacing={3}>
            {/* Alertes récentes - 50% */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  bgcolor: "rgba(30, 41, 59, 0.5)",
                  border: "1px solid rgba(59, 130, 246, 0.1)",
                  borderRadius: 3,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: "white", fontWeight: 600 }}
                    >
                      Alertes Récentes
                    </Typography>
                    <Badge
                      badgeContent={dashboardData.stats.activeAlerts}
                      color="error"
                    >
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportData}
                        sx={{
                          color: "#3b82f6",
                          textTransform: "none",
                          fontSize: "0.875rem",
                        }}
                      >
                        Exporter
                      </Button>
                    </Badge>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {dashboardData.alerts && dashboardData.alerts.length > 0 ? (
                      dashboardData.alerts.slice(0, 2).map((alert) => (
                        <Paper
                          key={alert.id}
                          sx={{
                            p: 2,
                            bgcolor: "rgba(30, 41, 59, 0.3)",
                            border: "1px solid",
                            borderColor:
                              alert.type === "critical"
                                ? "rgba(239, 68, 68, 0.2)"
                                : alert.type === "warning"
                                  ? "rgba(251, 146, 60, 0.2)"
                                  : "rgba(59, 130, 246, 0.2)",
                            borderRadius: 2,
                            transition: "all 0.2s ease",
                            "&:hover": {
                              transform: "translateX(4px)",
                              borderColor:
                                alert.type === "critical"
                                  ? "#ef4444"
                                  : alert.type === "warning"
                                    ? "#f59e0b"
                                    : "#3b82f6",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  mb: 0.5,
                                }}
                              >
                                {getStatusIcon(alert.type)}
                                <Typography
                                  variant="subtitle2"
                                  sx={{ color: "white", fontWeight: 600 }}
                                >
                                  {alert.module || "Système"}
                                </Typography>
                                <Chip
                                  label={
                                    alert.type === "critical"
                                      ? "Critique"
                                      : alert.type === "warning"
                                        ? "Avertissement"
                                        : "Info"
                                  }
                                  size="small"
                                  color={getStatusColor(alert.type)}
                                  sx={{ height: 20, fontSize: "0.65rem" }}
                                />
                              </Box>
                              <Typography
                                variant="body2"
                                sx={{ color: "#94a3b8", mb: 1 }}
                              >
                                {alert.message || "Alerte système"}
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: "#64748b" }}>
                              {alert.time || "Récemment"}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mt: 1,
                            }}
                          >
                            <Typography variant="caption" sx={{ color: "#64748b" }}>
                              Status: {alert.status === "active" ? "Actif" : "Résolu"}
                            </Typography>
                            <Button
                              size="small"
                              onClick={() => handleViewAlertDetails(alert)}
                              sx={{
                                fontSize: "0.75rem",
                                color: "#3b82f6",
                                "&:hover": {
                                  bgcolor: "rgba(59, 130, 246, 0.1)",
                                },
                              }}
                            >
                              Voir les détails
                            </Button>
                          </Box>
                        </Paper>
                      ))
                    ) : (
                      <Typography sx={{ color: "#64748b", textAlign: "center", py: 4 }}>
                        Aucune alerte récente
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Répartition des alertes - 50% */}
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  bgcolor: "rgba(30, 41, 59, 0.5)",
                  border: "1px solid rgba(59, 130, 246, 0.1)",
                  borderRadius: 3,
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3, height: "100%" }}>
                  <Typography
                    variant="h6"
                    sx={{ color: "white", fontWeight: 600, mb: 3 }}
                  >
                    Répartition des alertes
                  </Typography>
                  <Box
                    sx={{
                      height: 300,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                    }}
                  >
                    {moduleDistribution.total > 0 ? (
                      <>
                        <Box
                          sx={{
                            width: 180,
                            height: 180,
                            borderRadius: "50%",
                            background: `conic-gradient(${moduleConicGradient})`,
                            position: "relative",
                            boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
                            animation: "alertDonutIn 0.8s ease-out",
                            "@keyframes alertDonutIn": {
                              "0%": { transform: "scale(0.85)", opacity: 0 },
                              "100%": { transform: "scale(1)", opacity: 1 },
                            },
                          }}
                        >
                          <Box
                            sx={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              width: 110,
                              height: 110,
                              borderRadius: "50%",
                              bgcolor: "rgba(15, 23, 42, 0.95)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexDirection: "column",
                            }}
                          >
                            <Typography
                              sx={{
                                color: "white",
                                fontWeight: 700,
                                fontSize: "1.5rem",
                              }}
                            >
                              {moduleDistribution.items.length}
                            </Typography>
                            <Typography
                              sx={{ color: "#94a3b8", fontSize: "0.75rem" }}
                            >
                              modules
                            </Typography>
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 2,
                            flexWrap: "wrap",
                            justifyContent: "center",
                          }}
                        >
                          {moduleDistributionItems.map((item) => (
                            <Box
                              key={item.key}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: "50%",
                                  bgcolor: item.color,
                                }}
                              />
                              <Typography
                                sx={{ color: "#94a3b8", fontSize: "0.8rem" }}
                              >
                                {item.label} ({item.percent}%)
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </>
                    ) : (
                      <Typography sx={{ color: "#64748b", textAlign: "center", py: 4 }}>
                        Aucune donnée disponible
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Context menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: "#1e293b",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: 2,
            minWidth: 180,
          },
        }}
      >
        <MenuItem
          onClick={handleEditUser}
          sx={{
            color: "#94a3b8",
            "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" },
          }}
        >
          <EditIcon sx={{ mr: 1, fontSize: 20, color: "#3b82f6" }} /> Modifier
        </MenuItem>
        <MenuItem
          onClick={handleDeleteUser}
          sx={{
            color: "#94a3b8",
            "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" },
          }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: 20, color: "#ef4444" }} />{" "}
          Supprimer
        </MenuItem>
      </Menu>

      {/* Alert details dialog */}
      <Dialog
        open={alertDetailsOpen}
        onClose={handleCloseAlertDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "black",
            border: "1px solid #3B82F633",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "white",
            borderBottom: "1px solid rgba(59, 130, 246, 0.1)",
            pb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor:
                  selectedAlert?.type === "critical"
                    ? "rgba(239, 68, 68, 0.15)"
                    : "rgba(59, 130, 246, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {getStatusIcon(selectedAlert?.type)}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
                Détails de l'alerte
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#64748b", fontSize: "0.875rem" }}
              >
                {selectedAlert?.module || "Système"}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedAlert && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "white", display: "block", mb: 1 }}
                >
                  Type et statut
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip
                    label={
                      selectedAlert.type === "critical"
                        ? "Critique"
                        : selectedAlert.type === "warning"
                          ? "Avertissement"
                          : "Info"
                    }
                    color={getStatusColor(selectedAlert.type)}
                    sx={{ fontWeight: 600 }}
                  />
                  <Chip
                    label={
                      selectedAlert.status === "active" ? "Actif" : "Résolu"
                    }
                    variant="outlined"
                    sx={{
                      fontWeight: 600,
                      color: "white",
                      borderColor: "rgba(59,130,246,0.4)",
                    }}
                  />
                </Box>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", display: "block", mb: 1 }}
                >
                  Message
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "rgba(30, 41, 59, 0.3)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    borderRadius: 2,
                  }}
                >
                  <Typography sx={{ color: "#94a3b8" }}>
                    {selectedAlert.message || "Alerte système"}
                  </Typography>
                </Paper>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", display: "block", mb: 1.5 }}
                >
                  Informations détaillées
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { label: "Module", value: selectedAlert.module || "N/A" },
                    {
                      label: "Date/Heure",
                      value: selectedAlert.time || "Récemment",
                    },
                    {
                      label: "ID Alerte",
                      value: `#${selectedAlert.id || "N/A"}`,
                      mono: true,
                    },
                    {
                      label: "Priorité",
                      value:
                        selectedAlert.type === "critical"
                          ? "Haute"
                          : selectedAlert.type === "warning"
                            ? "Moyenne"
                            : "Basse",
                    },
                  ].map(({ label, value, mono }) => (
                    <Grid item xs={6} key={label}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "rgba(30, 41, 59, 0.3)",
                          border: "1px solid rgba(59, 130, 246, 0.2)",
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: "#64748b", display: "block", mb: 0.5 }}
                        >
                          {label}
                        </Typography>
                        <Typography
                          sx={{
                            color: "white",
                            fontWeight: 600,
                            fontFamily: mono ? "monospace" : "inherit",
                          }}
                        >
                          {value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", display: "block", mb: 1 }}
                >
                  Actions recommandées
                </Typography>
                <Alert
                  severity={
                    selectedAlert.type === "critical"
                      ? "error"
                      : selectedAlert.type === "warning"
                        ? "warning"
                        : "info"
                  }
                >
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
        <DialogActions
          sx={{ p: 3, borderTop: "1px solid rgba(59, 130, 246, 0.1)" }}
        >
          <Button
            onClick={handleCloseAlertDetails}
            sx={{
              color: "#94a3b8",
              "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" },
            }}
          >
            Fermer
          </Button>
          <Button
            variant="contained"
            sx={{
              bgcolor: "#3b82f6",
              color: "white",
              fontWeight: 600,
              "&:hover": { bgcolor: "#2563eb" },
            }}
            onClick={() => {
              handleCloseAlertDetails();
              setSuccessMessage("Alerte marquée comme traitée");
            }}
          >
            Marquer comme traitée
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications menu */}
      <Menu
        anchorEl={notificationsAnchorEl}
        open={Boolean(notificationsAnchorEl)}
        onClose={handleCloseNotifications}
        PaperProps={{
          sx: {
            mt: 1,
            width: 360,
            bgcolor: "#0f172a",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: 2,
            overflow: "hidden",
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid rgba(59, 130, 246, 0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography sx={{ color: "white", fontWeight: 700 }}>
            Notifications
          </Typography>
          <Button
            size="small"
            onClick={handleMarkAllNotificationsRead}
            sx={{
              color: "#3b82f6",
              textTransform: "none",
              fontSize: "0.75rem",
            }}
          >
            Tout marquer comme lu
          </Button>
        </Box>
        <Box sx={{ maxHeight: 360, overflowY: "auto" }}>
          {unreadNotifications.length > 0 ? (
            unreadNotifications.slice(0, 6).map((notif) => (
              <Box
                key={notif.id}
                sx={{
                  px: 2,
                  py: 1.5,
                  display: "flex",
                  gap: 1.5,
                  borderBottom: "1px solid rgba(59, 130, 246, 0.08)",
                }}
              >
                <Box sx={{ pt: 0.6 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: getNotificationDotColor(notif),
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        color: "white",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                      }}
                    >
                      {notif.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: "#94a3b8",
                        fontSize: "0.75rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatRelativeTime(notif.created_at)}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                    {notif.message}
                  </Typography>
                </Box>
              </Box>
            ))
          ) : (
            <Box sx={{ p: 2 }}>
              <Typography sx={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                Aucune notification non lue
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderTop: "1px solid rgba(59, 130, 246, 0.1)",
            textAlign: "center",
          }}
        >
          <Button
            size="small"
            onClick={() => {
              handleCloseNotifications();
              navigate("/notifications");
            }}
            sx={{
              color: "#3b82f6",
              textTransform: "none",
              fontSize: "0.85rem",
            }}
          >
            Voir toutes les notifications
          </Button>
        </Box>
      </Menu>

      {/* Delete dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: "#1e293b",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "white",
            borderBottom: "1px solid rgba(239, 68, 68, 0.1)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ErrorIcon sx={{ color: "#ef4444" }} /> Confirmer la suppression
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ color: "#94a3b8", mb: 2 }}>
            Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
            <strong style={{ color: "white" }}>{selectedUser?.name}</strong> ?
          </Typography>
          <Alert
            severity="warning"
            sx={{
              bgcolor: "rgba(251, 146, 60, 0.1)",
              border: "1px solid rgba(251, 146, 60, 0.2)",
            }}
          >
            Cette action est irréversible. Toutes les données associées seront
            également supprimées.
          </Alert>
        </DialogContent>
        <DialogActions
          sx={{ p: 3, borderTop: "1px solid rgba(239, 68, 68, 0.1)" }}
        >
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: "#94a3b8",
              "&:hover": { bgcolor: "rgba(59, 130, 246, 0.1)" },
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={confirmDeleteUser}
            variant="contained"
            sx={{
              bgcolor: "#ef4444",
              color: "white",
              fontWeight: 600,
              "&:hover": { bgcolor: "#dc2626" },
            }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          {successMessage}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={3000}
        onClose={() => setErrorMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="error" sx={{ width: "100%" }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard;
