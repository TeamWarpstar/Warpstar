import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Bell, Loader2, Heart, MessageCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
  NotificationItem,
} from "../../api/notifications";

const POLL_INTERVAL_MS = 60_000;

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function NotificationRow({ item, onClick }: { item: NotificationItem; onClick: () => void }) {
  const displayName = item.actor?.displayName || item.actor?.username || "Someone";
  const avatar      = item.actor?.profilePicture;
  const initial     = (item.actor?.username || "?")[0]?.toUpperCase() ?? "?";

  const action =
    item.type === "review_like"
      ? "liked your review of"
      : "commented on your review of";

  const target = item.gameName || "a game";
  const href   = item.gameId ? `/game/${item.gameId}` : "/";

  const Icon = item.type === "review_like" ? Heart : MessageCircle;
  const iconColor = item.type === "review_like" ? "text-pink-400" : "text-sky-400";

  return (
    <Link
      to={href}
      onClick={onClick}
      className={`flex items-start gap-3 px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-b-0 transition-colors ${
        !item.read ? "bg-white/[0.04]" : ""
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-zinc-700 overflow-hidden border border-white/10">
          {avatar
            ? <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{initial}</div>
          }
        </div>
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center ${iconColor}`}>
          <Icon className="w-2.5 h-2.5" />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-white/85 text-sm leading-snug">
          <span className="font-semibold text-white">{displayName}</span>{" "}
          <span className="text-white/60">{action}</span>{" "}
          <span className="font-semibold text-white">{target}</span>
        </p>
        <p className="text-white/40 text-xs mt-0.5">{timeAgo(item.createdAt)}</p>
      </div>

      {!item.read && (
        <div className="w-2 h-2 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" aria-label="Unread" />
      )}
    </Link>
  );
}

export function NotificationsMenu() {
  const { user }       = useAuth();
  const [open,    setOpen]    = useState(false);
  const [items,   setItems]   = useState<NotificationItem[]>([]);
  const [unread,  setUnread]  = useState(0);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cheap: just the unread count for the badge. Polled on a schedule.
  const fetchCount = async () => {
    if (!user) return;
    try {
      const { unread } = await getUnreadNotificationCount();
      setUnread(unread);
    } catch {
      // Swallow — badge stays in last-known state
    }
  };

  // Expensive: full list with enrichment. Only run when the menu opens.
  const fetchNotifs = async () => {
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

  // Badge polling — count only, paused while the tab is hidden so we don't
  // burn requests on backgrounded tabs.
  useEffect(() => {
    if (!user) { setItems([]); setUnread(0); return; }

    fetchCount();

    const tick = () => {
      if (document.visibilityState === "visible") fetchCount();
    };
    const interval = setInterval(tick, POLL_INTERVAL_MS);

    // Catch up immediately when the tab regains focus so the badge isn't
    // stale by an entire polling interval.
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchCount();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user?.id]);

  const handleToggle = async () => {
    const wasClosed = !open;
    setOpen(o => !o);
    if (wasClosed) {
      // Full fetch only when the menu actually opens.
      await fetchNotifs();
      // Mark read on the server; keep the local items' read state until next
      // fetch so the user can still see what was new in this session.
      if (unread > 0) {
        try {
          await markNotificationsRead();
          setUnread(0);
        } catch { /* keep badge until next fetch */ }
      }
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!user) {
    // Logged out — show a dimmed, non-interactive bell so layout stays put
    return (
      <button
        type="button"
        disabled
        className="relative text-white/30 cursor-default"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative text-white/70 hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-md max-h-[480px] bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 z-[200] flex flex-col">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Notifications</h3>
            {items.length > 0 && (
              <span className="text-white/35 text-xs">
                {items.length} recent
              </span>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Bell className="w-8 h-8 text-white/15 mx-auto mb-3" />
                <p className="text-white/50 text-sm font-semibold mb-1">All caught up</p>
                <p className="text-white/35 text-xs">
                  You'll see notifications here when someone likes or comments on your reviews.
                </p>
              </div>
            ) : (
              items.map(n => (
                <NotificationRow key={n.id} item={n} onClick={() => setOpen(false)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
