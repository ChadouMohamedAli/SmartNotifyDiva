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
  Edit as EditIcon,
  Bolt as BoltIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Build as BuildIcon,
  Factory as FactoryIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
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
  danger: "#ef4444",
  dangerDim: "rgba(239,68,68,0.12)",
  text: "#f1f5f9",
  textMuted: "#64748b",
  textSub: "#94a3b8",
};

// Modules ERP
const MODULES = [
  { value: "stock", label: "Stock", icon: InventoryIcon, color: "#3b82f6" },
  { value: "crm", label: "CRM", icon: PeopleIcon, color: "#8b5cf6" },
  { value: "facturation", label: "Facturation", icon: ReceiptIcon, color: "#ec4899" },
  { value: "gmao", label: "GMAO", icon: BuildIcon, color: "#f59e0b" },
  { value: "gpao", label: "GPAO", icon: FactoryIcon, color: "#f59e0b" },
  { value: "rh", label: "Ressources Humaines", icon: PersonIcon, color: "#06b6d4" },
];

// Priorités
const PRIORITIES = [
  { value: "critical", label: "Critique", color: "#ef4444", bgColor: "rgba(239,68,68,0.15)" },
  { value: "high", label: "Haute", color: "#f97316", bgColor: "rgba(249,115,22,0.15)" },
  { value: "medium", label: "Moyenne", color: "#3b82f6", bgColor: "rgba(59,130,246,0.15)" },
  { value: "low", label: "Basse", color: "#10b981", bgColor: "rgba(16,185,129,0.15)" },
];

// Opérateurs
const OPERATORS = [
  { value: "equal_to", label: "Égal à" },
  { value: "not_equal", label: "Différent de" },
  { value: "less_than", label: "Inférieur à" },
  { value: "less_equal", label: "Inférieur ou égal à" },
  { value: "greater_than", label: "Supérieur à" },
  { value: "greater_equal", label: "Supérieur ou égal à" },
];

// Champs disponibles
const FIELDS = {
  stock: [
    { value: "quantity", label: "Quantité" },
    { value: "threshold", label: "Seuil critique" },
  ],
  crm: [
    { value: "lead_score", label: "Score du lead" },
    { value: "days_since_last_contact", label: "Jours depuis dernier contact" },
  ],
  facturation: [
    { value: "amount", label: "Montant" },
    { value: "days_overdue", label: "Jours de retard" },
  ],
  default: [
    { value: "value", label: "Valeur" },
    { value: "count", label: "Compteur" },
  ],
};

const getFieldsForModule = (module) => FIELDS[module] || FIELDS.default;

// Helper pour parser les conditions (JSON string, objet ou tableau)
const parseConditions = (checkCondition) => {
  if (!checkCondition) return [{ field: "", operator: "", value: "" }];
  
  let data = checkCondition;
  // Si c'est une chaîne JSON (cas rare avec DRF mais possible)
  if (typeof checkCondition === 'string') {
    try {
      data = JSON.parse(checkCondition);
    } catch {
      return [{ field: "", operator: "", value: "" }];
    }
  }

  // Cas 1: C'est un objet avec une clé 'conditions' (Ex: {logic: 'AND', conditions: [...]})
  if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.conditions)) {
    return data.conditions.length ? data.conditions : [{ field: "", operator: "", value: "" }];
  }

  // Cas 2: C'est directement un tableau [...]
  if (Array.isArray(data)) {
    return data.length ? data : [{ field: "", operator: "", value: "" }];
  }

  return [{ field: "", operator: "", value: "" }];
};

