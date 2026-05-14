import { apiFetch } from "./client";

export interface Game {
  id:           string;
  name:         string;
  summary?:     string;
  coverUrl?:    string;
  releaseDate?: string;
  igdbRating?:  number;
  gameplayAvg:  number;
  contentAvg:   number;
  narrativeAvg: number;
  aestheticsAvg:number;
  polishAvg:    number;
  reviewTotal:  number;
  platformIds:  string[];
  genreIds:     string[];
  themeIds:     string[];
  similarTo:    string[];
  // Resolved name arrays (returned by backend alongside IDs)
  genres:       string[];
  themes:       string[];
  platforms:    string[];
}

export interface GamesResponse {
  total:   number;
  skip:    number;
  limit:   number;
  results: Game[];
}

export interface Platform { id: string; name: string; }
export interface Genre    { id: string; name: string; }
export interface Theme    { id: string; name: string; }

export async function getGames(params: {
  q?:        string;
  genre?:    string;
  platform?: string;
  theme?:    string;
  sort?:     string;
  skip?:     number;
  limit?:    number;
} = {}): Promise<GamesResponse> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined) qs.set(k, String(v)); });
  return apiFetch<GamesResponse>(`/api/games/?${qs}`);
}

export async function getGame(id: string): Promise<Game> {
  return apiFetch<Game>(`/api/games/${id}`);
}

export async function getSimilarGames(id: string, limit = 6): Promise<Game[]> {
  return apiFetch<Game[]>(`/api/games/${id}/similar?limit=${limit}`);
}

export async function getGameReviews(id: string, skip = 0, limit = 20) {
  return apiFetch(`/api/games/${id}/reviews?skip=${skip}&limit=${limit}`);
}

export async function getPlatforms(): Promise<Platform[]> {
  return apiFetch<Platform[]>("/api/games/meta/platforms");
}

export async function getGenres(): Promise<Genre[]> {
  return apiFetch<Genre[]>("/api/games/meta/genres");
}

export async function getThemes(): Promise<Theme[]> {
  return apiFetch<Theme[]>("/api/games/meta/themes");
}