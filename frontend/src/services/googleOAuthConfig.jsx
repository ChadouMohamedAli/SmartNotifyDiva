/**
 * Configuration Google OAuth 2.0
 * Utilise directement Google OAuth
 */

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');
const REDIRECT_URI =
  process.env.REACT_APP_GOOGLE_REDIRECT_URI ||
  `${window.location.origin}/auth/google/callback`;
const OAUTH_STATE_KEY = 'google_oauth_state';

const persistState = (state) => {
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
  localStorage.setItem(OAUTH_STATE_KEY, state);
};

const readSavedState = () =>
  sessionStorage.getItem(OAUTH_STATE_KEY) || localStorage.getItem(OAUTH_STATE_KEY);

/**
 * Génère une URL d'authentification Google OAuth 2.0
 */
export const getGoogleAuthURL = () => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google OAuth n\'est pas configure cote frontend.');
  }

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
  persistState(state);
  return state;
};

/**
 * Valide le state récupéré depuis Google
 */
export const validateState = (state) => {
  const savedState = readSavedState();
  return state === savedState;
};

/**
 * Nettoie le state de la session
 */
export const clearState = () => {
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  localStorage.removeItem(OAUTH_STATE_KEY);
};
