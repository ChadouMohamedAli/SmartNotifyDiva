const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const buildHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};

const normalizeList = (data) => (Array.isArray(data) ? data : data?.results || []);

export const productionService = {
  async getDashboard() {
    const response = await fetch(`${API_URL}/production/orders/dashboard/`, {
      method: "GET",
      headers: buildHeaders(),
    });
    if (!response.ok) throw new Error("Erreur chargement dashboard production");
    return response.json();
  },

  async getOrders() {
    const response = await fetch(`${API_URL}/production/orders/`, {
      method: "GET",
      headers: buildHeaders(),
    });
    if (!response.ok) throw new Error("Erreur chargement des ordres");
    return normalizeList(await response.json());
  },

  async createOrder(payload) {
    const response = await fetch(`${API_URL}/production/orders/`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  async updateOrder(id, payload) {
    const response = await fetch(`${API_URL}/production/orders/${id}/`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  async deleteOrder(id) {
    const response = await fetch(`${API_URL}/production/orders/${id}/`, {
      method: "DELETE",
      headers: buildHeaders(),
    });
    if (!response.ok) throw new Error("Erreur suppression ordre");
  },

  async getRawMaterials() {
    const response = await fetch(`${API_URL}/production/raw-materials/`, {
      method: "GET",
      headers: buildHeaders(),
    });
    if (!response.ok) throw new Error("Erreur chargement matières premières");
    return normalizeList(await response.json());
  },

  async createRawMaterial(payload) {
    const response = await fetch(`${API_URL}/production/raw-materials/`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  async updateRawMaterial(id, payload) {
    const response = await fetch(`${API_URL}/production/raw-materials/${id}/`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  async deleteRawMaterial(id) {
    const response = await fetch(`${API_URL}/production/raw-materials/${id}/`, {
      method: "DELETE",
      headers: buildHeaders(),
    });
    if (!response.ok) throw new Error("Erreur suppression matière première");
  },

  async getAlerts() {
    const response = await fetch(`${API_URL}/production/alerts/`, {
      method: "GET",
      headers: buildHeaders(),
    });
    if (!response.ok) throw new Error("Erreur chargement alertes production");
    return normalizeList(await response.json());
  },

  async resolveAlert(id, isResolved = true) {
    const response = await fetch(`${API_URL}/production/alerts/${id}/resolve/`, {
      method: "PATCH",
      headers: buildHeaders(),
      body: JSON.stringify({ is_resolved: isResolved }),
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  async getProducts() {
    const response = await fetch(`${API_URL}/stock/products/`, {
      method: "GET",
      headers: buildHeaders(),
    });
    if (!response.ok) throw new Error("Erreur chargement produits");
    return normalizeList(await response.json());
  },
};
