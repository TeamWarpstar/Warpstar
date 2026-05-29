/**
 * src/api/client.ts
 * Base fetch wrapper — attaches JWT, handles 401 refresh, throws on errors.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function getTokens() {
  return {
    access:  localStorage.getItem("ws_access_token"),
    refresh: localStorage.getItem("ws_refresh_token"),
  };
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem("ws_access_token",  access);
  localStorage.setItem("ws_refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("ws_access_token");
  localStorage.removeItem("ws_refresh_token");
}

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getTokens();
  if (!refresh) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) { clearTokens(); return null; }
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

// Decode the JWT's `exp` claim and check if it's already past (or within
// 10s of expiring). Returns true for unparseable tokens so we err on the
// side of refreshing — preventing a wasted 401 round-trip is cheap.
function isAccessTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (typeof payload.exp !== "number") return false;
    return payload.exp * 1000 - 10_000 < Date.now();
  } catch {
    return true;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth = false, ...init } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (!skipAuth) {
    let { access } = getTokens();
    // Proactively refresh expired tokens before sending the request —
    // saves a round-trip to the backend just to get a 401 back.
    if (access && isAccessTokenExpired(access)) {
      const refreshed = await refreshAccessToken();
      access = refreshed ?? access;
    }
    if (access) headers["Authorization"] = `Bearer ${access}`;
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  // Defensive: backend may have rotated keys or our exp check was wrong.
  // Refresh once on 401 and retry.
  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail ?? `API error ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export { setTokens, BASE_URL };