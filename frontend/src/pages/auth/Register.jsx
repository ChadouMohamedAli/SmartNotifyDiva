import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { openGoogleLoginPopup } from '../../services/googleOAuthConfig';
import { useTranslation } from 'react-i18next';
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  OutlinedInput,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Mail as MailIcon,
  Lock as LockIcon,
  Google as GoogleIcon,
  Person as PersonIcon,
  AccountCircle as AccountCircleIcon,
  Phone as PhoneIcon,
  Notifications as NotificationsIcon,
  FlashOn as FlashOnIcon,
  BarChart as BarChartIcon,
  Security as SecurityIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import notif from '../../assets/notif.png';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, login, checkEmailExists, checkPasswordStrength, generatePassword } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    role: '',
    numero_telephone: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    isValid: false,
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
      noCommon: true
    }
  });

  // Options pour le dropdown des rôles
  const roleOptions = [
    { value: 'responsable_stock', label: t('roleStockManager') },
    { value: 'responsable_appro', label: t('roleApproManager') },
    { value: 'commercial', label: t('roleSales') },
    { value: 'achats', label: t('rolePurchasing') },
    { value: 'employe', label: t('roleEmployee') },
    { value: 'fournisseur', label: t('roleSupplier') },
  ];

  const [emailError, setEmailError] = useState('');
  const [emailValidating, setEmailValidating] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [numberError, setNumberError] = useState('');
  const [numberValidating, setNumberValidating] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const handleGoogleAuthMessage = (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'google-auth-success') {
        setGoogleLoading(false);
        const googleUser = event.data?.payload?.user || JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = googleUser?.is_superuser || googleUser?.is_staff;
        navigate(isAdmin ? '/admin_dashboard' : '/dashboard', { replace: true });
      }

      if (event.data?.type === 'google-auth-error') {
        setGoogleLoading(false);
        setError(event.data?.payload?.error || 'Erreur lors de la connexion avec Google.');
      }
    };

    window.addEventListener('message', handleGoogleAuthMessage);
    return () => window.removeEventListener('message', handleGoogleAuthMessage);
  }, [navigate]);

  // Fonction locale pour générer un mot de passe
  const generateSecurePassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specials = '!@#$%^&*()_+-=[]{}|;:,.<>?~';
    
    let password = '';
    
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specials[Math.floor(Math.random() * specials.length)];
    
    const allChars = lowercase + uppercase + numbers + specials;
    for (let i = 0; i < 8; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    return password;
  };

  // Validation du mot de passe en temps réel
  const checkPasswordStrengthLocal = (password) => {
    const requirements = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password),
      noCommon: !['123456', 'password', 'qwerty', 'azerty', 'admin', 'welcome', '123456789', '111111', 'abc123']
        .some(seq => password.toLowerCase().includes(seq))
    };
    
    const score = Object.values(requirements).filter(Boolean).length;
    const missing = [];
    
    if (!requirements.length) missing.push('12 caractères');
    if (!requirements.uppercase) missing.push('une majuscule');
    if (!requirements.lowercase) missing.push('une minuscule');
    if (!requirements.number) missing.push('un chiffre');
    if (!requirements.special) missing.push('un caractère spécial');
    if (!requirements.noCommon) missing.push('éviter les mots communs');
    
    setPasswordStrength({
      score,
      feedback: missing.length > 0 ? `Manque : ${missing.join(', ')}` : '✓ Mot de passe sécurisé',
      isValid: score >= 5,
      requirements
    });
  };

  // Vérification email en temps réel
  const handleEmailCheck = async (email) => {
    if (!email || !email.includes('@')) {
      setEmailError('');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Format d\'email invalide');
      return;
    }
    
    setEmailValidating(true);
    try {
      const result = await checkEmailExists(email);
      if (result.exists) {
        setEmailError('Cet email est déjà utilisé');
      } else {
        setEmailError('');
      }
    } catch (error) {
      console.error('Erreur vérification email:', error);
    } finally {
      setEmailValidating(false);
    }
  };

  // Vérification username en temps réel
  const checkUsername = (username) => {
    if (!username) {
      setUsernameError('');
      return;
    }
    
    if (username.length < 3) {
      setUsernameError('Au moins 3 caractères');
    } else if (username.length > 30) {
      setUsernameError('Maximum 30 caractères');
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Lettres, chiffres et underscore seulement');
    } else {
      setUsernameError('');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Validation du rôle
    if (name === 'role') {
      if (!value) {
        setRoleError('Veuillez sélectionner un rôle');
      } else {
        setRoleError('');
      }
    }
    
    // Validation en temps réel
    switch (name) {
      case 'password':
        checkPasswordStrengthLocal(value);
        break;
      case 'email':
        setEmailError('');
        const timeoutId = setTimeout(() => {
          handleEmailCheck(value);
        }, 800);
        return () => clearTimeout(timeoutId);
      case 'username':
        checkUsername(value);
        break;
      default:
        break;
    }
  };

  const handleGeneratePassword = async () => {
    try {
      const generatedPassword = await generatePassword();
      if (generatedPassword) {
        setFormData({
          ...formData,
          password: generatedPassword,
          password2: generatedPassword
        });
        checkPasswordStrengthLocal(generatedPassword);
      } else {
        // Fallback local
        const newPassword = generateSecurePassword();
        setFormData({
          ...formData,
          password: newPassword,
          password2: newPassword
        });
        checkPasswordStrengthLocal(newPassword);
      }
    } catch (error) {
      // Fallback local
      const newPassword = generateSecurePassword();
      setFormData({
        ...formData,
        password: newPassword,
        password2: newPassword
      });
      checkPasswordStrengthLocal(newPassword);
    }
  };

  // Gestion de la connexion Google
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const popup = openGoogleLoginPopup();

      if (!popup) {
        setError('Impossible d\'ouvrir la fenêtre de connexion Google.');
        setGoogleLoading(false);
        return;
      }
      
      // Monitor popup closure
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          setGoogleLoading(false);
        }
      }, 500);
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de la popup Google:', error);
      setError('Impossible d\'ouvrir la fenêtre Google');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation finale
    if (!passwordStrength.isValid) {
      setError('Veuillez choisir un mot de passe plus fort');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.password2) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (emailError) {
      setError('Veuillez corriger les erreurs dans le formulaire');
      setLoading(false);
      return;
    }

    if (usernameError) {
      setError('Veuillez corriger le nom d\'utilisateur');
      setLoading(false);
      return;
    }

    if (roleError || !formData.role) {
      setError('Veuillez sélectionner un rôle');
      setLoading(false);
      return;
    }

    if (!formData.email || !formData.username || !formData.role || !formData.password || !formData.password2) {
      setError('Veuillez remplir tous les champs obligatoires');
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData);

      if (result.success) {
        navigate('/verification-pending', { replace: true });
      } else {
        if (typeof result.error === 'object') {
          const errorMessages = [];
          for (const key in result.error) {
            if (Array.isArray(result.error[key])) {
              errorMessages.push(`${key}: ${result.error[key].join(', ')}`);
            } else if (typeof result.error[key] === 'string') {
              errorMessages.push(result.error[key]);
            }
          }
          setError(errorMessages.join(' | ') || 'Erreur d\'inscription');
        } else {
          setError(String(result.error || 'Erreur d\'inscription'));
        }
      }
    } catch (err) {
      console.error('Erreur complète:', err);
      
      let errorMessage = 'Erreur technique';
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          const errors = [];
          for (const key in err.response.data) {
            if (Array.isArray(err.response.data[key])) {
              errors.push(`${key}: ${err.response.data[key].join(', ')}`);
            } else {
              errors.push(`${key}: ${err.response.data[key]}`);
            }
          }
          errorMessage = errors.join(' | ');
        } else {
          errorMessage = String(err.response.data);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      m: 0,
      p: 0,
      overflowY: 'auto',
      '&::-webkit-scrollbar': { width: '8px' },
      '&::-webkit-scrollbar-track': { bgcolor: 'rgba(15, 23, 42, 0.4)' },
      '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(59, 130, 246, 0.3)', borderRadius: '4px', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.5)' } },
    }}>
      {/* Colonne gauche - Formulaire d'inscription */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, md: 3 },
          bgcolor: 'white',
          overflowY: 'auto',
          order: { xs: 2, md: 1 },
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { bgcolor: 'rgba(15, 23, 42, 0.4)' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(59, 130, 246, 0.3)', borderRadius: '4px', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.5)' } },
        }}
      >
        <Box sx={{ maxWidth: 450, width: '100%' }}>
          {/* Logo mobile */}
          <Box 
            sx={{ 
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center', 
              justifyContent: 'center',
              mb: 2.5,
              gap: 0.75
            }}
          >
            <Box
              sx={{
                width: 35,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img 
                src={notif} 
                alt="SmartAlerte Logo" 
                style={{ 
                  width: '60px',
                  height: '60px',
                  objectFit: 'contain',
                }}
              />
            </Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 'bold',
                color: '#0a0e27',
                fontSize: '1.1rem',
              }}
            >
              SmartNotify
            </Typography>
          </Box>
          
          {/* Formulaire dans Paper */}
          <Paper
            elevation={0}
            sx={{
              border: '2px solid',
              borderColor: '#e2e8f0',
              borderRadius: 3,
              p: { xs: 3, sm: 4 },
              bgcolor: 'white',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#cbd5e1',
                boxShadow: '0 15px 50px rgba(0, 0, 0, 0.08)',
              }
            }}
          >
            <Box sx={{ mb: 2.5 }}>
              <Box 
                sx={{ 
                  width: 60,
                  height: 4,
                  bgcolor: '#3b82f6',
                  borderRadius: 2,
                  mb: 2.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              />
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  color: '#0a0e27',
                  mb: 0.25,
                  fontSize: '1.5rem',
                }}
              >
                Créer un compte
              </Typography>
              <Typography 
                sx={{ 
                  color: '#64748b',
                  fontSize: '0.9rem',
                }}
              >
                Rejoignez SmartNotify et commencez à gérer vos alertes
              </Typography>
            </Box>
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2, 
                  borderRadius: 2,
                  border: '1px solid #fee2e2',
                  bgcolor: '#fef2f2',
                  '& .MuiAlert-icon': {
                    color: '#ef4444'
                  }
                }}
              >
                {error}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 0 }}>
              {/* Champ email */}
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#1e293b',
                    fontSize: '0.875rem',
                    mb: 0.5
                  }}
                >
                  Adresse email
                </Typography>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="vous@entreprise.com"
                  required
                  error={!!emailError}
                  helperText={emailError}
                  disabled={emailValidating}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailIcon sx={{ color: emailError ? '#ef4444' : '#9ca3af', fontSize: '1.1rem' }} />
                      </InputAdornment>
                    ),
                    endAdornment: emailValidating && (
                      <InputAdornment position="end">
                        <CircularProgress size={16} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 1,
                      '& .MuiOutlinedInput-input': {
                        py: 1,
                        fontSize: '0.9rem',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: emailError ? '#ef4444' : '#e5e7eb',
                      }
                    }
                  }}
                  size="small"
                />
              </Box>

              {/* Champ Nom d'utilisateur */}
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#1e293b',
                    fontSize: '0.875rem',
                    mb: 0.5
                  }}
                >
                  Nom d'utilisateur 
                </Typography>
                <TextField
                  fullWidth
                  id="username"
                  name="username"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="nom_entreprise"
                  required
                  error={!!usernameError}
                  helperText={usernameError}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircleIcon sx={{ color: usernameError ? '#ef4444' : '#9ca3af', fontSize: '1.1rem' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 1,
                      '& .MuiOutlinedInput-input': {
                        py: 1,
                        fontSize: '0.9rem',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: usernameError ? '#ef4444' : '#e5e7eb',
                      }
                    }
                  }}
                  size="small"
                />
              </Box>

              {/* Prénom et Nom */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#1e293b',
                      fontSize: '0.875rem',
                      mb: 0.5
                    }}
                  >
                    Prénom
                  </Typography>
                  <TextField
                    fullWidth
                    id="first_name"
                    name="first_name"
                    autoComplete="given-name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Prénom"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: '#9ca3af', fontSize: '1.1rem' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 1,
                        '& .MuiOutlinedInput-input': {
                          py: 1,
                          fontSize: '0.9rem',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e5e7eb',
                        }
                      }
                    }}
                    size="small"
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#1e293b',
                      fontSize: '0.875rem',
                      mb: 0.5
                    }}
                  >
                    Nom
                  </Typography>
                  <TextField
                    fullWidth
                    id="last_name"
                    name="last_name"
                    autoComplete="family-name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Nom"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: '#9ca3af', fontSize: '1.1rem' }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 1,
                        '& .MuiOutlinedInput-input': {
                          py: 1,
                          fontSize: '0.9rem',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e5e7eb',
                        }
                      }
                    }}
                    size="small"
                  />
                </Box>
              </Box>

     {/* Champ Role - Version avec Select stylé */}
