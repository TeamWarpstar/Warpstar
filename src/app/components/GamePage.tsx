import { useParams, Link } from "react-router";
import { scoreStyle } from "./scoreStyle";
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
    categoryText: {
      gameplay:   "Combat is tight and endlessly satisfying — every build feels distinct.",
      content:    "Dozens of hours of meaningful side content, nothing feels like filler.",
      narrative:  "Every choice carries weight. I replayed twice just to see different outcomes.",
      aesthetics: "Jaw-dropping art direction. Some scenes genuinely look like paintings.",
      polish:     "Hit one bug in 80 hours. Rock solid across the board.",
    },
    review: "An absolute masterpiece! The narrative depth is incredible, and every choice feels meaningful. The art direction is stunning, and the gameplay loop keeps you engaged for hours. This is easily one of the best games of the year.",
    likes: 342,
    dislikes: 12,
    comments: 45,
    isPinned: true,
  },
  {
    reviewer: { username: "criticalplayer", avatar: "" },
    scores: { gameplay: 8.5, content: 8.0, narrative: 9.0, aesthetics: 9.5, polish: 8.0 },
    categoryText: {
      gameplay:   "Responsive and fun, though some abilities feel underpowered late-game.",
      content:    "Solid amount of content, a few side quests feel padded.",
      narrative:  "Captivating world-building with genuinely surprising twists.",
      aesthetics: "Stunning visuals and an incredible soundtrack.",
      polish:     "A handful of crashes early on — hopefully patched soon.",
    },
    review: "Great game overall, though I did encounter some minor technical issues. The story is captivating and the world-building is top-notch. Combat feels responsive and rewarding. Could use some optimization patches but still highly recommend.",
    likes: 189,
    dislikes: 8,
    comments: 23,
    isPinned: false,
  },
  {
    reviewer: { username: "indiegamer", avatar: "" },
    scores: { gameplay: 9.0, content: 8.5, narrative: 8.5, aesthetics: 9.0, polish: 9.5 },
    categoryText: {
      gameplay:   "Doesn't reinvent the wheel but everything clicks together perfectly.",
      content:    "Good volume of content — I'd love more post-game though.",
      narrative:  "Enjoyable story, though the ending felt slightly rushed.",
      aesthetics: "Cohesive and beautiful — love the environmental storytelling.",
      polish:     "Zero crashes, fast loads, and buttery smooth frame rate.",
    },
    review: "Polished to perfection! The attention to detail is remarkable. Every animation, sound effect, and visual element comes together beautifully. The gameplay might not revolutionize the genre, but it executes everything extremely well.",
    likes: 276,
    dislikes: 15,
    comments: 31,
    isPinned: false,
  },
  {
    reviewer: { username: "hotTake2026", avatar: "" },
    scores: { gameplay: 7.5, content: 7.0, narrative: 10.0, aesthetics: 8.5, polish: 7.5 },
    categoryText: {
      gameplay:   "Competent but safe — nothing you haven't done before.",
      content:    "Side content exists but the main story is the real draw.",
      narrative:  "Genuinely one of the best stories in gaming. Full stop.",
      aesthetics: "Great art direction that services the narrative perfectly.",
      polish:     "A few too many rough edges for a game at this price point.",
    },
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

function DistributionChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={distributionData} key="distribution-bar-chart">
        <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#a1a1aa" opacity={0.3} />
        <XAxis key="x" dataKey="range" stroke="#71717a" />
        <YAxis key="y" stroke="#71717a" />
        <Tooltip
          key="tooltip"
          contentStyle={{
            backgroundColor: "#111111",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "8px",
            color: "#ffffff",
          }}
        />
        <Bar key="gameplay"   dataKey="gameplay"   name="Gameplay"   fill="#818cf8" isAnimationActive={false} />
        <Bar key="content"    dataKey="content"    name="Content"    fill="#a78bfa" isAnimationActive={false} />
        <Bar key="narrative"  dataKey="narrative"  name="Narrative"  fill="#f472b6" isAnimationActive={false} />
        <Bar key="aesthetics" dataKey="aesthetics" name="Aesthetics" fill="#fb923c" isAnimationActive={false} />
        <Bar key="polish"     dataKey="polish"     name="Polish"     fill="#34d399" isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

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
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-12">
        {/* Cover art — hidden on mobile, shown md+ as sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-20">
            <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
              <ImageWithFallback
                src={game.coverArt}
                alt={game.title}
                className="w-full aspect-[3/4] object-cover"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Mobile cover + title row */}
          <div className="flex gap-4 lg:block">
            <div className="lg:hidden flex-shrink-0 w-28 sm:w-36 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
              <ImageWithFallback
                src={game.coverArt}
                alt={game.title}
                className="w-full aspect-[3/4] object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 sm:mb-4">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">{game.title}</h1>
                <Link
                  to={`/game/${gameId}/review`}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:shadow-lg hover:shadow-white/10 transition-all whitespace-nowrap text-sm sm:text-base"
                >
                  <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Write Review</span>
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                {game.platforms.map((platform: string) => (
                  <span key={platform} className="px-2 sm:px-3 py-1 bg-white/8 text-white/70 rounded-md border border-white/15 text-sm">
                    {platform}
                  </span>
                ))}
                <span className="text-white/50 text-sm">Released: {game.releaseDate}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-8">
            <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
              <div className="flex-shrink-0">
                <StarPolarDiagram scores={game.scores} size={220} showTotal={true} />
              </div>

              <div className="flex-1 w-full space-y-4">
                <div className="text-center lg:text-left">
                  <div className={`inline-block px-4 sm:px-5 py-2 rounded-2xl mb-2 text-4xl sm:text-6xl font-bold ${scoreStyle(totalScore).bg} ${scoreStyle(totalScore).text}`}>
                    {totalScore.toFixed(1)}
                  </div>
                  <div className="text-white/50 text-sm sm:text-base">Based on {game.reviewCount.toLocaleString()} reviews</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {Object.entries(game.scores).map(([key, value]) => {
                    const { bg, text } = scoreStyle(value as number);
                    return (
                      <div key={key} className={`rounded-lg p-3 ${bg}`}>
                        <div className="text-sm capitalize mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>{key}</div>
                        <div className={`text-2xl font-bold ${text}`}>{(value as number).toFixed(1)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Review Distribution</h3>
            <DistributionChart />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl sm:text-3xl font-bold text-white">Reviews</h2>

          <div className="flex gap-2">
            <button
              onClick={() => setSortBy("top")}
              className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                sortBy === "top"
                  ? "bg-white text-zinc-900"
                  : "bg-white/5 text-white/60 border border-white/10 hover:border-white/25"
              }`}
            >
              Top Rated
            </button>
            <button
              onClick={() => setSortBy("hot")}
              className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                sortBy === "hot"
                  ? "bg-white text-zinc-900"
                  : "bg-white/5 text-white/60 border border-white/10 hover:border-white/25"
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
