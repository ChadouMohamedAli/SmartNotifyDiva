import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { openGoogleLoginPopup } from '../../services/googleOAuthConfig';
import { useTranslation } from 'react-i18next';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Checkbox,
  IconButton,
  InputAdornment,
  Divider,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff,
  Mail as MailIcon,
  Lock as LockIcon,
  Google as GoogleIcon,
  Notifications as NotificationsIcon,
  FlashOn as FlashOnIcon,
  BarChart as BarChartIcon,
  Security as SecurityIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { FaTelegramPlane } from "react-icons/fa";
import notif from '../../assets/notif.png';

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailChecking, setEmailChecking] = useState(false);
  const { login, checkEmailExists, logout } = useAuth();
  const navigate = useNavigate();
  const emailInputRef = useRef(null);

  // Focus on email input when component mounts
  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleGoogleAuthMessage = (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'google-auth-success') {
        setLoading(false);
        const googleUser = event.data?.payload?.user || JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = googleUser?.is_superuser || googleUser?.is_staff;
        navigate(isAdmin ? '/admin_dashboard' : '/dashboard', { replace: true });
      }

      if (event.data?.type === 'google-auth-error') {
        setLoading(false);
        setError(event.data?.payload?.error || t('googleLoginError'));
      }
    };

    window.addEventListener('message', handleGoogleAuthMessage);
    return () => window.removeEventListener('message', handleGoogleAuthMessage);
  }, [navigate, t]);

  const handleTelegramSignIn = () => {
    navigate('/telegram-login');
  };

  const handleEmailCheck = async (emailToCheck) => {
    if (!emailToCheck || !emailToCheck.includes('@')) {
      setEmailError('');
      return false;
    }
    
    setEmailChecking(true);
    try {
      const result = await checkEmailExists(emailToCheck);
      return result.exists;
    } catch (error) {
      console.error('Erreur vérification email:', error);
      return false;
    } finally {
      setEmailChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    
    if (!email || !password) {
      setError(t('loginFillAllFields'));
      return;
    }
    
    if (!email.includes('@')) {
      setError(t('loginValidEmail'));
      return;
    }
    
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        if (result.verificationRequired) {
          const pendingPayload = {
            challengeId: result.challengeId,
            email: result.email,
            purpose: result.purpose,
            message: result.message,
          };
          localStorage.setItem('pending_otp', JSON.stringify(pendingPayload));
          navigate('/login-otp', { replace: true, state: pendingPayload });
          return;
        }

        const userData = result.user || JSON.parse(localStorage.getItem('user') || '{}');

        if (!userData.is_active) {
          await logout();
          setError(t('accountPendingApproval'));
          return;
        }

        const isAdmin = userData?.is_superuser || userData?.is_staff;

        if (isAdmin) {
          navigate('/admin_dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        const errorMessage = result.error || t('loginFailed');
        
        if (errorMessage.includes('credentials') || errorMessage.includes('mot de passe') || errorMessage.includes('Invalid')) {
          setError(t('invalidCredentials'));
        } else if (errorMessage.includes('disabled')) {
          setError(t('accountDisabled'));
        } else {
          setError(errorMessage);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('genericRetryError'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError('');
    
    if (value && !value.includes('@')) {
      setEmailError(t('invalidEmailFormat'));
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Ouvrir la popup Google OAuth
      const popup = openGoogleLoginPopup();
      
      if (!popup) {
        setError(t('popupBlocked'));
        setLoading(false);
        return;
      }
      
      // Attendre la fermeture de la popup
      const checkPopupInterval = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkPopupInterval);
            setLoading(false);
            // Le callback s'occupera de la redirection
          }
        } catch (e) {
          // Popup fermée par l'utilisateur
          clearInterval(checkPopupInterval);
          setLoading(false);
        }
      }, 500);
      
    } catch (error) {
      console.error('Erreur Google Sign-In:', error);
      setError(t('googleLoginError'));
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      width: '100vw',
      height: '100vh',
      display: 'flex',
      m: 0,
      p: 0,
      overflow: 'hidden',
    }}>
      {/* Colonne gauche - Section présentation */}
      <Box
        sx={{
          width: { xs: '0%', md: '50%' },
          bgcolor: '#0a0e27',
          color: 'white',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
        }}
      >
        {/* Contenu principal */}
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
                style={{ 
                  width: '60px',
                  height: '60px',
                  objectFit: 'contain',
                }}      
              />
            </Box>
            <Typography 
              variant="h10" 
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
              ERP Management & Alert System
            </Typography>

            <Typography 
              sx={{ 
                fontWeight: 600,
                mb: 2,
                color: '#94a3b8',
                fontSize: '1.1rem',
              }}
            >
              Gérez vos alertes ERP intelligemment
            </Typography>

            <Typography 
              sx={{ 
                color: '#cbd5e1',
                mb: 3,
                fontSize: '0.95rem',
                lineHeight: 1.5,
              }}
            >
              Une plateforme puissante pour configurer, gérer et recevoir des notifications 
              personnalisées de tous vos modules ERP.
            </Typography>
          </Box>

          {/* Statistiques style moderne avec icônes */}
          <Box sx={{ px: 2.5, mb: 3 }}>
            {/* Première ligne - 2 cartes */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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

      {/* Colonne droite - Formulaire de connexion */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, md: 3 },
          bgcolor: '#f8fafc',
          minHeight: '100vh',
        }}
      >
        <Box sx={{ maxWidth: 480, width: '100%' }}>
          {/* Logo mobile */}
          <Box 
            sx={{ 
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center', 
              justifyContent: 'center',
              mb: 3,
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
          
          {/* Card principale du formulaire */}
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
            {/* Header du formulaire avec barre de couleur */}
            <Box sx={{ mb: 3 }}>
              {/* Barre de couleur décorative */}
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
                  mb: 0.5,
                  fontSize: '1.75rem',
                }}
              >
                {t('welcome')}
              </Typography>
              <Typography 
                sx={{ 
                  color: '#64748b',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                }}
              >
                {t('loginSubtitle')}
              </Typography>
            </Box>
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
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
            
            <Box component="form" onSubmit={handleSubmit}>
              {/* Champ Email */}
              <Box sx={{ mb: 2.5 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 1,
                    color: '#1e293b',
                    fontSize: '0.875rem',
                  }}
                >
                  {t('emailAddress')}
                </Typography>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="exemple@entreprise.com"
                  error={!!emailError}
                  helperText={emailError}
                  disabled={emailChecking}
                  inputRef={emailInputRef}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailIcon sx={{ color: emailError ? '#ef4444' : '#64748b', fontSize: '1.25rem' }} />
                      </InputAdornment>
                    ),
                    endAdornment: emailChecking && (
                      <InputAdornment position="end">
                        <CircularProgress size={20} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      '& .MuiOutlinedInput-input': {
                        py: 1.5,
                        fontSize: '0.95rem',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: emailError ? '#ef4444' : '#e2e8f0',
                        borderWidth: '2px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: emailError ? '#ef4444' : '#cbd5e1',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: emailError ? '#ef4444' : '#3b82f6',
                      }
                    }
                  }}
                />
              </Box>
              
              {/* Champ Mot de passe */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#1e293b',
                      fontSize: '0.875rem',
                    }}
                  >
                    {t('password')}
                  </Typography>
                  <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#3b82f6',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        '&:hover': { 
                          textDecoration: 'underline',
                          color: '#2563eb' 
                        }
                      }}
                    >
                      {t('forgotPassword')}
                    </Typography>
                  </Link>
                </Box>

                <TextField
                  fullWidth
                  name="password"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#64748b', fontSize: '1.25rem' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ 
                            color: '#64748b',
                            '&:hover': {
                              bgcolor: '#f1f5f9'
                            }
                          }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      '& .MuiOutlinedInput-input': {
                        py: 1.5,
                        fontSize: '0.95rem',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#e2e8f0',
                        borderWidth: '2px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#cbd5e1',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3b82f6',
                      }
                    }
                  }}
                />
                
                {/* Conseils de sécurité */}
                <Box sx={{ mt: 1, p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                    <strong>{t('tipLabel')}</strong> {t('passwordTip')}
                  </Typography>
                </Box>
              </Box>
              
              {/* Case à cocher Se souvenir de moi */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Checkbox 
                  color="primary" 
                  sx={{ 
                    p: 0,
                    mr: 1,
                    '&.Mui-checked': {
                      color: '#3b82f6',
                    }
                  }} 
                />
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.875rem', fontWeight: 500 }}>
                  {t('rememberMe30Days')}
                </Typography>
              </Box>
              
              {/* Bouton de connexion */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                endIcon={loading ? null : <ArrowForwardIcon />}
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
                disabled={loading || emailChecking || !!emailError}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                    <span>Connexion en cours...</span>
                  </Box>
                ) : (
                  t('signIn')
                )}
              </Button>
              
              {/* Séparateur */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3 
              }}>
                <Box sx={{ flex: 1, height: '1px', bgcolor: '#e2e8f0' }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mx: 2, 
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                  }}
                >
                  {t('orContinueWith')}
                </Typography>
                <Box sx={{ flex: 1, height: '1px', bgcolor: '#e2e8f0' }} />
              </Box>
              
              {/* Bouton Google */}
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleSignIn}
                disabled={loading}
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
                  },
                  '&:disabled': {
                    bgcolor: '#e2e8f0',
                    borderColor: '#cbd5e1',
                    color: '#94a3b8',
                  }
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={18} sx={{ color: '#0a0e27' }} />
                    <span>Connexion en cours...</span>
                  </Box>
                ) : (
                  t('continueWithGoogle')
                )}
              </Button>

              {/* Bouton Telegram avec icône personnalisée */}
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FaTelegramPlane size={20} />}
                onClick={handleTelegramSignIn}
                disabled={loading}
                sx={{
                  mt: 1.5,
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
                    borderColor: '#26A5E4',
                    borderWidth: '2px',
                    bgcolor: '#eff6ff',
                    color: '#26A5E4',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(38,165,228,0.12)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  '&:disabled': {
                    bgcolor: '#e2e8f0',
                    borderColor: '#cbd5e1',
                    color: '#94a3b8',
                  }
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={18} sx={{ color: '#26A5E4' }} />
                    <span>Connexion en cours...</span>
                  </Box>
                ) : (
                  t('continueWithTelegram')
                )}
              </Button>
            </Box>
          </Paper>

          {/* Lien d'inscription en dehors de la carte */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" sx={{ color: '#64748b', display: 'inline', fontSize: '0.9rem' }}>
              {t('noAccount')}{' '}
            </Typography>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#3b82f6',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline',
                  fontSize: '0.9rem',
                  transition: 'color 0.2s ease',
                  '&:hover': { 
                    color: '#2563eb',
                    textDecoration: 'underline' 
                  }
                }}
              >
                {t('createAccount')}
              </Typography>
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
