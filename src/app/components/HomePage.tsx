import { useState, useEffect } from "react";
import { GameCard } from "./GameCard";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { getGames, getGenres, Game, Genre } from "../../api/games";

const GENRE_GRADIENTS: Record<string, string> = {
  Action:      "from-red-600 to-orange-500",
  RPG:         "from-violet-600 to-purple-500",
  Strategy:    "from-blue-600 to-cyan-500",
  Indie:       "from-pink-500 to-rose-400",
  Adventure:   "from-emerald-600 to-teal-500",
  Horror:      "from-zinc-700 to-zinc-600",
  Puzzle:      "from-teal-500 to-blue-500",
  Sports:      "from-orange-500 to-yellow-500",
  Simulation:  "from-emerald-500 to-cyan-500",
  Fighting:    "from-red-600 to-pink-600",
  Platformer:  "from-pink-500 to-purple-600",
  Racing:      "from-cyan-500 to-blue-600",
};

// Genres to show on the homepage (in this order if available)
const FEATURED_GENRE_NAMES = [
  "Action", "RPG", "Strategy", "Indie", "Adventure", "Horror",
  "Puzzle", "Sports", "Simulation", "Fighting", "Platformer", "Racing",
];

export function HomePage() {
  const [recommended, setRecommended] = useState<Game[]>([]);
  const [trending,    setTrending]    = useState<Game[]>([]);
  const [genres,      setGenres]      = useState<Genre[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [recPage,     setRecPage]     = useState(0);
  const REC_PAGE_SIZE = 5;

  useEffect(() => {
    Promise.all([
      getGames({ sort: "reviewTotal", limit: 50 }),
      getGames({ sort: "topRated",    limit: 12 }),
      getGenres(),
    ]).then(([rec, trend, allGenres]) => {
      setRecommended(rec.results ?? []);
      setTrending(trend.results ?? []);

      // Sort fetched genres to match the featured order, fill remaining slots
      const ordered = FEATURED_GENRE_NAMES
        .map(name => allGenres.find(g => g.name === name))
        .filter(Boolean) as Genre[];

      // Fill up to 12 with any genres not already in the list
      const orderedNames = new Set(ordered.map(g => g.name));
      const rest = allGenres.filter(g => !orderedNames.has(g.name));
      setGenres([...ordered, ...rest].slice(0, 12));
    }).finally(() => setLoading(false));
  }, []);

  const transformGame = (game: Game) => ({
    id:        game.id,
    title:     game.name,
    coverArt:  game.coverUrl ?? "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=600&fit=crop",
    platforms: game.platforms ?? [],
    developer: game.genres?.[0] ?? "",
    year:      game.releaseDate ? new Date(game.releaseDate).getFullYear() : 0,
    genres:    game.genres ?? [],
    scores: {
      gameplay:   game.gameplayAvg,
      content:    game.contentAvg,
      narrative:  game.narrativeAvg,
      aesthetics: game.aestheticsAvg,
      polish:     game.polishAvg,
    },
    igdbRating: game.igdbRating ?? 0,
  });

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
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-3xl font-bold text-white">Recommended for You</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setRecPage(p => Math.max(0, p - 1))}
              disabled={recPage === 0}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:border-white/25 transition-colors disabled:opacity-40"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
            </button>
            <button
              onClick={() => setRecPage(p => Math.min(maxRecPage, p + 1))}
              disabled={recPage >= maxRecPage}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:border-white/25 transition-colors disabled:opacity-40"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
          {recSlice.map(game => (
            <GameCard key={game.id} {...transformGame(game)} />
          ))}
        </div>
      </section>

      {/* Trending */}
      <section>
        <h2 className="text-xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Top Rated</h2>
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
          {trending.map(game => (
            <GameCard key={game.id} {...transformGame(game)} />
          ))}
        </div>
      </section>

      {/* Browse by Genre */}
      <section>
        <h2 className="text-xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Browse by Genre</h2>
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {genres.map(genre => {
            const gradient = GENRE_GRADIENTS[genre.name] ?? "from-purple-600 to-pink-500";
            return (
              <Link
                key={genre.id}
                to={`/genre/${genre.name.toLowerCase()}`}
                className={`group relative overflow-hidden rounded-xl aspect-square flex items-end p-4 border border-white/10 hover:scale-105 transition-all duration-300 bg-gradient-to-br ${gradient}`}
              >
                <span className="text-white text-base sm:text-xl font-bold relative z-10 drop-shadow">
                  {genre.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}