const EditAlert = ({ isOpen, onClose, alert, onSuccess }) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    module: "stock",
    priority: "medium",
    conditions: [{ field: "", operator: "", value: "" }],
    is_active: true,
    description: "",
    product: "",
    category: "",
    recipients: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem("access_token")}` };
        const [catRes, prodRes, userRes] = await Promise.all([
          fetch("http://localhost:8000/api/categories/", { headers }),
          fetch("http://localhost:8000/api/stock/products/", { headers }),
          fetch("http://localhost:8000/api/auth/users/", { headers }),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(Array.isArray(catData) ? catData : catData.results || []);
        }
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(Array.isArray(prodData) ? prodData : prodData.results || []);
        }
        if (userRes.ok) {
          const userData = await userRes.json();
          setAvailableUsers(Array.isArray(userData) ? userData : userData.results || []);
        }
      } catch (err) {
        console.error("Error fetching form data:", err);
      }
    };

    if (isOpen) {
      fetchData();
      if (alert) {
        const parsedConditions = parseConditions(alert.check_condition);
        setFormData({
          name: alert.name || "",
          module: alert.module || "stock",
          priority: alert.severity || alert.priority || "medium",
          conditions: parsedConditions,
          is_active: alert.is_active !== undefined ? alert.is_active : true,
          description: alert.description || "",
          product: alert.product || "",
          category: alert.category || "",
          recipients: Array.isArray(alert.recipients) ? alert.recipients : [],
        });
        setActiveStep(0);
        setErrorMessage("");
      }
    }
  }, [isOpen, alert]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConditionChange = (index, field, value) => {
    const newConditions = [...formData.conditions];
    newConditions[index][field] = value;
    setFormData(prev => ({ ...prev, conditions: newConditions }));
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: "", operator: "", value: "" }]
    }));
  };

  const removeCondition = (index) => {
    if (formData.conditions.length > 1) {
      setFormData(prev => ({
        ...prev,
        conditions: prev.conditions.filter((_, i) => i !== index)
      }));
    }
  };

  const validateStep = () => {
    if (activeStep === 0) {
      if (!formData.name.trim()) {
        setErrorMessage("Le nom de la règle est requis");
        return false;
      }
    }
    if (activeStep === 1) {
      const hasEmptyCondition = formData.conditions.some(
        c => !c.field || !c.operator || !c.value
      );
      if (hasEmptyCondition) {
        setErrorMessage("Veuillez remplir toutes les conditions");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setActiveStep(prev => prev + 1);
      setErrorMessage("");
    }
  };

  const prevStep = () => {
    setActiveStep(prev => prev - 1);
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        module: formData.module,
        severity: formData.priority,
        is_active: formData.is_active,
        check_condition: JSON.stringify(formData.conditions),
        description: formData.description || `Alerte ${formData.name} - ${formData.conditions.length} condition(s)`,
        product: formData.product || null,
        categories: formData.category ? [formData.category] : [],
        recipients: formData.recipients,
        notification_channels: ["email", "inapp"], // Fallback if missing
      };

      const response = await fetch(`http://localhost:8000/api/alerts/${alert.id}/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Erreur lors de la modification");
      }

      setSuccessMessage("Alerte modifiée avec succès !");
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
        const prefix = i === 0 ? "SI" : `  ET`;
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
      formData.recipients.length ? `Destinataires : ${formData.recipients.join(", ")}` : null,
      formData.category ? `Catégorie    : ${categories.find(c => String(c.id) === String(formData.category))?.name || formData.category}` : null,
      formData.product ? `Produit      : ${products.find(p => String(p.id) === String(formData.product))?.name || formData.product}` : null,
    ]
      .filter((l) => l !== null)
      .join("\n");
  };

  const steps = ["Informations", "Conditions", "Destinataires", "Récapitulatif"];

  const CustomConnector = () => (
    <StepConnector
      sx={{
        "& .MuiStepConnector-line": {
          borderColor: C.border,
          borderTopWidth: 2,
        },
      }}
    />
  );

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
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <EditIcon sx={{ color: C.accent, fontSize: 24 }} />
            <Typography sx={{ color: C.text, fontSize: "1.25rem", fontWeight: 700 }}>
              Modifier la Règle de Notification
            </Typography>
          </Box>
          <Typography sx={{ color: C.textMuted, fontSize: "0.875rem" }}>
            Mettez à jour la configuration de votre règle de notification
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: C.textMuted, "&:hover": { color: C.text } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Stepper */}
      <Box sx={{ px: 3, pt: 3 }}>
        <Stepper activeStep={activeStep} connector={<CustomConnector />}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 3, minHeight: 400 }}>
        {/* Step 0: Informations */}
        {activeStep === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField
                fullWidth
                label="Nom de la règle"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ex: Stock Critique Composants"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: C.text,
                    "& fieldset": { borderColor: C.border },
                    "&:hover fieldset": { borderColor: C.borderHi },
                    "&.Mui-focused fieldset": { borderColor: C.accent },
                  },
                  "& .MuiInputLabel-root": { color: C.textMuted },
                }}
              />
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Description detailed"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: C.text,
                    "& fieldset": { borderColor: C.border },
                    "&:hover fieldset": { borderColor: C.borderHi },
                    "&.Mui-focused fieldset": { borderColor: C.accent },
                  },
                  "& .MuiInputLabel-root": { color: C.textMuted },
                }}
              />
            </Box>

            {/* Categorie et Produit */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <FormControl fullWidth size="small" sx={{ 
                  "& .MuiOutlinedInput-root": { color: C.text, "& fieldset": { borderColor: C.border } },
                  "& .MuiInputLabel-root": { color: C.textMuted }
                }}>
                <InputLabel>Catégorie</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  label="Catégorie"
                >
                  <MenuItem value="">Toutes les catégories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={{ 
                  "& .MuiOutlinedInput-root": { color: C.text, "& fieldset": { borderColor: C.border } },
                  "& .MuiInputLabel-root": { color: C.textMuted }
                }}>
                <InputLabel>Produit spécifique</InputLabel>
                <Select
                  value={formData.product}
                  onChange={(e) => handleChange("product", e.target.value)}
                  label="Produit spécifique"
                >
                  <MenuItem value="">Tous les produits</MenuItem>
                  {products
                    .filter(p => {
                      const prodCatId = (p.category && typeof p.category === 'object') ? p.category.id : p.category;
                      return !formData.category || String(prodCatId) === String(formData.category);
                    })
                    .map((prod) => (
                      <MenuItem key={prod.id} value={prod.id}>
                        {prod.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography sx={{ color: C.textSub, fontSize: "0.85rem", fontWeight: 500, mb: 1.5 }}>
                Module ERP
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 1.5 }}>
                {MODULES.map((module) => {
                  const Icon = module.icon;
                  const isSelected = formData.module === module.value;
                  return (
                    <Button
                      key={module.value}
                      onClick={() => handleChange("module", module.value)}
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
                        "&:hover": { bgcolor: C.accentDim, borderColor: C.accent },
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

            <Box>
              <Typography sx={{ color: C.textSub, fontSize: "0.85rem", fontWeight: 500, mb: 1.5 }}>
                Priorité
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
                      fontSize: "0.8rem",
                      py: 2,
                      cursor: "pointer",
                      "&:hover": { bgcolor: priority.bgColor, borderColor: priority.color },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {/* Step 1: Conditions */}
        {activeStep === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {formData.conditions.map((condition, index) => (
              <Paper key={index} sx={{ p: 2, bgcolor: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: "10px", position: "relative" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <Typography sx={{ color: C.textMuted, fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase" }}>
                    Condition {index + 1}
                  </Typography>
                  {formData.conditions.length > 1 && (
                    <IconButton size="small" onClick={() => removeCondition(index)} sx={{ color: C.danger, ml: "auto", "&:hover": { bgcolor: C.dangerDim } }}>
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: C.textMuted }}>Champ</InputLabel>
                    <Select
                      value={condition.field}
                      onChange={(e) => handleConditionChange(index, "field", e.target.value)}
                      label="Champ"
                      sx={{ 
                        color: C.text, 
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: C.border },
                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: C.borderHi },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: C.accent },
                      }}
                    >
                      {getFieldsForModule(formData.module).map((field) => (
                        <MenuItem key={field.value} value={field.value} sx={{ bgcolor: C.surface, color: C.text }}>
                          {field.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: C.textMuted }}>Opérateur</InputLabel>
                    <Select
                      value={condition.operator}
                      onChange={(e) => handleConditionChange(index, "operator", e.target.value)}
                      label="Opérateur"
                      sx={{ 
                        color: C.text, 
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: C.border },
                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: C.borderHi },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: C.accent },
                      }}
                    >
                      {OPERATORS.map((op) => (
                        <MenuItem key={op.value} value={op.value} sx={{ bgcolor: C.surface, color: C.text }}>
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
                    sx={{ 
                      "& .MuiOutlinedInput-root": { 
                        color: C.text, 
                        "& fieldset": { borderColor: C.border },
                        "&:hover fieldset": { borderColor: C.borderHi },
                        "&.Mui-focused fieldset": { borderColor: C.accent },
                      },
                      "& .MuiInputLabel-root": { color: C.textMuted },
                    }}
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

        {/* Step 2: Destinataires */}
        {activeStep === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography sx={{ color: C.textSub, fontSize: "0.85rem", fontWeight: 500 }}>
              Sélectionnez les destinataires e-mail
            </Typography>
            <FormControl fullWidth>
              <InputLabel sx={{ color: C.textMuted }}>Destinataires</InputLabel>
              <Select
                multiple
                value={formData.recipients}
                onChange={(e) => handleChange("recipients", e.target.value)}
                label="Destinataires"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={value} 
                        size="small"
                        sx={{ bgcolor: C.accent, color: "white" }}
                      />
                    ))}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: C.surfaceHi,
                      color: C.text,
                      '& .MuiMenuItem-root': {
                        '&:hover': { bgcolor: C.accentDim },
                        '&.Mui-selected': { bgcolor: C.accentDim },
                      }
                    }
                  }
                }}
                sx={{
                  color: C.text,
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: C.border },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: C.borderHi },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: C.accent },
                }}
              >
                {availableUsers.filter(u => u.email).map((user) => (
                  <MenuItem key={user.id} value={user.email}>
                    {user.username} ({user.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Step 3: Récapitulatif */}
        {activeStep === 3 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography sx={{ color: C.textSub, fontSize: "0.85rem", fontWeight: 500 }}>
              Récapitulatif de la modification
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
          <Alert severity="error" sx={{ mt: 2, borderRadius: "8px" }} onClose={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        )}
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions sx={{ p: 3, borderTop: `1px solid ${C.border}`, justifyContent: "space-between" }}>
        <Button onClick={prevStep} disabled={activeStep === 0} sx={{ color: C.textMuted, textTransform: "none", fontWeight: 600 }}>
          Précédent
        </Button>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button onClick={onClose} sx={{ color: C.textMuted, textTransform: "none", fontWeight: 600 }}>Annuler</Button>
          {activeStep === steps.length - 1 ? (
            <Button 
              variant="contained" 
              onClick={handleSubmit} 
              disabled={loading} 
              sx={{ 
                bgcolor: C.accent, 
                color: "white", 
                textTransform: "none", 
                fontWeight: 600, 
                px: 4,
                "&:hover": { bgcolor: C.accentHi },
                "&:disabled": { bgcolor: C.border, color: C.textMuted }
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Enregistrer"}
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={nextStep} 
              sx={{ 
                bgcolor: C.accent, 
                color: "white", 
                textTransform: "none", 
                fontWeight: 600, 
                px: 4,
                "&:hover": { bgcolor: C.accentHi }
              }}
            >
              Suivant
            </Button>
          )}
        </Box>
      </DialogActions>

      {/* Loading & Success */}
      {loading && <LinearProgress sx={{ position: "absolute", bottom: 0, left: 0, right: 0, bgcolor: "transparent", "& .MuiLinearProgress-bar": { bgcolor: C.accent } }} />}

      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage("")} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity="success" sx={{ borderRadius: "8px", fontWeight: 600 }}>{successMessage}</Alert>
      </Snackbar>
    </Dialog>
  );
};

export default EditAlert;