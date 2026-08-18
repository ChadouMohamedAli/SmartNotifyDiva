//appel du backend
const API_URL = process.env.REACT_APP_API_URL;

console.log(' Facturation API_URL configuré à:', API_URL);

export const facturationService = {
  // Get all invoices
  async getAllInvoices(params = {}) {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn(' Aucun token trouvé dans localStorage');
        return [];
      }

      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.type) queryParams.append('type', params.type);
      if (params.search) queryParams.append('search', params.search);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);

      const url = `${API_URL}/facturation/invoices/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('📡 Fetching invoices from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(' Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(' API Error:', errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw data from API:', data);
      
      const invoiceList = data.results || (Array.isArray(data) ? data : []);
      console.log(' Invoices processed:', invoiceList);
      
      return invoiceList;
    } catch (error) {
      console.error('❌ Error fetching invoices:', error);
      return [];
    }
  },

  // Get invoice statistics
  async getStatistics() {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return null;
      }

      const response = await fetch(`${API_URL}/facturation/invoices/statistics/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(' Statistics:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
      return null;
    }
  },

  // Get single invoice
  async getInvoice(id) {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/facturation/invoices/${id}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error fetching invoice:', error);
      throw error;
    }
  },

  // Create new invoice
  async createInvoice(invoiceData) {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/facturation/invoices/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create invoice');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error creating invoice:', error);
      throw error;
    }
  },

  // Update invoice
  async updateInvoice(id, invoiceData) {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/facturation/invoices/${id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update invoice');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error updating invoice:', error);
      throw error;
    }
  },

  // Delete invoice
  async deleteInvoice(id) {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/facturation/invoices/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }

      return true;
    } catch (error) {
      console.error('❌ Error deleting invoice:', error);
      throw error;
    }
  },

  // Add payment to invoice
  async addPayment(invoiceId, paymentData) {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/facturation/invoices/${invoiceId}/add_payment/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add payment');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error adding payment:', error);
      throw error;
    }
  },

  // Get all payments
  async getPayments(invoiceId = null) {
    try {
      const token = localStorage.getItem('access_token');
      const url = invoiceId 
        ? `${API_URL}/facturation/payments/?invoice=${invoiceId}`
        : `${API_URL}/facturation/payments/`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || (Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error fetching payments:', error);
      return [];
    }
  },
};
