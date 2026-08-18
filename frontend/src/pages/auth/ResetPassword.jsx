import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import notif from '../../assets/notif.png';

const ResetPassword = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!newPassword || !newPassword2) {
      setError('Veuillez remplir tous les champs');
      setLoading(false);
      return;
    }

    if (newPassword !== newPassword2) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/auth/password-reset-confirm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          token,
          new_password: newPassword,
          new_password2: newPassword2,
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Lien invalide ou expiré');
      }

      setSuccess('Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            p: isMobile ? 3 : 4,
            background: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Box sx={{ width: '100%', mb: 3 }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button
                startIcon={<ArrowBackIcon />}
                sx={{
                  color: '#64748b',
                  '&:hover': { color: '#e0e7ff', backgroundColor: 'rgba(255,255,255,0.05)' },
                }}
              >
                Retour
              </Button>
            </Link>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 4,
              gap: 2,
            }}
          >
            <img
              src={notif}
              alt="SmartAlerte Logo"
              width="45"
              height="45"
              style={{ filter: 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.3))' }}
            />
            <Typography
              variant="h5"
              component="div"
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

          <Typography
            component="h1"
            variant="h5"
            align="center"
            sx={{
              mb: 1,
              fontWeight: 700,
              color: '#e2e8f0',
              fontSize: isMobile ? '1.5rem' : '1.75rem',
            }}
          >
            Réinitialiser le mot de passe
          </Typography>

          <Typography
            align="center"
            sx={{
              mb: 3,
              color: '#94a3b8',
              fontSize: '0.95rem',
              lineHeight: 1.5,
            }}
          >
            Choisissez un nouveau mot de passe pour sécuriser votre compte
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: '#ef4444',
                color: '#fca5a5',
                '& .MuiAlert-icon': { color: '#ef4444' },
              }}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert
              severity="success"
              sx={{
                mb: 2,
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderColor: '#22c55e',
                color: '#86efac',
                '& .MuiAlert-icon': { color: '#22c55e' },
              }}
            >
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="new_password"
              label="Nouveau mot de passe"
              name="new_password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#e2e8f0',
                  backgroundColor: '#161b22',
                  border: '1px solid #30363d',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 12px rgba(59, 130, 246, 0.1)',
                  },
                  '&.Mui-focused': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 16px rgba(59, 130, 246, 0.2)',
                  },
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#30363d',
                },
                '& .MuiInputLabel-root': {
                  color: '#94a3b8',
                  '&.Mui-focused': { color: '#60a5fa' },
                },
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="new_password2"
              label="Confirmer le mot de passe"
              name="new_password2"
              type="password"
              autoComplete="new-password"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#e2e8f0',
                  backgroundColor: '#161b22',
                  border: '1px solid #30363d',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 12px rgba(59, 130, 246, 0.1)',
                  },
                  '&.Mui-focused': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 16px rgba(59, 130, 246, 0.2)',
                  },
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#30363d',
                },
                '& .MuiInputLabel-root': {
                  color: '#94a3b8',
                  '&.Mui-focused': { color: '#60a5fa' },
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.2,
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                borderRadius: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)',
                },
                '&:disabled': {
                  background: '#4b5563',
                  color: '#9ca3af',
                },
              }}
              disabled={loading || !newPassword || !newPassword2}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} sx={{ color: '#60a5fa' }} />
                  <span>Réinitialisation...</span>
                </Box>
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </Button>

            <Box
              sx={{
                textAlign: 'center',
                pt: 2,
                borderTop: '1px solid #30363d',
              }}
            >
              <Typography sx={{ color: '#64748b', mb: 1, fontSize: '0.9rem' }}>
                Retour rapide a l espace de connexion
              </Typography>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button
                  sx={{
                    color: '#60a5fa',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      color: '#93c5fd',
                      backgroundColor: 'rgba(96, 165, 250, 0.1)',
                    },
                  }}
                >
                  Retour à la connexion
                </Button>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
    </Box>
  );
};

export default ResetPassword;
