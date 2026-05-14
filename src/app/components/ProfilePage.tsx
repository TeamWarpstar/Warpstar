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

  const isOwnProfile = !!user && username === user.username;

  const displayName  = isOwnProfile ? (user.displayName ?? user.googleName) : "Gaming Pro";
  const avatarSrc    = isOwnProfile ? user.profilePicture : undefined;
  const bannerSrc    = isOwnProfile
    ? (user.bannerImage ?? "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400&h=400&fit=crop")
    : "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400&h=400&fit=crop";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="relative mb-8">
        <div className="h-32 sm:h-48 rounded-xl overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900">
          <ImageWithFallback
            src={bannerSrc}
            alt="Profile banner"
            className="w-full h-full object-cover opacity-60"
          />
        </div>

        <div className="absolute -bottom-10 sm:-bottom-16 left-4 sm:left-8">
          <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-zinc-700 border-4 border-[#0a0a0a] flex items-center justify-center overflow-hidden">
            {avatarSrc ? (
              <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 sm:w-16 sm:h-16 text-white" />
            )}
          </div>
        </div>
      </div>

      <div className="mt-14 sm:mt-20 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">{displayName}</h1>
          <p className="text-base sm:text-xl text-white/50 mb-3 sm:mb-4">@{username}</p>
          <div className="flex items-center gap-4 sm:gap-6 text-white/60 text-sm sm:text-base">
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
          <button className="px-6 py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:shadow-lg hover:shadow-white/10 transition-all">
            Follow
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-8 border-b border-white/10">
        <button
          onClick={() => setActiveTab("reviews")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "reviews"
              ? "text-white border-b-2 border-white"
              : "text-white/50 hover:text-white/80"
          }`}
        >
          Reviews
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "activity"
              ? "text-white border-b-2 border-white"
              : "text-white/50 hover:text-white/80"
          }`}
        >
          Activity
        </button>
      </div>

      {activeTab === "reviews" && (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
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
                className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/25 hover:scale-105 transition-all"
              >
                <div className="relative aspect-[3/4]">
                  <ImageWithFallback
                    src={review.gameCover}
                    alt={review.gameTitle}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-white text-zinc-900 rounded-full font-bold">
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
                        <div className="text-xs text-white/40 capitalize truncate">{key.slice(0, 3)}</div>
                        <div className="text-sm font-bold text-white">{value}</div>
                      </div>
                    ))}
                  </div>

                  <p className="text-white/60 text-sm line-clamp-2">{review.review}</p>

                  <div className="flex items-center gap-2 text-xs text-white/40">
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
              className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 flex items-center gap-3 sm:gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                {activity.type === "review" && <MessageCircle className="w-6 h-6 text-white" />}
                {activity.type === "like" && <Heart className="w-6 h-6 text-white" />}
                {activity.type === "follow" && <User className="w-6 h-6 text-white" />}
              </div>

              <div className="flex-1">
                <p className="text-white/80">
                  <span className="font-semibold text-white">{activity.user}</span>
                  {" "}{activity.action}{" "}
                  <span className="font-semibold text-white">
                    {activity.game || activity.target}
                  </span>
                </p>
                <p className="text-sm text-white/40 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
