import { apiFetch, setTokens, clearTokens } from "./client";

export interface AuthTokens {
  access_token:  string;
  refresh_token: string;
  token_type:    string;
}

export async function register(username: string, email: string, password: string): Promise<AuthTokens> {
  const tokens = await apiFetch<AuthTokens>("/api/auth/register", {
    method:   "POST",
    body:     JSON.stringify({ username, email, password }),
    skipAuth: true,
  });
  setTokens(tokens.access_token, tokens.refresh_token);
  return tokens;
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const tokens = await apiFetch<AuthTokens>("/api/auth/login", {
    method:   "POST",
    body:     JSON.stringify({ email, password }),
    skipAuth: true,
  });
  setTokens(tokens.access_token, tokens.refresh_token);
  return tokens;
}

export async function googleLogin(googleCredential: string): Promise<AuthTokens> {
  const tokens = await apiFetch<AuthTokens>("/api/auth/google", {
    method:   "POST",
    body:     JSON.stringify({ credential: googleCredential }),
    skipAuth: true,
  });
  setTokens(tokens.access_token, tokens.refresh_token);
  return tokens;
}

export function logout() {
  clearTokens();
}