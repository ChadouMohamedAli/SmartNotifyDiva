/**
 * Intercepteur axios global : sur 401, tente un refresh JWT puis rejoue la requête une fois.
 */
import axios from 'axios';
import { refreshAccessToken } from './authFetch';

const SKIP_RETRY = (url) =>
  !url ||
  url.includes('/auth/login/') ||
  url.includes('/auth/register/') ||
  url.includes('/token/refresh/') ||
  url.includes('/auth/email-otp/') ||
  url.includes('/auth/google-auth/');

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const status = error.response?.status;
    const url = config?.url || '';

    if (status !== 401 || !config || config.__jwtRetry || SKIP_RETRY(url)) {
      return Promise.reject(error);
    }

    config.__jwtRetry = true;
    const ok = await refreshAccessToken();
    if (ok) {
      const token = localStorage.getItem('access_token');
      config.headers = config.headers || {};
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return axios(config);
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
    return Promise.reject(error);
  }
);
