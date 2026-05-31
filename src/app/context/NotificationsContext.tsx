import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
  NotificationItem,
} from "../../api/notifications";

const POLL_INTERVAL_MS = 60_000;

interface NotificationsContextType {
  unread:      number;
  items:       NotificationItem[];
  loading:     boolean;
  fetchList:   () => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unread,  setUnread]  = useState(0);
  const [items,   setItems]   = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Cheap: just the badge count, polled on a schedule.
  const fetchCount = async () => {
    if (!user) return;
    try {
      const res = await getUnreadNotificationCount();
      setUnread(res.unread);
    } catch {
      // Swallow — badge keeps last-known value
    }
  };

  // Expensive: full list with enrichment. Called when the menu opens.
  const fetchList = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await listNotifications(0, 20);
      setItems(res.results);
      setUnread(res.unread);
    } catch {
      // Swallow
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    if (unread <= 0) return;
    try {
      await markNotificationsRead();
      setUnread(0);
    } catch {
      // Leave the badge alone; next poll will reconcile.
    }
  };

  // Single poll loop for the whole app, regardless of how many bell
  // buttons consume the context. Pauses when the tab is hidden.
  useEffect(() => {
    if (!user) {
      setItems([]);
      setUnread(0);
      return;
    }

    fetchCount();

    const tick = () => {
      if (document.visibilityState === "visible") fetchCount();
    };
    const interval = setInterval(tick, POLL_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") fetchCount();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <NotificationsContext.Provider value={{ unread, items, loading, fetchList, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
