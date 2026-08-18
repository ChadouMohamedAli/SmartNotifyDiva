import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL_CANDIDATES } from '../config/api';

const normalizePath = (path = '') => path.replace(/^\/+/, '');

const parseApiList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const request = async (path, options = {}) => {
  const token = await AsyncStorage.getItem('access_token');
  let lastNetworkError = null;

  for (const baseUrl of API_BASE_URL_CANDIDATES) {
    try {
      const url = `${baseUrl}/${normalizePath(path)}${options.query ? `?${new URLSearchParams(options.query).toString()}` : ''}`;
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        let details = '';
        try {
          details = await response.text();
        } catch (error) {
          details = '';
        }
        throw new Error(details || `API ${response.status}`);
      }

      if (response.status === 204) {
        return null;
      }

      return response.json();
    } catch (error) {
      // Keep trying other hosts only for transport-level failures.
      const isNetworkFailure =
        error?.name === 'TypeError' ||
        /Network request failed|Failed to fetch|Network Error/i.test(String(error?.message || ''));

      if (!isNetworkFailure) {
        throw error;
      }
      lastNetworkError = error;
    }
  }

  if (lastNetworkError) {
    throw lastNetworkError;
  }

  throw new Error('Impossible de contacter le serveur backend.');
};

export const mobileCrudApi = {
  parseApiList,
  getList: async (path, query = null) => {
    const data = await request(path, { method: 'GET', query });
    return parseApiList(data);
  },
  create: async (path, payload) => request(path, { method: 'POST', body: payload }),
  update: async (path, id, payload) => request(`${normalizePath(path)}/${id}/`, { method: 'PUT', body: payload }),
  patch: async (path, id, payload) => request(`${normalizePath(path)}/${id}/`, { method: 'PATCH', body: payload }),
  remove: async (path, id) => request(`${normalizePath(path)}/${id}/`, { method: 'DELETE' }),
};
