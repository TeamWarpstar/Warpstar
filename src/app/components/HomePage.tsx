import { GameCard } from "./GameCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router";

const recommendedGames = [
  {
    id: "1",
    title: "Stellar Odyssey",
    coverArt: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=600&fit=crop",
    platforms: ["PC", "PS5", "Xbox"],
    developer: "Nova Interactive",
    year: 2024,
    genre: "Sci-Fi RPG",
    scores: { gameplay: 9.2, content: 8.5, narrative: 9.0, aesthetics: 9.5, polish: 8.8 },
  },
  {
    id: "2",
    title: "Neon Breach",
    coverArt: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=600&fit=crop",
    platforms: ["PC", "Switch"],
    developer: "Glitch Labs",
    year: 2023,
    genre: "Action",
    scores: { gameplay: 8.7, content: 7.9, narrative: 7.5, aesthetics: 9.2, polish: 8.5 },
  },
  {
    id: "3",
    title: "Dragon's Legacy",
    coverArt: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=600&fit=crop",
    platforms: ["PC", "PS5"],
    developer: "Ember Studios",
    year: 2024,
    genre: "Fantasy RPG",
    scores: { gameplay: 9.5, content: 9.3, narrative: 9.8, aesthetics: 9.0, polish: 9.2 },
  },
  {
    id: "4",
    title: "Velocity Racer",
    coverArt: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=600&fit=crop",
    platforms: ["PC", "Xbox", "PS5"],
    developer: "Apex Drive Co.",
    year: 2023,
    genre: "Racing",
    scores: { gameplay: 8.9, content: 8.2, narrative: 7.0, aesthetics: 9.3, polish: 9.0 },
  },
  {
    id: "5",
    title: "Mythic Realms",
    coverArt: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop",
    platforms: ["PC", "Switch"],
    developer: "Arcane Forge",
    year: 2022,
    genre: "Strategy RPG",
    scores: { gameplay: 9.0, content: 9.5, narrative: 8.8, aesthetics: 8.5, polish: 8.7 },
  },
];

const trendingGames = [
  {
    id: "6",
    title: "Cyber Revolution",
    coverArt: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=600&fit=crop",
    platforms: ["PC"],
    developer: "Darkframe Studio",
    year: 2025,
    genre: "Cyberpunk",
    scores: { gameplay: 8.5, content: 8.8, narrative: 9.2, aesthetics: 9.7, polish: 8.3 },
  },
  {
    id: "7",
    title: "Galaxy Command",
    coverArt: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop",
    platforms: ["PC", "Xbox"],
    developer: "Starfield Games",
    year: 2025,
    genre: "Strategy",
    scores: { gameplay: 9.1, content: 8.9, narrative: 8.5, aesthetics: 9.0, polish: 9.3 },
  },
  {
    id: "8",
    title: "Shadow Tactics",
    coverArt: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=600&fit=crop",
    platforms: ["PC", "PS5"],
    developer: "Phantom Works",
    year: 2024,
    genre: "Stealth",
    scores: { gameplay: 9.3, content: 8.7, narrative: 8.9, aesthetics: 8.8, polish: 9.0 },
  },
  {
    id: "9",
    title: "Mystic Chronicles",
    coverArt: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=600&fit=crop",
    platforms: ["Switch"],
    developer: "Wanderlore",
    year: 2024,
    genre: "Adventure RPG",
    scores: { gameplay: 8.8, content: 9.2, narrative: 9.5, aesthetics: 8.6, polish: 8.9 },
  },
  {
    id: "10",
    title: "Wasteland Warriors",
    coverArt: "https://images.unsplash.com/photo-1556438064-2d7646166914?w=400&h=600&fit=crop",
    platforms: ["PC", "Xbox", "PS5"],
    developer: "Iron Veil",
    year: 2023,
    genre: "Post-Apocalyptic",
    scores: { gameplay: 8.6, content: 8.4, narrative: 7.8, aesthetics: 9.1, polish: 8.7 },
  },
  {
    id: "11",
    title: "Pixel Dungeon",
    coverArt: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=600&fit=crop",
    platforms: ["PC", "Switch"],
    developer: "ByteCraft",
    year: 2022,
    genre: "Roguelike",
    scores: { gameplay: 9.0, content: 9.4, narrative: 8.2, aesthetics: 8.3, polish: 8.8 },
  },
];

const genres = [
  { name: "Action", emoji: "⚔️", color: "from-red-500 to-orange-500" },
  { name: "RPG", emoji: "🎭", color: "from-purple-500 to-pink-500" },
  { name: "Strategy", emoji: "🎯", color: "from-blue-500 to-cyan-500" },
  { name: "Indie", emoji: "🎨", color: "from-green-500 to-teal-500" },
  { name: "Adventure", emoji: "🗺️", color: "from-yellow-500 to-orange-500" },
  { name: "Horror", emoji: "👻", color: "from-gray-700 to-purple-900" },
];

export function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Recommended for You
          </h2>
          <div className="flex gap-2">
            <button className="p-2 bg-purple-950/50 border border-purple-500/30 rounded-lg hover:border-pink-500/50 transition-colors" aria-label="Previous games">
              <ChevronLeft className="w-5 h-5 text-purple-300" />
            </button>
            <button className="p-2 bg-purple-950/50 border border-purple-500/30 rounded-lg hover:border-pink-500/50 transition-colors" aria-label="Next games">
              <ChevronRight className="w-5 h-5 text-purple-300" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {recommendedGames.map(game => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Trending Games
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {trendingGames.map(game => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-6">
          Browse by Genre
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {genres.map(genre => (
            <Link
              key={genre.name}
              to={`/genre/${genre.name.toLowerCase()}`}
              className="group relative overflow-hidden rounded-xl p-6 aspect-square flex flex-col items-center justify-center gap-3 bg-purple-950/30 border border-purple-500/20 hover:border-pink-500/50 hover:scale-105 transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${genre.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
              <span className="text-5xl relative z-10">{genre.emoji}</span>
              <span className="text-white font-semibold relative z-10">{genre.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}