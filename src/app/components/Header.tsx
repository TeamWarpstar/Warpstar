import { Link, useNavigate } from "react-router";
import { Search, Settings, X, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getGames, Game } from "../../api/games";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [query,        setQuery]        = useState("");
  const [results,      setResults]      = useState<Game[]>([]);
  const [searching,    setSearching]    = useState(false);
  const menuRef    = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLDivElement>(null);
  const debounceRef= useRef<ReturnType<typeof setTimeout>|null>(null);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current   && !menuRef.current.contains(e.target as Node))   setShowUserMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setResults([]);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await getGames({ q: query, limit: 6 });
        setResults(res.results);
      } finally { setSearching(false); }
    }, 350);
  }, [query]);

  const handleSignOut = () => { signOut(); navigate("/login"); };
  const profileUrl    = user?.username ? `/profile/${user.username}` : "/login";

  return (
    <header className="sticky top-0 z-50 bg-[#0a0118]/80 backdrop-blur-xl border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-2xl">⭐</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Warpstar</span>
        </Link>

        {/* Search */}
        <div ref={searchRef} className="flex-1 max-w-2xl relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300/50 pointer-events-none"/>
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search games…"
            className="w-full bg-purple-950/30 border border-purple-500/30 rounded-full pl-12 pr-10 py-3 text-white placeholder:text-purple-300/50 focus:outline-none focus:border-pink-500/50 transition-colors"/>
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white">
              <X className="w-4 h-4"/>
            </button>
          )}

          {/* Dropdown */}
          {(query && (results.length > 0 || searching)) && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-[#0a0118] border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/50 z-50">
              {searching
                ? <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 text-pink-400 animate-spin"/></div>
                : results.map(g => (
                    <Link key={g.id} to={`/game/${g.id}`} onClick={() => { setQuery(""); setResults([]); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-purple-950/50 transition-colors">
                      <img src={g.coverUrl ?? ""} alt="" className="w-8 h-10 object-cover rounded-md border border-purple-500/20" onError={e => (e.currentTarget.style.display="none")}/>
                      <div>
                        <p className="text-white text-sm font-medium">{g.name}</p>
                        {g.releaseDate && <p className="text-purple-400 text-xs">{new Date(g.releaseDate).getFullYear()}</p>}
                      </div>
                      {g.reviewTotal > 0 && <span className="ml-auto text-pink-400 font-bold text-sm">{((g.gameplayAvg+g.contentAvg+g.narrativeAvg+g.aestheticsAvg+g.polishAvg)/5).toFixed(1)}</span>}
                    </Link>
                  ))
              }
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-4">
          <Link to="/" className="text-purple-200 hover:text-pink-400 transition-colors hidden md:block">Home</Link>
          <Link to="/genre/action" className="text-purple-200 hover:text-pink-400 transition-colors hidden md:block">Discover</Link>
          <Link to="/settings" className="text-purple-200 hover:text-pink-400 transition-colors"><Settings className="w-5 h-5"/></Link>

          {user && (
            <div ref={menuRef} className="relative">
              <button onClick={() => setShowUserMenu(p=>!p)}
                className="w-9 h-9 rounded-full overflow-hidden border-2 border-purple-500/40 hover:border-pink-500/60 transition-colors flex items-center justify-center bg-purple-900/50">
                {user.profilePicture
                  ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover"/>
                  : <span className="text-pink-400 font-bold text-sm">{user.username[0]?.toUpperCase()}</span>
                }
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#0a0118] border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-900/50 overflow-hidden z-50">
                  <Link to={profileUrl} onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-3 text-purple-200 hover:bg-purple-950/50 hover:text-white transition-colors text-sm">
                    @{user.username}
                  </Link>
                  <Link to="/settings" onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-3 text-purple-200 hover:bg-purple-950/50 hover:text-white transition-colors text-sm border-t border-purple-500/20">
                    Settings
                  </Link>
                  <button onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-sm border-t border-purple-500/20">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}