import { apiFetch } from "./client";
import { Game } from "./games";

export interface RecommendationWeights {
  gameplay:      number;
  aesthetics:    number;
  content:       number;
  polish:        number;
  narrative:     number;
  genreMatch:    number;
  platformMatch: number;
  recency:       number;
}

export const DEFAULT_WEIGHTS: RecommendationWeights = {
  gameplay:      5,
  aesthetics:    5,
  content:       5,
  polish:        5,
  narrative:     5,
  genreMatch:    5,
  platformMatch: 5,
  recency:       5,
};

export interface RecommendationResponse {
  total:   number;
  weights: RecommendationWeights;
  results: (Game & { _score: number })[];
}

function buildQuery(params: Partial<RecommendationWeights> & { limit?: number }): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) q.set(k, String(v));
  }
  return q.toString() ? `?${q.toString()}` : "";
}

export async function getRecommendations(
  overrides?: Partial<RecommendationWeights>,
  limit = 20,
): Promise<RecommendationResponse> {
  const raw = await apiFetch<RecommendationResponse>(`/api/recommendations/${buildQuery({ ...overrides, limit })}`);

  // The recommendation engine returns raw game docs which only have ID arrays
  // (genreIds, platformIds, developerIds) not resolved name arrays.
  // Re-fetch each game via /api/games/:id to get the fully-resolved document.
  const enriched = await Promise.all(
    raw.results.map(async (g: any) => {
      // If genres/platforms/developers are already strings, skip re-fetch
      if (
        Array.isArray(g.genres) && g.genres.length > 0 &&
        typeof g.genres[0] === "string"
      ) return g;
      try {
        const full = await apiFetch<any>(`/api/games/${g.id}`);
        return { ...full, _score: g._score };
      } catch {
        return g;
      }
    })
  );

  return { ...raw, results: enriched };
}

export async function saveWeights(weights: Partial<RecommendationWeights>): Promise<void> {
  return apiFetch(`/api/recommendations/weights${buildQuery(weights)}`, { method: "PATCH" });
}