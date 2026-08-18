import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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

const ForgotPassword = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Placeholder for password reset logic
    try {
      const response = await fetch('http://localhost:8000/api/auth/password-reset/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || 'Erreur lors de l\'envoi du lien');
      }

      setSuccess(' un lien de réinitialisation a été envoyé.');
    } catch (err) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
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
         
          {/* Main Card */}
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
            
            {/* Logo et nom de l'application */}
             {/* Header with back button */}

            {/* Titre */}
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
              Réinitialiser votre mot de passe
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
              Entrez votre email pour recevoir les instructions de réinitialisation
            </Typography>

            {/* Alerts */}
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

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Adresse email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
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
                  '& .MuiInputBase-input::placeholder': {
                    color: '#64748b',
                    opacity: 1,
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
                disabled={loading || !email}
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
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} sx={{ color: '#60a5fa' }} />
                    <span>Envoi...</span>
                  </Box>
                ) : (
                  'Envoyer le lien de réinitialisation'
                )}
              </Button>

              {/* Footer link */}
            <Box
  sx={{
    textAlign: 'center',
    pt: 2,
    borderTop: '1px solid #30363d',
  }}
>
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 1,
      flexWrap: 'wrap',
    }}
  >
    <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
      Vous vous souvenez de votre mot de passe?
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
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default ForgotPassword;
