import { apiFetch } from "./client";

export interface BackendUser {
  id:            string;
  username:      string;
  createdAt:     string;
  favoriteGames: string[];
  followers:     string[];
  following:     string[];
  preferences:   Record<string, unknown>;
  role?:         string;
}

export async function getMe(): Promise<BackendUser> {
  return apiFetch<BackendUser>("/api/users/me");
}

export interface UpdateMeData {
  username?:           string;
  preferences?:        Record<string, unknown>;
  onboardingComplete?: boolean;
}

export async function updateMe(data: UpdateMeData): Promise<BackendUser> {
  return apiFetch<BackendUser>("/api/users/me", {
    method: "PATCH",
    body:   JSON.stringify(data),
  });
}

export async function getUserByUsername(username: string): Promise<BackendUser> {
  return apiFetch<BackendUser>(`/api/users/${username}`);
}

export async function followUser(username: string): Promise<{ following: boolean; follower_count: number }> {
  return apiFetch(`/api/users/${username}/follow`, { method: "POST" });
}

export async function getFollowers(username: string): Promise<BackendUser[]> {
  return apiFetch<BackendUser[]>(`/api/users/${username}/followers`);
}

export async function getFollowing(username: string): Promise<BackendUser[]> {
  return apiFetch<BackendUser[]>(`/api/users/${username}/following`);
}

export async function toggleFavoriteGame(gameId: string): Promise<{ favorited: boolean }> {
  return apiFetch(`/api/users/me/favorites/${gameId}`, { method: "POST" });
}

export async function getFavoriteGames() {
  return apiFetch("/api/users/me/favorites");
}

export async function getFeed(skip = 0, limit = 20) {
  return apiFetch(`/api/feed/?skip=${skip}&limit=${limit}`);
}

export async function getMyActivity(skip = 0, limit = 20) {
  return apiFetch(`/api/feed/me?skip=${skip}&limit=${limit}`);
}

export async function searchUsers(q: string, limit = 10): Promise<BackendUser[]> {
  return apiFetch<BackendUser[]>(`/api/users/search?q=${encodeURIComponent(q)}&limit=${limit}`);
}