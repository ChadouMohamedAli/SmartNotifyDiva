import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthorizedMenus } from '../utils/moduleMenuConfig';

/**
 * Composant pour vérifier si l'utilisateur a accès à une page spécifique
 * basé sur ses authorized_pages
 */
const RequirePageAccess = ({ children, pageSlug }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Les superadmins ont accès à tout
  if (user?.is_superuser || user?.is_primary_admin) {
    return children;
  }

  // Si aucune autorisation fine n'est définie, on retombe sur les droits par rôle.
  const authorizedPages = Array.isArray(user?.authorized_pages) ? user.authorized_pages : [];
  const roleBasedPages = getAuthorizedMenus(user);
  const effectivePages = authorizedPages.length > 0 ? authorizedPages : roleBasedPages;
  
  console.log(`[RequirePageAccess] Checking access to page: ${pageSlug}`);
  console.log(`[RequirePageAccess] User authorized pages:`, authorizedPages);
  console.log(`[RequirePageAccess] Role based pages:`, roleBasedPages);
  console.log(`[RequirePageAccess] Effective pages:`, effectivePages);
  console.log(`[RequirePageAccess] Has access:`, effectivePages.includes(pageSlug));

  if (!effectivePages.includes(pageSlug)) {
    console.warn(`[RequirePageAccess] User ${user?.email} denied access to page: ${pageSlug}`);
    if (user?.role === 'responsable_appro') {
      return <Navigate to="/appro-dashboard" replace />;
    }
    if (user?.role === 'responsable_stock') {
      return <Navigate to="/stock-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RequirePageAccess;
