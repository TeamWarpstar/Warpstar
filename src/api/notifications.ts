import { apiFetch } from "./client";

export type NotificationType = "review_like" | "review_comment";

export interface NotificationActor {
  username?:       string;
  displayName?:    string;
  profilePicture?: string;
}

export interface NotificationItem {
  id:            string;
  userId:        string;
  actorId:       string;
  type:          NotificationType;
  reviewId:      string;
  commentId?:    string;
  read:          boolean;
  createdAt:     string;
  actor?:        NotificationActor;
  reviewTitle?:  string;
  gameId?:       string;
  gameName?:     string;
  gameCoverUrl?: string;
}

export interface NotificationsResponse {
  total:   number;
  unread:  number;
  skip:    number;
  limit:   number;
  results: NotificationItem[];
}

export async function listNotifications(skip = 0, limit = 20): Promise<NotificationsResponse> {
  return apiFetch<NotificationsResponse>(`/api/notifications/?skip=${skip}&limit=${limit}`);
}

export async function markNotificationsRead(): Promise<void> {
  await apiFetch(`/api/notifications/mark-read`, { method: "POST" });
}
