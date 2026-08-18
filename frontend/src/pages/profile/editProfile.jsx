import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Paper,
  useTheme,
  useMediaQuery,
  Button,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Description as DescriptionIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import SharedSidebar from '../../components/SharedSidebar';

const EditProfile = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    phone_number: '',
    role: '',
  });

  // Initialiser les données du formulaire avec les données utilisateur
  useEffect(() => {
    console.log('🔍 EditProfile - User data:', user);
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
        phone_number: user.phone_number || '',
        role: user.role || '',
      });
    }
  }, [user]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`🔍 Changing ${name} to:`, value);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔍 Form submitted with data:', formData);
    setLoading(true);
    setError(null);

    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        phone_number: formData.phone_number,
      
      };

      // Appeler la fonction updateProfile du contexte
      await updateProfile(payload);
      
      console.log('Profile update successful');
      setSuccess(true);
      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (err) {
      console.error('❌ Profile update failed:', err);
      setError(err.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  if (!user) {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'black',
      }}>
        <Typography variant="h4" sx={{ color: 'white' }}>
          Chargement...
        </Typography>
      </Box>
    );
  }

  // Détermine si l'utilisateur est admin
  const isAdmin = user?.is_superuser || user?.is_staff;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'black' }}>
      {/* Sidebar partagé */}
      <SharedSidebar 
        mobileOpen={mobileOpen} 
        onMobileClose={handleDrawerToggle}
      />

      {/* Contenu principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          minHeight: '100vh',
          bgcolor: 'black',
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'rgba(15, 23, 42, 0.4)',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(59, 130, 246, 0.3)',
            borderRadius: '4px',
            '&:hover': {
              bgcolor: 'rgba(59, 130, 246, 0.5)',
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 1.2,
            borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          {/* Menu mobile icon */}
          {isMobile && (
            <IconButton
              onClick={handleDrawerToggle}
              sx={{
                color: 'white',
                mr: 1,
                '&:hover': {
                  bgcolor: 'rgba(59, 130, 246, 0.1)',
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

         
        </Box>

        {/* Contenu de la page EditProfile */}
        <Box sx={{ p: 3, pb: 6 }}>
          {/* Messages d'alerte */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                bgcolor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
              }} 
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <Card sx={{ 
            bgcolor: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            <CardContent sx={{ p: 4 }}>
              <form onSubmit={handleSubmit}>
                {/* Section Avatar */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
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
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#94a3b8',
                      fontSize: '0.85rem',
                    }}
                  >
                    Photo de profil 
                  </Typography>
                </Box>

                <Divider sx={{ 
                  my: 4, 
                  borderColor: 'rgba(59, 130, 246, 0.1)',
                  '&::before, &::after': {
                    borderColor: 'rgba(59, 130, 246, 0.1)',
                  }
                }} />

                {/* Informations personnelles */}
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    mb: 4, 
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <PersonIcon sx={{ color: '#3b82f6', fontSize: 24 }} />
                  Informations personnelles
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Prénom"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': {
                            borderColor: 'rgba(59, 130, 246, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: '#3b82f6',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#3b82f6',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#94a3b8',
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#3b82f6',
                        }
                      }}
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: '#64748b' }} />
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nom"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': {
                            borderColor: 'rgba(59, 130, 246, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: '#3b82f6',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#3b82f6',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#94a3b8',
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#3b82f6',
                        }
                      }}
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: '#64748b' }} />
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': {
                            borderColor: 'rgba(59, 130, 246, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: '#3b82f6',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#3b82f6',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#94a3b8',
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#3b82f6',
                        }
                      }}
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1, color: '#64748b' }} />
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nom d'utilisateur"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': {
                            borderColor: 'rgba(59, 130, 246, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: '#3b82f6',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#3b82f6',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#94a3b8',
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#3b82f6',
                        }
                      }}
                      InputProps={{
                        startAdornment: <BadgeIcon sx={{ mr: 1, color: '#64748b' }} />
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Téléphone"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': {
                            borderColor: 'rgba(59, 130, 246, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: '#3b82f6',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#3b82f6',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#94a3b8',
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#3b82f6',
                        }
                      }}
                      InputProps={{
                        startAdornment: <PhoneIcon sx={{ mr: 1, color: '#64748b' }} />
                      }}
                      placeholder="+216 12 345 678"
                    />
                  </Grid>
                  
                    <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Role"
                      name="role"
                      value={isAdmin ? 'Administrateur' : formData.role}
                      onChange={handleInputChange}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': {
                            borderColor: 'rgba(59, 130, 246, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: '#3b82f6',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#3b82f6',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#94a3b8',
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#3b82f6',
                        }
                      }}
                      InputProps={{
                        startAdornment: <personIcon sx={{ mr: 1, color: '#64748b' }} />
                      }}
                      
                      placeholder="Entrez votre role "
                    />
                  </Grid>

               
                </Grid>

                <Divider sx={{ 
                  my: 4, 
                  borderColor: 'rgba(59, 130, 246, 0.1)',
                  '&::before, &::after': {
                    borderColor: 'rgba(59, 130, 246, 0.1)',
                  }
                }} />

                {/* Boutons d'action */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: 2, 
                  mt: 4,
                  pt: 3,
                  borderTop: '1px solid rgba(59, 130, 246, 0.1)'
                }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    startIcon={<CancelIcon />}
                    disabled={loading}
                    sx={{ 
                      minWidth: 140,
                      color: '#94a3b8',
                      borderColor: 'rgba(59, 130, 246, 0.3)',
                      textTransform: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        borderColor: '#3b82f6',
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                      }
                    }}
                  >
                    Annuler
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={loading}
                    sx={{ 
                      minWidth: 140,
                      bgcolor: '#3b82f6',
                      color: 'white',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                      '&:hover': {
                        bgcolor: '#2563eb',
                        boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
                      },
                      '&:disabled': {
                        bgcolor: 'rgba(59, 130, 246, 0.5)',
                      }
                    }}
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Snackbar pour les messages de succès */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success" 
          sx={{ 
            width: '100%',
            bgcolor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: '#10b981',
          }}
        >
          Profil mis à jour avec succès !
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditProfile;