const AUTH_KEY = "polling_auth";

// Centralized auth storage keeps token handling consistent across pages.
export function readStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveAuth(authData) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}
