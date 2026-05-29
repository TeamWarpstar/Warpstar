import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { GameCard } from "./GameCard";
import { getGames, Game } from "../../api/games";
import {
  getRecommendations,
  getRecommendationFeedback,
  setRecommendationFeedback,
  clearRecommendationFeedback,
  FeedbackType,
} from "../../api/recommendations";
import { useAuth } from "../context/AuthContext";

function gameToCardProps(g: Game & { [k: string]: any }) {
  const platforms = g.platforms ?? [];
  const genres    = g.genres    ?? [];
  const devs      = g.developers ?? [];
  return {
    id:        g.id,
    title:     g.name,
    coverArt:  g.coverUrl ?? "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=600&fit=crop",
    platforms,
    developer: devs[0] ?? "",
    year:      g.releaseDate ? new Date(g.releaseDate).getFullYear() : 0,
    genres,
    scores: {
      gameplay:   g.gameplayAvg   ?? 0,
      content:    g.contentAvg    ?? 0,
      narrative:  g.narrativeAvg  ?? 0,
      aesthetics: g.aestheticsAvg ?? 0,
      polish:     g.polishAvg     ?? 0,
    },
    igdbRating: g.igdbRating ?? 0,
  };
}

export function HomePage() {
  const { user }                          = useAuth();
  const [recommended,    setRecommended]    = useState<Game[]>([]);
  const [trending,       setTrending]       = useState<Game[]>([]);
  const [loadingShell,   setLoadingShell]   = useState(true);   // top rated rail
  const [loadingRec,     setLoadingRec]     = useState(true);   // recommendations
  const [recPage,        setRecPage]        = useState(0);
  const [feedback,       setFeedback]       = useState<Record<string, FeedbackType>>({});
  const REC_PAGE_SIZE = 4;

  useEffect(() => {
    setLoadingShell(true);
    setLoadingRec(true);
    setRecPage(0);

    // Phase 1 — top rated rail loads immediately (fast, no auth needed)
    getGames({ sort: "topRated", limit: 12 })
      .then(trend => setTrending(trend.results ?? []))
      .finally(() => setLoadingShell(false));

    // Phase 2 — recommendations + feedback load in background
    const recPromise: Promise<Game[]> = user
      ? getRecommendations(undefined, 20)
          .then(r => r.results as unknown as Game[])
          .catch(() => getGames({ sort: "reviewTotal", limit: 20 }).then(r => r.results ?? []))
      : getGames({ sort: "reviewTotal", limit: 20 }).then(r => r.results ?? []);

    recPromise
      .then(rec => setRecommended(rec))
      .finally(() => setLoadingRec(false));

    if (user) {
      getRecommendationFeedback().then(setFeedback).catch(() => setFeedback({}));
    } else {
      setFeedback({});
    }
  }, [user?.id]);

  const handleFeedback = async (gameId: string, type: FeedbackType | null) => {
    const prev = feedback[gameId] ?? null;
    // Optimistic state update
    setFeedback(f => {
      const next = { ...f };
      if (type === null) delete next[gameId];
      else next[gameId] = type;
      return next;
    });
    // Thumbs down: hide from the visible recommendations immediately
    if (type === "down") {
      setRecommended(rs => rs.filter(g => g.id !== gameId));
    }
    try {
      if (type === null) await clearRecommendationFeedback(gameId);
      else                await setRecommendationFeedback(gameId, type);
    } catch {
      // Roll back optimistic state on failure
      setFeedback(f => {
        const next = { ...f };
        if (prev) next[gameId] = prev;
        else      delete next[gameId];
        return next;
      });
    }
  };

  const recSlice   = recommended.slice(recPage * REC_PAGE_SIZE, (recPage + 1) * REC_PAGE_SIZE);
  const maxRecPage = Math.max(0, Math.ceil(recommended.length / REC_PAGE_SIZE) - 1);

  if (loadingShell) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8 lg:space-y-12">

      {/* Recommended */}
      <section>
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
            {user ? "Recommended for You" : "Top Games"}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setRecPage(p => Math.max(0, p - 1))}
              disabled={recPage === 0}
              className="p-2 sm:p-2.5 bg-white/5 border border-white/10 rounded-lg hover:border-white/25 transition-colors disabled:opacity-40"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
            </button>
            <button
              onClick={() => setRecPage(p => Math.min(maxRecPage, p + 1))}
              disabled={recPage >= maxRecPage}
              className="p-2 sm:p-2.5 bg-white/5 border border-white/10 rounded-lg hover:border-white/25 transition-colors disabled:opacity-40"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
            </button>
          </div>
        </div>
        {loadingRec ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
            {Array.from({ length: REC_PAGE_SIZE }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-lg sm:rounded-xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
            {recSlice.map(g => (
              <GameCard
                key={g.id}
                {...gameToCardProps(g)}
                feedback={user ? (feedback[g.id] ?? null) : undefined}
                onFeedback={user ? (t) => handleFeedback(g.id, t) : undefined}
                reasons={(g as any)._reasons}
              />
            ))}
          </div>
        )}
      </section>

      {/* Top Rated */}
      <section>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-6">Top Rated</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 lg:gap-6">
          {trending.map(g => <GameCard key={g.id} {...gameToCardProps(g)} />)}
        </div>
      </section>
    </div>
  );
}