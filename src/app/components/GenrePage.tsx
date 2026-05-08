import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { GameCard } from "./GameCard";
import { getGames, getGenres, Game, Genre } from "../../api/games";

const GENRE_INFO: Record<string,{emoji:string;description:string;color:string}> = {
  action:     {emoji:"⚔️",  description:"Fast-paced games with intense combat",                    color:"from-red-500 to-orange-500"},
  rpg:        {emoji:"🎭",  description:"Immersive role-playing with deep stories",                color:"from-purple-500 to-pink-500"},
  strategy:   {emoji:"🎯",  description:"Tactical games requiring planning and wit",               color:"from-blue-500 to-cyan-500"},
  indie:      {emoji:"🎨",  description:"Creative independent games with unique styles",           color:"from-green-500 to-teal-500"},
  adventure:  {emoji:"🗺️", description:"Exploration-focused games with rich worlds",              color:"from-yellow-500 to-orange-500"},
  horror:     {emoji:"👻",  description:"Terrifying experiences on the edge of your seat",        color:"from-gray-700 to-purple-900"},
  puzzle:     {emoji:"🧩",  description:"Brain-teasing challenges and logic games",               color:"from-teal-500 to-blue-500"},
  sports:     {emoji:"🏆",  description:"Competitive sports and athletic simulations",            color:"from-orange-500 to-yellow-500"},
  simulation: {emoji:"🌍",  description:"Build, manage, and explore lifelike systems",            color:"from-emerald-500 to-cyan-500"},
  fighting:   {emoji:"🥊",  description:"Head-to-head combat with deep mechanics",               color:"from-red-600 to-pink-600"},
  platformer: {emoji:"🎮",  description:"Jump and run through exciting levels",                  color:"from-pink-500 to-purple-600"},
  racing:     {emoji:"🏎️", description:"High-speed racing across thrilling tracks",              color:"from-cyan-500 to-blue-600"},
};

export function GenrePage() {
  const { genreName } = useParams<{genreName:string}>();
  const [games,   setGames]   = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [skip,    setSkip]    = useState(0);
  const LIMIT = 18;

  const info = GENRE_INFO[genreName?.toLowerCase() ?? ""] ?? {emoji:"🎮", description:"", color:"from-purple-500 to-pink-500"};
  const label = genreName ? genreName.charAt(0).toUpperCase() + genreName.slice(1) : "";

  useEffect(() => {
    if (!genreName) return;
    setLoading(true);
    // First find genre id, then fetch games
    getGenres().then(genres => {
      const genre = genres.find(g => g.name.toLowerCase() === genreName.toLowerCase());
      if (!genre) { setLoading(false); return; }
      return getGames({ genre: genre.id, limit: LIMIT, skip });
    }).then(res => {
      if (!res) return;
      setGames(res.results);
      setTotal(res.total);
    }).finally(() => setLoading(false));
  }, [genreName, skip]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-r ${info.color} p-8 mb-10 border border-white/10`}>
        <div className="absolute inset-0 bg-black/40"/>
        <div className="relative z-10 flex items-center gap-5">
          <span className="text-6xl">{info.emoji}</span>
          <div>
            <h1 className="text-4xl font-black text-white mb-1">{label}</h1>
            <p className="text-white/70">{info.description}</p>
            {total > 0 && <p className="text-white/50 text-sm mt-1">{total.toLocaleString()} games</p>}
          </div>
        </div>
      </div>

      {loading
        ? <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 text-pink-400 animate-spin"/></div>
        : games.length === 0
          ? <p className="text-purple-400 text-center py-20">No games found for this genre.</p>
          : <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {games.map(g => (
                  <GameCard key={g.id}
                    id={g.id} title={g.name}
                    coverArt={g.coverUrl ?? "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=600&fit=crop"}
                    platforms={[]} developer="" year={g.releaseDate ? new Date(g.releaseDate).getFullYear() : 0}
                    genre={label}
                    scores={{gameplay:g.gameplayAvg,content:g.contentAvg,narrative:g.narrativeAvg,aesthetics:g.aestheticsAvg,polish:g.polishAvg}}
                  />
                ))}
              </div>
              {/* Pagination */}
              <div className="flex justify-center gap-4 mt-10">
                {skip > 0 && (
                  <button onClick={() => setSkip(s=>Math.max(0,s-LIMIT))}
                    className="px-6 py-2 bg-purple-950/50 border border-purple-500/30 text-purple-300 rounded-xl hover:border-pink-500/50 transition-all">
                    Previous
                  </button>
                )}
                {skip + LIMIT < total && (
                  <button onClick={() => setSkip(s=>s+LIMIT)}
                    className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all">
                    Next
                  </button>
                )}
              </div>
            </>
      }
    </div>
  );
}