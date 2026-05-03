import { useParams, Link } from "react-router";
import { User, Calendar, Heart, MessageCircle } from "lucide-react";
import { useState } from "react";
import { ImageWithFallback } from "./ImageWithFallback";
import { useAuth } from "../context/AuthContext";

const userReviews = [
  {
    gameId: "1",
    gameTitle: "Stellar Odyssey",
    gameCover: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=200&h=300&fit=crop",
    scores: { gameplay: 9.5, content: 9.0, narrative: 9.5, aesthetics: 9.8, polish: 9.2 },
    review: "An absolute masterpiece! The narrative depth is incredible.",
    date: "April 28, 2026",
  },
  {
    gameId: "3",
    gameTitle: "Dragon's Legacy",
    gameCover: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=300&fit=crop",
    scores: { gameplay: 9.8, content: 9.5, narrative: 10.0, aesthetics: 9.2, polish: 9.6 },
    review: "Best RPG I've played in years. The story had me in tears.",
    date: "April 15, 2026",
  },
  {
    gameId: "2",
    gameTitle: "Neon Breach",
    gameCover: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200&h=300&fit=crop",
    scores: { gameplay: 8.5, content: 8.0, narrative: 7.5, aesthetics: 9.5, polish: 8.8 },
    review: "Gorgeous visuals and tight gameplay. A bit short on content though.",
    date: "March 22, 2026",
  },
];

const activityFeed = [
  { type: "review", user: "gamerpro88", action: "reviewed", game: "Stellar Odyssey", time: "2 hours ago" },
  { type: "like", user: "gamerpro88", action: "liked", game: "Shadow Tactics", time: "5 hours ago" },
  { type: "follow", user: "indiegamer", action: "started following", target: "criticalplayer", time: "1 day ago" },
  { type: "review", user: "hotTake2026", action: "reviewed", game: "Cyber Revolution", time: "2 days ago" },
];

export function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"reviews" | "activity">("reviews");

  // Treat the page as "own profile" when the URL username matches the logged-in user
  const isOwnProfile = !!user && username === user.username;

  // Pick display values: own profile uses live auth data, others use mock data
  const displayName  = isOwnProfile ? (user.displayName ?? user.googleName) : "Gaming Pro";
  const avatarSrc    = isOwnProfile ? user.profilePicture : undefined;
  const bannerSrc    = isOwnProfile
    ? (user.bannerImage ?? "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400&h=400&fit=crop")
    : "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400&h=400&fit=crop";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="relative mb-8">
        <div className="h-48 rounded-xl overflow-hidden bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900">
          <ImageWithFallback
            src={bannerSrc}
            alt="Profile banner"
            className="w-full h-full object-cover opacity-60"
          />
        </div>

        <div className="absolute -bottom-16 left-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 border-4 border-[#0a0118] flex items-center justify-center overflow-hidden">
            {avatarSrc ? (
              <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-16 h-16 text-white" />
            )}
          </div>
        </div>
      </div>

      <div className="mt-20 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">{displayName}</h1>
          <p className="text-xl text-purple-300 mb-4">@{username}</p>
          <div className="flex items-center gap-6 text-purple-200">
            <div>
              <span className="font-bold text-white">1.2K</span> Followers
            </div>
            <div>
              <span className="font-bold text-white">342</span> Following
            </div>
            <div>
              <span className="font-bold text-white">{userReviews.length}</span> Reviews
            </div>
          </div>
        </div>

        {!isOwnProfile && (
          <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-pink-500/30 transition-all">
            Follow
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-8 border-b border-purple-500/20">
        <button
          onClick={() => setActiveTab("reviews")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "reviews"
              ? "text-pink-400 border-b-2 border-pink-400"
              : "text-purple-300 hover:text-pink-300"
          }`}
        >
          Reviews
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "activity"
              ? "text-pink-400 border-b-2 border-pink-400"
              : "text-purple-300 hover:text-pink-300"
          }`}
        >
          Activity
        </button>
      </div>

      {activeTab === "reviews" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userReviews.map((review) => {
            const totalScore = (
              review.scores.gameplay +
              review.scores.content +
              review.scores.narrative +
              review.scores.aesthetics +
              review.scores.polish
            ) / 5;

            return (
              <Link
                key={review.gameId}
                to={`/game/${review.gameId}`}
                className="group bg-purple-950/30 border border-purple-500/20 rounded-xl overflow-hidden hover:border-pink-500/50 hover:scale-105 transition-all"
              >
                <div className="relative aspect-[3/4]">
                  <ImageWithFallback
                    src={review.gameCover}
                    alt={review.gameTitle}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full text-white font-bold">
                    {totalScore.toFixed(1)}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-bold mb-2">{review.gameTitle}</h3>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {Object.entries(review.scores).map(([key, value]) => (
                      <div key={key}>
                        <div className="text-xs text-purple-300 capitalize truncate">{key.slice(0, 3)}</div>
                        <div className="text-sm font-bold text-pink-400">{value}</div>
                      </div>
                    ))}
                  </div>

                  <p className="text-purple-200 text-sm line-clamp-2">{review.review}</p>

                  <div className="flex items-center gap-2 text-xs text-purple-400">
                    <Calendar className="w-3 h-3" />
                    <span>{review.date}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {activeTab === "activity" && (
        <div className="space-y-4">
          {activityFeed.map((activity, index) => (
            <div
              key={`activity-${index}-${activity.time}`}
              className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-6 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                {activity.type === "review" && <MessageCircle className="w-6 h-6 text-white" />}
                {activity.type === "like" && <Heart className="w-6 h-6 text-white" />}
                {activity.type === "follow" && <User className="w-6 h-6 text-white" />}
              </div>

              <div className="flex-1">
                <p className="text-purple-100">
                  <span className="font-semibold text-white">{activity.user}</span>
                  {" "}{activity.action}{" "}
                  <span className="font-semibold text-pink-400">
                    {activity.game || activity.target}
                  </span>
                </p>
                <p className="text-sm text-purple-400 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}