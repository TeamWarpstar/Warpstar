/**
 * src/api/client.ts
 * Base fetch wrapper â€” attaches JWT, handles 401 refresh, throws on errors.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function getTokens() {
  return {
    access: localStorage.getItem("ws_access_token"),
    refresh: localStorage.getItem("ws_refresh_token"),
  };
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("ws_access_token", access);
  localStorage.setItem("ws_refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("ws_access_token");
  localStorage.removeItem("ws_refresh_token");
}

async function refreshAccessToken() {
  const { refresh } = getTokens();
  if (!refresh) {
    console.error("[client.ts] No refresh token available");
    throw new Error("No refresh token");
  }

  try {
    console.log("[client.ts] Attempting to refresh access token...");
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    if (!res.ok) {
      console.error("[client.ts] Token refresh failed with status:", res.status);
      throw new Error(`Refresh failed with status ${res.status}`);
    }

    const data = await res.json();
    console.log("[client.ts] Token refreshed successfully");
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch (error) {
    console.error("[client.ts] Token refresh error:", error);
    throw error;
  }
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  let { access } = getTokens();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (access) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${access}`;
  }

  try {
    console.log(`[client.ts] Making ${options.method || 'GET'} request to: ${path}`);
    let res = await fetch(url, { ...options, headers });
    console.log(`[client.ts] Response status: ${res.status}`);

    // If 401, try refresh
    if (res.status === 401 && access) {
      console.warn("[client.ts] Got 401 Unauthorized, attempting token refresh...");
      try {
        access = await refreshAccessToken();
        (headers as Record<string, string>)["Authorization"] = `Bearer ${access}`;
        console.log("[client.ts] Retrying request with new token...");
        res = await fetch(url, { ...options, headers });
        console.log(`[client.ts] Retry response status: ${res.status}`);
      } catch (refreshError) {
        console.error("[client.ts] Token refresh failed, clearing tokens:", refreshError);
        localStorage.removeItem("ws_access_token");
        localStorage.removeItem("ws_refresh_token");
        throw refreshError;
      }
    }

    if (!res.ok) {
      const body = await res.text();
      console.error(`[client.ts] API error ${res.status}: ${body}`);
      throw new Error(`API error ${res.status}: ${body}`);
    }

    const data = await res.json();
    console.log(`[client.ts] Response parsed successfully`);
    return data;
  } catch (error) {
    console.error(`[client.ts] apiFetch error for ${path}:`, error);
    console.error("[client.ts] Error details:", error instanceof Error ? { message: error.message, stack: error.stack } : String(error));
    throw error;
  }
}
