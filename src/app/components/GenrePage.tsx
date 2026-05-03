import { useParams } from "react-router";
import { GameCard } from "./GameCard";

const genreGames: Record<string, any[]> = {
  action: [
    {
      id: "6",
      title: "Cyber Revolution",
      coverArt: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=600&fit=crop",
      platforms: ["PC"],
      scores: { gameplay: 8.5, content: 8.8, narrative: 9.2, aesthetics: 9.7, polish: 8.3 },
    },
    {
      id: "10",
      title: "Wasteland Warriors",
      coverArt: "https://images.unsplash.com/photo-1556438064-2d7646166914?w=400&h=600&fit=crop",
      platforms: ["PC", "Xbox", "PS5"],
      scores: { gameplay: 8.6, content: 8.4, narrative: 7.8, aesthetics: 9.1, polish: 8.7 },
    },
    {
      id: "4",
      title: "Velocity Racer",
      coverArt: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=600&fit=crop",
      platforms: ["PC", "Xbox", "PS5"],
      scores: { gameplay: 8.9, content: 8.2, narrative: 7.0, aesthetics: 9.3, polish: 9.0 },
    },
  ],
  rpg: [
    {
      id: "3",
      title: "Dragon's Legacy",
      coverArt: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=600&fit=crop",
      platforms: ["PC", "PS5"],
      scores: { gameplay: 9.5, content: 9.3, narrative: 9.8, aesthetics: 9.0, polish: 9.2 },
    },
    {
      id: "5",
      title: "Mythic Realms",
      coverArt: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop",
      platforms: ["PC", "Switch"],
      scores: { gameplay: 9.0, content: 9.5, narrative: 8.8, aesthetics: 8.5, polish: 8.7 },
    },
    {
      id: "9",
      title: "Mystic Chronicles",
      coverArt: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=600&fit=crop",
      platforms: ["Switch"],
      scores: { gameplay: 8.8, content: 9.2, narrative: 9.5, aesthetics: 8.6, polish: 8.9 },
    },
  ],
};

const genreInfo: Record<string, { emoji: string; description: string; color: string }> = {
  action: {
    emoji: "⚔️",
    description: "Fast-paced games with intense combat and exciting gameplay",
    color: "from-red-500 to-orange-500",
  },
  rpg: {
    emoji: "🎭",
    description: "Immersive role-playing games with deep stories and character development",
    color: "from-purple-500 to-pink-500",
  },
  strategy: {
    emoji: "🎯",
    description: "Tactical games that require planning and strategic thinking",
    color: "from-blue-500 to-cyan-500",
  },
  indie: {
    emoji: "🎨",
    description: "Creative independent games with unique mechanics and art styles",
    color: "from-green-500 to-teal-500",
  },
  adventure: {
    emoji: "🗺️",
    description: "Exploration-focused games with rich worlds to discover",
    color: "from-yellow-500 to-orange-500",
  },
  horror: {
    emoji: "👻",
    description: "Terrifying experiences that will keep you on the edge of your seat",
    color: "from-gray-700 to-purple-900",
  },
};

export function GenrePage() {
  const { genreName } = useParams();
  const genre = genreName?.toLowerCase() || "action";
  const info = genreInfo[genre] || genreInfo.action;
  const games = genreGames[genre] || genreGames.action;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${info.color} p-12 mb-8`}>
        <div className="relative z-10">
          <div className="text-7xl mb-4">{info.emoji}</div>
          <h1 className="text-5xl font-bold text-white mb-3 capitalize">{genre}</h1>
          <p className="text-xl text-white/90 max-w-2xl">{info.description}</p>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
          <div className="text-[20rem] leading-none">{info.emoji}</div>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          {games.length} Games
        </h2>
        <select className="bg-purple-950/50 border border-purple-500/30 rounded-lg px-4 py-2 text-purple-200 focus:outline-none focus:border-pink-500/50">
          <option>Highest Rated</option>
          <option>Most Reviews</option>
          <option>Recently Added</option>
          <option>Name A-Z</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {games.map(game => (
          <GameCard key={game.id} {...game} />
        ))}
      </div>
    </div>
  );
}
