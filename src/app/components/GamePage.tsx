import { useParams, Link } from "react-router";
import { scoreStyle } from "./scoreStyle";
import { StarPolarDiagram } from "./StarPolarDiagram";
import { ReviewCard } from "./ReviewCard";
import { useState, useEffect } from "react";
import { ImageWithFallback } from "./ImageWithFallback";
import { Edit3, Heart, Loader2, Tag, Monitor, Building2 } from "lucide-react";
import { getGame, getGameReviews, getSimilarGames, Game } from "../../api/games";
import { toggleFavoriteGame } from "../../api/users";
import { deleteReview } from "../../api/reviews";
import { useAuth } from "../context/AuthContext";

const SCORE_FACTORS = [
  { key: "gameplay"   as const, label: "Gameplay",   color: "#6373ff" },
  { key: "aesthetics" as const, label: "Aesthetics", color: "#ff9a48" },
  { key: "content"    as const, label: "Content",    color: "#a95eff" },
  { key: "polish"     as const, label: "Polish",     color: "#61bb74" },
  { key: "narrative"  as const, label: "Narrative",  color: "#f55f5f" },
];

function mapReview(r: any, onDelete?: (id: string) => void, isOwn?: boolean) {
  return {
    reviewer:     { username: r.username ?? r.userId ?? "unknown", avatar: r.avatar ?? undefined },
    scores:       { gameplay: r.gameplay ?? 0, content: r.content ?? 0, narrative: r.narrative ?? 0, aesthetics: r.aesthetics ?? 0, polish: r.polish ?? 0 },
    categoryText: { gameplay: r.gp_body ?? "", content: r.con_body ?? "", narrative: r.ntv_body ?? "", aesthetics: r.aes_body ?? "", polish: r.pol_body ?? "" },
    title:        r.title ?? undefined,
    review:       r.body ?? "",
    likes:        r.likes ?? 0,
    dislikes:     0,
    comments:     r.commentsCount ?? 0,
    isPinned:     false,
    id:           r.id,
    createdAt:    r.createdAt ?? undefined,
    isOwnReview:  isOwn ?? false,
    onDelete:     onDelete,
  };
}

