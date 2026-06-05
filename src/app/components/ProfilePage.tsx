import { useParams, Link } from "react-router";
import { User, Calendar, Loader2, X, ArrowDown, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ImageWithFallback } from "./ImageWithFallback";
import { ReviewCard } from "./ReviewCard";
import { GameCard } from "./GameCard";
import { useAuth } from "../context/AuthContext";
import { getUserByUsername, followUser, getFollowers, getFollowing, BackendUser } from "../../api/users";
import { getUserReviews, ReviewSort, SortDir, REVIEW_SORT_OPTIONS } from "../../api/reviews";
import { getGame, Game } from "../../api/games";

const FAVORITE_SORT_OPTIONS = [
  { value: "lastFavorited", label: "Last Favorited" },
  { value: "firstFavorited", label: "First Favorited" },
  { value: "titleAZ", label: "Title (A-Z)" },
  { value: "highestRated", label: "Highest Rated" },
];

function gameToCardProps(g: Game & { [k: string]: any }) {
  const platforms = g.platforms ?? [];
  const genres    = g.genres    ?? [];
  const devs      = g.developers ?? [];
  return {
    id:        g.id,
    title:     g.name,
    coverArt:  g.coverUrl ?? "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=600&fit=crop",
    platforms,
    developer: devs[0] ?? "",
    year:      g.releaseDate ? new Date(g.releaseDate).getFullYear() : 0,
    genres,
    scores: {
      gameplay:   g.gameplayAvg   ?? 0,
      content:    g.contentAvg    ?? 0,
      narrative:  g.narrativeAvg  ?? 0,
      aesthetics: g.aestheticsAvg ?? 0,
      polish:     g.polishAvg     ?? 0,
    },
    igdbRating: g.igdbRating ?? 0,
    reviewTotal: g.reviewTotal ?? 0,
  };
}

