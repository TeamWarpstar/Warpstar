import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { GameCard } from "./GameCard";
import { getGames, getGenres, Game, Genre } from "../../api/games";
import { getRecommendations } from "../../api/recommendations";
import { useAuth } from "../context/AuthContext";

const GENRE_COLORS: Record<string, string> = {
  Action:      "from-red-500 to-orange-500",
  RPG:         "from-purple-500 to-pink-500",
  Strategy:    "from-blue-500 to-cyan-500",
  Indie:       "from-green-500 to-teal-500",
  Adventure:   "from-yellow-500 to-orange-500",
  Horror:      "from-gray-700 to-purple-900",
  Puzzle:      "from-teal-500 to-blue-500",
  Sports:      "from-orange-500 to-yellow-500",
  Simulation:  "from-emerald-500 to-cyan-500",
  Fighting:    "from-red-600 to-pink-600",
  Platformer:  "from-pink-500 to-purple-600",
  Racing:      "from-cyan-500 to-blue-600",
};

function gameToCardProps(g: Game & { [k: string]: any }) {
  // recommendations endpoint returns the raw mongo doc which may use
  // different field shapes — handle both gracefully
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
  const [recommended, setRecommended]     = useState<Game[]>([]);
  const [trending,    setTrending]        = useState<Game[]>([]);
  const [genres,      setGenres]          = useState<Genre[]>([]);
  const [loading,     setLoading]         = useState(true);
  const [recPage,     setRecPage]         = useState(0);
  const REC_PAGE_SIZE = 5;

  useEffect(() => {
    setLoading(true);
    setRecPage(0);

    // For logged-in users try the recommendations endpoint; fall back to
    // top-rated if the endpoint isn't available yet (404/500).
    const recPromise: Promise<Game[]> = user
      ? getRecommendations(undefined, 20)
          .then(r => {
            console.log("[Recommendations] raw response:", r);
            console.log("[Recommendations] first result:", r.results?.[0]);
            return r.results as unknown as Game[];
          })
          .catch(err => {
            console.error("[Recommendations] error, falling back:", err);
            return getGames({ sort: "reviewTotal", limit: 20 }).then(r => r.results ?? []);
          })
      : getGames({ sort: "reviewTotal", limit: 20 }).then(r => r.results ?? []);

    Promise.all([
      recPromise,
      getGames({ sort: "topRated", limit: 12 }),
      getGenres(),
    ]).then(([rec, trend, gens]) => {
      setRecommended(rec);
      setTrending(trend.results ?? []);
      setGenres(gens.slice(0, 12));
    }).finally(() => setLoading(false));
  }, [user?.id]);

  const recSlice   = recommended.slice(recPage * REC_PAGE_SIZE, (recPage + 1) * REC_PAGE_SIZE);
  const maxRecPage = Math.max(0, Math.ceil(recommended.length / REC_PAGE_SIZE) - 1);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">

      {/* Recommended */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white">
            {user ? "Recommended for You" : "Top Games"}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setRecPage(p => Math.max(0, p - 1))}
              disabled={recPage === 0}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:border-white/25 transition-colors disabled:opacity-40"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-white/60" />
            </button>
            <button
              onClick={() => setRecPage(p => Math.min(maxRecPage, p + 1))}
              disabled={recPage >= maxRecPage}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:border-white/25 transition-colors disabled:opacity-40"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {recSlice.map(g => <GameCard key={g.id} {...gameToCardProps(g)} />)}
        </div>
      </section>

      {/* Top Rated */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-6">Top Rated</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {trending.map(g => <GameCard key={g.id} {...gameToCardProps(g)} />)}
        </div>
      </section>

      {/* Browse by Genre */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-6">Browse by Genre</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {genres.map(genre => (
            <Link
              key={genre.id}
              to={`/genre/${genre.name.toLowerCase()}`}
              className="group relative overflow-hidden rounded-xl p-6 aspect-square flex flex-col items-center justify-center gap-3 bg-white/5 border border-white/10 hover:border-white/25 hover:scale-105 transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${GENRE_COLORS[genre.name] ?? "from-zinc-700 to-zinc-600"} opacity-20 group-hover:opacity-30 transition-opacity`} />
              <span className="text-white font-semibold relative z-10">{genre.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}