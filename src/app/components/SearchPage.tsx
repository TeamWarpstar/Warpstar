import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router";
import { Search, X, Loader2, User } from "lucide-react";
import { getGames, getGenres, Game, Genre } from "../../api/games";
import { searchUsers } from "../../api/users";
import { GameCard } from "./GameCard";
import { PageJumper } from "./PageJumper";

type SearchType = "games" | "genres" | "users";

const SEARCH_TYPES: { value: SearchType; label: string;}[] = [
  { value: "games",  label: "Games",  },
  { value: "genres", label: "Genres",},
  { value: "users",  label: "Users", },
];

const SORT_OPTIONS = [
  { value: "reviewTotal",     label: "Most Reviews"  },
  { value: "igdbRating",      label: "Highest Rated" },
  { value: "igdbRatingCount", label: "Most Popular"  },
  { value: "releaseDate",     label: "Release Date"  },
  { value: "name",            label: "Name A–Z"      },
];

const PAGE_SIZE = 20;

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const initialType  = (searchParams.get("type") as SearchType) ?? "games";

  const [query,       setQuery]       = useState(initialQuery);
  const [inputValue,  setInputValue]  = useState(initialQuery);
  const [searchType,  setSearchType]  = useState<SearchType>(initialType);
  const [sort,        setSort]        = useState("reviewTotal");

  // Results
  const [gameResults,  setGameResults]  = useState<Game[]>([]);
  const [genreResults, setGenreResults] = useState<Genre[]>([]);
  const [userResults,  setUserResults]  = useState<any[]>([]);
  const [total,        setTotal]        = useState(0);
  const [skip,         setSkip]         = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [searched,     setSearched]     = useState(!!initialQuery);

  const inputRef    = useRef<HTMLInputElement>(null);
  const totalPages  = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(skip / PAGE_SIZE);
  const hasMore     = searchType === "games" && skip + PAGE_SIZE < total;

  // ---------------------------------------------------------------------------
  // Sync state with URL params — fires when the header (or anything else)
  // navigates to /search?q=… while this page is already mounted.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    const t = (searchParams.get("type") as SearchType) ?? "games";
    setQuery(q);
    setInputValue(q);
    setSearchType(t);
    setSkip(0);
    setSearched(!!q);
  }, [searchParams]);

  // ---------------------------------------------------------------------------
  // Initial / query-change / sort-change / page-jump fetch (replaces results)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!query.trim()) {
      setGameResults([]); setGenreResults([]); setUserResults([]);
      setTotal(0); setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    const run = async () => {
      try {
        if (searchType === "games") {
          const res = await getGames({ q: query, sort, limit: PAGE_SIZE, skip });
          setGameResults(res.results ?? []);
          setTotal(res.total ?? 0);
          setGenreResults([]); setUserResults([]);
        } else if (searchType === "genres") {
          const all     = await getGenres();
          const q       = query.toLowerCase();
          const matched = all.filter(g => g.name.toLowerCase().includes(q));
          setGenreResults(matched);
          setTotal(matched.length);
          setGameResults([]); setUserResults([]);
        } else {
          try {
            const users = await searchUsers(query.trim().replace(/^@/, ""), 20);
            setUserResults(users);
            setTotal(users.length);
          } catch {
            setUserResults([]); setTotal(0);
          }
          setGameResults([]); setGenreResults([]);
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [query, searchType, sort, skip]);

  // ---------------------------------------------------------------------------
  // Infinite scroll — appends game results
  // ---------------------------------------------------------------------------
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || searchType !== "games") return;
    setLoadingMore(true);
    try {
      const nextSkip = gameResults.length;
      const res = await getGames({ q: query, sort, limit: PAGE_SIZE, skip: nextSkip });
      setGameResults(prev => [...prev, ...(res.results ?? [])]);
      setTotal(res.total ?? 0);
      setSkip(nextSkip);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, searchType, gameResults.length, query, sort]);

  

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setSkip(0);
    setSearchParams({ q: trimmed, type: searchType });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTypeChange = (type: SearchType) => {
    setSearchType(type);
    setSkip(0);
    setSort("reviewTotal");
    setGameResults([]); setGenreResults([]); setUserResults([]);
    if (query) setSearchParams({ q: query, type });
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setSkip(0);
    setGameResults([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageChange = (page: number) => {
    setSkip(page * PAGE_SIZE);
    setGameResults([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearSearch = () => {
    setInputValue(""); setQuery("");
    setGameResults([]); setGenreResults([]); setUserResults([]);
    setTotal(0); setSearched(false); setSkip(0);
    setSearchParams({});
    inputRef.current?.focus();
  };

  const hasResults = gameResults.length > 0 || genreResults.length > 0 || userResults.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Search games, genres, users…"
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors text-lg"
            />
            {inputValue && (
              <button type="button" onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <button type="submit"
            className="px-6 py-4 bg-white text-zinc-900 font-semibold rounded-2xl hover:shadow-lg hover:shadow-white/10 transition-all whitespace-nowrap">
            Search
          </button>
        </div>
      </form>

      {/* Type tabs + sort */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex gap-2">
          {SEARCH_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => handleTypeChange(t.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                searchType === t.value
                  ? "bg-white text-zinc-900"
                  : "bg-white/5 text-white/60 border border-white/10 hover:border-white/25 hover:text-white/80"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {searchType === "games" && query && (
          <select
            value={sort}
            onChange={e => handleSortChange(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-white/30"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Result count */}
      {searched && !loading && (
        <p className="text-white/40 text-sm mb-6">
          {hasResults
            ? `${total.toLocaleString()} result${total !== 1 ? "s" : ""} for "${query}"`
            : `No results for "${query}"`
          }
        </p>
      )}

      {/* Initial load spinner */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Search className="w-16 h-16 text-white/10 mb-4" />
          <p className="text-white/30 text-lg">Start typing to search</p>
          <p className="text-white/20 text-sm mt-1">Search for games, genres, or users</p>
        </div>
      )}

      {/* No results */}
      {!loading && searched && !hasResults && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-white/40 text-lg mb-2">Nothing found for "{query}"</p>
          <p className="text-white/25 text-sm">Try a different spelling or search type</p>
        </div>
      )}

      {/* Game results */}
      {!loading && gameResults.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
            {gameResults.map(game => (
              <GameCard
                key={game.id}
                id={game.id}
                title={game.name}
                coverArt={game.coverUrl ?? "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=600&fit=crop"}
                platforms={game.platforms ?? []}
                developer={game.developers?.[0] ?? game.genres?.[0] ?? ""}
                year={game.releaseDate ? new Date(game.releaseDate).getFullYear() : 0}
                genres={game.genres ?? []}
                scores={{ gameplay: game.gameplayAvg, content: game.contentAvg, narrative: game.narrativeAvg, aesthetics: game.aestheticsAvg, polish: game.polishAvg }}
                igdbRating={game.igdbRating ?? 0}
              />
            ))}
          </div>


          {loadingMore && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
            </div>
          )}

          {!hasMore && gameResults.length > PAGE_SIZE && (
            <p className="text-center text-white/25 text-sm py-6">
              All {total.toLocaleString()} results loaded
            </p>
          )}

          {/* Page jumper */}
          {totalPages > 2 && (
            <PageJumper
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Genre results */}
      {!loading && genreResults.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {genreResults.map(genre => (
            <Link
              key={genre.id}
              to={`/genre/${genre.name.toLowerCase()}`}
              className="group relative overflow-hidden rounded-xl aspect-square flex items-end p-4 border border-white/10 hover:border-white/30 hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white/10 to-white/5"
            >
              <span className="text-white font-bold text-base relative z-10 drop-shadow">{genre.name}</span>
            </Link>
          ))}
        </div>
      )}

      {/* User results */}
      {!loading && userResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {userResults.map(u => (
            <Link
              key={u.id ?? u.username}
              to={`/profile/${u.username}`}
              className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-white/25 hover:bg-white/8 transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0 border-2 border-white/15">
                {u.preferences?.profilePicture
                  ? <img src={u.preferences.profilePicture} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <User className="w-7 h-7 text-white/50" />
                    </div>
                }
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold truncate">
                  {(u.preferences?.displayName as string) ?? u.username}
                </p>
                <p className="text-white/50 text-sm">@{u.username}</p>
                <div className="flex gap-3 mt-1 text-xs text-white/40">
                  <span>{(u.followers?.length ?? 0).toLocaleString()} followers</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}