import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Loader2, Info, Compass } from "lucide-react";
import { GameCard } from "./GameCard";
import { ReviewCard } from "./ReviewCard";
import { getRecentReviews, FollowingReview } from "../../api/reviews";
import { getGames, Game } from "../../api/games";
import {
  getRecommendations,
  getRecommendationFeedback,
  setRecommendationFeedback,
  clearRecommendationFeedback,
  FeedbackType,
} from "../../api/recommendations";
import { useAuth } from "../context/AuthContext";
import { useScoring } from "../context/ScoringContext";

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
    reviewTotal: g.reviewTotal ?? 0,
  };
}

export function HomePage() {
  const { user }                                           = useAuth();
  const { personalizedScoring, togglePersonalizedScoring } = useScoring();
  const [recommended,    setRecommended]    = useState<Game[]>([]);
  const [trending,       setTrending]       = useState<Game[]>([]);
  const [loadingShell,   setLoadingShell]   = useState(true);   // top rated rail
  const [loadingRec,     setLoadingRec]     = useState(true);   // recommendations
  const [recPage,        setRecPage]        = useState(0);
  const [feedback,       setFeedback]       = useState<Record<string, FeedbackType>>({});
  const [recentReviews,  setRecentReviews]  = useState<FollowingReview[]>([]);
  const [recentIdx,      setRecentIdx]      = useState(0);
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

    // Phase 3 — most recent reviews across the site (public)
    setRecentIdx(0);
    getRecentReviews(10)
      .then(r => setRecentReviews(r.results ?? []))
      .catch(() => setRecentReviews([]));
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
        {/* Section header — title + personalized scores control */}
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
            {user ? "Recommended for You" : "Top Games"}
          </h2>
          {user && (
            <div className="flex items-center gap-1.5">
              <span className="sm:hidden text-xs text-white/40 font-medium"> Personalized Scores</span>
              <span className="hidden sm:block text-xs text-white/40 font-medium">Personalized Scores</span>
              <button
                onClick={togglePersonalizedScoring}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  personalizedScoring
                    ? "bg-white text-zinc-900 border-white"
                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/25 hover:text-white/70"
                }`}
                aria-pressed={personalizedScoring}
              >
                {personalizedScoring ? "On" : "Off"}
              </button>
              <div className="relative group">
                <button className="p-1 text-white/30 hover:text-white/60 transition-colors" aria-label="About personalized scores">
                  <Info className="w-3.5 h-3.5" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-white/15 rounded-lg p-3 text-xs text-white/60 leading-relaxed shadow-xl z-50 hidden group-hover:block pointer-events-none">
                  Scores are re-weighted using your factor preferences from Settings. Games that excel in what you care about score higher than their community average.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card grid with flanking nav arrows */}
        <div className="relative">
          {/* Left arrow — hidden on mobile, fades out when at first page */}
          <button
            onClick={() => setRecPage(p => Math.max(0, p - 1))}
            disabled={recPage === 0}
            className="hidden sm:flex absolute -left-5 lg:-left-7 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-zinc-900 border border-white/25 rounded-full text-white shadow-lg hover:bg-zinc-800 hover:border-white/50 hover:scale-110 transition-all duration-150 disabled:opacity-0 disabled:pointer-events-none"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

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

          {/* Right arrow — hidden on mobile, fades out when at last page */}
          <button
            onClick={() => setRecPage(p => Math.min(maxRecPage, p + 1))}
            disabled={recPage >= maxRecPage}
            className="hidden sm:flex absolute -right-5 lg:-right-7 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-zinc-900 border border-white/25 rounded-full text-white shadow-lg hover:bg-zinc-800 hover:border-white/50 hover:scale-110 transition-all duration-150 disabled:opacity-0 disabled:pointer-events-none"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Page dots — clickable, visible on all screen sizes */}
        {!loadingRec && maxRecPage > 0 && (
          <div className="flex justify-center items-center gap-2 mt-5">
            {Array.from({ length: maxRecPage + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setRecPage(i)}
                aria-label={`Go to page ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === recPage
                    ? "bg-white w-6"
                    : "bg-white/25 w-1.5 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* Mobile-only prev/next row — shown below grid since side arrows don't fit */}
        {!loadingRec && maxRecPage > 0 && (
          <div className="flex sm:hidden justify-center gap-3 mt-4">
            <button
              onClick={() => setRecPage(p => Math.max(0, p - 1))}
              disabled={recPage === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/15 rounded-full text-white/60 text-sm disabled:opacity-30 hover:bg-white/10 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={() => setRecPage(p => Math.min(maxRecPage, p + 1))}
              disabled={recPage >= maxRecPage}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/15 rounded-full text-white/60 text-sm disabled:opacity-30 hover:bg-white/10 transition-all"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

      {/* Top Rated */}
      <section>
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Top Rated</h2>
          <Link
            to="/explore"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm font-semibold hover:border-white/30 hover:text-white transition-all"
          >
            <Compass className="w-4 h-4" /> Explore all
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 lg:gap-6">
          {trending.map(g => <GameCard key={g.id} {...gameToCardProps(g)} />)}
        </div>
      </section>

      {/* Recent Reviews — one-at-a-time horizontal carousel */}
      {recentReviews.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 sm:mb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Recent Reviews</h2>
            <span className="text-xs text-white/40 font-medium tabular-nums">
              {recentIdx + 1} / {recentReviews.length}
            </span>
          </div>

          <div className="relative">
            {/* Left arrow */}
            <button
              onClick={() => setRecentIdx(i => Math.max(0, i - 1))}
              disabled={recentIdx === 0}
              className="hidden sm:flex absolute -left-5 lg:-left-7 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-zinc-900 border border-white/25 rounded-full text-white shadow-lg hover:bg-zinc-800 hover:border-white/50 hover:scale-110 transition-all duration-150 disabled:opacity-0 disabled:pointer-events-none"
              aria-label="Previous review"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {(() => {
              const r = recentReviews[recentIdx];
              return (
                <ReviewCard
                  key={r.id}
                  id={r.id}
                  reviewer={{
                    username:    r.reviewer?.username    ?? "",
                    displayName: r.reviewer?.displayName,
                    avatar:      r.reviewer?.profilePicture,
                  }}
                  scores={{
                    gameplay:   r.gameplay   ?? 0,
                    content:    r.content    ?? 0,
                    narrative:  r.narrative  ?? 0,
                    aesthetics: r.aesthetics ?? 0,
                    polish:     r.polish     ?? 0,
                  }}
                  categoryText={{
                    gameplay:   r.gp_body,
                    content:    r.con_body,
                    narrative:  r.ntv_body,
                    aesthetics: r.aes_body,
                    polish:     r.pol_body,
                  }}
                  title={r.title}
                  review={r.body ?? ""}
                  likes={r.likes ?? 0}
                  dislikes={0}
                  comments={r.commentsCount ?? 0}
                  createdAt={r.createdAt}
                  showGame={true}
                  gameId={r.gameId}
                  gameName={r.gameName}
                  gameCoverUrl={r.gameCoverUrl}
                  containsSpoilers={r.containsSpoilers}
                />
              );
            })()}

            {/* Right arrow */}
            <button
              onClick={() => setRecentIdx(i => Math.min(recentReviews.length - 1, i + 1))}
              disabled={recentIdx >= recentReviews.length - 1}
              className="hidden sm:flex absolute -right-5 lg:-right-7 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-zinc-900 border border-white/25 rounded-full text-white shadow-lg hover:bg-zinc-800 hover:border-white/50 hover:scale-110 transition-all duration-150 disabled:opacity-0 disabled:pointer-events-none"
              aria-label="Next review"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Page dots */}
          <div className="flex justify-center items-center gap-2 mt-5 flex-wrap">
            {recentReviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setRecentIdx(i)}
                aria-label={`Go to review ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === recentIdx ? "bg-white w-6" : "bg-white/25 w-1.5 hover:bg-white/50"
                }`}
              />
            ))}
          </div>

          {/* Mobile prev/next */}
          <div className="flex sm:hidden justify-center gap-3 mt-4">
            <button
              onClick={() => setRecentIdx(i => Math.max(0, i - 1))}
              disabled={recentIdx === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/15 rounded-full text-white/60 text-sm disabled:opacity-30 hover:bg-white/10 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={() => setRecentIdx(i => Math.min(recentReviews.length - 1, i + 1))}
              disabled={recentIdx >= recentReviews.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/15 rounded-full text-white/60 text-sm disabled:opacity-30 hover:bg-white/10 transition-all"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}