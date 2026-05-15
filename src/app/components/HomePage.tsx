import { useState, useEffect } from "react";
import { GameCard } from "./GameCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { getGames, Game, GamesResponse } from "../api/games";

// Fallback mock data for when API is unavailable
const FALLBACK_GAMES = [
  {
    id: "1",
    name: "Stellar Odyssey",
    coverUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=600&fit=crop",
    platforms: ["PC", "PS5", "Xbox"],
    genres: ["Sci-Fi", "RPG"],
    gameplayAvg: 9.2,
    contentAvg: 8.5,
    narrativeAvg: 9.0,
    aestheticsAvg: 9.5,
    polishAvg: 8.8,
    releaseDate: "2024-01-15",
  },
  {
    id: "3",
    name: "Dragon's Legacy",
    coverUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=600&fit=crop",
    platforms: ["PC", "PS5"],
    genres: ["Fantasy", "RPG"],
    gameplayAvg: 9.6,
    contentAvg: 9.5,
    narrativeAvg: 9.8,
    aestheticsAvg: 9.7,
    polishAvg: 9.6,
    releaseDate: "2024-03-20",
  },
  {
    id: "12",
    name: "Hollow Frontier",
    coverUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=600&fit=crop",
    platforms: ["PC"],
    genres: ["Survival"],
    gameplayAvg: 7.8,
    contentAvg: 6.9,
    narrativeAvg: 6.2,
    aestheticsAvg: 7.5,
    polishAvg: 6.8,
    releaseDate: "2025-02-10",
  },
] as Game[];

const genres = [
  { name: "Action",    gradient: "from-red-600    to-orange-500" },
  { name: "RPG",       gradient: "from-violet-600 to-purple-500" },
  { name: "Strategy",  gradient: "from-blue-600   to-cyan-500"   },
  { name: "Indie",     gradient: "from-pink-500   to-rose-400"   },
  { name: "Adventure", gradient: "from-emerald-600 to-teal-500"  },
  { name: "Horror",    gradient: "from-zinc-700   to-zinc-600"   },
];

export function HomePage() {
  const [recommendedGames, setRecommendedGames] = useState<Game[]>(FALLBACK_GAMES);
  const [trendingGames, setTrendingGames] = useState<Game[]>(FALLBACK_GAMES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        // Fetch recommended games
        const recommendedRes = await getGames({ limit: 10, sort: "-reviewTotal" });
        if (recommendedRes.results?.length) {
          setRecommendedGames(recommendedRes.results);
        }

        // Fetch trending games
        const trendingRes = await getGames({ limit: 10, sort: "-gameplayAvg" });
        if (trendingRes.results?.length) {
          setTrendingGames(trendingRes.results);
        }
      } catch (error) {
        console.error("Failed to fetch games:", error);
        // Keep fallback data
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const transformGame = (game: Game) => ({
    id: game.id,
    title: game.name,
    coverArt: game.coverUrl || "https://via.placeholder.com/400x600?text=No+Image",
    platforms: game.platforms || [],
    developer: game.genres?.[0] || "Unknown",
    year: game.releaseDate ? new Date(game.releaseDate).getFullYear() : 2024,
    genres: game.genres || ["Game"],
    scores: {
      gameplay: game.gameplayAvg || 0,
      content: game.contentAvg || 0,
      narrative: game.narrativeAvg || 0,
      aesthetics: game.aestheticsAvg || 0,
      polish: game.polishAvg || 0,
    },
    igdbRating: game.igdbRating || 0,
  });
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      <section>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-3xl font-bold text-white">Recommended for You</h2>
          <div className="flex gap-2">
            <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:border-white/25 transition-colors" aria-label="Previous games">
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
            </button>
            <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:border-white/25 transition-colors" aria-label="Next games">
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
          {recommendedGames.map(game => (
            <GameCard key={game.id} {...transformGame(game)} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-3xl font-bold text-white">Trending Games</h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
          {trendingGames.map(game => (
            <GameCard key={game.id} {...transformGame(game)} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Browse by Genre</h2>

        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {genres.map(genre => (
            <Link
              key={genre.name}
              to={`/genre/${genre.name.toLowerCase()}`}
              className={`group relative overflow-hidden rounded-xl aspect-square flex items-end p-4 border border-white/10 hover:scale-105 transition-all duration-300 bg-gradient-to-br ${genre.gradient}`}
            >
              <span className="text-[#ffffff] text-xl font-bold relative z-10 drop-shadow">{genre.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
