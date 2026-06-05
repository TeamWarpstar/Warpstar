import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { GameCard } from "./GameCard";
import { LoadingScreen } from "./LoadingScreen";
import { getGame, Game } from "../../api/games";
import {
  getRecommendationFeedback,
  setRecommendationFeedback,
  clearRecommendationFeedback,
  FeedbackType,
} from "../../api/recommendations";
import { useAuth } from "../context/AuthContext";

function gameToCardProps(g: Game) {
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

export function FeedbackPage() {
  const { user } = useAuth();
  const [games,      setGames]      = useState<Game[]>([]);
  const [feedback,   setFeedback]   = useState<Record<string, FeedbackType>>({});
  const [loading,    setLoading]    = useState(true);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    getRecommendationFeedback()
      .then(async fb => {
        setFeedback(fb);
        const ids = Object.keys(fb);
        const results = await Promise.all(
          ids.map(id => getGame(id).catch(() => null)),
        );
        setGames(results.filter((g): g is Game => g !== null));
      })
      .catch(() => { setFeedback({}); setGames([]); })
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Keep the minigame loader mounted briefly after loading finishes so the
  // progress bar can animate to 100% before unmounting.
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setShowLoader(false), 900);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const handleFeedback = async (gameId: string, type: FeedbackType | null) => {
    const prev = feedback[gameId] ?? null;
    setFeedback(f => {
      const next = { ...f };
      if (type === null) delete next[gameId];
      else next[gameId] = type;
      return next;
    });
    try {
      if (type === null) await clearRecommendationFeedback(gameId);
      else                await setRecommendationFeedback(gameId, type);
    } catch {
      setFeedback(f => {
        const next = { ...f };
        if (prev) next[gameId] = prev;
        else      delete next[gameId];
        return next;
      });
    }
  };

  if (!user) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <ThumbsUp className="w-12 h-12 text-white/20 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Sign in to manage your feedback</h2>
      <Link to="/login"
        className="inline-block mt-2 px-6 py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:shadow-lg hover:shadow-white/10 transition-all">
        Sign In
      </Link>
    </div>
  );

  if (showLoader) return <LoadingScreen isFinishing={!loading} />;

  const liked    = games.filter(g => feedback[g.id] === "up");
  const disliked = games.filter(g => feedback[g.id] === "down");

  const section = (title: string, icon: JSX.Element, list: Game[], emptyText: string) => (
    <section>
      <div className="flex items-center gap-2 mb-3 sm:mb-6">
        {icon}
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{title}</h2>
        <span className="text-white/40 text-base font-medium">{list.length}</span>
      </div>
      {list.length === 0 ? (
        <p className="text-white/40 text-sm">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 lg:gap-6">
          {list.map(g => (
            <GameCard
              key={g.id}
              {...gameToCardProps(g)}
              feedback={feedback[g.id] ?? null}
              onFeedback={(t) => handleFeedback(g.id, t)}
            />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-8 sm:space-y-12">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Your Feedback</h1>
        <p className="text-white/50 text-sm sm:text-base">
          Games you've rated for recommendations. Tap a game's thumb to clear or change it.
        </p>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-20">
          <ThumbsUp className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">No feedback yet</h2>
          <p className="text-white/40 max-w-sm mx-auto">
            Thumbs up or down on recommended games to tune your suggestions. They'll show up here.
          </p>
        </div>
      ) : (
        <>
          {section("Liked",    <ThumbsUp   className="w-6 h-6 text-white/60" />, liked,    "You haven't liked any games yet.")}
          {section("Disliked", <ThumbsDown className="w-6 h-6 text-white/60" />, disliked, "You haven't disliked any games yet.")}
        </>
      )}
    </div>
  );
}
