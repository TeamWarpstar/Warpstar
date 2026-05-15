import { Link } from "react-router";

const genres = [
  { name: "Action",     gradient: "from-red-600     to-orange-500"  },
  { name: "RPG",        gradient: "from-violet-600  to-purple-500"  },
  { name: "Strategy",   gradient: "from-blue-600    to-cyan-500"    },
  { name: "Indie",      gradient: "from-pink-500    to-rose-400"    },
  { name: "Adventure",  gradient: "from-emerald-600 to-teal-500"    },
  { name: "Horror",     gradient: "from-zinc-700    to-zinc-600"    },
  { name: "Puzzle",     gradient: "from-yellow-500  to-amber-400"   },
  { name: "Sports",     gradient: "from-lime-600    to-green-500"   },
  { name: "Simulation", gradient: "from-sky-600     to-blue-400"    },
  { name: "Fighting",   gradient: "from-orange-600  to-red-500"     },
  { name: "Platformer", gradient: "from-indigo-600  to-violet-500"  },
  { name: "Racing",     gradient: "from-slate-600   to-zinc-500"    },
];

export function DiscoverPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-white mb-2">Discover</h1>
      <p className="text-white/50 mb-10">Browse games by genre</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {genres.map(genre => (
          <Link
            key={genre.name}
            to={`/genre/${genre.name.toLowerCase()}`}
            className={`group relative overflow-hidden aspect-square rounded-2xl border border-white/10 flex items-end p-5 hover:scale-105 transition-all duration-200 bg-gradient-to-br ${genre.gradient}`}
          >
            <span className="text-[#ffffff] text-xl font-bold drop-shadow">{genre.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
