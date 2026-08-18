/**
 * Configuration Google OAuth 2.0
 * Utilise directement Google OAuth
 */

// Configuration Google OAuth
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const REDIRECT_URI = process.env.REACT_APP_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

/**
 * Génère une URL d'authentification Google OAuth 2.0
 */
export const getGoogleAuthURL = () => {
  const scope = encodeURIComponent('openid email profile');
  const responseType = 'code';
  const accessType = 'offline';
  
  return `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `response_type=${responseType}&` +
    `scope=${scope}&` +
    `access_type=${accessType}&` +
    `state=${generateState()}`;
};

/**
 * Ouvre la popup Google OAuth
 */
export const openGoogleLoginPopup = (width = 500, height = 600) => {
  const authURL = getGoogleAuthURL();
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  
  const popup = window.open(
    authURL,
    'google_login',
    `width=${width},height=${height},left=${left},top=${top},resizable=yes`
  );
  
  return popup;
};

/**
 * Échange le code d'autorisation contre un token
 */
export const exchangeCodeForToken = async (code) => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  
  const response = await fetch(`${API_URL}/auth/google-oauth-callback/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: code,
      redirect_uri: REDIRECT_URI,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Erreur lors de l\'échange du code');
  }
  
  return await response.json();
};

/**
 * Génère un state random pour la sécurité CSRF
 */
const generateState = () => {
  const state = Math.random().toString(36).substring(7) + Date.now().toString(36);
  sessionStorage.setItem('oauth_state', state);
  return state;
};

/**
 * Valide le state récupéré depuis Google
 */
export const validateState = (state) => {
  const savedState = sessionStorage.getItem('oauth_state');
  return state === savedState;
};

/**
 * Nettoie le state de la session
 */
export const clearState = () => {
  sessionStorage.removeItem('oauth_state');
};
