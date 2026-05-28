import { Link, useNavigate, useLocation } from "react-router";
import { Search, Bell, Settings, Menu, X, Loader2, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getGames, getGenres, Game, Genre } from "../../api/games";
import { getUserByUsername, searchUsers } from "../../api/users";
import warpstarWhiteLogo from "../../imports/warpstarwhite.png";
import warpstarDarkLogo from "../../imports/warpstartransparent.png";

// ---------------------------------------------------------------------------
// Search types
// ---------------------------------------------------------------------------

type SearchType = "games" | "genres" | "users";

const SEARCH_TYPES: { value: SearchType; label: string }[] = [
  { value: "games",  label: "Games"  },
  { value: "genres", label: "Genres" },
  { value: "users",  label: "Users"  },
];

// ---------------------------------------------------------------------------
// Search box
// ---------------------------------------------------------------------------

interface SearchBoxProps {
  className?: string;
  onNavigate?: () => void;
}

function SearchBox({ className = "", onNavigate }: SearchBoxProps) {
  const navigate = useNavigate();
  const [query,       setQuery]       = useState("");
  const [searchType,  setSearchType]  = useState<SearchType>("games");
  const [gameResults, setGameResults] = useState<Game[]>([]);
  const [genreResults,setGenreResults]= useState<Genre[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [showTypeMenu,setShowTypeMenu]= useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [typeMenuPos, setTypeMenuPos] = useState({ top: 0, left: 0, width: 0 });

  const containerRef   = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const typeButtonRef  = useRef<HTMLButtonElement>(null);
  const typeMenuRef    = useRef<HTMLDivElement>(null);
  const resultsRef     = useRef<HTMLDivElement>(null);
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasResults = gameResults.length > 0 || genreResults.length > 0 || userResults.length > 0;
  const showResults = query.trim().length > 0 && (hasResults || searching);

  // Reposition portals on scroll/resize
  const updatePositions = () => {
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      setDropdownPos({ top: r.bottom + 8, left: r.left, width: r.width });
    }
    if (typeButtonRef.current) {
      const r = typeButtonRef.current.getBoundingClientRect();
      setTypeMenuPos({ top: r.bottom + 4, left: r.left, width: 128 });
    }
  };

  useEffect(() => {
    updatePositions();
    window.addEventListener("scroll", updatePositions, true);
    window.addEventListener("resize", updatePositions);
    return () => {
      window.removeEventListener("scroll", updatePositions, true);
      window.removeEventListener("resize", updatePositions);
    };
  }, []);

  // Also update when menus open
  useEffect(() => { updatePositions(); }, [showTypeMenu, showResults]);

  // Close on outside click — must also exclude the portalled menus
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideContainer = containerRef.current?.contains(target);
      const insideTypeMenu  = typeMenuRef.current?.contains(target);
      const insideResults   = resultsRef.current?.contains(target);
      if (!insideContainer && !insideTypeMenu && !insideResults) {
        setGameResults([]); setGenreResults([]); setUserResults([]); setShowTypeMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setGameResults([]); setGenreResults([]); setUserResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        if (searchType === "games") {
          const res = await getGames({ q: query, limit: 6 });
          setGameResults(res.results);
          setGenreResults([]); setUserResults([]);
        } else if (searchType === "genres") {
          const all     = await getGenres();
          const q       = query.toLowerCase();
          const matched = all.filter(g => g.name.toLowerCase().includes(q)).slice(0, 8);
          setGenreResults(matched);
          setGameResults([]); setUserResults([]);
        } else {
          try {
            const users = await searchUsers(query.trim().replace(/^@/, ""), 5);
            setUserResults(users);
          } catch { setUserResults([]); }
          setGameResults([]); setGenreResults([]);
        }
      } catch {
        setGameResults([]); setGenreResults([]); setUserResults([]);
      } finally { setSearching(false); }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchType]);

  const handleSelect = () => {
    setQuery(""); setGameResults([]); setGenreResults([]); setUserResults([]);
    onNavigate?.();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}&type=${searchType}`);
    setQuery(""); setGameResults([]); setGenreResults([]); setUserResults([]);
    onNavigate?.();
  };

  const currentLabel = SEARCH_TYPES.find(t => t.value === searchType)?.label ?? "Games";
  const placeholder  = searchType === "games" ? "Search games…" : searchType === "genres" ? "Search genres…" : "Search by username…";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex items-center bg-white/5 border border-white/10 rounded-full overflow-hidden focus-within:border-white/30 transition-colors">

        {/* Type trigger */}
        <button
          ref={typeButtonRef}
          type="button"
          onClick={() => { updatePositions(); setShowTypeMenu(v => !v); }}
          className="flex items-center gap-1 pl-4 pr-2 py-3 text-white/50 hover:text-white/80 transition-colors text-sm font-medium border-r border-white/10 whitespace-nowrap flex-shrink-0"
        >
          {currentLabel}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTypeMenu ? "rotate-180" : ""}`} />
        </button>

        {/* Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
            placeholder={placeholder}
            className="w-full bg-transparent pl-9 pr-10 py-3 text-white placeholder:text-white/30 focus:outline-none text-sm"
          />
          {query && (
            <button type="button"
              onClick={() => { setQuery(""); setGameResults([]); setGenreResults([]); setUserResults([]); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Submit button */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          className="flex-shrink-0 px-3 py-3 text-white/40 hover:text-white/80 border-l border-white/10 transition-colors"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Type menu portal */}
      {showTypeMenu && createPortal(
        <div
          ref={typeMenuRef}
          className="fixed bg-[#111111] border border-white/10 rounded-xl overflow-hidden shadow-xl shadow-black/60"
          style={{ top: typeMenuPos.top, left: typeMenuPos.left, width: typeMenuPos.width, zIndex: 9999 }}
        >
          {SEARCH_TYPES.map(t => (
            <button key={t.value} type="button"
              onClick={() => {
                setSearchType(t.value); setShowTypeMenu(false);
                setQuery(""); setGameResults([]); setGenreResults([]); setUserResults([]);
                inputRef.current?.focus();
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${searchType === t.value ? "text-white bg-white/10" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
            >
              {t.label}
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* Results portal */}
      {showResults && createPortal(
        <div
          ref={resultsRef}
          className="fixed bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
        >
          {searching ? (
            <div className="flex items-center justify-center py-5">
              <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
            </div>
          ) : (
            <>
              {gameResults.map(g => (
                <Link key={g.id} to={`/game/${g.id}`} onClick={handleSelect}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                  <img src={g.coverUrl ?? ""} alt="" className="w-8 h-10 object-cover rounded border border-white/10 flex-shrink-0"
                    onError={e => (e.currentTarget.style.display = "none")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{g.name}</p>
                    {g.releaseDate && <p className="text-white/40 text-xs">{new Date(g.releaseDate).getFullYear()}</p>}
                  </div>
                  {g.reviewTotal > 0 && (
                    <span className="text-white/60 text-sm font-bold flex-shrink-0">
                      {((g.gameplayAvg + g.contentAvg + g.narrativeAvg + g.aestheticsAvg + g.polishAvg) / 5).toFixed(1)}
                    </span>
                  )}
                </Link>
              ))}
              {genreResults.map(g => (
                <Link key={g.id} to={`/genre/${g.name.toLowerCase()}`} onClick={handleSelect}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                  <div className="w-8 h-10 rounded border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0 text-lg">🎮</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{g.name}</p>
                    <p className="text-white/40 text-xs">Genre</p>
                  </div>
                </Link>
              ))}
              {userResults.map(u => (
                <Link key={u.id ?? u.username} to={`/profile/${u.username}`} onClick={handleSelect}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0 border border-white/10">
                    {u.preferences?.profilePicture
                      ? <img src={u.preferences.profilePicture} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{u.username?.[0]?.toUpperCase()}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{(u.preferences?.displayName as string) ?? u.username}</p>
                    <p className="text-white/40 text-xs">@{u.username}</p>
                  </div>
                </Link>
              ))}
              {!searching && !hasResults && query.trim() && (
                <div className="px-4 py-5 text-center text-white/40 text-sm">
                  No {currentLabel.toLowerCase()} found for "{query}"
                </div>
              )}
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export function Header() {
  const { user, signOut }  = useAuth();
  const { isDark }         = useTheme();
  const navigate           = useNavigate();
  const location           = useLocation();
  const [showUserMenu,   setShowUserMenu]   = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const profileUrl = user?.username ? `/profile/${user.username}` : "/login";

  useEffect(() => {
    setShowMobileMenu(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = () => { signOut(); navigate("/"); };
  const closeMobile   = () => setShowMobileMenu(false);

  return (
    <header className="warpstar-header sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10" style={{ overflow: "visible" }}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4" style={{ overflow: "visible" }}>

        {/* Logo */}
        <Link to="/" className="flex items-center flex-shrink-0">
          <img src={isDark ? warpstarWhiteLogo : warpstarDarkLogo} alt="Warpstar" className="h-10 md:h-12 w-auto" />
        </Link>

        {/* Responsive search */}
          <div className="flex-1 min-w-0 max-w-2xl hidden sm:flex">
            <SearchBox className="w-full" />
          </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 ml-auto">
          <Link to="/" className="text-white/70 hover:text-white transition-colors">Home</Link>
          {/* <Link to="/discover" className="text-white/70 hover:text-white transition-colors">Discover</Link> */}
          {user && <Link to="/following" className="text-white/70 hover:text-white transition-colors">Following</Link>}
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
              <button
                onClick={() => setShowUserMenu(p => !p)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 hover:border-white/50 hover:scale-110 transition-all"
                aria-label="User menu"
              >
                {user.profilePicture
                  ? <img src={user.profilePicture} alt={user.displayName ?? "User"} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-white font-bold text-sm">
                      {user.displayName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                }
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 z-[200]">
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

        {/* Mobile / tablet right side */}
        <div className="flex sm:hidden items-center gap-3 ml-auto">
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
          <button onClick={() => setShowMobileMenu(v => !v)} className="mobile-menu-button text-white/70 hover:text-white transition-colors p-1" aria-label="Toggle menu">
            {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {/* Mobile drawer */}
      {showMobileMenu && (
        <div className="md:hidden mobile-drawer border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl px-4 py-4 space-y-4">
          <SearchBox onNavigate={closeMobile} />
          <nav className="flex flex-col gap-1">
            <Link to="/" onClick={closeMobile} className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Home</Link>
            {/* <Link to="/discover" onClick={closeMobile} className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Discover</Link> */}
            {user ? (
              <>
                <Link to="/following" onClick={closeMobile} className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Following</Link>
                <Link to={profileUrl} onClick={closeMobile} className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Profile</Link>
                <Link to="/settings" onClick={closeMobile} className="px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Settings</Link>
                <button onClick={() => { handleSignOut(); closeMobile(); }} className="text-left px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Sign Out</button>
              </>
            ) : (
              <Link to="/login" onClick={closeMobile} className="px-4 py-3 text-white font-semibold bg-white/10 hover:bg-white/15 rounded-xl transition-colors">Sign In</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}