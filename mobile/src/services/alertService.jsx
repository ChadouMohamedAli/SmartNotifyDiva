const ALERTS_STORAGE_KEY = 'smartnotify_alerts';

export const alertService = {
  // Récupérer toutes les alertes
  async getAllAlerts() {
    try {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const alerts = JSON.parse(localStorage.getItem(ALERTS_STORAGE_KEY) || '[]');
      
      return {
        ok: true,
        json: async () => alerts
      };
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
      return {
        ok: false,
        json: async () => ({ error: 'Erreur de chargement' })
      };
    }
  },

  // Créer une Nouvelle alerte
  async createAlert(alertData) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const alerts = JSON.parse(localStorage.getItem(ALERTS_STORAGE_KEY) || '[]');
      
      const newAlert = {
        ...alertData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      alerts.push(newAlert);
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
      
      return {
        ok: true,
        json: async () => newAlert
      };
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      return {
        ok: false,
        json: async () => ({ error: 'Erreur de création' })
      };
    }
  },

  // Supprimer une alerte
  async deleteAlert(id) {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const alerts = JSON.parse(localStorage.getItem(ALERTS_STORAGE_KEY) || '[]');
      const filteredAlerts = alerts.filter(alert => alert.id !== id);
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(filteredAlerts));
      
      return { ok: true };
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return { ok: false };
    }
  },

  // Modifier le statut d'une alerte
  async toggleAlertStatus(id, isActive) {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const alerts = JSON.parse(localStorage.getItem(ALERTS_STORAGE_KEY) || '[]');
      const updatedAlerts = alerts.map(alert => 
        alert.id === id ? { ...alert, isActive, updatedAt: new Date().toISOString() } : alert
      );
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updatedAlerts));
      
      return { ok: true };
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      return { ok: false };
    }
  },

  // Mettre à jour une alerte
  async updateAlert(id, alertData) {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const alerts = JSON.parse(localStorage.getItem(ALERTS_STORAGE_KEY) || '[]');
      const updatedAlerts = alerts.map(alert => 
        alert.id === id ? { ...alert, ...alertData, updatedAt: new Date().toISOString() } : alert
      );
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updatedAlerts));
      
      return { ok: true };
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      return { ok: false };
    }
  }
};