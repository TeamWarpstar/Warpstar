import { useParams, Link } from "react-router-dom";
import { StarPolarDiagram } from "./StarPolarDiagram";
import { ReviewCard } from "./ReviewCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { ImageWithFallback } from "./ImageWithFallback";
import { Edit3, Heart, Loader2 } from "lucide-react";
import { getGame, getGameReviews, getSimilarGames, Game } from "../../api/games";
import { toggleFavoriteGame } from "../../api/users";
import { useAuth } from "../context/AuthContext";
 
export function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { user, refreshUser } = useAuth();
  const [game,         setGame]         = useState<Game | null>(null);
  const [reviews,      setReviews]      = useState<any[]>([]);
  const [similar,      setSimilar]      = useState<Game[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [sortBy,       setSortBy]       = useState<"top"|"hot">("top");
  const [favoriting,   setFavoriting]   = useState(false);
 
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
 
  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-pink-400 animate-spin"/></div>;
  if (!game) return <div className="text-center text-purple-300 py-20">Game not found.</div>;
 
  const scores = { gameplay: game.gameplayAvg, content: game.contentAvg, narrative: game.narrativeAvg, aesthetics: game.aestheticsAvg, polish: game.polishAvg };
  const totalScore = Object.values(scores).reduce((a,b)=>a+b,0) / 5;
 
  const sortedReviews = sortBy === "hot"
    ? [...reviews].sort((a,b) => (b.likes - b.commentsCount) - (a.likes - a.commentsCount))
    : [...reviews].sort((a,b) => b.overallScore - a.overallScore);
 
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="rounded-xl overflow-hidden border border-purple-500/20 shadow-2xl">
              <ImageWithFallback src={game.coverUrl ?? ""} alt={game.name} className="w-full aspect-[3/4] object-cover"/>
            </div>
            {user && (
              <button onClick={handleFavorite} disabled={favoriting}
                className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border font-semibold transition-all ${isFavorited ? "bg-pink-500/20 border-pink-500/50 text-pink-400" : "bg-purple-950/50 border-purple-500/30 text-purple-300 hover:border-pink-500/50"}`}>
                <Heart className={`w-4 h-4 ${isFavorited ? "fill-pink-400" : ""}`}/>
                {isFavorited ? "Favorited" : "Add to Favorites"}
              </button>
            )}
          </div>
        </div>
 
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <h1 className="text-4xl sm:text-5xl font-bold text-white">{game.name}</h1>
              {user && (
                <Link to={`/game/${gameId}/review`}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-pink-500/30 transition-all whitespace-nowrap">
                  <Edit3 className="w-5 h-5"/><span>Write Review</span>
                </Link>
              )}
            </div>
            {game.releaseDate && <p className="text-purple-300">Released: {new Date(game.releaseDate).toLocaleDateString()}</p>}
            {game.summary && <p className="text-purple-200/70 mt-3 leading-relaxed">{game.summary}</p>}
          </div>
 
          <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-shrink-0"><StarPolarDiagram scores={scores} size={280} showTotal={true}/></div>
              <div className="flex-1 space-y-4">
                <div className="text-center lg:text-left">
                  <div className="text-6xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">{totalScore.toFixed(1)}</div>
                  <div className="text-purple-300">Based on {game.reviewTotal.toLocaleString()} reviews</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(scores).map(([key,value]) => (
                    <div key={key} className="bg-purple-900/30 rounded-lg p-3 border border-purple-500/20">
                      <div className="text-sm text-purple-300 capitalize mb-1">{key}</div>
                      <div className="text-2xl font-bold text-pink-400">{(value as number).toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
 
          {similar.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Similar Games</h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {similar.map(s => (
                  <Link key={s.id} to={`/game/${s.id}`} className="flex-shrink-0 w-24 group">
                    <div className="rounded-lg overflow-hidden border border-purple-500/20 group-hover:border-pink-500/40 transition-colors">
                      <ImageWithFallback src={s.coverUrl ?? ""} alt={s.name} className="w-full aspect-[3/4] object-cover"/>
                    </div>
                    <p className="text-xs text-purple-300 mt-1.5 truncate group-hover:text-pink-300 transition-colors">{s.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
 
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Reviews</h2>
          <div className="flex gap-2">
            {(["top","hot"] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${sortBy===s ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" : "bg-purple-950/50 text-purple-300 border border-purple-500/30 hover:border-pink-500/50"}`}>
                {s === "top" ? "Top Rated" : "Most Active"}
              </button>
            ))}
          </div>
        </div>
        {sortedReviews.length === 0
          ? <p className="text-purple-400 text-center py-12">No reviews yet. Be the first!</p>
          : sortedReviews.map((r, i) => <ReviewCard key={r.id ?? i} {...r}/>)
        }
      </div>
    </div>
  );
}