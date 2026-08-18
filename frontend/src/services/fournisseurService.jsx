const API_URL = process.env.REACT_APP_API_URL;

export const fournisseurService = {
  async getAllSuppliers() {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return [];

      const response = await fetch(`${API_URL}/fournisseurs/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || (Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
  },
};