<Box sx={{ mb: 2 }}>
  <Typography
    variant="body2"
    sx={{
      fontWeight: 600,
      color: '#1e293b',
      fontSize: '0.875rem',
      mb: 0.5
    }}
  >
    Rôle
  </Typography>
  <FormControl fullWidth size="small" required error={!!roleError}>
    <Select
      id="role"
      name="role"
      value={formData.role}
      onChange={handleChange}
      displayEmpty
      renderValue={(selected) => {
        if (!selected) {
          return <span style={{ color: '#1e293b', fontWeight: 400 }}>Sélectionnez votre rôle</span>;
        }
        const selectedOption = roleOptions.find(opt => opt.value === selected);
        return <span style={{ color: '#0a0e27', fontWeight: 500 }}>{selectedOption ? selectedOption.label : selected}</span>;
      }}
      sx={{
        borderRadius: 1,
        color: '#0a0e27',
        backgroundColor: 'white',
        '& .MuiOutlinedInput-input': {
          py: 1,
          fontSize: '0.9rem',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#e5e7eb',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#cbd5e1',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#3b82f6',
        }
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            maxHeight: 300,
            mt: 0.5,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            borderRadius: 2,
            bgcolor: 'white',
          }
        }
      }}
    >
      {roleOptions.map((option) => (
        <MenuItem 
          key={option.value} 
          value={option.value}
          sx={{
            fontSize: '0.9rem',
            py: 1,
            color: '#1e293b',
            '&:hover': {
              bgcolor: 'rgba(59, 130, 246, 0.08)',
            },
            '&.Mui-selected': {
              bgcolor: 'rgba(59, 130, 246, 0.12)',
              color: '#0a0e27',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'rgba(59, 130, 246, 0.2)',
              }
            }
          }}
        >
          {option.label}
        </MenuItem>
      ))}
    </Select>
    {roleError && (
      <FormHelperText error>{roleError}</FormHelperText>
    )}
  </FormControl>
  <Typography 
    variant="caption" 
    sx={{ 
      color: '#6b7280', 
      display: 'block',
      mt: 0.5,
      fontSize: '0.7rem'
    }}
  >
    Sélectionnez le rôle qui correspond à votre fonction
  </Typography>
