import { Link, useNavigate } from "react-router";
import { Search, Bell, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };

  const profileUrl = user?.username ? `/profile/${user.username}` : "/profile/me";

  return (
    <header className="warpstar-header sticky top-0 z-50 bg-[#0a0118]/80 backdrop-blur-xl border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-2xl">⭐</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Warpstar
          </span>
        </Link>

        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300/50" />
            <input
              type="text"
              placeholder="Search games, users, genres..."
              className="w-full bg-purple-950/30 border border-purple-500/30 rounded-full pl-12 pr-4 py-3 text-white placeholder:text-purple-300/50 focus:outline-none focus:border-pink-500/50 transition-colors"
            />
          </div>
        </div>

        <nav className="flex items-center gap-6">
          <Link to="/" className="text-purple-200 hover:text-pink-400 transition-colors">
            Home
          </Link>
          <Link to="/genre/action" className="text-purple-200 hover:text-pink-400 transition-colors">
            Discover
          </Link>
          <Link to={profileUrl} className="text-purple-200 hover:text-pink-400 transition-colors">
            Profile
          </Link>
          <Link to="/settings" className="text-purple-200 hover:text-pink-400 transition-colors">
            <Settings className="w-5 h-5" />
          </Link>

          <button className="relative text-purple-200 hover:text-pink-400 transition-colors" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full" aria-label="Unread notifications" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500/40 hover:border-pink-500/60 hover:scale-110 transition-all"
              aria-label="User menu"
            >
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.displayName ?? "User"} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {user?.displayName?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#12082a] border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/60 z-50">
                {/* User info */}
                <div className="px-4 py-3 border-b border-purple-500/20">
                  <p className="text-white font-semibold text-sm truncate">{user?.displayName}</p>
                  <p className="text-purple-400 text-xs truncate">@{user?.username}</p>
                </div>

                <Link
                  to={profileUrl}
                  className="block px-4 py-3 text-purple-200 hover:bg-purple-900/40 hover:text-white transition-colors text-sm"
                  onClick={() => setShowUserMenu(false)}
                >
                  View Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-3 text-purple-200 hover:bg-purple-900/40 hover:text-white transition-colors text-sm"
                  onClick={() => setShowUserMenu(false)}
                >
                  Settings
                </Link>

                {user?.topGenres && user.topGenres.length > 0 && (
                  <div className="px-4 py-3 border-t border-purple-500/20">
                    <p className="text-purple-500 text-xs mb-2">Top Genres</p>
                    <div className="flex flex-wrap gap-1">
                      {user.topGenres.map(g => (
                        <span key={g} className="px-2 py-0.5 bg-purple-900/60 text-purple-200 text-xs rounded-full border border-purple-500/30">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-purple-500/20">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 text-pink-400 hover:bg-purple-900/40 transition-colors text-sm"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}