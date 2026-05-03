import { useParams, Link } from "react-router";
import { StarPolarDiagram } from "./StarPolarDiagram";
import { ReviewCard } from "./ReviewCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { ImageWithFallback } from "./ImageWithFallback";
import { Edit3 } from "lucide-react";

const gameData: any = {
  "1": {
    title: "Stellar Odyssey",
    coverArt: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=1200&fit=crop",
    platforms: ["PC", "PS5", "Xbox"],
    releaseDate: "March 15, 2026",
    scores: { gameplay: 9.2, content: 8.5, narrative: 9.0, aesthetics: 9.5, polish: 8.8 },
    reviewCount: 1247,
  },
  "3": {
    title: "Dragon's Legacy",
    coverArt: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=1200&fit=crop",
    platforms: ["PC", "PS5"],
    releaseDate: "January 8, 2026",
    scores: { gameplay: 9.5, content: 9.3, narrative: 9.8, aesthetics: 9.0, polish: 9.2 },
    reviewCount: 2891,
  },
};

const reviews = [
  {
    reviewer: { username: "gamerpro88", avatar: "" },
    scores: { gameplay: 9.5, content: 9.0, narrative: 9.5, aesthetics: 9.8, polish: 9.2 },
    review: "An absolute masterpiece! The narrative depth is incredible, and every choice feels meaningful. The art direction is stunning, and the gameplay loop keeps you engaged for hours. This is easily one of the best games of the year.",
    likes: 342,
    dislikes: 12,
    comments: 45,
    isPinned: true,
  },
  {
    reviewer: { username: "criticalplayer", avatar: "" },
    scores: { gameplay: 8.5, content: 8.0, narrative: 9.0, aesthetics: 9.5, polish: 8.0 },
    review: "Great game overall, though I did encounter some minor technical issues. The story is captivating and the world-building is top-notch. Combat feels responsive and rewarding. Could use some optimization patches but still highly recommend.",
    likes: 189,
    dislikes: 8,
    comments: 23,
    isPinned: false,
  },
  {
    reviewer: { username: "indiegamer", avatar: "" },
    scores: { gameplay: 9.0, content: 8.5, narrative: 8.5, aesthetics: 9.0, polish: 9.5 },
    review: "Polished to perfection! The attention to detail is remarkable. Every animation, sound effect, and visual element comes together beautifully. The gameplay might not revolutionize the genre, but it executes everything extremely well.",
    likes: 276,
    dislikes: 15,
    comments: 31,
    isPinned: false,
  },
  {
    reviewer: { username: "hotTake2026", avatar: "" },
    scores: { gameplay: 7.5, content: 7.0, narrative: 10.0, aesthetics: 8.5, polish: 7.5 },
    review: "Unpopular opinion: The narrative is PHENOMENAL but the gameplay is just okay. Don't get me wrong, it's competent, but you're really here for the story. If you're a narrative-focused player, this is a must-play. If you want innovative gameplay, look elsewhere.",
    likes: 412,
    dislikes: 198,
    comments: 87,
    isPinned: false,
  },
];

const distributionData = [
  { range: "0-2", gameplay: 15, content: 22, narrative: 8, aesthetics: 12, polish: 18 },
  { range: "2-4", gameplay: 34, content: 48, narrative: 21, aesthetics: 28, polish: 42 },
  { range: "4-6", gameplay: 89, content: 124, narrative: 67, aesthetics: 76, polish: 98 },
  { range: "6-8", gameplay: 312, content: 287, narrative: 245, aesthetics: 298, polish: 276 },
  { range: "8-10", gameplay: 797, content: 766, narrative: 906, aesthetics: 833, polish: 813 },
];

export function GamePage() {
  const { gameId } = useParams();
  const [sortBy, setSortBy] = useState<"top" | "hot">("top");

  const game = gameData[gameId as string] || gameData["1"];

  const totalScore = (
    game.scores.gameplay +
    game.scores.content +
    game.scores.narrative +
    game.scores.aesthetics +
    game.scores.polish
  ) / 5;

  const sortedReviews = sortBy === "hot"
    ? [...reviews].sort((a, b) => {
        const controversyA = Math.min(a.likes, a.dislikes) / Math.max(a.likes, a.dislikes, 1);
        const controversyB = Math.min(b.likes, b.dislikes) / Math.max(b.likes, b.dislikes, 1);
        return controversyB - controversyA;
      })
    : reviews;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="rounded-xl overflow-hidden border border-purple-500/20 shadow-2xl">
              <ImageWithFallback
                src={game.coverArt}
                alt={game.title}
                className="w-full aspect-[3/4] object-cover"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <h1 className="text-4xl sm:text-5xl font-bold text-white">{game.title}</h1>
              <Link
                to={`/game/${gameId}/review`}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-pink-500/30 transition-all whitespace-nowrap"
              >
                <Edit3 className="w-5 h-5" />
                <span>Write Review</span>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {game.platforms.map((platform: string) => (
                <span
                  key={platform}
                  className="px-3 py-1 bg-purple-900/50 text-purple-200 rounded-md border border-purple-500/30"
                >
                  {platform}
                </span>
              ))}
              <span className="text-purple-300">Released: {game.releaseDate}</span>
            </div>
          </div>

          <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <StarPolarDiagram scores={game.scores} size={280} showTotal={true} />
              </div>

              <div className="flex-1 space-y-4">
                <div className="text-center lg:text-left">
                  <div className="text-6xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {totalScore.toFixed(1)}
                  </div>
                  <div className="text-purple-300">Based on {game.reviewCount.toLocaleString()} reviews</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(game.scores).map(([key, value]) => (
                    <div key={key} className="bg-purple-900/30 rounded-lg p-3 border border-purple-500/20">
                      <div className="text-sm text-purple-300 capitalize mb-1">{key}</div>
                      <div className="text-2xl font-bold text-pink-400">{(value as number).toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Review Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#8b5cf6" opacity={0.1} />
                <XAxis dataKey="range" stroke="#c4b5fd" />
                <YAxis stroke="#c4b5fd" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e1b4b",
                    border: "1px solid #8b5cf6",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="gameplay" name="Gameplay" fill="#ec4899" isAnimationActive={false} />
                <Bar dataKey="content" name="Content" fill="#8b5cf6" isAnimationActive={false} />
                <Bar dataKey="narrative" name="Narrative" fill="#06b6d4" isAnimationActive={false} />
                <Bar dataKey="aesthetics" name="Aesthetics" fill="#fbbf24" isAnimationActive={false} />
                <Bar dataKey="polish" name="Polish" fill="#10b981" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Reviews
          </h2>

          <div className="flex gap-2">
            <button
              onClick={() => setSortBy("top")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                sortBy === "top"
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  : "bg-purple-950/50 text-purple-300 border border-purple-500/30 hover:border-pink-500/50"
              }`}
            >
              Top Rated
            </button>
            <button
              onClick={() => setSortBy("hot")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                sortBy === "hot"
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  : "bg-purple-950/50 text-purple-300 border border-purple-500/30 hover:border-pink-500/50"
              }`}
            >
              🔥 Hottest Take
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {sortedReviews.map((review, index) => (
            <ReviewCard key={`review-${review.reviewer.username}-${index}`} {...review} />
          ))}
        </div>
      </div>
    </div>
  );
}