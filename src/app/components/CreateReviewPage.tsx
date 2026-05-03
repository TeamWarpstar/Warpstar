import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { InteractiveStarDiagram } from "./InteractiveStarDiagram";
import { ImageWithFallback } from "./ImageWithFallback";

interface ReviewScores {
  gameplay: number;
  content: number;
  narrative: number;
  aesthetics: number;
  polish: number;
}

interface CategoryText {
  gameplay: string;
  content: string;
  narrative: string;
  aesthetics: string;
  polish: string;
}

const gameData: any = {
  "1": {
    title: "Stellar Odyssey",
    coverArt: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=600&fit=crop",
  },
  "2": {
    title: "Neon Breach",
    coverArt: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=600&fit=crop",
  },
  "3": {
    title: "Dragon's Legacy",
    coverArt: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=600&fit=crop",
  },
  "4": {
    title: "Velocity Racer",
    coverArt: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=600&fit=crop",
  },
  "5": {
    title: "Mythic Realms",
    coverArt: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop",
  },
  "6": {
    title: "Cyber Revolution",
    coverArt: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=600&fit=crop",
  },
  "7": {
    title: "Galaxy Command",
    coverArt: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=600&fit=crop",
  },
  "8": {
    title: "Shadow Tactics",
    coverArt: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=600&fit=crop",
  },
  "9": {
    title: "Mystic Chronicles",
    coverArt: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=600&fit=crop",
  },
  "10": {
    title: "Wasteland Warriors",
    coverArt: "https://images.unsplash.com/photo-1556438064-2d7646166914?w=400&h=600&fit=crop",
  },
  "11": {
    title: "Pixel Dungeon",
    coverArt: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=600&fit=crop",
  },
};

export function CreateReviewPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const game = gameData[gameId as string] || gameData["1"];

  const [scores, setScores] = useState<ReviewScores>({
    gameplay: 5,
    content: 5,
    narrative: 5,
    aesthetics: 5,
    polish: 5,
  });

  const [categoryText, setCategoryText] = useState<CategoryText>({
    gameplay: "",
    content: "",
    narrative: "",
    aesthetics: "",
    polish: "",
  });

  const [summary, setSummary] = useState("");

  const handleScoreChange = (category: keyof ReviewScores, value: number) => {
    setScores(prev => ({ ...prev, [category]: value }));
  };

  const handleCategoryTextChange = (category: keyof CategoryText, value: string) => {
    setCategoryText(prev => ({ ...prev, [category]: value }));
  };

  const handlePost = () => {
    if (!summary.trim()) {
      alert("Please write an overall review before posting.");
      return;
    }

    const review = {
      gameId,
      scores,
      categoryText,
      summary,
      timestamp: new Date().toISOString(),
    };

    const existingReviews = JSON.parse(localStorage.getItem("warpstar-reviews") || "[]");
    existingReviews.push(review);
    localStorage.setItem("warpstar-reviews", JSON.stringify(existingReviews));

    navigate(`/game/${gameId}`);
  };

  const totalScore = (
    scores.gameplay +
    scores.content +
    scores.narrative +
    scores.aesthetics +
    scores.polish
  ) / 5;

  const categories: Array<{ key: keyof ReviewScores; label: string; description: string }> = [
    { key: "gameplay", label: "Gameplay", description: "Mechanics, controls, and core gameplay loop" },
    { key: "content", label: "Content", description: "Amount and variety of content" },
    { key: "narrative", label: "Narrative", description: "Story, characters, and world-building" },
    { key: "aesthetics", label: "Aesthetics", description: "Art direction, visuals, and audio" },
    { key: "polish", label: "Polish", description: "Technical quality and refinement" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Write a Review</h1>
        <div className="flex items-center gap-4">
          <div className="w-16 h-24 rounded-lg overflow-hidden border border-purple-500/30">
            <ImageWithFallback
              src={game.coverArt}
              alt={game.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">{game.title}</h2>
            <div className="text-purple-300">Share your thoughts with the community</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Rate the Game</h3>

            {categories.map(category => (
              <div key={category.key} className="mb-6 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-purple-200 font-semibold">{category.label}</label>
                    <p className="text-sm text-purple-400">{category.description}</p>
                  </div>
                  <div className="text-2xl font-bold text-pink-400 min-w-[3rem] text-right">
                    {scores[category.key].toFixed(1)}
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={scores[category.key]}
                  onChange={(e) => handleScoreChange(category.key, parseFloat(e.target.value))}
                  className="w-full h-2 bg-purple-900/50 rounded-lg appearance-none cursor-pointer slider-pink mb-3"
                />

                <textarea
                  placeholder={`What did you think about the ${category.label.toLowerCase()}?`}
                  value={categoryText[category.key]}
                  onChange={(e) => handleCategoryTextChange(category.key, e.target.value)}
                  className="w-full bg-purple-950/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder:text-purple-400/50 focus:outline-none focus:border-pink-500/50 transition-colors resize-none"
                  rows={3}
                />
              </div>
            ))}
          </div>

          <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Overall Review</h3>
            <textarea
              placeholder="Write your overall thoughts about the game..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-purple-950/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder:text-purple-400/50 focus:outline-none focus:border-pink-500/50 transition-colors resize-none"
              rows={6}
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate(`/game/${gameId}`)}
              className="flex-1 px-6 py-4 bg-purple-900/50 border border-purple-500/30 text-purple-200 font-bold text-lg rounded-lg hover:border-pink-500/50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg rounded-lg hover:shadow-lg hover:shadow-pink-500/30 transition-all"
            >
              Post Review
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Your Rating</h3>

            <div className="text-center mb-6">
              <div className="text-6xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {totalScore.toFixed(1)}
              </div>
              <div className="text-purple-300">Overall Score</div>
            </div>

            <div className="flex justify-center mb-6">
              <div className="w-full max-w-[min(400px,100%)] aspect-square">
                <InteractiveStarDiagram
                  scores={scores}
                  onScoreChange={handleScoreChange}
                  size={400}
                />
              </div>
            </div>

            <div className="text-sm text-purple-300 text-center bg-purple-900/30 rounded-lg p-3 border border-purple-500/20">
              <span className="block mb-1">💡 Interactive Controls</span>
              <span className="text-xs">Drag star points or use sliders to adjust ratings</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
