import { useParams, Link } from "react-router";
import { scoreStyle } from "./scoreStyle";
import { StarPolarDiagram } from "./StarPolarDiagram";
import { ReviewCard } from "./ReviewCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { ImageWithFallback } from "./ImageWithFallback";
import { Edit3, Heart, Loader2, Tag, Monitor } from "lucide-react";
import { getGame, getGameReviews, getSimilarGames, Game } from "../../api/games";
import { toggleFavoriteGame } from "../../api/users";
import { useAuth } from "../context/AuthContext";

// ---------------------------------------------------------------------------
// Review distribution chart â€” built from real review data
// ---------------------------------------------------------------------------

function buildDistributionData(reviews: any[]) {
  const buckets = ["0-2", "2-4", "4-6", "6-8", "8-10"];
  const dims    = ["gameplay", "content", "narrative", "aesthetics", "polish"];

  const data = buckets.map(range => {
    const [lo, hi] = range.split("-").map(Number);
    const row: any = { range };
    dims.forEach(dim => {
      row[dim] = reviews.filter(r => {
        const v = r[dim] ?? 0;
        return v >= lo && v < hi;
      }).length;
    });
    return row;
  });

  return data;
}

function DistributionChart({ reviews }: { reviews: any[] }) {
  const data = buildDistributionData(reviews);
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} key="distribution-bar-chart">
        <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#a1a1aa" opacity={0.3} />
        <XAxis key="x" dataKey="range" stroke="#71717a" />
        <YAxis key="y" stroke="#71717a" />
        <Tooltip
          key="tooltip"
          contentStyle={{
            backgroundColor: "#111111",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "8px",
            color: "#ffffff",
          }}
        />
        <Bar key="gameplay"   dataKey="gameplay"   name="Gameplay"   fill="#818cf8" isAnimationActive={false} />
        <Bar key="content"    dataKey="content"    name="Content"    fill="#a78bfa" isAnimationActive={false} />
        <Bar key="narrative"  dataKey="narrative"  name="Narrative"  fill="#f472b6" isAnimationActive={false} />
        <Bar key="aesthetics" dataKey="aesthetics" name="Aesthetics" fill="#fb923c" isAnimationActive={false} />
        <Bar key="polish"     dataKey="polish"     name="Polish"     fill="#34d399" isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GamePage() {
  const { gameId }               = useParams<{ gameId: string }>();
  const { user, refreshUser }    = useAuth();
  const [game,       setGame]       = useState<Game | null>(null);
  const [reviews,    setReviews]    = useState<any[]>([]);
  const [similar,    setSimilar]    = useState<Game[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [sortBy,     setSortBy]     = useState<"top" | "hot">("top");
  const [favoriting, setFavoriting] = useState(false);

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

  const isFavorited = user?.favoriteGames?.includes(gameId ?? "");

  const handleFavorite = async () => {
    if (!gameId || !user) return;
    setFavoriting(true);
    try { await toggleFavoriteGame(gameId); await refreshUser(); }
    finally { setFavoriting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
    </div>
  );
  if (!game) return (
    <div className="text-center text-white/50 py-20">Game not found.</div>
  );

  const scores = {
    gameplay:   game.gameplayAvg,
    content:    game.contentAvg,
    narrative:  game.narrativeAvg,
    aesthetics: game.aestheticsAvg,
    polish:     game.polishAvg,
  };

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) / 5;

  const releaseYear = game.releaseDate
    ? new Date(game.releaseDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  const sortedReviews = sortBy === "hot"
    ? [...reviews].sort((a, b) => {
        const controversyA = Math.min(a.likes ?? 0, a.dislikes ?? 0) / Math.max(a.likes ?? 0, a.dislikes ?? 0, 1);
        const controversyB = Math.min(b.likes ?? 0, b.dislikes ?? 0) / Math.max(b.likes ?? 0, b.dislikes ?? 0, 1);
        return controversyB - controversyA;
      })
    : [...reviews].sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-12">

        {/* Sidebar cover â€” desktop only */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
              <ImageWithFallback
                src={game.coverUrl ?? ""}
                alt={game.name}
                className="w-full aspect-[3/4] object-cover"
              />
            </div>

            {/* Favorite button â€” logged in users only */}
            {user && (
              <button onClick={handleFavorite} disabled={favoriting}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border font-semibold transition-all text-sm ${isFavorited ? "bg-pink-500/20 border-pink-500/50 text-pink-400" : "bg-white/5 border-white/10 text-white/70 hover:border-white/25"}`}>
                <Heart className={`w-4 h-4 ${isFavorited ? "fill-pink-400" : ""}`} />
                {isFavorited ? "Favorited" : "Add to Favorites"}
              </button>
            )}

            {/* Genres */}
            {(game.genres ?? []).length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-white/40 mb-2">
                  <Tag className="w-3 h-3" /> Genres
                </div>
                <div className="flex flex-wrap gap-2">
                  {game.genres.map(g => (
                    <Link key={g} to={`/genre/${g.toLowerCase()}`}
                      className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/60 hover:border-white/30 hover:text-white transition-colors">
                      {g}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Platforms */}
            {(game.platforms ?? []).length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-white/40 mb-2">
                  <Monitor className="w-3 h-3" /> Platforms
                </div>
                <div className="flex flex-wrap gap-2">
                  {game.platforms.map(p => (
                    <span key={p} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/60">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Themes */}
            {(game.themes ?? []).length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-white/40 mb-2">
                  <Tag className="w-3 h-3" /> Themes
                </div>
                <div className="flex flex-wrap gap-2">
                  {game.themes.map(t => (
                    <span key={t} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/60">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">

          {/* Mobile: cover + title row */}
          <div className="flex gap-4 lg:block">
            <div className="lg:hidden flex-shrink-0 w-28 sm:w-36 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
              <ImageWithFallback
                src={game.coverUrl ?? ""}
                alt={game.name}
                className="w-full aspect-[3/4] object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 sm:mb-4">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                  {game.name}
                </h1>
                {user ? (
                  <Link
                    to={`/game/${gameId}/review`}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:shadow-lg hover:shadow-white/10 transition-all whitespace-nowrap text-sm sm:text-base"
                  >
                    <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Write Review</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 border border-white/20 text-white/70 font-semibold rounded-lg hover:bg-white/15 transition-all whitespace-nowrap text-sm sm:text-base"
                  >
                    Sign in to review
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Mobile: platforms inline */}
                {(game.platforms ?? []).slice(0, 3).map(p => (
                  <span key={p} className="lg:hidden px-2 sm:px-3 py-1 bg-white/8 text-white/70 rounded-md border border-white/15 text-sm">
                    {p}
                  </span>
                ))}
                {releaseYear && (
                  <span className="text-white/50 text-sm">Released: {releaseYear}</span>
                )}
                {game.igdbRating && (
                  <span className="text-white/40 text-sm">IGDB: {game.igdbRating.toFixed(1)}</span>
                )}
              </div>

              {/* Mobile favorite */}
              {user && (
                <button onClick={handleFavorite} disabled={favoriting}
                  className={`lg:hidden mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${isFavorited ? "bg-pink-500/20 border-pink-500/50 text-pink-400" : "bg-white/5 border-white/10 text-white/60 hover:border-white/25"}`}>
                  <Heart className={`w-3.5 h-3.5 ${isFavorited ? "fill-pink-400" : ""}`} />
                  {isFavorited ? "Favorited" : "Favorite"}
                </button>
              )}
            </div>
          </div>

          {/* Summary */}
          {game.summary && (
            <p className="text-white/60 leading-relaxed">{game.summary}</p>
          )}

          {/* Scores */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-8">
            <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
              <div className="flex-shrink-0">
                <StarPolarDiagram scores={scores} size={220} showTotal={true} />
              </div>
              <div className="flex-1 w-full space-y-4">
                <div className="text-center lg:text-left">
                  <div className={`inline-block px-4 sm:px-5 py-2 rounded-2xl mb-2 text-4xl sm:text-6xl font-bold ${scoreStyle(totalScore).bg} ${scoreStyle(totalScore).text}`}>
                    {totalScore.toFixed(1)}
                  </div>
                  <div className="text-white/50 text-sm sm:text-base">
                    Based on {game.reviewTotal.toLocaleString()} reviews
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {Object.entries(scores).map(([key, value]) => {
                    const { bg, text } = scoreStyle(value as number);
                    return (
                      <div key={key} className={`rounded-lg p-3 ${bg}`}>
                        <div className="text-sm capitalize mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>{key}</div>
                        <div className={`text-2xl font-bold ${text}`}>{(value as number).toFixed(1)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Distribution chart â€” only shown when there are reviews */}
          {reviews.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Review Distribution</h3>
              <DistributionChart reviews={reviews} />
            </div>
          )}

          {/* Similar games */}
          {similar.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Similar Games</h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {similar.map(s => (
                  <Link key={s.id} to={`/game/${s.id}`} className="flex-shrink-0 w-24 group">
                    <div className="rounded-lg overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors">
                      <ImageWithFallback src={s.coverUrl ?? ""} alt={s.name} className="w-full aspect-[3/4] object-cover" />
                    </div>
                    <p className="text-xs text-white/50 mt-1.5 truncate group-hover:text-white/80 transition-colors">
                      {s.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl sm:text-3xl font-bold text-white">Reviews</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy("top")}
              className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                sortBy === "top"
                  ? "bg-white text-zinc-900"
                  : "bg-white/5 text-white/60 border border-white/10 hover:border-white/25"
              }`}
            >
              Top Rated
            </button>
            <button
              onClick={() => setSortBy("hot")}
              className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                sortBy === "hot"
                  ? "bg-white text-zinc-900"
                  : "bg-white/5 text-white/60 border border-white/10 hover:border-white/25"
              }`}
            >
               Hottest Take
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {sortedReviews.length === 0
            ? <p className="text-white/40 text-center py-12">No reviews yet. Be the first!</p>
            : sortedReviews.map((review, index) => (
                <ReviewCard key={review.id ?? `review-${index}`} {...review} />
              ))
          }
        </div>
      </div>
    </div>
  );
}