import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  IconButton,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import notif from '../../assets/notif.png';
import SharedSidebar from '../../components/SharedSidebar';

const ChangePassword = () => {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!oldPassword || !newPassword || !newPassword2) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (newPassword !== newPassword2) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    const result = await changePassword(oldPassword, newPassword, newPassword2);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Erreur lors du changement de mot de passe');
      return;
    }

    setSuccess('Mot de passe changé avec succès');
    setTimeout(() => navigate('/profile'), 1200);
  };

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'black' }}>
      <SharedSidebar mobileOpen={mobileOpen} onMobileClose={handleDrawerToggle} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: isMobile ? '100%' : 'calc(100% - 280px)',
          minHeight: '100vh',
          bgcolor: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Menu hamburger mobile */}
        {isMobile && (
          <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
            <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
              <MenuIcon />
            </IconButton>
          </Box>
        )}
        
        <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              gap: 1
            }}
          >
            <img
              src={notif}
              alt="SmartAlerte Logo"
              width="40"
              height="40"
            />
            <Typography
              variant="h4"
              component="div"
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
              }}
            >
              SmartAlerte
            </Typography>
          </Box>

          <Typography
            component="h1"
            variant="h5"
            align="center"
            gutterBottom
            sx={{ mb: 3 }}
          >
            Changer le mot de passe
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="old_password"
              label="Mot de passe actuel"
              name="old_password"
              type="password"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />

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
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Mettre a jour'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/profile')}
            >
              Retour
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
      </Box>
    </Box>
  );
};

export default ChangePassword;
