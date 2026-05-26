/**
 * src/api/auth.ts
 * Authentication endpoints: Google login, logout, profile updates.
 */

import { apiFetch } from "./client";

export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  is_new_user?: boolean;
  user?: {
    id: string;
    email: string;
    googleName?: string;
    googleAvatar?: string;
    username?: string;
  };
}

/**
 * Exchange Google credential for Warpstar auth tokens.
 */
export async function googleLogin(googleCredential: string): Promise<AuthResponse> {
  try {
    console.log("[auth.ts] Making POST request to /api/auth/google");
    const data = await apiFetch<AuthResponse>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential: googleCredential }),
    });
    console.log("[auth.ts] API response received successfully", data);

    // Store tokens (handle both camelCase and snake_case)
    const accessToken = data.accessToken || data.access_token;
    const refreshToken = data.refreshToken || data.refresh_token;
    
    if (!accessToken || !refreshToken) {
      throw new Error("No tokens in auth response: " + JSON.stringify(data));
    }
    
    console.log("[auth.ts] Storing access and refresh tokens...");
    localStorage.setItem("ws_access_token", accessToken);
    localStorage.setItem("ws_refresh_token", refreshToken);
    console.log("[auth.ts] Tokens stored successfully");

    // Normalize response to camelCase
    console.log("[auth.ts] Original response:", data);
    console.log("[auth.ts] is_new_user field:", data.is_new_user);
    
    return {
      ...data,
      accessToken: accessToken,
      refreshToken: refreshToken,
      is_new_user: data.is_new_user,
    };
  } catch (error) {
    console.error("[auth.ts] googleLogin failed:", error);
    console.error("[auth.ts] Error details:", error instanceof Error ? { message: error.message, stack: error.stack } : String(error));
    throw error;
  }
}

export async function logout() {
  localStorage.removeItem("ws_access_token");
  localStorage.removeItem("ws_refresh_token");
}

export async function getProfile() {
  return apiFetch("/api/auth/profile");
}

export async function updateProfile(data: any) {
  return apiFetch("/api/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  // Store tokens (handle both camelCase and snake_case)
  const accessToken = data.accessToken || data.access_token;
  const refreshToken = data.refreshToken || data.refresh_token;
  
  if (!accessToken || !refreshToken) {
    throw new Error("No tokens in login response: " + JSON.stringify(data));
  }
  
  localStorage.setItem("ws_access_token", accessToken);
  localStorage.setItem("ws_refresh_token", refreshToken);

  return { ...data, accessToken, refreshToken };
}

export async function register(username: string, email: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });

  // Store tokens (handle both camelCase and snake_case)
  const accessToken = data.accessToken || data.access_token;
  const refreshToken = data.refreshToken || data.refresh_token;
  
  if (!accessToken || !refreshToken) {
    throw new Error("No tokens in register response: " + JSON.stringify(data));
  }
  
  localStorage.setItem("ws_access_token", accessToken);
  localStorage.setItem("ws_refresh_token", refreshToken);

  return { ...data, accessToken, refreshToken };
}