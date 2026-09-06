const BASE_URL = '/api';
const CSRF_COOKIE_NAME = 'csrf_token'; // must match backend/src/config/env.js auth.csrfCookieName
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function request(path, { method = 'GET', body, headers } = {}) {
  const csrfToken = SAFE_METHODS.has(method) ? null : readCookie(CSRF_COOKIE_NAME);

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    // Sends the httpOnly session cookie set by the backend (Phase 3) -
    // required since auth is cookie-based, not a bearer token in JS.
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      // Double-submit CSRF token (Phase 14) - only meaningful once a
      // session exists, so it's simply absent for login/register.
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || 'Something went wrong.';
    const error = new Error(message);
    error.code = data?.code;
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
};
