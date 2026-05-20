import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { GameCard } from "./GameCard";
import { getGames, Game } from "../../api/games";

const GENRE_INFO: Record<string, { description: string }> = {
  action:     { description: "Fast-paced games with intense combat and exciting gameplay" },
  rpg:        { description: "Immersive role-playing games with deep stories and character development" },
  strategy:   { description: "Tactical games that require planning and strategic thinking" },
  indie:      { description: "Creative independent games with unique mechanics and art styles" },
  adventure:  { description: "Exploration-focused games with rich worlds to discover" },
  horror:     { description: "Terrifying experiences that will keep you on the edge of your seat" },
  puzzle:     { description: "Brain-teasing challenges and logic games" },
  sports:     { description: "Competitive sports and athletic simulations" },
  simulation: { description: "Build, manage, and explore lifelike systems" },
  fighting:   { description: "Head-to-head combat with deep mechanics" },
  platformer: { description: "Jump and run through exciting levels" },
  racing:     { description: "High-speed racing across thrilling tracks" },
};

const SORT_OPTIONS = [
  { value: "reviewTotal", label: "Most Reviews" },
  { value: "igdbRating",  label: "Highest Rated" },
  { value: "releaseDate", label: "Recently Added" },
  { value: "name",        label: "Name A-Z" },
];

const LIMIT = 20;

export function GenrePage() {
  const { genreName }              = useParams<{ genreName: string }>();
  const [games,   setGames]        = useState<Game[]>([]);
  const [loading, setLoading]      = useState(true);
  const [total,   setTotal]        = useState(0);
  const [skip,    setSkip]         = useState(0);
  const [sort,    setSort]         = useState("reviewTotal");

  const genre = genreName?.toLowerCase() ?? "";
  const info  = GENRE_INFO[genre] ?? { description: "Browse games in this genre" };
  const label = genreName ? genreName.charAt(0).toUpperCase() + genreName.slice(1) : "";

  useEffect(() => {
    if (!genreName) return;
    setLoading(true);
    setGames([]);

    // Pass the genre name directly — the backend resolves it to the IGDB ID
    getGames({ genre: genreName, sort, limit: LIMIT, skip })
      .then(res => {
        setGames(res.results ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(() => {
        setGames([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [genreName, sort, skip]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 p-6 sm:p-12 mb-8 border border-white/10">
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2 sm:mb-3 capitalize">{label}</h1>
          <p className="text-base sm:text-xl text-white/70 max-w-2xl">{info.description}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          {loading ? "Loading…" : `${total.toLocaleString()} Games`}
        </h2>
        <select
          value={sort}
          onChange={e => { setSort(e.target.value); setSkip(0); }}
          className="bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white/70 focus:outline-none focus:border-white/30 text-sm sm:text-base"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading
        ? <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 text-white/40 animate-spin"/></div>
        : games.length === 0
          ? <p className="text-white/40 text-center py-20">No games found for this genre.</p>
          : <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {games.map(game => (
                  <GameCard
                    key={game.id}
                    id={game.id}
                    title={game.name}
                    coverArt={game.coverUrl ?? "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=600&fit=crop"}
                    platforms={game.platforms ?? []}
                    developer=""
                    year={game.releaseDate ? new Date(game.releaseDate).getFullYear() : 0}
                    genres={game.genres ?? []}
                    scores={{ gameplay: game.gameplayAvg, content: game.contentAvg, narrative: game.narrativeAvg, aesthetics: game.aestheticsAvg, polish: game.polishAvg }}
                    igdbRating={game.igdbRating ?? 0}
                  />
                ))}
              </div>
              <div className="flex justify-center gap-4 mt-10">
                {skip > 0 && (
                  <button onClick={() => setSkip(s => Math.max(0, s - LIMIT))}
                    className="px-6 py-2 bg-white/5 border border-white/15 text-white/70 rounded-xl hover:border-white/30 transition-all">
                    Previous
                  </button>
                )}
                {skip + LIMIT < total && (
                  <button onClick={() => setSkip(s => s + LIMIT)}
                    className="px-6 py-2 bg-white text-zinc-900 font-semibold rounded-xl hover:shadow-lg hover:shadow-white/10 transition-all">
                    Next
                  </button>
                )}
              </div>
            </>
      }
    </div>
  );
}