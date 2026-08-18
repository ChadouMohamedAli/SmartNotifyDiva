import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper,
  LinearProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Bolt as BoltIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Build as BuildIcon,
  Factory as FactoryIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

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
  warning: "#f59e0b",
  warningDim: "rgba(245,158,11,0.12)",
  danger: "#ef4444",
  dangerDim: "rgba(239,68,68,0.12)",
  text: "#f1f5f9",
  textMuted: "#64748b",
  textSub: "#94a3b8",
};

/* ─── Données métier ─────────────────────────────────────────────────────── */
const MODULES = [
  { value: "stock", label: "Stock", icon: InventoryIcon, color: "#3b82f6" },
  { value: "crm", label: "CRM", icon: PeopleIcon, color: "#8b5cf6" },
  { value: "facturation", label: "Facturation", icon: ReceiptIcon, color: "#ec4899" },
  { value: "gmao", label: "GMAO", icon: BuildIcon, color: "#f59e0b" },
  { value: "gpao", label: "GPAO", icon: FactoryIcon, color: "#f59e0b" },
  { value: "rh", label: "Ressources Humaines", icon: PersonIcon, color: "#06b6d4" },
];

/* ─── Correspondance Rôle → Module autorisé ─────────────────────────────── */
const ROLE_MODULE = {
  "Responsable entrepôt": "stock",
  "Responsable comptabilité": "facturation",
  "Équipe commerciale": "crm",
  "Technicien": "gmao",
  "Superviseur": "gpao",
  "Manager": "stock",
  "Administrateur": null, // null = tous les modules
};

const ADMIN_MODULES = ["stock", "crm", "facturation", "gmao", "gpao", "rh"];

const FIELDS = {
  stock: [
    { value: "quantity", label: "Quantité" },
    { value: "min_stock", label: "Seuil critique" },
    { value: "stock_value", label: "Valeur du stock" },
    { value: "replenishment_delay", label: "Délai réapprovisionnement" },
  ],
  crm: [
    { value: "lead_score", label: "Score du lead" },
    { value: "days_since_last_contact", label: "Jours depuis dernier contact" },
    { value: "potential_value", label: "Valeur potentielle" },
    { value: "status", label: "Statut" },
    { value: "source", label: "Source" },
  ],
  facturation: [
    { value: "amount", label: "Montant" },
    { value: "days_overdue", label: "Jours de retard" },
    { value: "due_date", label: "Date d'échéance" },
    { value: "invoice_status", label: "Statut facture" },
  ],
  gmao: [
    { value: "maintenance_due_date", label: "Date de maintenance" },
    { value: "task_priority", label: "Priorité de la tâche" },
    { value: "equipment_status", label: "Statut équipement" },
    { value: "maintenance_cost", label: "Coût de maintenance" },
  ],
  gpao: [
    { value: "production_delay", label: "Délai de production" },
    { value: "defect_rate", label: "Taux de défaut" },
    { value: "raw_material_stock", label: "Stock matière première" },
    { value: "machine_capacity", label: "Capacité machine" },
  ],
  rh: [
    { value: "contract_end_date", label: "Date fin de contrat" },
    { value: "leave_balance", label: "Solde de congés" },
    { value: "absence_days", label: "Jours d'absence" },
    { value: "certification_expiry", label: "Expiration certification" },
  ],
};

const OPERATORS = [
  { value: "eq", label: "Égal à" },
  { value: "neq", label: "Différent de" },
  { value: "lt", label: "Inférieur à" },
  { value: "lte", label: "Inférieur ou égal à" },
  { value: "gt", label: "Supérieur à" },
  { value: "gte", label: "Supérieur ou égal à" },
  { value: "contains", label: "Contient" },
];

const PRIORITIES = [
  { value: "critical", label: "Critique", color: "#ef4444", bgColor: "rgba(239,68,68,0.15)" },
  { value: "high", label: "Haute", color: "#f97316", bgColor: "rgba(249,115,22,0.15)" },
  { value: "medium", label: "Moyenne", color: "#3b82f6", bgColor: "rgba(59,130,246,0.15)" },
  { value: "low", label: "Basse", color: "#10b981", bgColor: "rgba(16,185,129,0.15)" },
];

const CHANNELS = [];
const NOTIF_TYPES = [];
const RECURRENCES = [];

