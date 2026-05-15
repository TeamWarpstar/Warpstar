import { useParams, Link } from "react-router";
import { User, Calendar, Heart, MessageCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ImageWithFallback } from "./ImageWithFallback";
import { useAuth } from "../context/AuthContext";
import { getUserByUsername, followUser, BackendUser } from "../../api/users";

export function ProfilePage() {
  const { username }              = useParams<{ username: string }>();
  const { user: me, refreshUser } = useAuth();
  const [profile,      setProfile]      = useState<BackendUser | null>(null);
  const [reviews,      setReviews]      = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState<"reviews" | "activity">("reviews");
  const [following,    setFollowing]    = useState(false);
  const [followerCount,setFollowerCount]= useState(0);

  const isOwnProfile = !!me && username === me.username;

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    getUserByUsername(username)
      .then(p => {
        setProfile(p);
        setFollowerCount(p.followers?.length ?? 0);
        setFollowing(me ? (p.followers ?? []).includes(me.id) : false);
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

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-white/40 animate-spin"/></div>;
  if (!profile) return <div className="text-center text-white/50 py-20">User not found.</div>;

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
            className={`px-6 py-3 font-semibold rounded-lg transition-all ${following ? "bg-white/10 border border-white/20 text-white/70 hover:bg-white/15" : "bg-white text-zinc-900 hover:shadow-lg hover:shadow-white/10"}`}>
            {following ? "Unfollow" : "Follow"}
          </button>
        )}
        {isOwnProfile && (
          <Link to="/settings" className="px-6 py-3 bg-white/10 border border-white/20 text-white/70 font-semibold rounded-lg hover:bg-white/15 transition-all">
            Edit Profile
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-white/10">
        {(["reviews","activity"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-semibold capitalize transition-all ${activeTab===tab ? "text-white border-b-2 border-white" : "text-white/50 hover:text-white/80"}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "reviews" && (
        reviews.length === 0
          ? <p className="text-white/40 text-center py-20">No reviews yet.</p>
          : <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {reviews.map((review, i) => {
                const totalScore = (review.gameplay+review.content+review.narrative+review.aesthetics+review.polish)/5;
                return (
                  <Link key={review.id ?? i} to={`/game/${review.gameId}`}
                    className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/25 hover:scale-105 transition-all">
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white truncate">{review.title}</h3>
                        <span className="px-2 py-0.5 bg-white text-zinc-900 rounded-full font-bold text-sm flex-shrink-0 ml-2">{totalScore.toFixed(1)}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 text-center">
                        {["gameplay","content","narrative","aesthetics","polish"].map(key => (
                          <div key={key}>
                            <div className="text-xs text-white/40 capitalize truncate">{key.slice(0,3)}</div>
                            <div className="text-sm font-bold text-white">{review[key]}</div>
                          </div>
                        ))}
                      </div>
                      {review.body && <p className="text-white/60 text-sm line-clamp-2">{review.body}</p>}
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
      )}

      {activeTab === "activity" && (
        <p className="text-white/40 text-center py-20">Activity feed coming soon.</p>
      )}
    </div>
  );
}