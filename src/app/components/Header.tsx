import { Link, useNavigate } from "react-router";
import { Search, Bell, Settings, Menu, X, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getGames, Game } from "../../api/games";
import warpstarWhiteLogo from "../../imports/warpstarwhite.png";
import warpstarDarkLogo from "../../imports/warpstartransparent.png";

export function Header() {
  const { user, signOut } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu,   setShowUserMenu]   = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [query,          setQuery]          = useState("");
  const [results,        setResults]        = useState<Game[]>([]);
  const [searching,      setSearching]      = useState(false);
  const menuRef    = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLDivElement>(null);
  const debounceRef= useRef<ReturnType<typeof setTimeout> | null>(null);

  const profileUrl = user?.username ? `/profile/${user.username}` : "/login";

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current   && !menuRef.current.contains(e.target as Node))   setShowUserMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setResults([]);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on navigate
  useEffect(() => { setShowMobileMenu(false); }, [navigate]);

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

  const handleSignOut = () => { signOut(); navigate("/"); };
  const closeMobile   = () => setShowMobileMenu(false);

  const SearchBox = ({ className = "" }: { className?: string }) => (
    <div ref={searchRef} className={`relative ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search games, users, genres..."
        className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-10 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
      />
      {query && (
        <button onClick={() => { setQuery(""); setResults([]); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Dropdown results */}
      {query && (results.length > 0 || searching) && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 z-50">
          {searching
            ? <div className="flex items-center justify-center py-5"><Loader2 className="w-5 h-5 text-white/40 animate-spin"/></div>
            : results.map(g => (
                <Link key={g.id} to={`/game/${g.id}`}
                  onClick={() => { setQuery(""); setResults([]); closeMobile(); }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                  <img src={g.coverUrl ?? ""} alt="" className="w-8 h-10 object-cover rounded border border-white/10"
                    onError={e => (e.currentTarget.style.display = "none")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{g.name}</p>
                    {g.releaseDate && <p className="text-white/40 text-xs">{new Date(g.releaseDate).getFullYear()}</p>}
                  </div>
                  {g.reviewTotal > 0 && (
                    <span className="text-white/60 text-sm font-bold flex-shrink-0">
                      {((g.gameplayAvg+g.contentAvg+g.narrativeAvg+g.aestheticsAvg+g.polishAvg)/5).toFixed(1)}
                    </span>
                  )}
                </Link>
              ))
          }
        </div>
      )}
    </div>
  );

  return (
    <header className="warpstar-header sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center flex-shrink-0">
          <img src={isDark ? warpstarWhiteLogo : warpstarDarkLogo} alt="Warpstar" className="h-10 md:h-12 w-auto" />
        </Link>

        {/* Desktop search */}
        <div className="hidden md:flex flex-1 max-w-2xl">
          <SearchBox className="w-full" />
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 ml-auto">
          <Link to="/" className="text-white/70 hover:text-white transition-colors">Home</Link>
          <Link to="/discover" className="text-white/70 hover:text-white transition-colors">Discover</Link>
          {user && <Link to={profileUrl} className="text-white/70 hover:text-white transition-colors">Profile</Link>}
          <Link to="/settings" className="text-white/70 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </Link>
          <button className="relative text-white/70 hover:text-white transition-colors" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
          </button>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowUserMenu(p => !p)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 hover:border-white/50 hover:scale-110 transition-all"
                aria-label="User menu">
                {user.profilePicture
                  ? <img src={user.profilePicture} alt={user.displayName ?? "User"} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-white font-bold text-sm">
                      {user.displayName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                }
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 z-50">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-white font-semibold text-sm truncate">{user.displayName}</p>
                    <p className="text-white/40 text-xs truncate">@{user.username}</p>
                  </div>
                  <Link to={profileUrl} onClick={() => setShowUserMenu(false)} className="block px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white transition-colors text-sm">View Profile</Link>
                  <Link to="/settings" onClick={() => setShowUserMenu(false)} className="block px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white transition-colors text-sm border-t border-white/10">Settings</Link>
                  {user.topGenres && user.topGenres.length > 0 && (
                    <div className="px-4 py-3 border-t border-white/10">
                      <p className="text-white/40 text-xs mb-2">Top Genres</p>
                      <div className="flex flex-wrap gap-1">
                        {user.topGenres.map(g => (
                          <span key={g} className="px-2 py-0.5 bg-white/8 text-white/70 text-xs rounded-full border border-white/15">{g}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="border-t border-white/10">
                    <button onClick={handleSignOut} className="w-full text-left px-4 py-3 text-white/60 hover:bg-white/5 hover:text-white transition-colors text-sm">Sign Out</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="px-4 py-2 bg-white text-zinc-900 font-semibold rounded-lg text-sm hover:shadow-lg hover:shadow-white/10 transition-all">
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile right side */}
        <div className="flex md:hidden items-center gap-3 ml-auto">
          <button className="relative text-white/70" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full" />
          </button>
          {user && (
            <Link to={profileUrl} className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
              {user.profilePicture
                ? <img src={user.profilePicture} alt={user.displayName ?? "User"} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-white font-bold text-xs">{user.displayName?.[0]?.toUpperCase() ?? "?"}</div>
              }
            </Link>
          )}
          <button onClick={() => setShowMobileMenu(v => !v)} className="text-white/70 hover:text-white transition-colors p-1" aria-label="Toggle menu">
            {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl px-4 py-4 space-y-4">
          <SearchBox />
          <nav className="flex flex-col gap-1">
            <Link to="/" onClick={closeMobile} className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Home</Link>
            <Link to="/discover" onClick={closeMobile} className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Discover</Link>
            {user
              ? <>
                  <Link to={profileUrl} onClick={closeMobile} className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Profile</Link>
                  <Link to="/settings" onClick={closeMobile} className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Settings</Link>
                  <button onClick={() => { handleSignOut(); closeMobile(); }} className="text-left px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Sign Out</button>
                </>
              : <Link to="/login" onClick={closeMobile} className="px-4 py-3 text-white font-semibold bg-white/10 hover:bg-white/15 rounded-xl transition-colors">Sign In</Link>
            }
          </nav>
        </div>
      )}
    </header>
  );
}