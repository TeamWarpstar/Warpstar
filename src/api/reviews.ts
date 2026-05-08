import { apiFetch } from "./client";

export interface ReviewPayload {
  gameplay:         number;
  content:          number;
  narrative:        number;
  aesthetics:       number;
  polish:           number;
  title:            string;
  body?:            string;
  gp_body?:         string;
  con_body?:        string;
  ntv_body?:        string;
  aes_body?:        string;
  pol_body?:        string;
  containsSpoilers: boolean;
}

export interface Review extends ReviewPayload {
  id:           string;
  userId:       string;
  gameId:       string;
  overallScore: number;
  likes:        number;
  commentsCount:number;
  createdAt:    string;
}

export async function createReview(gameId: string, payload: ReviewPayload): Promise<Review> {
  return apiFetch<Review>(`/api/reviews/${gameId}`, {
    method: "POST",
    body:   JSON.stringify(payload),
  });
}

export async function updateReview(reviewId: string, payload: Partial<ReviewPayload>): Promise<Review> {
  return apiFetch<Review>(`/api/reviews/${reviewId}`, {
    method: "PATCH",
    body:   JSON.stringify(payload),
  });
}

export async function deleteReview(reviewId: string): Promise<void> {
  return apiFetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
}

export async function toggleReviewLike(reviewId: string): Promise<{ liked: boolean }> {
  return apiFetch(`/api/reviews/${reviewId}/like`, { method: "POST" });
}

export async function getReviewComments(reviewId: string, skip = 0, limit = 20) {
  return apiFetch(`/api/reviews/${reviewId}/comments?skip=${skip}&limit=${limit}`);
}

export async function addReviewComment(reviewId: string, content: string) {
  return apiFetch(`/api/reviews/${reviewId}/comments?content=${encodeURIComponent(content)}`, {
    method: "POST",
  });
}