/**
 * src/api/auth.ts
 * Authentication endpoints — email/password, Google OAuth, logout.
 */

import { apiFetch, setTokens, clearTokens } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthTokens {
  access_token:  string;
  refresh_token: string;
  token_type:    string;
}

// Shape returned by the Google endpoint — our backend returns the same
// JWT pair as email login, so we normalise it to AuthTokens
export interface GoogleAuthResponse {
  access_token:  string;
  refresh_token: string;
  token_type:    string;
  is_new_user:   boolean;
}

// ---------------------------------------------------------------------------
// Email / password
// ---------------------------------------------------------------------------

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<AuthTokens> {
  const tokens = await apiFetch<AuthTokens>("/api/auth/register", {
    method:   "POST",
    body:     JSON.stringify({ username, email, password }),
    skipAuth: true,
  });
  setTokens(tokens.access_token, tokens.refresh_token);
  return tokens;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthTokens> {
  const tokens = await apiFetch<AuthTokens>("/api/auth/login", {
    method:   "POST",
    body:     JSON.stringify({ email, password }),
    skipAuth: true,
  });
  setTokens(tokens.access_token, tokens.refresh_token);
  return tokens;
}

// ---------------------------------------------------------------------------
// Google OAuth
// ---------------------------------------------------------------------------

export async function googleLogin(
  googleCredential: string,
): Promise<GoogleAuthResponse> {
  const data = await apiFetch<GoogleAuthResponse>("/api/auth/google", {
    method:   "POST",
    body:     JSON.stringify({ credential: googleCredential }),
    skipAuth: true,
  });
  setTokens(data.access_token, data.refresh_token);
  return data;
}

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const tokens = await apiFetch<AuthTokens>("/api/auth/refresh", {
    method:   "POST",
    body:     JSON.stringify({ refresh_token: refreshToken }),
    skipAuth: true,
  });
  setTokens(tokens.access_token, tokens.refresh_token);
  return tokens;
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export function logout(): void {
  clearTokens();
}