const getFieldsForModule = (module) => FIELDS[module] || [];

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: C.text,
    "& fieldset": { borderColor: C.border },
    "&:hover fieldset": { borderColor: C.borderHi },
    "&.Mui-focused fieldset": { borderColor: C.accent },
  },
  "& .MuiInputLabel-root": { color: C.textMuted },
  "& .MuiInputLabel-root.Mui-focused": { color: C.accentHi },
  "& .MuiSelect-icon": { color: C.textMuted },
};

const selectMenuProps = {
  PaperProps: {
    sx: {
      bgcolor: C.surface,
      border: `1px solid ${C.border}`,
      "& .MuiMenuItem-root": {
        color: C.text,
        fontSize: "0.875rem",
        "&:hover": { bgcolor: C.accentDim },
        "&.Mui-selected": { bgcolor: C.accentDim },
        "&.Mui-selected:hover": { bgcolor: C.accentDim },
      },
    },
  },
};

/* ─── Composant principal ────────────────────────────────────────────────── */
const NewAlert = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [fetchingData, setFetchingData] = useState(false);

  const userRole = user?.role || "Manager";
  const isAdmin = user?.is_superuser || user?.is_staff || userRole === "Administrateur";
  
  const canAddEmail = isAdmin || userRole === "responsable_appro" || userRole === "responsable_stock";

  const allowedModules = isAdmin ? ADMIN_MODULES : (ROLE_MODULE[userRole] ? [ROLE_MODULE[userRole]] : ["stock"]);
  const defaultModule = allowedModules[0];

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    module: defaultModule,
    priority: "medium",
    conditionLogic: "AND",
    conditions: [{ field: "", operator: "", value: "" }],
    channels: ["email", "inapp"],
    recipients: [],
    recipientRole: "",
    notifType: "immediate",
    recurrence: "once",
    snoozeHours: 0,
    is_active: true,
    customSubject: "",
    customBody: "",
    product: "",
    category: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setFetchingData(true);
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem("access_token")}` };
        const [catRes, prodRes] = await Promise.all([
          fetch("http://localhost:8000/api/categories/", { headers }),
          fetch("http://localhost:8000/api/stock/products/", { headers }),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(Array.isArray(catData) ? catData : catData.results || []);
        }
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(Array.isArray(prodData) ? prodData : prodData.results || []);
        }

        // Fetch users if authorized roles
        if (canAddEmail) {
          const usersRes = await fetch("http://localhost:8000/api/auth/users/", { headers });
          if (usersRes.status === 401 || usersRes.status === 403) {
            console.warn("Accès refusé à la liste des utilisateurs");
          } else if (usersRes.ok) {
            const usersData = await usersRes.json();
            setAvailableUsers(Array.isArray(usersData) ? usersData : usersData.results || []);
          }
        }
      } catch (err) {
        console.error("Error fetching form data:", err);
      } finally {
        setFetchingData(false);
      }
    };

    if (isOpen) {
      fetchData();
      setActiveStep(0);
      setFormData({
        name: "",
        description: "",
        module: defaultModule,
        priority: "medium",
        conditionLogic: "AND",
        conditions: [{ field: "", operator: "", value: "" }],
        channels: ["email", "inapp"],
        recipients: [],
        recipientRole: "",
        notifType: "immediate",
        recurrence: "once",
        snoozeHours: 0,
        is_active: true,
        customSubject: "",
        customBody: "",
        product: "",
        category: "",
      });
      setErrorMessage("");
    }
  }, [isOpen, defaultModule]);

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const isModuleAllowed = (moduleValue) => {
    return true;
  };

  const handleModuleChange = (moduleValue) => {
    handleChange("module", moduleValue);
  };

  const handleConditionChange = (index, field, value) => {
    const next = [...formData.conditions];
    next[index][field] = value;
    setFormData((prev) => ({ ...prev, conditions: next }));
  };

  const addCondition = () =>
    setFormData((prev) => ({
      ...prev,
      conditions: [...prev.conditions, { field: "", operator: "", value: "" }],
    }));

  const removeCondition = (index) => {
    if (formData.conditions.length > 1)
      setFormData((prev) => ({
        ...prev,
        conditions: prev.conditions.filter((_, i) => i !== index),
      }));
  };

  const validateStep = () => {
    if (activeStep === 0) {
      if (!formData.name.trim()) {
        setErrorMessage("Le nom de la règle est requis.");
        return false;
      }
    }
    if (activeStep === 1) {
      const empty = formData.conditions.some(
        (c) => !c.field || !c.operator || !c.value
      );
      if (empty) {
        setErrorMessage("Veuillez remplir toutes les conditions.");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setActiveStep((p) => p + 1);
      setErrorMessage("");
    }
  };

  const prevStep = () => {
    setActiveStep((p) => p - 1);
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        module: formData.module,
        severity: formData.priority,
        is_active: formData.is_active,
        check_condition: JSON.stringify({
          logic: formData.conditionLogic,
          conditions: formData.conditions,
        }),
        notification_channels: formData.channels,
        recipients: formData.recipients,
        recipient_role: formData.recipientRole,
        notif_type: formData.notifType,
        recurrence: formData.recurrence,
        snooze_hours: formData.snoozeHours,
        custom_subject: formData.customSubject,
        custom_body: formData.customBody,
        product: formData.product || null,
        categories: formData.category ? [formData.category] : [],
      };

      const response = await fetch("http://localhost:8000/api/alerts/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        throw new Error("Votre session a expiré ou le jeton est invalide. Veuillez vous reconnecter.");
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Erreur lors de la création.");
      }

      setSuccessMessage("Règle créée avec succès !");
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const buildPreview = () => {
    const condStr = formData.conditions
      .map((c, i) => {
        const prefix = i === 0 ? "SI" : `  ${formData.conditionLogic}`;
        const fieldLabel =
          getFieldsForModule(formData.module).find((f) => f.value === c.field)
            ?.label || c.field;
        const opLabel =
          OPERATORS.find((o) => o.value === c.operator)?.label || c.operator;
        return `${prefix} ${fieldLabel} ${opLabel} ${c.value}`;
      })
      .join("\n");

    return [
      `Règle        : ${formData.name}`,
      formData.description ? `Description  : ${formData.description}` : null,
      `Module       : ${MODULES.find((m) => m.value === formData.module)?.label}`,
      `Priorité     : ${PRIORITIES.find((p) => p.value === formData.priority)?.label}`,
      ``,
      `Conditions   :`,
      condStr,
      ``,
      formData.category ? `Catégorie    : ${categories.find(c => String(c.id) === String(formData.category))?.name || formData.category}` : null,
      formData.product ? `Produit      : ${products.find(p => String(p.id) === String(formData.product))?.name || formData.product}` : null,
      formData.recipients?.length > 0 ? `Destinataires: ${formData.recipients.join(", ")}` : null,
    ]
      .filter((l) => l !== null)
      .join("\n");
  };

  const steps = ["Informations", "Conditions", "Récapitulatif"];

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: "16px",
          overflow: "hidden",
          position: "relative",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <BoltIcon sx={{ color: C.accent, fontSize: 24 }} />
            <Typography sx={{ color: C.text, fontSize: "1.25rem", fontWeight: 700 }}>
              Nouvelle Règle de Notification
            </Typography>
          </Box>
          <Typography sx={{ color: C.textMuted, fontSize: "0.875rem" }}>
            Configurez une règle pour recevoir des notifications automatiques
          </Typography>
          <Chip
            label={`Rôle : ${userRole}`}
            size="small"
            sx={{ mt: 1, bgcolor: C.accentDim, color: C.accent }}
          />
        </Box>
        <IconButton onClick={onClose} sx={{ color: C.textMuted }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Stepper */}
      <Box sx={{ px: 3, pt: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  "& .MuiStepLabel-label": { color: C.textMuted },
                  "& .MuiStepLabel-label.Mui-active": { color: C.text },
                  "& .MuiStepIcon-root": { color: C.border },
                  "& .MuiStepIcon-root.Mui-active": { color: C.accent },
                  "& .MuiStepIcon-root.Mui-completed": { color: C.success },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent sx={{ p: 3, minHeight: 420 }}>
        {/* ÉTAPE 0 — Informations */}
        {activeStep === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField
                fullWidth
                label="Nom de la règle *"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ex : Stock critique composants"
                sx={inputSx}
              />
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Description optionnelle"
                sx={inputSx}
              />
            </Box>

            {/* Categorie et Produit */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Catégorie</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  label="Catégorie"
                  MenuProps={selectMenuProps}
                >
                  <MenuItem value="">Toutes les catégories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={inputSx}>
                <InputLabel>Produit spécifique</InputLabel>
                <Select
                  value={formData.product}
                  onChange={(e) => handleChange("product", e.target.value)}
                  label="Produit spécifique"
                  disabled={fetchingData}
                  MenuProps={selectMenuProps}
                >
                  <MenuItem value="">Tous les produits</MenuItem>
                  {products
                    .filter(p => {
                      // Normalize category ID from product
                      let prodCatId = null;
                      if (p.category !== null && p.category !== undefined) {
                        prodCatId = (typeof p.category === 'object') ? p.category.id : p.category;
                      }

                      // Ensure comparison is safe (both strings or both numbers)
                      const formCatId = formData.category;
                      const isMatch = !formCatId || String(prodCatId) === String(formCatId);

                      console.log("Filtering product:", p.name, "Product Category ID:", prodCatId, "Form Category ID:", formCatId, "Match:", isMatch);
                      return isMatch;
                    })
                    .map((prod) => (
                      <MenuItem key={prod.id} value={prod.id}>
                        {prod.name} {prod.sku ? `(${prod.sku})` : ""}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>

            {/* Modules */}
            <Box>
           

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 1.5 }}>
                {MODULES.map((module) => {
                  const Icon = module.icon;
                  const isSelected = formData.module === module.value;
                  const isAllowed = true; // Temporary fix/check components

                  return (
                    <Button
                      key={module.value}
                      onClick={() => handleModuleChange(module.value)}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                        py: 1.5,
                        borderRadius: "10px",
                        bgcolor: isSelected ? C.accentDim : "transparent",
                        border: `1px solid ${isSelected ? C.accent : C.border}`,
                        color: isSelected ? C.accent : C.textMuted,
                        textTransform: "none",
                        "&:hover": {
                          bgcolor: C.accentDim,
                          borderColor: C.accent,
                        },
                      }}
                    >
                      <Icon sx={{ fontSize: 24 }} />
                      <Typography sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
                        {module.label}
                      </Typography>
                    </Button>
                  );
                })}
              </Box>
            </Box>

            {/* Priorité */}
            <Box>
              <Typography sx={{ color: C.textSub, fontSize: "0.85rem", fontWeight: 500, mb: 1.5 }}>
                Priorité *
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                {PRIORITIES.map((priority) => (
                  <Chip
                    key={priority.value}
                    label={priority.label}
                    onClick={() => handleChange("priority", priority.value)}
                    sx={{
                      bgcolor: formData.priority === priority.value ? priority.bgColor : C.surfaceHi,
                      color: formData.priority === priority.value ? priority.color : C.textMuted,
                      border: `1px solid ${formData.priority === priority.value ? priority.color : C.border}`,
                      fontWeight: 600,
                      "&:hover": {
                        bgcolor: priority.bgColor,
                        borderColor: priority.color,
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Notification Email for specific roles */}
            {canAddEmail && (
              <Box>
                <Typography sx={{ color: C.textSub, fontSize: "0.85rem", fontWeight: 500, mb: 1.5 }}>
                  Destinataires de notification 
                </Typography>
                <FormControl fullWidth size="small" sx={inputSx}>
                  <InputLabel>Sélectionner des utilisateurs</InputLabel>
                  <Select
                    multiple
                    value={formData.recipients}
                    onChange={(e) => handleChange("recipients", e.target.value)}
                    label="Sélectionner des utilisateurs"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip 
                            key={value} 
                            label={value} 
                            size="small" 
                            sx={{ bgcolor: C.accentDim, color: C.accent, height: 24, fontWeight: 500 }}
                          />
                        ))}
                      </Box>
                    )}
                    MenuProps={selectMenuProps}
                  >
                    {availableUsers.length === 0 ? (
                      <MenuItem disabled>Aucun utilisateur trouvé (Vérifiez votre connexion)</MenuItem>
                    ) : (
                      availableUsers.map((u) => (
                        <MenuItem key={u.id} value={u.email}>
                          {u.email} ({u.username} - {u.role})
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                <Typography sx={{ color: C.textMuted, fontSize: "0.75rem", mt: 1 }}>
                  Les utilisateurs sélectionnés recevront les notifications par email.
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* ÉTAPE 1 — Conditions */}
        {activeStep === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography sx={{ color: C.textSub, fontSize: "0.85rem", fontWeight: 500 }}>
                Logique entre conditions :
              </Typography>
              {["AND", "OR"].map((logic) => (
                <Chip
                  key={logic}
                  label={logic === "AND" ? "ET (AND)" : "OU (OR)"}
                  onClick={() => handleChange("conditionLogic", logic)}
                  sx={{
                    bgcolor: formData.conditionLogic === logic ? C.accentDim : C.surfaceHi,
                    color: formData.conditionLogic === logic ? C.accent : C.textMuted,
                    border: `1px solid ${formData.conditionLogic === logic ? C.accent : C.border}`,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                />
              ))}
            </Box>

            {formData.conditions.map((condition, index) => (
              <Paper
                key={index}
                sx={{
                  p: 2,
                  bgcolor: C.surfaceHi,
                  border: `1px solid ${C.border}`,
                  borderRadius: "10px",
                  position: "relative",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  {index > 0 && (
                    <Chip
                      label={formData.conditionLogic}
                      size="small"
                      sx={{ bgcolor: C.accentDim, color: C.accent, fontWeight: 700, fontSize: "0.7rem" }}
                    />
                  )}
                  <Typography sx={{ color: C.textMuted, fontSize: "0.7rem", fontWeight: 600 }}>
                    Condition {index + 1}
                  </Typography>
                  {formData.conditions.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => removeCondition(index)}
                      sx={{ color: C.danger, ml: "auto" }}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5 }}>
                  <FormControl fullWidth size="small" sx={inputSx}>
                    <InputLabel>Champ</InputLabel>
                    <Select
                      value={condition.field}
                      onChange={(e) => handleConditionChange(index, "field", e.target.value)}
                      label="Champ"
                      MenuProps={selectMenuProps}
                    >
                      {getFieldsForModule(formData.module).map((field) => (
                        <MenuItem key={field.value} value={field.value}>
                          {field.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small" sx={inputSx}>
                    <InputLabel>Opérateur</InputLabel>
                    <Select
                      value={condition.operator}
                      onChange={(e) => handleConditionChange(index, "operator", e.target.value)}
                      label="Opérateur"
                      MenuProps={selectMenuProps}
                    >
                      {OPERATORS.map((op) => (
                        <MenuItem key={op.value} value={op.value}>
                          {op.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    size="small"
                    label="Valeur"
                    value={condition.value}
                    onChange={(e) => handleConditionChange(index, "value", e.target.value)}
                    placeholder="Ex : 10, HIGH, 3000"
                    sx={inputSx}
                  />
                </Box>
              </Paper>
            ))}

            <Button
              onClick={addCondition}
              startIcon={<AddIcon />}
              sx={{
                color: C.accent,
                border: `1px dashed ${C.border}`,
                borderRadius: "10px",
                py: 1.5,
                textTransform: "none",
                "&:hover": { borderColor: C.accent, bgcolor: C.accentDim },
              }}
            >
              Ajouter une condition
            </Button>
          </Box>
        )}

        {/* ÉTAPE 2 — Récapitulatif */}
        {activeStep === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography sx={{ color: C.textSub, fontSize: "0.85rem", fontWeight: 500 }}>
              Récapitulatif de la règle
            </Typography>
            <Paper
              sx={{
                p: 2,
                bgcolor: C.surfaceHi,
                border: `1px solid ${C.border}`,
                borderRadius: "10px",
                fontFamily: "monospace",
                fontSize: "0.82rem",
                color: C.textSub,
                whiteSpace: "pre-wrap",
                lineHeight: 1.8,
              }}
            >
              {buildPreview()}
            </Paper>
          </Box>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ p: 3, borderTop: `1px solid ${C.border}`, justifyContent: "space-between" }}>
        <Button onClick={prevStep} disabled={activeStep === 0} sx={{ color: C.textMuted }}>
          Précédent
        </Button>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button onClick={onClose} sx={{ color: C.textMuted }}>
            Annuler
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              sx={{ bgcolor: C.accent, "&:hover": { bgcolor: C.accentHi } }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Créer la règle"}
            </Button>
          ) : (
            <Button variant="contained" onClick={nextStep} sx={{ bgcolor: C.accent, "&:hover": { bgcolor: C.accentHi } }}>
              Suivant
            </Button>
          )}
        </Box>
      </DialogActions>

      {loading && <LinearProgress sx={{ position: "absolute", bottom: 0, left: 0, right: 0 }} />}

      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage("")}>
        <Alert severity="success">{successMessage}</Alert>
      </Snackbar>
    </Dialog>
  );
};

export default NewAlert;