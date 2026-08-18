const API_BASE = "http://localhost:8000/api";

// Mapping entre les modules ERP et les modules backend
const MODULE_MAPPING = {
  'STOCK': 'stock',
  'CRM': 'crm',
  'FINANCE': 'facturation',
  'RH': 'rh',
  'PRODUCTION': 'gmao', // Gestion de Maintenance Assistée par Ordinateur
  'ACHATS': 'stock' // Les achats sont mappés au stock
};

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  "Content-Type": "application/json",
});

export const notificationService = {
  /**
   * Récupérer toutes les notifications et les compter par module
   */
  async getNotificationsByModule() {
    try {
      console.log(' Appel API: GET /api/notifications/');
      const response = await fetch(`${API_BASE}/notifications/`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.statusText}`);
      }

      const notifications = await response.json();
      console.log('📦 Réponse brute de l\'API:', notifications);
      console.log('Nombre de notifications:', notifications.length);

      // Grouper les notifications par module via les alertes associées
      const notificationsByModule = {};

      // Initialiser les compteurs pour tous les modules
      Object.values(MODULE_MAPPING).forEach(module => {
        notificationsByModule[module] = 0;
      });

      console.log('🔢 Initialisation des compteurs:', notificationsByModule);

      // Compter les notifications par module
      notifications.forEach((notification, index) => {
        console.group(` Notification ${index}`);
        console.log('ID:', notification.id);
        console.log('Title:', notification.title);
        console.log('Alert:', notification.alert);
        
        if (notification.alert) {
          console.log('Alert.module:', notification.alert.module);
        } else {
          console.warn(' Alert est NULL!');
        }

        if (notification.alert && notification.alert.module) {
          const module = notification.alert.module;
          console.log(' Module trouvé:', module);
          if (!notificationsByModule[module]) {
            notificationsByModule[module] = 0;
          }
          notificationsByModule[module]++;
          console.log('Compteur mis à jour:', notificationsByModule);
        } else {
          console.warn(`❌ Pas de module pour cette notification`);
        }
        console.groupEnd();
      });

      console.log(' Résultat final:', notificationsByModule);
      return notificationsByModule;
    } catch (error) {
      console.error(' Erreur lors de la récupération des notifications:', error);
      // Retourner des valeurs par défaut en cas d'erreur
      const defaults = {};
      Object.values(MODULE_MAPPING).forEach(module => {
        defaults[module] = 0;
      });
      return defaults;
    }
  },

  /**
   * Récupérer les notifications pour un module spécifique
   * @param {string} moduleName - Nom du module ('stock', 'crm', etc.)
   */
  async getNotificationsByModuleName(moduleName) {
    try {
      const response = await fetch(`${API_BASE}/notifications/`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.statusText}`);
      }

      const notifications = await response.json();

      // Filtrer les notifications pour le module spécifié
      return notifications.filter(notification => notification.alert && notification.alert.module === moduleName);
    } catch (error) {
      console.error(`Erreur lors de la récupération des notifications pour ${moduleName}:`, error);
      return [];
    }
  },

  /**
   * Récupérer le nombre total de notifications non lues de l'utilisateur
   */
  async getUnreadCount() {
    try {
      const response = await fetch(`${API_BASE}/notifications/unread_count/`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.statusText}`);
      }

      const data = await response.json();
      return data.unread_count || 0;
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre de notifications non lues:', error);
      return 0;
    }
  },

  /**
   * Obtenir le module backend correspondant à un module ERP
   * @param {string} erpModuleName - Nom du module ERP
   */
  getBackendModule(erpModuleName) {
    return MODULE_MAPPING[erpModuleName];
  },
};
