import { useParams, Link } from "react-router";
import { User, Calendar, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ImageWithFallback } from "./ImageWithFallback";
import { useAuth } from "../context/AuthContext";
import { getUserByUsername, followUser, BackendUser } from "../../api/users";
import { getGameReviews } from "../../api/games";

export function ProfilePage() {
  const { username }        = useParams<{ username: string }>();
  const { user: me, refreshUser } = useAuth();
  const [profile, setProfile]     = useState<BackendUser | null>(null);
  const [reviews, setReviews]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<"reviews"|"activity">("reviews");
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  const isOwnProfile = me?.username === username;

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    getUserByUsername(username)
      .then(async p => {
        setProfile(p);
        setFollowerCount(p.followers?.length ?? 0);
        setFollowing(me ? p.followers?.includes(me.id) : false);
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

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-pink-400 animate-spin"/></div>;
  if (!profile) return <div className="text-center text-purple-300 py-20">User not found.</div>;

  const displayName = (profile.preferences?.displayName as string) ?? profile.username;
  const avatar      = profile.preferences?.profilePicture as string | undefined;
  const joinDate    = new Date(profile.createdAt).toLocaleDateString("en-US", { month:"long", year:"numeric" });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Banner */}
      <div className="h-40 rounded-2xl bg-gradient-to-r from-pink-900/40 via-purple-900/40 to-blue-900/40 border border-purple-500/20 mb-0 overflow-hidden">
        {profile.preferences?.bannerImage && (
          <img src={profile.preferences.bannerImage as string} alt="" className="w-full h-full object-cover"/>
        )}
      </div>

      {/* Avatar + info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 px-4 -mt-12 mb-6">
        <div className="w-24 h-24 rounded-2xl border-4 border-[#0a0118] overflow-hidden bg-purple-900/50 flex-shrink-0">
          {avatar
            ? <img src={avatar} alt={displayName} className="w-full h-full object-cover"/>
            : <User className="w-full h-full p-4 text-purple-400"/>
          }
        </div>
        <div className="flex-1 pb-1">
          <h1 className="text-2xl font-bold text-white">{displayName}</h1>
          <p className="text-purple-400">@{profile.username}</p>
        </div>
        {!isOwnProfile && me && (
          <button onClick={handleFollow}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${following ? "bg-purple-900/50 border border-purple-500/30 text-purple-300 hover:border-pink-500/50" : "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/30"}`}>
            {following ? "Unfollow" : "Follow"}
          </button>
        )}
        {isOwnProfile && (
          <Link to="/settings" className="px-6 py-2 rounded-xl font-semibold bg-purple-900/50 border border-purple-500/30 text-purple-300 hover:border-pink-500/50 transition-all">Edit Profile</Link>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-6 px-4 mb-8">
        {[
          { label:"Reviews",   value: reviews.length },
          { label:"Followers", value: followerCount },
          { label:"Following", value: profile.following?.length ?? 0 },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-sm text-purple-400">{s.label}</div>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-sm text-purple-400 ml-auto">
          <Calendar className="w-4 h-4"/><span>Joined {joinDate}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-purple-500/20 mb-6">
        {(["reviews","activity"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${activeTab===t ? "border-pink-500 text-pink-400" : "border-transparent text-purple-400 hover:text-white"}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === "reviews" && (
        reviews.length === 0
          ? <p className="text-purple-400 text-center py-12">No reviews yet.</p>
          : <div className="space-y-4">
              {reviews.map((r, i) => (
                <Link key={r.id ?? i} to={`/game/${r.gameId}`}
                  className="block bg-purple-950/30 border border-purple-500/20 rounded-xl p-5 hover:border-pink-500/40 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">{r.title}</h3>
                    <span className="text-2xl font-bold text-pink-400">{r.overallScore?.toFixed(1)}</span>
                  </div>
                  {r.body && <p className="text-purple-300/70 text-sm line-clamp-2">{r.body}</p>}
                  <p className="text-xs text-purple-500 mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
                </Link>
              ))}
            </div>
      )}

      {activeTab === "activity" && (
        <p className="text-purple-400 text-center py-12">Activity feed coming soon.</p>
      )}
    </div>
  );
}