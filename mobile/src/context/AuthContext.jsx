import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_BASE_URL_CANDIDATES } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const getCandidateApiBaseUrls = () => {
    return API_BASE_URL_CANDIDATES;
  };

  const postAuthWithFallback = async (path, payload) => {
    const baseUrls = getCandidateApiBaseUrls();
    let lastNetworkError = null;

    for (const baseUrl of baseUrls) {
      try {
        const response = await axios.post(`${baseUrl}/auth/${path}`, payload, {
          timeout: 8000,
        });
        return response;
      } catch (error) {
        // If backend responded, it is a real auth/validation error; don't try other hosts.
        if (error.response) {
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

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('access_token');
        if (storedToken) {
          setToken(storedToken);
          await fetchUserProfile(storedToken);
        } else {
          setLoading(false);
        }
      } catch (e) {
        setLoading(false);
      }
    };
    loadStorageData();
  }, []);

  const getWithFallback = async (path, authToken) => {
    const baseUrls = getCandidateApiBaseUrls();
    let lastError = null;
    for (const baseUrl of baseUrls) {
      try {
        const response = await axios.get(`${baseUrl}/${path.replace(/^\/+/, '')}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
          timeout: 8000,
        });
        return response;
      } catch (error) {
        if (error.response) throw error;
        lastError = error;
      }
    }
    throw lastError || new Error('Impossible de contacter le serveur backend.');
  };

  const fetchUserProfile = async (authToken) => {
    try {
      const response = await getWithFallback('auth/user/', authToken);
      
      const userData = {
        id: response.data.id,
        email: response.data.email,
        username: response.data.username,
        first_name: response.data.first_name,
        last_name: response.data.last_name,
        phone_number: response.data.phone_number || '',
        telegram_username: response.data.telegram_username || '',
        telegram_chat_id: response.data.telegram_chat_id || '',
        role: response.data.role || '',
        company: response.data.company || '',
        profile_picture: response.data.profile_picture || null,
        is_active: response.data.is_active,
        is_superuser: response.data.is_superuser || false,
        is_staff: response.data.is_staff || false,
        is_primary_admin: response.data.is_primary_admin || false,
        date_joined: response.data.date_joined,
        last_login: response.data.last_login,
      };
      
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error fetching profile:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await postAuthWithFallback('login/', {
        email,
        password
      });
      
      const { access, refresh, user: apiUserData } = response.data;
      
      await AsyncStorage.setItem('access_token', access);
      await AsyncStorage.setItem('refresh_token', refresh);
      setToken(access);
      
      const fullUserData = { ...apiUserData };
      
      setUser(fullUserData);
      await AsyncStorage.setItem('user', JSON.stringify(fullUserData));
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
      let errorMessage = 'Login failed';
      if (!error.response) {
        errorMessage = 'Connexion au serveur impossible. Verifiez EXPO_PUBLIC_API_URL et que Django tourne sur le port 8000.';
      }
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          if (error.response.data.error) errorMessage = error.response.data.error;
          else if (error.response.data.detail) errorMessage = error.response.data.detail;
          else errorMessage = Object.values(error.response.data).flat()[0] || errorMessage;
        } else {
          errorMessage = error.response.data;
        }
      }
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      const refresh_token = await AsyncStorage.getItem('refresh_token');
      if (refresh_token) {
        await axios.post(`${API_BASE_URL}/auth/logout/`, 
          { refresh_token },
          { 
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('user');
      setUser(null);
      setToken(null);
    }
  };

  const register = async (userData) => {
    try {
      const response = await postAuthWithFallback('register/', userData);
      const { access, refresh, user: apiUserData } = response.data;
      
      await AsyncStorage.setItem('access_token', access);
      await AsyncStorage.setItem('refresh_token', refresh);
      setToken(access);
      
      const fullUserData = { ...apiUserData };
      
      setUser(fullUserData);
      await AsyncStorage.setItem('user', JSON.stringify(fullUserData));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Registration error:', error.response?.data || error);
      let errorMessage = 'Registration failed';
      if (error.response?.data) {
        errorMessage = JSON.stringify(error.response.data);
      }
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = async (formData) => {
    if (!token) return { success: false, error: 'No authentication token found' };
    try {
      const response = await axios.put(
        `${API_BASE_URL}/auth/user/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      const payloadUser = response.data.user || response.data;
      const updatedUser = { ...user, ...payloadUser };
      
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to update profile' };
    }
  };

  const changePassword = async (oldPassword, newPassword, newPassword2) => {
    if (!token) return { success: false, error: 'No authentication token found' };
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/change-password/`,
        { old_password: oldPassword, new_password: newPassword, new_password2: newPassword2 },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to change password' };
    }
  };

  const isAdmin = () => {
    if (!user) return false;
    return user.is_superuser || user.is_staff;
  };

  const checkEmailExists = async (email) => {
    const baseUrls = getCandidateApiBaseUrls();
    for (const baseUrl of baseUrls) {
      try {
        const response = await axios.get(
          `${baseUrl}/auth/check-email/?email=${encodeURIComponent(email)}`,
          { timeout: 5000 }
        );
        return response.data;
      } catch (error) {
        // If server responded (4xx/5xx), trust the response
        if (error.response) return error.response.data || { exists: false };
        // Network error → try next URL
      }
    }
    // All URLs failed (network unreachable) → don't block the user
    return { exists: null };
  };

  const checkPasswordStrength = async (password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/check-password-strength/`, { password });
      return response.data;
    } catch (error) {
      return null;
    }
  };

  const generatePassword = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/generate-password/`);
      return response.data.password;
    } catch (error) {
      return null;
    }
  };

  const refreshUser = async () => {
    if (!token) return { success: false, error: 'No authentication token' };
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/user/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const updatedUser = { ...user, ...response.data };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      return { success: true, data: updatedUser };
    } catch (error) {
      return { success: false, error: 'Failed to refresh user' };
    }
  };

  const telegramAuth = async (telegramPayload) => {
    try {
      const response = await postAuthWithFallback('telegram-auth/', telegramPayload);
      const { token: accessToken, refresh_token: refreshToken, user: apiUserData } = response.data;

      await AsyncStorage.setItem('access_token', accessToken);
      await AsyncStorage.setItem('refresh_token', refreshToken || '');
      setToken(accessToken);

      const fullUserData = { ...apiUserData };
      setUser(fullUserData);
      await AsyncStorage.setItem('user', JSON.stringify(fullUserData));

      return { success: true, user: fullUserData };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Connexion Telegram impossible';
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user, token, loading, login, logout, register,
    updateProfile, changePassword, isAdmin,
    checkEmailExists, checkPasswordStrength, generatePassword, refreshUser, telegramAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};