export function GamePage() {
  const { gameId }            = useParams<{ gameId: string }>();
  const { user, refreshUser } = useAuth();
  const [game,       setGame]       = useState<Game | null>(null);
  const [reviews,    setReviews]    = useState<any[]>([]);
  const [similar,    setSimilar]    = useState<Game[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [sortBy,     setSortBy]     = useState<"top" | "hot">("top");
  const [favoriting, setFavoriting] = useState(false);
  const [deleting,   setDeleting]   = useState<string | null>(null);

  const loadReviews = async () => {
    if (!gameId) return;
    const r = await getGameReviews(gameId) as any;
    setReviews(r.results ?? []);
  };

  useEffect(() => {
    if (!gameId) return;
    setLoading(true);
    Promise.all([
      getGame(gameId),
      getGameReviews(gameId) as Promise<any>,
      getSimilarGames(gameId),
    ]).then(([g, r, s]) => {
      setGame(g);
      setReviews((r as any).results ?? []);
      setSimilar(s);
    }).finally(() => setLoading(false));
  }, [gameId]);

  const myReview    = user ? reviews.find(r => r.username === user.username) : null;
  const isFavorited = user?.favoriteGames?.includes(gameId ?? "");

  const handleFavorite = async () => {
    if (!gameId || !user) return;
    setFavoriting(true);
    try { await toggleFavoriteGame(gameId); await refreshUser(); }
    finally { setFavoriting(false); }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Delete your review? This cannot be undone.")) return;
    setDeleting(reviewId);
    try {
      await deleteReview(reviewId);
      await loadReviews();
      const g = await getGame(gameId!);
      setGame(g);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-pink-400 animate-spin" /></div>;
  if (!game)   return <div className="text-center text-white/50 py-20">Game not found.</div>;

  const scores = {
    gameplay:   game.gameplayAvg,
    content:    game.contentAvg,
    narrative:  game.narrativeAvg,
    aesthetics: game.aestheticsAvg,
    polish:     game.polishAvg,
  };
  const releaseYear = game.releaseDate
    ? new Date(game.releaseDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  const sortedReviews = sortBy === "hot"
    ? [...reviews].sort((a, b) => {
        const cA = Math.min(a.likes ?? 0, a.dislikes ?? 0) / Math.max(a.likes ?? 0, a.dislikes ?? 0, 1);
        const cB = Math.min(b.likes ?? 0, b.dislikes ?? 0) / Math.max(b.likes ?? 0, b.dislikes ?? 0, 1);
        return cB - cA;
      })
    : [...reviews].sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <div className="lg:flex lg:gap-8">

        {/* ── Desktop sidebar (lg+) ── */}
        <div className="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0">
          <div className="sticky top-6 max-h-[calc(100vh-2rem)] overflow-y-auto space-y-4 pb-4 [&::-webkit-scrollbar]:hidden">
            <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
              <ImageWithFallback src={game.coverUrl ?? ""} alt={game.name} className="w-full aspect-[3/4] object-cover" />
            </div>

            {user && (
              <button onClick={handleFavorite} disabled={favoriting}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border font-semibold transition-all text-sm ${isFavorited ? "bg-pink-500/20 border-pink-500/50 text-pink-400" : "bg-white/5 border-white/10 text-white/70 hover:border-white/25"}`}>
                <Heart className={`w-4 h-4 ${isFavorited ? "fill-pink-400" : ""}`} />
                {isFavorited ? "Favorited" : "Add to Favorites"}
              </button>
            )}

            {(game.genres ?? []).length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-white/40 mb-2"><Tag className="w-3 h-3" /> Genres</div>
                <div className="flex flex-wrap gap-2">
                  {game.genres.map(g => (
                    <Link key={g} to={`/genre/${g.toLowerCase()}`} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/60 hover:border-white/30 hover:text-white transition-colors">{g}</Link>
                  ))}
                </div>
              </div>
            )}

            {(game.platforms ?? []).length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-white/40 mb-2"><Monitor className="w-3 h-3" /> Platforms</div>
                <div className="flex flex-wrap gap-2">
                  {game.platforms.map(p => <span key={p} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/60">{p}</span>)}
                </div>
              </div>
            )}

            {(game.themes ?? []).length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-white/40 mb-2"><Tag className="w-3 h-3" /> Themes</div>
                <div className="flex flex-wrap gap-2">
                  {game.themes.map(t => <span key={t} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/60">{t}</span>)}
                </div>
              </div>
            )}

            {(game.developers ?? []).length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-white/40 mb-2"><Building2 className="w-3 h-3" /> Developer</div>
                <div className="flex flex-wrap gap-2">
                  {game.developers.map(c => <span key={c} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/60">{c}</span>)}
                </div>
              </div>
            )}

            {(game.publishers ?? []).length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-white/40 mb-2"><Building2 className="w-3 h-3" /> Publisher</div>
                <div className="flex flex-wrap gap-2">
                  {game.publishers.map(c => <span key={c} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/60">{c}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 space-y-6 sm:space-y-8">

          {/* ══════════════════════════════════════
              MOBILE / TABLET HEADER  (hidden lg+)
              ══════════════════════════════════════ */}
          <div className="lg:hidden space-y-4">

            {/* Row 1: Cover art + Title + action buttons */}
            <div className="flex gap-4 items-start">
              {/* Cover art */}
              <div className="flex-shrink-0 w-28 sm:w-36 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                <ImageWithFallback src={game.coverUrl ?? ""} alt={game.name} className="w-full aspect-[3/4] object-cover" />
              </div>

              {/* Title, meta, actions */}
              <div className="flex-1 min-w-0 flex flex-col gap-2 pt-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">{game.name}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                  {releaseYear && <span className="text-white/50">{releaseYear}</span>}
                  {game.igdbRating && <span className="text-white/40">IGDB: {game.igdbRating.toFixed(1)}</span>}
                </div>
                {user ? (
                  <div className="flex flex-col gap-2 mt-1">
                    <Link to={`/game/${gameId}/review`}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-zinc-900 font-semibold rounded-lg hover:shadow-lg transition-all text-sm">
                      <Edit3 className="w-3.5 h-3.5" />
                      {myReview ? "Edit Review" : "Write Review"}
                    </Link>
                    {myReview && (
                      <button onClick={() => handleDeleteReview(myReview.id)} disabled={deleting === myReview.id}
                        className="flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 font-semibold rounded-lg text-xs">
                        {deleting === myReview.id ? "Deleting…" : "Delete Review"}
                      </button>
                    )}
                    <button onClick={handleFavorite} disabled={favoriting}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${isFavorited ? "bg-pink-500/20 border-pink-500/50 text-pink-400" : "bg-white/5 border-white/10 text-white/60 hover:border-white/25"}`}>
                      <Heart className={`w-3 h-3 ${isFavorited ? "fill-pink-400" : ""}`} />
                      {isFavorited ? "Favorited" : "Favorite"}
                    </button>
                  </div>
                ) : (
                  <Link to="/login"
                    className="mt-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 border border-white/20 text-white/70 font-semibold rounded-lg text-sm">
                    Sign in to review
                  </Link>
                )}
              </div>
            </div>

            {/* Row 2: Star diagram + score bars */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <StarPolarDiagram scores={scores} size={150} showTotal={true} showLabels={false} showNumbers={false} />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  {SCORE_FACTORS.map(f => {
                    const val = scores[f.key];
                    const pct = (val / 10) * 100;
                    return (
                      <div key={f.key}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span style={{ fontSize: 10, fontWeight: 600, color: f.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            {f.label}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: f.color }}>{val.toFixed(1)}</span>
                        </div>
                        <div style={{ position: "relative", height: 4, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: f.color, opacity: 0.85 }} />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-white/25 text-xs pt-0.5">
                    {game.reviewTotal.toLocaleString()} {game.reviewTotal === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>
            </div>

            {/* Row 3: Summary */}
            {game.summary && (
              <p className="text-white/80 leading-relaxed text-sm sm:text-base">{game.summary}</p>
            )}

            {/* Row 4: Platforms */}
            {(game.platforms ?? []).length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-white/40 mb-2">
                  <Monitor className="w-3 h-3" /> Platforms
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {game.platforms.map(p => (
                    <span key={p} className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/60">{p}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Row 5: Genres + Developer */}
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {(game.genres ?? []).length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-xs text-white/40 mb-1.5"><Tag className="w-3 h-3" /> Genres</div>
                  <div className="flex flex-wrap gap-1.5">
                    {game.genres.map(g => (
                      <Link key={g} to={`/genre/${g.toLowerCase()}`} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-xs text-white/60 hover:border-white/30 hover:text-white transition-colors">{g}</Link>
                    ))}
                  </div>
                </div>
              )}
              {(game.developers ?? []).length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-xs text-white/40 mb-1.5"><Building2 className="w-3 h-3" /> Developer</div>
                  <div className="flex flex-wrap gap-1.5">
                    {game.developers.map(c => (
                      <span key={c} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-xs text-white/60">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════
              DESKTOP HEADER  (lg+)
              ══════════════════════════════════════ */}
          <div className="hidden lg:block">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">{game.name}</h1>
              {user ? (
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Link to={`/game/${gameId}/review`}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:shadow-lg hover:shadow-white/10 transition-all whitespace-nowrap">
                    <Edit3 className="w-5 h-5" />
                    {myReview ? "Edit Review" : "Write Review"}
                  </Link>
                  {myReview && (
                    <button onClick={() => handleDeleteReview(myReview.id)} disabled={deleting === myReview.id}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 font-semibold rounded-lg hover:bg-red-500/20 transition-all text-sm whitespace-nowrap">
                      {deleting === myReview.id ? "Deleting…" : "Delete Review"}
                    </button>
                  )}
                </div>
              ) : (
                <Link to="/login"
                  className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white/70 font-semibold rounded-lg hover:bg-white/15 transition-all whitespace-nowrap">
                  Sign in to review
                </Link>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              {releaseYear && <span className="text-white/50 text-md">Released: {releaseYear}</span>}
              {game.igdbRating && <span className="text-white/40 text-md">IGDB: {game.igdbRating.toFixed(1)}</span>}
            </div>

            {game.summary && (
              <p className="text-white/100 leading-relaxed">{game.summary}</p>
            )}
          </div>

          {/* ── Scores panel (desktop only) ── */}
          <div className="hidden lg:block bg-white/5 border border-white/10 rounded-xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <StarPolarDiagram scores={scores} size={350} showTotal={true} showLabels={false} showNumbers={true} />
              </div>
              <div className="flex-1 w-full space-y-3">
                {SCORE_FACTORS.map(f => {
                  const val = scores[f.key];
                  const pct = (val / 10) * 100;
                  return (
                    <div key={f.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span style={{ fontSize: 12, fontWeight: 600, color: f.color, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                          {f.label}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: f.color }}>
                          {val.toFixed(1)}
                        </span>
                      </div>
                      <div style={{ position: "relative", height: 7, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: f.color, opacity: 0.85, transition: "width 0.6s ease" }} />
                        {Array.from({ length: 9 }).map((_, t) => {
                          const tickPct = (t + 1) * 10;
                          const isFilled = tickPct <= pct;
                          return (
                            <div key={t} style={{
                              position: "absolute",
                              top: 0, bottom: 0,
                              left: `${tickPct}%`,
                              width: 1.5,
                              background: isFilled ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.5)",
                              transform: "translateX(-50%)",
                            }} />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <p className="text-white/25 text-xs pt-1">
                  Based on {game.reviewTotal.toLocaleString()} {game.reviewTotal === 1 ? "review" : "reviews"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Similar games ── */}
          {similar.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Similar Games</h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {similar.map(s => (
                  <Link key={s.id} to={`/game/${s.id}`} className="flex-shrink-0 w-24 group">
                    <div className="rounded-lg overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors">
                      <ImageWithFallback src={s.coverUrl ?? ""} alt={s.name} className="w-full aspect-[3/4] object-cover" />
                    </div>
                    <p className="text-xs text-white/50 mt-1.5 truncate group-hover:text-white/80 transition-colors">{s.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Reviews ── */}
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl sm:text-3xl font-bold text-white">Reviews</h2>
              <div className="flex gap-2">
                {(["top", "hot"] as const).map(s => (
                  <button key={s} onClick={() => setSortBy(s)}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${sortBy === s ? "bg-white text-zinc-900" : "bg-white/5 text-white/60 border border-white/10 hover:border-white/25"}`}>
                    {s === "top" ? "Top Rated" : "Hottest Take"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {sortedReviews.length === 0
                ? <p className="text-white/40 text-center py-12">No reviews yet. Be the first!</p>
                : sortedReviews.map((review, index) => (
                    <ReviewCard
                      key={review.id ?? `review-${index}`}
                      {...mapReview(review, handleDeleteReview, user?.username === review.username)}
                    />
                  ))
              }
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}