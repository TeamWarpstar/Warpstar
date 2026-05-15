/**
 * src/api/auth.ts
 * Authentication endpoints: Google login, logout, profile updates.
 */

import { apiFetch } from "./client";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
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
    console.log("[auth.ts] API response received successfully");

    // Store tokens
    console.log("[auth.ts] Storing access and refresh tokens...");
    localStorage.setItem("ws_access_token", data.accessToken);
    localStorage.setItem("ws_refresh_token", data.refreshToken);
    console.log("[auth.ts] Tokens stored successfully");

    return data;
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
