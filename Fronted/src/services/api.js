import { readStoredAuth, saveAuth } from "../utils/authStorage.js";

export const API_URL = import.meta.env.VITE_API_URL || "https://nm-polling-zumy.vercel.app";

// Fetch wrapper adds tokens and performs refresh-token rotation on expired access tokens.
export async function apiRequest(path, options = {}, retry = true) {
  const auth = readStoredAuth();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (response.status === 401 && retry && auth.refreshToken) {
    const refreshResponse = await fetch(`${API_URL}/api/users/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    });
    const refreshed = await refreshResponse.json();
    if (refreshResponse.ok) {
      saveAuth(refreshed.data);
      return apiRequest(path, options, false);
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.error || "Request failed");
  }
  return data;
}
