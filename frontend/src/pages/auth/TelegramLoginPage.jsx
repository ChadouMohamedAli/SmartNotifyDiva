import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import notif from '../../assets/notif.png';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');
const BOT_USERNAME = process.env.REACT_APP_TELEGRAM_BOT_USERNAME || 'ERP_notif_Bot';

const TelegramLoginPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { setSession } = useAuth();

  // Step 1: enter username → open bot
  // Step 2: enter OTP received from bot
  const [step, setStep] = useState(1);
  const [telegramUsername, setTelegramUsername] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [botUrl, setBotUrl] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const otpRef = useRef(null);
  const normalizedTelegramUsername = telegramUsername.trim().replace(/^@/, '');
  const isTelegramUsernameValid = /^[a-zA-Z0-9_]{5,32}$/.test(normalizedTelegramUsername);

  useEffect(() => {
    if (step === 2 && otpRef.current) {
      setTimeout(() => otpRef.current?.focus(), 100);
    }
  }, [step]);

  // ── Step 1: request code ──────────────────────────────────────────
  const handleRequestCode = async () => {
    if (!isTelegramUsernameValid) {
      setError('Le username Telegram est obligatoire (5-32 caracteres, lettres/chiffres/_).');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const resp = await axios.post(`${API_BASE_URL}/auth/telegram-send-code/`, {
        telegram_username: normalizedTelegramUsername,
      });
      const { session_code, bot_url } = resp.data;
      setSessionCode(session_code);
      setBotUrl(bot_url);

      // Open the bot in a new tab
      window.open(bot_url, '_blank', 'noopener,noreferrer');

      setStep(2);
    } catch (err) {
      setError('Impossible de contacter le serveur. Vérifiez que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Entrez le code à 6 chiffres reçu sur Telegram.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const resp = await axios.post(`${API_BASE_URL}/auth/telegram-verify-otp/`, {
        session_code: sessionCode,
        otp,
      });
      const { user, token, refresh_token } = resp.data;

      const fullUser = setSession(user, token, refresh_token);

      const isAdmin = fullUser?.is_superuser || fullUser?.is_staff;
      navigate(isAdmin ? '/admin_dashboard' : '/dashboard', { replace: true });
    } catch (err) {
      const apiMsg = err?.response?.data?.error || '';
      if (apiMsg.includes('Code pas encore généré')) {
        setError('Aucun code n a encore été géneré. Ouvrez le bot, cliquez sur Start, puis revenez vérifier.');
      } else {
        setError(apiMsg || 'Code incorrect ou expiré.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpKeyDown = (e) => {
    if (e.key === 'Enter') handleVerifyOtp();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0e27 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? 2 : 3,
      }}
    >
      <Container component="main" maxWidth="sm">
      <Box sx={{ width: '100%' }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4, gap: 1 }}>
          <img
            src={notif}
            alt="Logo"
            style={{
              width: 48,
              height: 48,
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.3))',
            }}
          />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: 0.5,
            }}
          >
            SmartNotify
          </Typography>
       
 </Box>
        <Paper
          elevation={0}
          sx={{
            border: '1px solid #30363d',
            borderRadius: 2,
            p: isMobile ? 3 : 4,
            background: '#0d1117',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          
          {/* Header */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                border: '1px solid #3b82f6',
              }}
            >
              <SendIcon sx={{ color: '#60a5fa', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#e2e8f0', mb: 0.5 }}>
              Connexion via Telegram
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              {step === 1
                ? 'Recevez un code de vérification directement dans Telegram'
                : 'Entrez le code reçu sur Telegram'}
            </Typography>
          </Box>

          {/* Step indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
            <Box
              sx={{
                flex: 1, height: 4, borderRadius: 2,
                bgcolor: step >= 1 ? '#3b82f6' : '#30363d',
                transition: 'background 0.3s',
              }}
            />
            <Box
              sx={{
                flex: 1, height: 4, borderRadius: 2,
                bgcolor: step >= 2 ? '#3b82f6' : '#30363d',
                transition: 'background 0.3s',
              }}
            />
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2.5,
                borderRadius: 2,
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: '#ef4444',
                color: '#fca5a5',
                '& .MuiAlert-icon': { color: '#ef4444' },
              }}
            >
              {error}
            </Alert>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#94a3b8', mb: 1 }}>
                Nom d'utilisateur Telegram <Typography component="span" sx={{ color: '#94a3b8', fontWeight: 400 }}></Typography>
              </Typography>
              <TextField
                fullWidth
                placeholder="@votre_username"
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value.replace(/\s+/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRequestCode(); }}
                error={telegramUsername.length > 0 && !isTelegramUsernameValid}
                helperText={
                  telegramUsername.length > 0 && !isTelegramUsernameValid
                    ? 'Format invalide: 5-32 caracteres (lettres, chiffres, _)'
                    : 'Entrez votre nom d\'utilisateur Telegram '
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#94a3b8', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2,
                    color: '#e2e8f0',
                    backgroundColor: '#161b22',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#30363d' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                  },
                }}
                sx={{
                  mb: 2,
                  '& .MuiInputBase-input::placeholder': {
                    color: '#64748b',
                    opacity: 1,
                  },
                  '& .MuiFormHelperText-root': {
                    ml: 0,
                    mt: 1,
                    color: telegramUsername.length > 0 && !isTelegramUsernameValid ? '#fca5a5' : '#94a3b8',
                  },
                }}
              />

          

              <Button
                fullWidth
                variant="contained"
                startIcon={loading ? null : <SendIcon />}
                onClick={handleRequestCode}
                disabled={loading || !isTelegramUsernameValid}
                sx={{
                  py: 1.5, borderRadius: 2,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  fontWeight: 600, fontSize: '1rem',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
                  },
                  '&:disabled': { background: '#4b5563', color: '#9ca3af' },
                }}
              >
                {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Démarrer'}
              </Button>
            </>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <>
              <Box sx={{ p: 2, backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 2, border: '1px solid #22c55e', mb: 3, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <SecurityIcon sx={{ color: '#22c55e', mt: 0.2 }} />
                <Box>
                  <Typography variant="body2" sx={{ color: '#86efac', fontWeight: 600 }}>
                    Etape finale dans Telegram
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#bbf7d0', fontSize: '0.85rem' }}>
                    Ouvrez <strong>@{BOT_USERNAME}</strong>, cliquez <strong>Start</strong>, puis copiez le code a 6 chiffres recu.
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" sx={{ fontWeight: 600, color: '#e2e8f0', mb: 1 }}>
                Code de vérification
              </Typography>
              <TextField
                fullWidth
                inputRef={otpRef}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={handleOtpKeyDown}
                inputProps={{ maxLength: 6, style: { letterSpacing: '0.5rem', fontSize: '1.5rem', textAlign: 'center' } }}
                InputProps={{
                  sx: {
                    borderRadius: 2,
                    color: '#e2e8f0',
                    backgroundColor: '#161b22',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#30363d' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                  },
                }}
                sx={{ mb: 3 }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                sx={{
                  py: 1.5, borderRadius: 2,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  fontWeight: 600, fontSize: '1rem',
                  textTransform: 'none', mb: 1.5,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
                  },
                  '&:disabled': { background: '#4b5563', color: '#9ca3af' },
                }}
              >
                {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Vérifier et se connecter'}
              </Button>

              <Divider sx={{ my: 1.5, borderColor: '#30363d' }} />

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Button
                  size="small"
                  variant="text"
                  sx={{ color: '#60a5fa', textTransform: 'none', fontSize: '0.85rem' }}
                  onClick={() => window.open(botUrl, '_blank', 'noopener,noreferrer')}
                >
                  Rouvrir le bot
                </Button>
                <Typography sx={{ color: '#475569', alignSelf: 'center' }}>|</Typography>
                <Button
                  size="small"
                  variant="text"
                  sx={{ color: '#94a3b8', textTransform: 'none', fontSize: '0.85rem' }}
                  onClick={() => { setStep(1); setOtp(''); setError(''); setSessionCode(''); }}
                >
                  Recommencer
                </Button>
              </Box>
            </>
          )}
        </Paper>

        {/* Back to login */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              sx={{
                color: '#64748b',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  color: '#e0e7ff',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                },
              }}
            >
              Retour à la connexion
            </Button>
          </Link>
        </Box>
      </Box>
      </Container>
    </Box>
  );
};

export default TelegramLoginPage;
