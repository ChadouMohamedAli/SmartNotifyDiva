/**
 * Configuration des menus par rôle
 * Chaque rôle définit les menus accessibles
 */

export const ROLE_MENUS = {
  // Super Admin - Accès à TOUT
  super_admin: [
    'dashboard',
    'alertes',
    'notifications',
    'stock',
    'orders',
    'categories',
    'fournisseurs',
    'entrepots',
    'facturation',
    'matiere-premiere',
    'ordre-production',
    'produit-fini',
    'modules',
    'admin',
    'Employes',
    'history',
    'profile',
    'settings',
    'deconnexion',
  ],

  // Responsable Stock - Gère stock, catégories, entrepôts, fournisseurs
  responsable_stock: [
    'dashboard',
    'stock',
    'categories',
    'fournisseurs',
    'entrepots',
    'facturation',
    'alertes',
    'notifications',
    'history',
    'admin',
    'profile',
    'settings',
    'deconnexion',
  ],

  // Responsable Production - Gère production uniquement
  responsable_production: [
    'dashboard',
    'matiere-premiere',
    'ordre-production',
    'produit-fini',
    'alertes',
    'notifications',
    'history',
    'profile',
    'settings',
    'deconnexion',
  ],

  // Responsable Facturation
  responsable_facturation: [
    'dashboard',
    'facturation',
    'orders',
    'alertes',
    'notifications',
    'history',
    'profile',
    'settings',
    'deconnexion',
  ],

  // Responsable Commandes
  responsable_commandes: [
    'dashboard',
    'orders',
    'stock',
    'alertes',
    'notifications',
    'history',
    'profile',
    'settings',
    'deconnexion',
  ],

  // Agent Stock - Consultation uniquement
  agent_stock: [
    'dashboard',
    'stock',
    'notifications',
    'profile',
    'settings',
    'deconnexion',
  ],

  // Agent Production - Consultation uniquement
  agent_production: [
    'dashboard',
    'matiere-premiere',
    'ordre-production',
    'produit-fini',
    'notifications',
    'profile',
    'settings',
    'deconnexion',
  ],

  // Employé - Accès minimal
  employe: [
    'dashboard',
    'notifications',
    'profile',
    'settings',
    'deconnexion',
  ],
};

/**
 * Filtre les menus en fonction du rôle de l'utilisateur
 */
export const getAuthorizedMenus = (user) => {
  if (!user) return [];

  // Super Admin voit tout
  if (user.is_super_admin || user.is_superuser || user.is_primary_admin) {
    return ROLE_MENUS.super_admin;
  }

  // Retourne les menus selon le rôle
  return ROLE_MENUS[user.role] || ROLE_MENUS.employe;
};
