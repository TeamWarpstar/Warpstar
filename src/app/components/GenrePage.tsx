import { useParams } from "react-router";
import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { GameCard } from "./GameCard";
import { PageJumper } from "./PageJumper";
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
  { value: "reviewTotal", label: "Most Reviews"  },
  { value: "igdbRating",  label: "Highest Rated" },
  { value: "releaseDate", label: "Release Date"  },
  { value: "name",        label: "Name A–Z"      },
];

const PAGE_SIZE = 20;

export function GenrePage() {
  const { genreName } = useParams<{ genreName: string }>();

  const [games,       setGames]       = useState<Game[]>([]);
  const [total,       setTotal]       = useState(0);
  const [skip,        setSkip]        = useState(0);
  const [sort,        setSort]        = useState("reviewTotal");
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const genre = genreName?.toLowerCase() ?? "";
  const info  = GENRE_INFO[genre] ?? { description: "Browse games in this genre" };
  const label = genreName ? genreName.charAt(0).toUpperCase() + genreName.slice(1) : "";

  const totalPages  = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(skip / PAGE_SIZE);
  const hasMore     = skip + PAGE_SIZE < total;

  // Initial / sort / page-jump load — replaces the list
  useEffect(() => {
    if (!genreName) return;
    setLoading(true);
    setGames([]);
    window.scrollTo({ top: 0, behavior: "smooth" });

    getGames({ genre: genreName, sort, limit: PAGE_SIZE, skip })
      .then(res => {
        setGames(res.results ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(() => { setGames([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [genreName, sort, skip]);

  // Infinite scroll — appends to the list
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextSkip = games.length; // append from where we are
      const res = await getGames({ genre: genreName!, sort, limit: PAGE_SIZE, skip: nextSkip });
      setGames(prev => [...prev, ...(res.results ?? [])]);
      setTotal(res.total ?? 0);
      // Keep skip in sync so page jumper stays accurate
      setSkip(nextSkip);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, games.length, genreName, sort]);


  const handlePageChange = (page: number) => {
    setSkip(page * PAGE_SIZE);
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setSkip(0);
  };

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
          onChange={e => handleSortChange(e.target.value)}
          className="bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white/70 focus:outline-none focus:border-white/30 text-sm sm:text-base"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Initial load spinner */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && games.length === 0 && (
        <p className="text-white/40 text-center py-20">No games found for this genre.</p>
      )}

      {/* Game grid */}
      {!loading && games.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {games.map(game => (
              <GameCard
                key={game.id}
                id={game.id}
                title={game.name}
                coverArt={game.coverUrl ?? "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=600&fit=crop"}
                platforms={game.platforms ?? []}
                developer={game.developers?.[0] ?? ""}
                year={game.releaseDate ? new Date(game.releaseDate).getFullYear() : 0}
                genres={game.genres ?? []}
                scores={{ gameplay: game.gameplayAvg, content: game.contentAvg, narrative: game.narrativeAvg, aesthetics: game.aestheticsAvg, polish: game.polishAvg }}
                igdbRating={game.igdbRating ?? 0}
              />
            ))}
          </div>


          {/* Load more spinner */}
          {loadingMore && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
            </div>
          )}

          {/* End of results */}
          {!hasMore && games.length > PAGE_SIZE && (
            <p className="text-center text-white/25 text-sm py-6">
              All {total.toLocaleString()} games loaded
            </p>
          )}

          {/* Page jumper — shown once enough pages exist */}
          {totalPages > 2 && (
            <PageJumper
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}