export function ProfilePage() {
  const { username }              = useParams<{ username: string }>();
  const { user: me, refreshUser } = useAuth();
  const [profile,         setProfile]         = useState<BackendUser | null>(null);
  const [reviews,         setReviews]         = useState<any[]>([]);
  const [favoriteGames,   setFavoriteGames]   = useState<Game[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [activeTab,       setActiveTab]       = useState<"reviews" | "favorites">("reviews");
  const [sortBy,          setSortBy]          = useState<ReviewSort>("recent");
  const [sortDir,         setSortDir]         = useState<SortDir>("desc");
  const [favoriteSortBy,  setFavoriteSortBy]  = useState("lastFavorited");
  const [following,       setFollowing]       = useState(false);
  const [followerCount,   setFollowerCount]   = useState(0);

  // Follow list modal
  const [followModalTab,    setFollowModalTab]    = useState<"followers" | "following" | null>(null);
  const [followersList,     setFollowersList]     = useState<BackendUser[]>([]);
  const [followingList,     setFollowingList]     = useState<BackendUser[]>([]);
  const [loadingFollowList, setLoadingFollowList] = useState(false);

  const isOwnProfile = !!me && username === me.username;

  useEffect(() => {
    if (!username) return;
    setLoading(true);

    getUserByUsername(username)
      .then(async p => {
        setProfile(p);
        setFollowerCount(p.followers?.length ?? 0);
        setFollowing(me ? (p.followers ?? []).includes(me.id) : false);

        try {
          const res = await getUserReviews(p.id);
          // Handle different possible response formats
          let reviewsList = Array.isArray(res) ? res : (res?.results ?? res ?? []);
          if (!Array.isArray(reviewsList)) reviewsList = [];

          // Enrich reviews with game data if missing
          const enrichedReviews = await Promise.all(
            reviewsList.map(async (review: any) => {
              if (!review.gameName && review.gameId) {
                try {
                  const game = await getGame(review.gameId);
                  return { ...review, gameName: game.name, gameCoverUrl: game.coverUrl };
                } catch {
                  return review;
                }
              }
              return review;
            })
          );
          setReviews(enrichedReviews);
        } catch {
          setReviews([]);
        }

        try {
          const favoriteGameIds = p.favoriteGames ?? [];
          const favoriteGamesData = await Promise.all(
            favoriteGameIds.map(id => getGame(id))
          );
          setFavoriteGames(favoriteGamesData);
        } catch {
          setFavoriteGames([]);
        }
      })
      .catch(() => {
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, [username, me?.id]);

  const handleFollow = async () => {
    if (!username) return;
    const res = await followUser(username);
    setFollowing(res.following);
    setFollowerCount(res.follower_count);
    await refreshUser();
    // Invalidate cached lists — they'll re-fetch next time the modal opens
    setFollowersList([]);
    setFollowingList([]);
  };

  // Reset cached follow lists when the visited profile changes
  useEffect(() => {
    setFollowersList([]);
    setFollowingList([]);
    setFollowModalTab(null);
  }, [username]);

  // Lazy-load follow lists when the modal opens or the tab switches
  useEffect(() => {
    if (!followModalTab || !username) return;
    const tab = followModalTab;
    const alreadyLoaded = tab === "followers"
      ? followersList.length > 0
      : followingList.length > 0;
    if (alreadyLoaded) return;
    setLoadingFollowList(true);
    const fetcher = tab === "followers"
      ? getFollowers(username)
      : getFollowing(username);
    fetcher
      .then(list => {
        if (tab === "followers") setFollowersList(list);
        else                     setFollowingList(list);
      })
      .catch(() => {})
      .finally(() => setLoadingFollowList(false));
  }, [followModalTab, username]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
    </div>
  );
  if (!profile) return (
    <div className="text-center text-white/50 py-20">User not found.</div>
  );

  const displayName = (profile.preferences?.displayName as string) ?? profile.username;
  const avatarSrc   = profile.preferences?.profilePicture as string | undefined;
  const bannerSrc   = (profile.preferences?.bannerImage as string | undefined)
    ?? "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400&h=400&fit=crop";
  const joinDate    = new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Banner */}
      <div className="relative mb-8">
        <div className="h-32 sm:h-48 rounded-xl overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900">
          <ImageWithFallback src={bannerSrc} alt="Profile banner" className="w-full h-full object-cover" />
        </div>
        <div className="absolute -bottom-10 sm:-bottom-16 left-4 sm:left-8">
          <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-zinc-700 border-4 border-[#0a0a0a] flex items-center justify-center overflow-hidden">
            {avatarSrc
              ? <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
              : <User className="w-10 h-10 sm:w-16 sm:h-16 text-white" />
            }
          </div>
        </div>
      </div>

      {/* Info row */}
      <div className="mt-14 sm:mt-20 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">{displayName}</h1>
          <p className="text-base sm:text-xl text-white/50 mb-3 sm:mb-4">@{profile.username}</p>
          <div className="flex items-center gap-4 sm:gap-6 text-white/60 text-sm sm:text-base flex-wrap">
            <button
              type="button"
              onClick={() => setFollowModalTab("followers")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              <span className="font-bold text-white">{followerCount.toLocaleString()}</span> Followers
            </button>
            <button
              type="button"
              onClick={() => setFollowModalTab("following")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              <span className="font-bold text-white">{(profile.following?.length ?? 0).toLocaleString()}</span> Following
            </button>
            <div><span className="font-bold text-white">{reviews.length}</span> Reviews</div>
            <div className="flex items-center gap-1.5 text-sm text-white/40">
              <Calendar className="w-3.5 h-3.5" /> Joined {joinDate}
            </div>
          </div>
        </div>

        {!isOwnProfile && me && (
          <button onClick={handleFollow}
            className={`px-6 py-3 font-semibold rounded-lg transition-all ${
              following
                ? "bg-white/10 border border-white/20 text-white/70 hover:bg-white/15"
                : "bg-white text-zinc-900 hover:shadow-lg hover:shadow-white/10"
            }`}>
            {following ? "Unfollow" : "Follow"}
          </button>
        )}
        {isOwnProfile && (
          <Link to="/settings"
            className="px-6 py-3 bg-white/10 border border-white/20 text-white/70 font-semibold rounded-lg hover:bg-white/15 transition-all">
            Edit Profile
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-white/10">
        {(["reviews", "favorites"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-semibold capitalize transition-all ${
              activeTab === tab ? "text-white border-b-2 border-white" : "text-white/50 hover:text-white/80"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Reviews tab */}
      {activeTab === "reviews" && (
        reviews.length === 0
          ? <p className="text-white/40 text-center py-20">No reviews yet.</p>
          : <>
              <div className="mb-6 flex items-center justify-end gap-2">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as ReviewSort)}
                  className="profile-sort-select bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/40 text-sm cursor-pointer [&>option]:bg-zinc-900"
                >
                  {REVIEW_SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setSortDir(d => (d === "desc" ? "asc" : "desc"))}
                  className="flex items-center justify-center w-9 bg-white/10 border border-white/20 rounded-lg text-white/70 hover:border-white/40 hover:text-white transition-colors"
                  title={sortDir === "desc" ? "Highest / newest first" : "Lowest / oldest first"}
                  aria-label="Toggle sort direction"
                >
                  {sortDir === "desc" ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                </button>
              </div>
              <div className="space-y-4">
                {(() => {
                  const sortKey = (r: any): number => {
                    switch (sortBy) {
                      case "recent":  return new Date(r.createdAt ?? 0).getTime();
                      case "overall": return (r.gameplay + r.content + r.narrative + r.aesthetics + r.polish) / 5;
                      default:        return r[sortBy] ?? 0; // gameplay / content / narrative / aesthetics / polish
                    }
                  };
                  const dirMul = sortDir === "asc" ? -1 : 1;
                  const sorted = [...reviews].sort((a, b) => (sortKey(b) - sortKey(a)) * dirMul);
                  return sorted.map((review, i) => (
                    <ReviewCard
                      key={review.id ?? i}
                      id={review.id}
                      reviewer={{
                        username: profile.username,
                        displayName: displayName,
                        avatar:   avatarSrc,
                      }}
                      scores={{
                        gameplay:   review.gameplay   ?? 0,
                        content:    review.content    ?? 0,
                        narrative:  review.narrative  ?? 0,
                        aesthetics: review.aesthetics ?? 0,
                        polish:     review.polish     ?? 0,
                      }}
                      categoryText={{
                        gameplay:   review.gp_body,
                        content:    review.con_body,
                        narrative:  review.ntv_body,
                        aesthetics: review.aes_body,
                        polish:     review.pol_body,
                      }}
                      title={review.title}
                      review={review.body ?? ""}
                      likes={review.likes ?? 0}
                      dislikes={0}
                      comments={review.commentsCount ?? 0}
                      createdAt={review.createdAt}
                      isOwnReview={isOwnProfile}
                      showGame={true}
                      gameId={review.gameId}
                      gameName={review.gameName}
                      gameCoverUrl={review.gameCoverUrl}
                      containsSpoilers={review.containsSpoilers}
                    />
                  ));
                })()}
              </div>
            </>
      )}

      {/* Favorites tab */}
      {activeTab === "favorites" && (
        favoriteGames.length === 0 ? (
          <p className="text-white/40 text-center py-20">No favorite games yet.</p>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-end">
              <select
                value={favoriteSortBy}
                onChange={e => setFavoriteSortBy(e.target.value)}
                className="profile-sort-select bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/40 text-sm"
              >
                {FAVORITE_SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 lg:gap-6">
              {(() => {
                const sorted = [...favoriteGames].sort((a, b) => {
                  const getOverall = (g: Game) => {
                    const avg = (g.gameplayAvg + g.contentAvg + g.narrativeAvg + g.aestheticsAvg + g.polishAvg) / 5;
                    return avg > 0 ? avg : (g.igdbRating ?? 0);
                  };

                  switch (favoriteSortBy) {
                    case "firstFavorited":
                      return favoriteGames.indexOf(a) - favoriteGames.indexOf(b);
                    case "titleAZ":
                      return a.name.localeCompare(b.name);
                    case "highestRated":
                      return getOverall(b) - getOverall(a);
                    case "lastFavorited":
                    default:
                      return favoriteGames.indexOf(b) - favoriteGames.indexOf(a);
                  }
                });
                return sorted.map(g => <GameCard key={g.id} {...gameToCardProps(g)} />);
              })()}
            </div>
          </>
        )
      )}

      {/* Followers / Following modal */}
      {followModalTab && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setFollowModalTab(null)}
        >
          <div
            className="relative w-full max-w-md max-h-[80vh] mx-4 bg-zinc-900 border border-white/15 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Tabs */}
            <div className="flex border-b border-white/10 relative">
              <button
                onClick={() => setFollowModalTab("followers")}
                className={`flex-1 px-4 py-4 text-sm font-semibold transition-colors ${
                  followModalTab === "followers"
                    ? "text-white border-b-2 border-white"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {followerCount.toLocaleString()} Followers
              </button>
              <button
                onClick={() => setFollowModalTab("following")}
                className={`flex-1 px-4 py-4 text-sm font-semibold transition-colors ${
                  followModalTab === "following"
                    ? "text-white border-b-2 border-white"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {(profile.following?.length ?? 0).toLocaleString()} Following
              </button>
              <button
                onClick={() => setFollowModalTab(null)}
                aria-label="Close"
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 p-2">
              {(() => {
                const currentList = followModalTab === "followers" ? followersList : followingList;

                if (loadingFollowList) {
                  return (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                    </div>
                  );
                }
                if (currentList.length === 0) {
                  return (
                    <p className="text-white/40 text-center py-12 px-4 text-sm">
                      {followModalTab === "followers"
                        ? `${displayName} doesn't have any followers yet.`
                        : `${displayName} isn't following anyone yet.`}
                    </p>
                  );
                }
                return currentList.map(u => {
                  const dName  = (u.preferences?.displayName as string) || u.username;
                  const avatar = u.preferences?.profilePicture as string | undefined;
                  return (
                    <Link
                      key={u.id}
                      to={`/profile/${u.username}`}
                      onClick={() => setFollowModalTab(null)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0 border border-white/10">
                        {avatar
                          ? <img src={avatar} alt={dName} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{u.username[0]?.toUpperCase() ?? "?"}</div>
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-semibold truncate text-sm">{dName}</p>
                        <p className="text-white/40 text-xs truncate">@{u.username}</p>
                      </div>
                    </Link>
                  );
                });
              })()}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}