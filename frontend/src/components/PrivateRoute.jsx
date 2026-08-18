import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }
  
  // Si l'utilisateur n'est pas authentifié
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Un compte inactif ne peut pas acceder aux pages protegees
  if (!user.is_active) {
    return <Navigate to="/login" replace />;
  }
  
  // Utilisateur authentifie et actif
  return children;
};

export default PrivateRoute;
