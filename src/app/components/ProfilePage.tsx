import { useParams, Link } from "react-router";
import { User, Calendar, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ImageWithFallback } from "./ImageWithFallback";
import { ReviewCard } from "./ReviewCard";
import { GameCard } from "./GameCard";
import { useAuth } from "../context/AuthContext";
import { getUserByUsername, followUser, BackendUser } from "../../api/users";
import { getUserReviews } from "../../api/reviews";
import { getGame, Game } from "../../api/games";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highestOverall", label: "Highest Overall" },
  { value: "lowestOverall", label: "Lowest Overall" },
  { value: "highestGameplay", label: "Highest Gameplay" },
  { value: "highestContent", label: "Highest Content" },
  { value: "highestNarrative", label: "Highest Narrative" },
  { value: "highestAesthetics", label: "Highest Aesthetics" },
  { value: "highestPolish", label: "Highest Polish" },
];

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
  };
}

export function ProfilePage() {
  const { username }              = useParams<{ username: string }>();
  const { user: me, refreshUser } = useAuth();
  const [profile,         setProfile]         = useState<BackendUser | null>(null);
  const [reviews,         setReviews]         = useState<any[]>([]);
  const [favoriteGames,   setFavoriteGames]   = useState<Game[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [activeTab,       setActiveTab]       = useState<"reviews" | "favorites">("reviews");
  const [sortBy,          setSortBy]          = useState("newest");
  const [favoriteSortBy,  setFavoriteSortBy]  = useState("lastFavorited");
  const [following,       setFollowing]       = useState(false);
  const [followerCount,   setFollowerCount]   = useState(0);

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
          console.log("Reviews API Response:", res);
          
          // Handle different possible response formats
          let reviewsList = Array.isArray(res) ? res : (res?.results ?? res ?? []);
          console.log("Reviews to display (raw):", reviewsList);
          
          // Ensure we have an array
          if (!Array.isArray(reviewsList)) {
            reviewsList = [];
          }
          
          // Enrich reviews with game data if missing
          const enrichedReviews = await Promise.all(
            reviewsList.map(async (review: any) => {
              if (!review.gameName && review.gameId) {
                try {
                  const game = await getGame(review.gameId);
                  return {
                    ...review,
                    gameName: game.name,
                    gameCoverUrl: game.coverUrl,
                  };
                } catch (err) {
                  console.warn(`Could not fetch game data for ${review.gameId}:`, err);
                  return review;
                }
              }
              return review;
            })
          );
          
          console.log("Enriched reviews:", enrichedReviews);
          setReviews(enrichedReviews);
        } catch (err) {
          console.error("Error fetching reviews:", err);
          setReviews([]);
        }

        // Fetch favorite games for the activity tab
        try {
          const favoriteGameIds = p.favoriteGames ?? [];
          const favoriteGamesData = await Promise.all(
            favoriteGameIds.map(id => getGame(id))
          );
          setFavoriteGames(favoriteGamesData);
        } catch (err) {
          console.error("Error fetching favorite games:", err);
          setFavoriteGames([]);
        }
      })
      .catch(err => {
        console.error("Error fetching user profile:", err);
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
  };

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
          <ImageWithFallback src={bannerSrc} alt="Profile banner" className="w-full h-full object-cover opacity-60" />
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
            <div><span className="font-bold text-white">{followerCount.toLocaleString()}</span> Followers</div>
            <div><span className="font-bold text-white">{(profile.following?.length ?? 0).toLocaleString()}</span> Following</div>
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
              <div className="mb-6 flex items-center justify-end">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="profile-sort-select bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white/40 text-sm"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-4">
                {(() => {
                  const sorted = [...reviews].sort((a, b) => {
                    const getOverall = (r: any) => (r.gameplay + r.content + r.narrative + r.aesthetics + r.polish) / 5;
                    
                    switch (sortBy) {
                      case "newest":
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      case "oldest":
                        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                      case "highestOverall":
                        return getOverall(b) - getOverall(a);
                      case "lowestOverall":
                        return getOverall(a) - getOverall(b);
                      case "highestGameplay":
                        return (b.gameplay ?? 0) - (a.gameplay ?? 0);
                      case "highestContent":
                        return (b.content ?? 0) - (a.content ?? 0);
                      case "highestNarrative":
                        return (b.narrative ?? 0) - (a.narrative ?? 0);
                      case "highestAesthetics":
                        return (b.aesthetics ?? 0) - (a.aesthetics ?? 0);
                      case "highestPolish":
                        return (b.polish ?? 0) - (a.polish ?? 0);
                      default:
                        return 0;
                    }
                  });
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
    </div>
  );
}