</Box>

              {/* Champ Numéro de téléphone */}
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#1e293b',
                    fontSize: '0.875rem',
                    mb: 0.5
                  }}
                >
                  Numéro de téléphone
                </Typography>
                <TextField
                  fullWidth
                  id="numero_telephone"
                  name="numero_telephone"
                  type="tel"
                  inputProps={{ maxLength:8, pattern: "[0-9]{8}" }}
                  autoComplete="tel"
                  value={formData.numero_telephone}
                  onChange={handleChange}
                  placeholder="Numéro de téléphone"
                  required
                  error={!!numberError}
                  helperText={numberError}
                  disabled={numberValidating}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: numberError ? '#ef4444' : '#9ca3af', fontSize: '1.1rem' }} />
                      </InputAdornment>
                    ),
                    endAdornment: numberValidating && (
                      <InputAdornment position="end">
                        <CircularProgress size={16} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 1,
                      '& .MuiOutlinedInput-input': {
                        py: 1,
                        fontSize: '0.9rem',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: numberError ? '#ef4444' : '#e5e7eb',
                      }
                    }
                  }}
                  size="small"
                />
              </Box>

              {/* Champ Mot de passe */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#1e293b',
                      fontSize: '0.875rem',
                    }}
                  >
                    Mot de passe 
                  </Typography>
                  <Button
                    startIcon={<RefreshIcon />}
                    onClick={handleGeneratePassword}
                    size="small"
                    sx={{ 
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      color: '#3b82f6',
                      '&:hover': {
                        bgcolor: 'rgba(59, 130, 246, 0.1)'
                      }
                    }}
                  >
                    Générer
                  </Button>
                </Box>
                <TextField
                  fullWidth
                  name="password"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#9ca3af', fontSize: '1.1rem' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#9ca3af', p: 0.25 }}
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 1,
                      '& .MuiOutlinedInput-input': {
                        py: 1,
                        fontSize: '0.9rem',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e5e7eb',
                      }
                    }
                  }}
                  size="small"
                />
                
                {/* Indicateur de force du mot de passe */}
                {formData.password && (
                  <Box sx={{ mt: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ 
                        width: '100%', 
                        height: 6, 
                        bgcolor: '#e2e8f0',
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{
                          width: `${(passwordStrength.score / 6) * 100}%`,
                          height: '100%',
                          bgcolor: passwordStrength.score >= 5 ? '#10b981' : 
                                   passwordStrength.score >= 3 ? '#f59e0b' : '#ef4444',
                          transition: 'all 0.3s ease'
                        }} />
                      </Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          ml: 1,
                          color: passwordStrength.score >= 5 ? '#10b981' : 
                                 passwordStrength.score >= 3 ? '#f59e0b' : '#ef4444',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          minWidth: 60,
                          textAlign: 'right'
                        }}
                      >
                        {passwordStrength.score}/6
                      </Typography>
                    </Box>
                    
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: passwordStrength.score >= 5 ? '#10b981' : 
                               passwordStrength.score >= 3 ? '#f59e0b' : '#ef4444',
                        fontSize: '0.75rem',
                        display: 'block',
                        mb: 1
                      }}
                    >
                      {passwordStrength.feedback}
                    </Typography>
                    
                    {/* Détails des exigences */}
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: 0.5,
                      fontSize: '0.7rem'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: passwordStrength.requirements.length ? '#10b981' : '#d1d5db',
                          mr: 0.5
                        }} />
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          12+ caractères
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: passwordStrength.requirements.uppercase ? '#10b981' : '#d1d5db',
                          mr: 0.5
                        }} />
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          Majuscule
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: passwordStrength.requirements.lowercase ? '#10b981' : '#d1d5db',
                          mr: 0.5
                        }} />
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          Minuscule
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: passwordStrength.requirements.number ? '#10b981' : '#d1d5db',
                          mr: 0.5
                        }} />
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          Chiffre
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: passwordStrength.requirements.special ? '#10b981' : '#d1d5db',
                          mr: 0.5
                        }} />
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          Caractère spécial
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: passwordStrength.requirements.noCommon ? '#10b981' : '#d1d5db',
                          mr: 0.5
                        }} />
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          Pas commun
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Champ Confirmer mot de passe */}
              <Box sx={{ mb: 2.5 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#1e293b',
                    fontSize: '0.875rem',
                    mb: 0.5
                  }}
                >
                  Confirmer le mot de passe 
                </Typography>
                <TextField
                  fullWidth
                  name="password2"
                  type={showPassword2 ? "text" : "password"}
                  id="password2"
                  autoComplete="new-password"
                  value={formData.password2}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  error={formData.password2 && formData.password !== formData.password2}
                  helperText={formData.password2 && formData.password !== formData.password2 ? 'Les mots de passe ne correspondent pas' : ''}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ 
                          color: formData.password2 && formData.password !== formData.password2 ? '#ef4444' : '#9ca3af', 
                          fontSize: '1.1rem' 
                        }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword2(!showPassword2)}
                          edge="end"
                          sx={{ 
                            color: formData.password2 && formData.password !== formData.password2 ? '#ef4444' : '#9ca3af', 
                            p: 0.25 
                          }}
                          size="small"
                        >
                          {showPassword2 ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 1,
                      '& .MuiOutlinedInput-input': {
                        py: 1,
                        fontSize: '0.9rem',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: formData.password2 && formData.password !== formData.password2 ? '#ef4444' : '#e5e7eb',
                      }
                    }
                  }}
                  size="small"
                />
              </Box>
              
              {/* Bouton d'inscription */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  py: 1.5,
                  mb: 3,
                  borderRadius: 2,
                  bgcolor: '#0a0e27',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1rem',
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(10, 14, 39, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: '#1e293b',
                    boxShadow: '0 6px 20px rgba(10, 14, 39, 0.3)',
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  '&:disabled': {
                    bgcolor: '#e2e8f0',
                    color: '#94a3b8',
                    boxShadow: 'none',
                  }
                }}
                disabled={
                  loading || 
                  !passwordStrength.isValid || 
                  !!emailError || 
                  !!usernameError ||
                  !formData.email ||
                  !formData.username ||
                  !formData.role ||
                  !formData.password ||
                  !formData.password2 ||
                  formData.password !== formData.password2
                }
              >
                {loading ? (
                  <CircularProgress size={18} sx={{ color: 'white' }} />
                ) : 'Créer mon compte'}
              </Button>
              
              {/* Séparateur */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2.5 
              }}>
                <Box sx={{ flex: 1, height: '1px', bgcolor: '#e5e7eb' }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mx: 1, 
                    color: '#6b7280',
                    fontWeight: 500,
                    fontSize: '0.7rem',
                  }}
                >
                  OU CONTINUER AVEC
                </Typography>
                <Box sx={{ flex: 1, height: '1px', bgcolor: '#e5e7eb' }} />
              </Box>
              
              {/* Bouton Google */}
              <Button
                fullWidth
                variant="outlined"
                startIcon={googleLoading ? null : <GoogleIcon />}
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                sx={{ 
                  py: 1.5,
                  borderRadius: 2,
                  borderColor: '#e2e8f0',
                  borderWidth: '2px',
                  color: '#1e293b',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  bgcolor: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    borderWidth: '2px',
                    bgcolor: '#f8fafc',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  }
                }}
              >
                {googleLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={18} />
                    <span>Connexion...</span>
                  </Box>
                ) : 'Continuer avec Google'}
              </Button>
            </Box>
          </Paper>
          
          {/* Lien de connexion */}
          <Box sx={{ textAlign: 'center', mt: 2.5 }}>
            <Typography variant="body2" sx={{ color: '#6b7280', display: 'inline', fontSize: '0.8rem' }}>
              Vous avez déjà un compte?{' '}
            </Typography>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#3b82f6',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline',
                  fontSize: '0.8rem',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Se connecter
              </Typography>
            </Link>
          </Box>
        </Box>
      </Box>

      {/* Colonne droite - Section présentation */}
      <Box
        sx={{
          flex: 1,
          bgcolor: '#0a0e27',
          color: 'white',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          m: 0,
          p: 0,
          order: { xs: 1, md: 2 },
        }}
      >
        <Box sx={{ 
          flex: 1, 
          display: 'flex',
          flexDirection: 'column',
          m: 0,
          p: 0,
        }}>
          {/* Logo et nom */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5, 
            pt: 2.5,
            pl: 2.5,
            pr: 2.5,
            mb: 2.5,
          }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img 
                src={notif} 
                alt="SmartAlerte Logo" 
                width="60" 
                height="60" 
                style={{ objectFit: 'contain' }}
              />
            </Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: '1.1rem',
              }}
            >
              SmartNotify
            </Typography>
          </Box>

          {/* Titre principal */}
          <Box sx={{ px: 2.5 }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 800,
                fontSize: '2.2rem',
                lineHeight: 1.1,
                mb: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ERP Alert System
            </Typography>

            {/* Sous-titre */}
            <Typography 
              sx={{ 
                fontWeight: 600,
                mb: 2,
                color: '#94a3b8',
                fontSize: '1.1rem',
              }}
            >
              Rejoignez-nous dès aujourd'hui
            </Typography>

            {/* Description */}
            <Typography 
              sx={{ 
                color: '#cbd5e1',
                mb: 3,
                fontSize: '0.95rem',
                lineHeight: 1.5,
              }}
            >
              Créez votre compte et commencez à gérer vos notifications ERP de manière intelligente.
            </Typography>
          </Box>

          {/* Statistiques style moderne */}
          <Box sx={{ px: 2.5, mb: 3 }}>
            {/* Première ligne - 2 cartes */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              {/* Carte 1 - Alertes Personnalisées */}
              <Card
                sx={{
                  flex: 1,
                  bgcolor: 'rgba(30, 41, 99, 0.5)',
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  borderRadius: 2.5,
                  p: 2.5,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.15)',
                  }
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'rgba(59, 130, 246, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    <NotificationsIcon sx={{ color: '#60a5fa', fontSize: 24 }} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    Alertes Personnalisées
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(203, 213, 225, 0.8)',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                    }}
                  >
                    Configurez vos propres règles d'alerte pour chaque module ERP
                  </Typography>
                </CardContent>
              </Card>

              {/* Carte 2 - Notifications Instantanées */}
              <Card
                sx={{
                  flex: 1,
                  bgcolor: 'rgba(30, 41, 99, 0.5)',
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  borderRadius: 2.5,
                  p: 2.5,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.15)',
                  }
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'rgba(59, 130, 246, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    <FlashOnIcon sx={{ color: '#60a5fa', fontSize: 24 }} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    Notifications Instantanées
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(203, 213, 225, 0.8)',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                    }}
                  >
                    Recevez des alertes en temps réel par email ou in-app
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Deuxième ligne - 2 cartes */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* Carte 3 - Tableau de Bord Analytique */}
              <Card
                sx={{
                  flex: 1,
                  bgcolor: 'rgba(30, 41, 99, 0.5)',
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  borderRadius: 2.5,
                  p: 2.5,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.15)',
                  }
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'rgba(59, 130, 246, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    <BarChartIcon sx={{ color: '#60a5fa', fontSize: 24 }} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    Tableau de Bord Analytique
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(203, 213, 225, 0.8)',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                    }}
                  >
                    Suivez vos notifications et optimisez vos processus
                  </Typography>
                </CardContent>
              </Card>

              {/* Carte 4 - Sécurité Renforcée */}
              <Card
                sx={{
                  flex: 1,
                  bgcolor: 'rgba(30, 41, 99, 0.5)',
                  border: '1px solid rgba(59, 130, 246, 0.15)',
                  borderRadius: 2.5,
                  p: 2.5,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.15)',
                  }
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: 'rgba(59, 130, 246, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    <SecurityIcon sx={{ color: '#60a5fa', fontSize: 24 }} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    Sécurité Renforcée
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(203, 213, 225, 0.8)',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                    }}
                  >
                    Vos données ERP restent confidentielles et protégées
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ px: 2.5, pb: 2.5 }}>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 1.5 }} />
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#64748b',
              textAlign: 'center',
              fontSize: '0.7rem',
            }}
          >
            © 2026 DIVA Software. Tous droits réservés.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Register;
