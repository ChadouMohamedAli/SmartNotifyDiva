/**
 * fetch avec en-tête Bearer + renouvellement automatique du JWT (401 → /api/auth/token/refresh/).
 */

const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://localhost:8000')
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '');

let refreshInFlight = null;

export function getApiOrigin() {
  return API_ORIGIN;
}

/** Ex: '/alerts/' ou '/api/alerts/' → URL absolue */
export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (p.startsWith('/api')) return `${API_ORIGIN}${p}`;
  return `${API_ORIGIN}/api${p}`;
}

async function doRefresh() {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return false;

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_ORIGIN}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.access) {
        localStorage.setItem('access_token', data.access);
        if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
        window.dispatchEvent(
          new CustomEvent('auth:token-updated', { detail: { access: data.access } })
        );
      }
      return Boolean(data.access);
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Appelé par l’intercepteur axios ou manuellement */
export async function refreshAccessToken() {
  return doRefresh();
}

function mergeHeaders(initHeaders, access) {
  const base =
    typeof initHeaders === 'object' && initHeaders !== null && !(initHeaders instanceof Headers)
      ? { ...initHeaders }
      : {};
  const out = {
    'Content-Type': 'application/json',
    ...base,
  };
  if (access) out.Authorization = `Bearer ${access}`;
  return out;
}

/**
 * @param {string} input — URL complète ou chemin commençant par / (ex. '/alerts/', '/api/stock/products/')
 * @param {RequestInit} init
 */
export async function authFetch(input, init = {}) {
  const url =
    typeof input === 'string' && (input.startsWith('http://') || input.startsWith('https://'))
      ? input
      : apiUrl(input);

  const run = () => {
    const access = localStorage.getItem('access_token');
    const headers = mergeHeaders(init.headers, access);
    return fetch(url, {
      ...init,
      headers,
      credentials: init.credentials ?? 'include',
    });
  };

  let res = await run();

  if (res.status === 401) {
    const ok = await doRefresh();
    if (ok) {
      res = await run();
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }
  }

  return res;
}
