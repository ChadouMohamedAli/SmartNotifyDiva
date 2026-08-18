  import React, { createContext, useState, useContext, useEffect } from 'react';
  import axios from 'axios';

  const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8000')
    .replace(/\/+$/, '')
    .replace(/\/api$/i, '');

  const AuthContext = createContext();

  export const useAuth = () => {
    return useContext(AuthContext);
  };

  export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    });
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(() => {
      return localStorage.getItem('access_token');
    });

    useEffect(() => {
      if (token) {
        fetchUserProfile(token);
      } else {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      const onTokenUpdated = (e) => {
        if (e.detail?.access) setToken(e.detail.access);
      };
      const onSessionExpired = () => {
        setUser(null);
        setToken(null);
        window.location.href = '/login';
      };
      window.addEventListener('auth:token-updated', onTokenUpdated);
      window.addEventListener('auth:session-expired', onSessionExpired);
      return () => {
        window.removeEventListener('auth:token-updated', onTokenUpdated);
        window.removeEventListener('auth:session-expired', onSessionExpired);
      };
    }, []);

    const fetchUserProfile = async (authToken) => {
      try {
        const response = await axios.get('http://localhost:8000/api/auth/user/', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
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
          authorized_pages: response.data.authorized_pages || [],
          is_active: response.data.is_active,
          is_superuser: response.data.is_superuser || false,
          is_staff: response.data.is_staff || false,
          is_primary_admin: response.data.is_primary_admin || false,
          date_joined: response.data.date_joined,
          last_login: response.data.last_login,
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error('Error fetching profile:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    const login = async (email, password) => {
      try {
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const normalizedPassword = String(password || '');

        const response = await axios.post(`${API_BASE_URL}/api/auth/login/`, {
          email: normalizedEmail,
          password: normalizedPassword
        }, {
          withCredentials: true
        });

        if (response.data?.verification_required) {
          return {
            success: true,
            verificationRequired: true,
            challengeId: response.data.challenge_id,
            email: response.data.email,
            purpose: response.data.purpose,
            message: response.data.message,
          };
        }

        const { access, refresh, user: apiUserData } = response.data;

        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        setToken(access);

        const fullUserData = {
          id: apiUserData.id,
          email: apiUserData.email,
          username: apiUserData.username,
          first_name: apiUserData.first_name,
          last_name: apiUserData.last_name,
          phone_number: apiUserData.phone_number || '',
          telegram_username: apiUserData.telegram_username || '',
          telegram_chat_id: apiUserData.telegram_chat_id || '',
          role: apiUserData.role || '',
          company: apiUserData.company || '',
          profile_picture: apiUserData.profile_picture || null,
          authorized_pages: apiUserData.authorized_pages || [],
          is_active: apiUserData.is_active,
          is_superuser: apiUserData.is_superuser || false,
          is_staff: apiUserData.is_staff || false,
          is_primary_admin: apiUserData.is_primary_admin || false,
          date_joined: apiUserData.date_joined,
          last_login: apiUserData.last_login,
        };

        setUser(fullUserData);
        localStorage.setItem('user', JSON.stringify(fullUserData));

        return { success: true, user: fullUserData };
      } catch (error) {
        const statusCode = error?.response?.status;
        const responseData = error?.response?.data;

        // Les 400/401 sont des erreurs metier attendues (mauvais creds, validation)
        if (!statusCode || statusCode >= 500) {
          console.error('Login error:', responseData || error);
        }

        let errorMessage = 'Login failed';
        if (responseData) {
          if (typeof responseData === 'object') {
            if (responseData.error) {
              errorMessage = responseData.error;
              if (Array.isArray(responseData.details) && responseData.details.length > 0) {
                errorMessage = `${errorMessage} ${responseData.details.join(' | ')}`;
              }
            } else if (responseData.detail) {
              errorMessage = responseData.detail;
            } else {
              const errors = Object.values(responseData).flat();
              errorMessage = errors[0] || errorMessage;
            }
          } else {
            errorMessage = responseData;
          }
        }

        return {
          success: false,
          error: errorMessage
        };
      }
    };
    const logout = async () => {
      try {
        const refresh_token = localStorage.getItem('refresh_token');
        // Appeler l'API de déconnexion pour nettoyer la session
        await axios.post('http://localhost:8000/api/auth/logout/', 
          { refresh_token },
          { 
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Nettoyer le localStorage dans tous les cas
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
      }
    };

    const register = async (userData) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/register/`, userData);

        if (response.data?.verification_required) {
          return {
            success: true,
            verificationRequired: true,
            challengeId: response.data.challenge_id,
            email: response.data.email,
            purpose: response.data.purpose,
            message: response.data.message,
          };
        }

        return { success: true, data: response.data };
      } catch (error) {
        console.error('Registration error:', error.response?.data || error);

        let errorMessage = 'Registration failed';
        if (error.response?.data) {
          if (typeof error.response.data === 'object') {
            const errors = [];
            for (const key in error.response.data) {
              if (Array.isArray(error.response.data[key])) {
                errors.push(`${key}: ${error.response.data[key].join(', ')}`);
              } else {
                errors.push(`${key}: ${error.response.data[key]}`);
              }
            }
            errorMessage = errors.join(' | ');
          } else {
            errorMessage = error.response.data;
          }
        }

        return {
          success: false,
          error: errorMessage
        };
      }
    };
    const updateProfile = async (formData) => {
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }
      
      try {
        const response = await axios.put(
          'http://localhost:8000/api/auth/user/',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          }
        );
        
        const payloadUser = response.data.user || response.data;
        const updatedUser = {
          ...user,
          ...payloadUser
        };
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        return { success: true, data: response.data };
        
      } catch (error) {
        console.error('Error updating profile:', error.response?.data || error);
        return { 
          success: false, 
          error: error.response?.data?.error || error.response?.data?.detail || 'Failed to update profile' 
        };
      }
    };

    const changePassword = async (oldPassword, newPassword, newPassword2) => {
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      try {
        const response = await axios.post(
          'http://localhost:8000/api/auth/change-password/',
          {
            old_password: oldPassword,
            new_password: newPassword,
            new_password2: newPassword2,
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          }
        );

        return { success: true, data: response.data };
      } catch (error) {
        const errorMessage = error.response?.data?.error ||
          error.response?.data?.detail ||
          error.response?.data?.old_password ||
          error.response?.data?.new_password ||
          error.response?.data?.new_password2 ||
          'Failed to change password';

        return { success: false, error: errorMessage };
      }
    };

    const isAdmin = () => {
      if (!user) return false;
      return user.is_superuser || user.is_staff;
    };

    // Nouvelles fonctions pour la sécurité
    const checkEmailExists = async (email) => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/auth/check-email/?email=${encodeURIComponent(email)}`
        );
        return response.data;
      } catch (error) {
        console.error('Error checking email:', error);
        return { exists: false, valid: false };
      }
    };

    const checkPasswordStrength = async (password) => {
      try {
        const response = await axios.post(
          'http://localhost:8000/api/auth/check-password-strength/',
          { password }
        );
        return response.data;
      } catch (error) {
        console.error('Error checking password strength:', error);
        return null;
      }
    };

    const generatePassword = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/auth/generate-password/');
        return response.data.password;
      } catch (error) {
        console.error('Error generating password:', error);
        return null;
      }
    };

    const refreshUser = async () => {
      if (!token) {
        return { success: false, error: 'No authentication token' };
      }
      
      try {
        const response = await axios.get('http://localhost:8000/api/auth/user/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const updatedUser = {
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
          authorized_pages: response.data.authorized_pages || [],
          is_active: response.data.is_active,
          is_superuser: response.data.is_superuser || false,
          is_staff: response.data.is_staff || false,
          is_primary_admin: response.data.is_primary_admin || false,
          date_joined: response.data.date_joined,
          last_login: response.data.last_login,
        };
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true, data: updatedUser };
      } catch (error) {
        console.error('Error refreshing user:', error);
        return { success: false, error: 'Failed to refresh user' };
      }
    };

    const verifyEmailOtp = async (challengeId, otp) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/email-otp/verify/`, {
          challenge_id: challengeId,
          otp,
        }, {
          withCredentials: true,
        });

        const { access, refresh, user: apiUserData } = response.data;

        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        setToken(access);

        const fullUserData = {
          id: apiUserData.id,
          email: apiUserData.email,
          username: apiUserData.username,
          first_name: apiUserData.first_name,
          last_name: apiUserData.last_name,
          phone_number: apiUserData.phone_number || '',
          telegram_username: apiUserData.telegram_username || '',
          telegram_chat_id: apiUserData.telegram_chat_id || '',
          role: apiUserData.role || '',
          company: apiUserData.company || '',
          profile_picture: apiUserData.profile_picture || null,
          is_active: apiUserData.is_active,
          is_superuser: apiUserData.is_superuser || false,
          is_staff: apiUserData.is_staff || false,
          is_primary_admin: apiUserData.is_primary_admin || false,
          date_joined: apiUserData.date_joined,
          last_login: apiUserData.last_login,
        };

        setUser(fullUserData);
        localStorage.setItem('user', JSON.stringify(fullUserData));

        return { success: true, user: fullUserData };
      } catch (error) {
        return {
          success: false,
          error: error.response?.data?.error || 'Code OTP invalide',
        };
      }
    };

    const resendEmailOtp = async (challengeId) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/email-otp/resend/`, {
          challenge_id: challengeId,
        });

        return {
          success: true,
          challengeId: response.data.challenge_id,
          email: response.data.email,
          purpose: response.data.purpose,
          message: response.data.message,
        };
      } catch (error) {
        return {
          success: false,
          error: error.response?.data?.error || 'Impossible de renvoyer le code',
        };
      }
    };

    const telegramAuth = async (telegramPayload) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/telegram-auth/`, telegramPayload, {
          withCredentials: true
        });

        const { token: accessToken, refresh_token: refreshToken, user: apiUserData } = response.data;

        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken || '');
        setToken(accessToken);

        const fullUserData = {
          id: apiUserData.id,
          email: apiUserData.email,
          username: apiUserData.username,
          first_name: apiUserData.first_name,
          last_name: apiUserData.last_name,
          phone_number: apiUserData.phone_number || '',
          telegram_username: apiUserData.telegram_username || '',
          telegram_chat_id: apiUserData.telegram_chat_id || '',
          role: apiUserData.role || '',
          company: apiUserData.company || '',
          profile_picture: apiUserData.profile_picture || null,
          is_active: apiUserData.is_active,
          is_superuser: apiUserData.is_superuser || false,
          is_staff: apiUserData.is_staff || false,
          is_primary_admin: apiUserData.is_primary_admin || false,
          date_joined: apiUserData.date_joined,
          last_login: apiUserData.last_login,
        };

        setUser(fullUserData);
        localStorage.setItem('user', JSON.stringify(fullUserData));

        return { success: true, user: fullUserData };
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Connexion Telegram impossible';
        return { success: false, error: errorMessage };
      }
    };

    const value = {
      user,
      token,
      loading,
      login,
      logout,
      register,
      updateProfile,
      changePassword,
      isAdmin,
      checkEmailExists,
      checkPasswordStrength,
      generatePassword,
      refreshUser,
      verifyEmailOtp,
      resendEmailOtp,
      telegramAuth,
      setSession: (userData, accessToken, refreshToken) => {
        const fullUserData = {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone_number: userData.phone_number || '',
          telegram_username: userData.telegram_username || '',
          telegram_chat_id: userData.telegram_chat_id || '',
          role: userData.role || '',
          company: userData.company || '',
          profile_picture: userData.profile_picture || null,
          is_active: userData.is_active,
          is_superuser: userData.is_superuser || false,
          is_staff: userData.is_staff || false,
          is_primary_admin: userData.is_primary_admin || false,
          date_joined: userData.date_joined,
          last_login: userData.last_login,
        };
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken || '');
        localStorage.setItem('user', JSON.stringify(fullUserData));
        setToken(accessToken);
        setUser(fullUserData);
        return fullUserData;
      },
    };

    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  };
