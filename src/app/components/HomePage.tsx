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
    id: "3",
    title: "Dragon's Legacy",
    coverArt: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=600&fit=crop",
    platforms: ["PC", "PS5"],
    developer: "Ember Studios",
    year: 2024,
    genre: "Fantasy RPG",
    scores: { gameplay: 9.6, content: 9.5, narrative: 9.8, aesthetics: 9.7, polish: 9.6 },
  },
  {
    id: "12",
    title: "Hollow Frontier",
    coverArt: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=600&fit=crop",
    platforms: ["PC"],
    developer: "Dusk Engine",
    year: 2025,
    genre: "Survival",
    scores: { gameplay: 7.8, content: 6.9, narrative: 6.2, aesthetics: 7.5, polish: 6.8 },
  },
  {
    id: "13",
    title: "Chrono Break",
    coverArt: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=600&fit=crop",
    platforms: ["PC", "Switch"],
    developer: "TimeLock Studios",
    year: 2023,
    genre: "Puzzle",
    scores: { gameplay: 6.0, content: 5.5, narrative: 6.5, aesthetics: 6.2, polish: 5.8 },
  },
  {
    id: "14",
    title: "Iron Fist Arena",
    coverArt: "https://images.unsplash.com/photo-1527576539890-dfa815648363?w=400&h=600&fit=crop",
    platforms: ["PC", "PS5", "Xbox"],
    developer: "KnuckleCode",
    year: 2022,
    genre: "Fighting",
    scores: { gameplay: 4.5, content: 3.8, narrative: 2.5, aesthetics: 4.0, polish: 3.2 },
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
    id: "15",
    title: "Bog Wanderer",
    coverArt: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop",
    platforms: ["PC"],
    developer: "Mudpipe Games",
    year: 2021,
    genre: "Adventure",
    scores: { gameplay: 2.5, content: 1.8, narrative: 3.0, aesthetics: 2.2, polish: 1.5 },
  },
  {
    id: "16",
    title: "Neon Kart GP",
    coverArt: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=600&fit=crop",
    platforms: ["PC", "Switch"],
    developer: "Apex Drive Co.",
    year: 2024,
    genre: "Racing",
    scores: { gameplay: 7.2, content: 6.5, narrative: 4.0, aesthetics: 8.0, polish: 7.0 },
  },
  {
    id: "17",
    title: "Starfall: Reborn",
    coverArt: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=600&fit=crop",
    platforms: ["PC", "PS5"],
    developer: "Nebula Works",
    year: 2025,
    genre: "Sci-Fi RPG",
    scores: { gameplay: 9.7, content: 9.6, narrative: 9.8, aesthetics: 9.9, polish: 9.5 },
  },
  {
    id: "18",
    title: "Clockwork Siege",
    coverArt: "https://images.unsplash.com/photo-1553481187-be93c21490a9?w=400&h=600&fit=crop",
    platforms: ["PC"],
    developer: "Brass Gear Dev",
    year: 2023,
    genre: "Strategy",
    scores: { gameplay: 5.5, content: 5.0, narrative: 4.5, aesthetics: 5.8, polish: 4.8 },
  },
  {
    id: "19",
    title: "Galactic Shovelware",
    coverArt: "https://images.unsplash.com/photo-1608306448197-e83633f1261c?w=400&h=600&fit=crop",
    platforms: ["PC", "Switch"],
    developer: "Lazy Pixel Inc.",
    year: 2023,
    genre: "Platformer",
    scores: { gameplay: 1.2, content: 0.8, narrative: 0.5, aesthetics: 1.5, polish: 0.6 },
  },
];

const genres = [
  { name: "Action",    gradient: "from-red-600    to-orange-500" },
  { name: "RPG",       gradient: "from-violet-600 to-purple-500" },
  { name: "Strategy",  gradient: "from-blue-600   to-cyan-500"   },
  { name: "Indie",     gradient: "from-pink-500   to-rose-400"   },
  { name: "Adventure", gradient: "from-emerald-600 to-teal-500"  },
  { name: "Horror",    gradient: "from-zinc-700   to-zinc-600"   },
];

export function HomePage() {
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
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-3xl font-bold text-white">Trending Games</h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6">
          {trendingGames.map(game => (
            <GameCard key={game.id} {...game} />
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
