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

export type RecommendationReasonType =
  | "feedback"
  | "history"
  | "genre"
  | "platform"
  | "quality"
  | "recency"
  | "popularity";

export interface RecommendationReason {
  type: RecommendationReasonType;
  text: string;
}

export type RecommendedGame = Game & {
  _score:   number;
  _reasons?: RecommendationReason[];
};

export interface RecommendationResponse {
  total:   number;
  weights: RecommendationWeights;
  results: RecommendedGame[];
}

function buildQuery(params: Partial<RecommendationWeights> & { limit?: number }): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) q.set(k, String(v));
  }
  return q.toString() ? `?${q.toString()}` : "";
}

// In-memory cache so navigating back to homepage doesn't re-fetch
let _recCache: { data: RecommendationResponse; ts: number } | null = null;
const REC_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function clearRecommendationsCache() {
  _recCache = null;
}

export async function getRecommendations(
  overrides?: Partial<RecommendationWeights>,
  limit = 20,
): Promise<RecommendationResponse> {
  // Return cached result if still fresh and no overrides
  if (!overrides && _recCache && Date.now() - _recCache.ts < REC_CACHE_TTL_MS) {
    return _recCache.data;
  }

  const raw = await apiFetch<RecommendationResponse>(`/api/recommendations/${buildQuery({ ...overrides, limit })}`);

  // Only re-fetch games that are missing string arrays — avoids 20 requests
  // when the data is already correct
  const needsEnrich = raw.results.filter((g: any) =>
    !(Array.isArray(g.genres) && g.genres.length > 0 && typeof g.genres[0] === "string")
  );

  if (needsEnrich.length > 0) {
    const enrichMap = new Map<string, any>();
    await Promise.all(
      needsEnrich.map(async (g: any) => {
        try {
          const full = await apiFetch<any>(`/api/games/${g.id}`);
          enrichMap.set(g.id, { ...full, _score: g._score, _reasons: g._reasons });
        } catch {
          enrichMap.set(g.id, g);
        }
      })
    );
    raw.results = raw.results.map((g: any) => enrichMap.get(g.id) ?? g) as any;
  }

  // Cache only non-override results
  if (!overrides) {
    _recCache = { data: raw, ts: Date.now() };
  }

  return raw;
}

export async function saveWeights(weights: Partial<RecommendationWeights>): Promise<void> {
  clearRecommendationsCache();
  return apiFetch(`/api/recommendations/weights${buildQuery(weights)}`, { method: "PATCH" });
}

// ---------------------------------------------------------------------------
// Thumbs up / down feedback
// ---------------------------------------------------------------------------

export type FeedbackType = "up" | "down";

export async function getRecommendationFeedback(): Promise<Record<string, FeedbackType>> {
  return apiFetch<Record<string, FeedbackType>>(`/api/recommendations/feedback`);
}

export async function setRecommendationFeedback(gameId: string, type: FeedbackType): Promise<void> {
  clearRecommendationsCache();
  await apiFetch(`/api/recommendations/feedback`, {
    method: "POST",
    body:   JSON.stringify({ gameId, type }),
  });
}

export async function clearRecommendationFeedback(gameId: string): Promise<void> {
  clearRecommendationsCache();
  await apiFetch(`/api/recommendations/feedback/${gameId}`, { method: "DELETE" });
}
