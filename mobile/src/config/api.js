import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

const normalizeBaseUrl = (url) => url.replace(/\/+$/, '');

const getExpoHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (!hostUri) return null;

  const host = String(hostUri).split(':')[0]?.trim();
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
};

const getReactNativeDevServerHost = () => {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (!scriptURL) return null;

  try {
    const parsed = new URL(scriptURL);
    const host = parsed.hostname;
    if (!host || host === 'localhost' || host === '127.0.0.1') return null;
    return host;
  } catch (error) {
    return null;
  }
};

const expoHost = getExpoHost();
const devServerHost = getReactNativeDevServerHost();

const getApiBaseUrlCandidates = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  const fallbackBaseUrl = `http://${defaultHost}:8000/api`;
  const lanHost = expoHost || devServerHost;
  const lanBaseUrl = lanHost ? `http://${lanHost}:8000/api` : null;

  const ordered = [envUrl, lanBaseUrl, fallbackBaseUrl, 'http://localhost:8000/api', 'http://127.0.0.1:8000/api'];
  return [...new Set(ordered.filter(Boolean).map((url) => normalizeBaseUrl(url)))];
};

export const API_BASE_URL_CANDIDATES = getApiBaseUrlCandidates();

// Expo exposes runtime env vars with EXPO_PUBLIC_ prefix.
export const API_BASE_URL = API_BASE_URL_CANDIDATES[0];

export const withApi = (path = '') => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
};
