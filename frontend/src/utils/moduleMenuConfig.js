/**
 * Configuration des menus par rôle
 * Chaque rôle définit les menus accessibles
 */

export const ROLE_MENUS = {
  // Admin (superuser / staff / primary) — même périmètre : tout le module stock + le reste
  super_admin: [
    'dashboard',
    'alertes',
    'notifications',
    'stock',
    'stock-movements',
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

  // Responsable Stock — tableau de bord dédié + stock + commandes (sans modules ERP / admin)
  responsable_stock: [
    'dashboard',
    'alertes',
    'notifications',
    'stock',
    'categories',
    'stock-movements',
    'fournisseurs',
    'entrepots',
    'orders',
    'facturation',
    'history',
    'profile',
    'settings',
    'deconnexion',
  ],

  // Responsable Approvisionnement
  responsable_appro: [
    'dashboard',
    'alertes',
    'notifications',
    'stock',
    'fournisseurs',
    'orders',
    'facturation',
    'history',
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
    'stock-movements',
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
    'stock-movements',
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

  // Tout administrateur Django (staff / superuser / primary) voit le menu complet
  if (user.is_super_admin || user.is_superuser || user.is_primary_admin || user.is_staff) {
    return ROLE_MENUS.super_admin;
  }

  // Retourne les menus selon le rôle
  return ROLE_MENUS[user.role] || ROLE_MENUS.employe;
};
