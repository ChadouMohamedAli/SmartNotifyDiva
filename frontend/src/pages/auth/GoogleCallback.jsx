import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { exchangeCodeForToken, validateState, clearState } from '../../services/googleOAuthConfig';

const GOOGLE_AUTH_SUCCESS = 'google-auth-success';
const GOOGLE_AUTH_ERROR = 'google-auth-error';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setError(`Erreur Google: ${errorParam}`);
          setLoading(false);
          return;
        }

        if (!code) {
          setError("Code d'authentification manquant");
          setLoading(false);
          return;
        }

        if (!validateState(state)) {
          setError('Etat de securite invalide - possible attaque CSRF');
          setLoading(false);
          return;
        }

        clearState();

        const data = await exchangeCodeForToken(code);

        localStorage.setItem('access_token', data.token);
        localStorage.setItem('refresh_token', data.refresh_token || '');
        localStorage.setItem('user', JSON.stringify(data.user));

        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            {
              type: GOOGLE_AUTH_SUCCESS,
              payload: {
                user: data.user,
              },
            },
            window.location.origin
          );
          window.close();
          return;
        }

        const isAdmin = data.user?.is_superuser || data.user?.is_staff;
        navigate(isAdmin ? '/admin_dashboard' : '/dashboard', { replace: true });
      } catch (err) {
        console.error('Erreur callback Google:', err);
        const message = err.message || 'Erreur lors de la connexion avec Google';

        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            {
              type: GOOGLE_AUTH_ERROR,
              payload: {
                error: message,
              },
            },
            window.location.origin
          );
          window.close();
          return;
        }

        setError(message);
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          bgcolor: '#f8fafc',
        }}
      >
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>Authentification en cours...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          bgcolor: '#f8fafc',
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {error}
        </Alert>
        <Typography
          onClick={() => navigate('/login', { replace: true })}
          sx={{
            mt: 3,
            color: '#3b82f6',
            cursor: 'pointer',
            textDecoration: 'underline',
            '&:hover': { color: '#2563eb' },
          }}
        >
          Retour a la connexion
        </Typography>
      </Box>
    );
  }

  return null;
};

export default GoogleCallback;
