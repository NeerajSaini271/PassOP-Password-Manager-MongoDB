const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
).replace(/\/$/, "");
export const TOKEN_KEY = "nexlockr-session";
export const AUTH_CHANGE_EVENT = "nexlockr-auth-change";

function migrateLegacyToken() {
  const legacyToken = sessionStorage.getItem(TOKEN_KEY);
  if (legacyToken && !localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(TOKEN_KEY, legacyToken);
  }
  sessionStorage.removeItem(TOKEN_KEY);
}

export function getToken() {
  migrateLegacyToken();
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
}

export async function request(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}
