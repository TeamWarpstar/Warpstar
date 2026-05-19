import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { InteractiveStarDiagram } from "./InteractiveStarDiagram";
import { ImageWithFallback } from "./ImageWithFallback";
import { Loader2 } from "lucide-react";
import { getGame, Game } from "../../api/games";
import { createReview } from "../../api/reviews";
import { useAuth } from "../context/AuthContext";

interface ReviewScores {
  gameplay: number; content: number; narrative: number;
  aesthetics: number; polish: number;
}

interface CategoryText {
  gameplay: string; content: string; narrative: string;
  aesthetics: string; polish: string;
}

const CATEGORIES: Array<{ key: keyof ReviewScores; label: string; description: string }> = [
  { key: "gameplay",   label: "Gameplay",   description: "How well do the mechanics, controls, and core gameplay loop serve the overall experience?" },
  { key: "content",    label: "Content",    description: "How much content is there, and how engaging is it? This encapsulates the quantity, depth, and replayability of content in the game." },
  { key: "narrative",  label: "Narrative",  description: "How good is this game at telling a story? For single-player experiences, this can mean the quality of the plot and characters. For multiplayer games, this can be quality of the stories you create within that game." },
  { key: "aesthetics", label: "Aesthetics", description: "How appealing is this game's graphical and audio design?" },
  { key: "polish",     label: "Polish",     description: "How refined is the overall presentation and execution of the game? This includes the game's performance, stability, and overall feel." },
];

export function CreateReviewPage() {
  const { gameId }   = useParams<{ gameId: string }>();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const [game,    setGame]    = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error,   setError]   = useState("");

  const [scores, setScores] = useState<ReviewScores>({
    gameplay: 5, content: 5, narrative: 5, aesthetics: 5, polish: 5,
  });

  const [categoryText, setCategoryText] = useState<CategoryText>({
    gameplay: "", content: "", narrative: "", aesthetics: "", polish: "",
  });

  const [title,    setTitle]    = useState("");
  const [summary,  setSummary]  = useState("");
  const [spoilers, setSpoilers] = useState(false);

  useEffect(() => {
    if (!gameId) return;
    getGame(gameId)
      .then(setGame)
      .finally(() => setLoading(false));
  }, [gameId]);

  if (!user) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-white/50 text-lg">Please sign in to write a review.</p>
    </div>
  );

  const handleScoreChange = (key: keyof ReviewScores, value: number) => {
    setScores(prev => ({ ...prev, [key]: Math.min(10, Math.max(1, Math.round(value))) }));
  };

  const handlePost = async () => {
    if (!gameId) return;
    if (!title.trim()) { setError("Please add a title for your review."); return; }
    if (!summary.trim()) { setError("Please write an overall review before posting."); return; }
    setError(""); setPosting(true);
    try {
      await createReview(gameId, {
        ...scores,
        title:            title.trim(),
        body:             summary,
        gp_body:          categoryText.gameplay,
        con_body:         categoryText.content,
        ntv_body:         categoryText.narrative,
        aes_body:         categoryText.aesthetics,
        pol_body:         categoryText.polish,
        containsSpoilers: spoilers,
      });
      navigate(`/game/${gameId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post review.");
      setPosting(false);
    }
  };

  const totalScore = (scores.gameplay+scores.content+scores.narrative+scores.aesthetics+scores.polish)/5;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-white/40 animate-spin"/></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Write a Review</h1>
        {game && (
          <div className="flex items-center gap-4">
            <div className="w-16 h-24 rounded-lg overflow-hidden border border-white/15">
              <ImageWithFallback src={game.coverUrl ?? ""} alt={game.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">{game.name}</h2>
              <div className="text-white/50">Share your thoughts with the community</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Review title */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Review Title</h3>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Summarise your experience in one line" maxLength={200}
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-white/40 transition-colors" />
          </div>

          {/* Score sliders */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Rate the Game</h3>
            {CATEGORIES.map(cat => (
              <div key={cat.key} className="mb-6 last:mb-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <label className="text-white/80 font-semibold">{cat.label}</label>
                    <p className="text-sm text-white/40">{cat.description}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button type="button" onClick={() => handleScoreChange(cat.key, scores[cat.key]-1)}
                      className="w-8 h-8 rounded-lg bg-white/8 border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-colors flex items-center justify-center text-lg select-none">-</button>
                    <input type="number" min={1} max={10} value={scores[cat.key]}
                      onChange={e => { const v = parseInt(e.target.value,10); if (!isNaN(v)) handleScoreChange(cat.key,v); }}
                      className="w-12 h-8 text-center bg-white/5 border border-white/15 rounded-lg text-white font-bold focus:outline-none focus:border-white/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    <button type="button" onClick={() => handleScoreChange(cat.key, scores[cat.key]+1)}
                      className="w-8 h-8 rounded-lg bg-white/8 border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-colors flex items-center justify-center text-lg select-none">+</button>
                  </div>
                </div>
                <input type="range" min="1" max="10" step="1" value={scores[cat.key]}
                  onChange={e => handleScoreChange(cat.key, parseInt(e.target.value,10))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-mono mb-3" />
                <textarea
                  placeholder={`What did you think about the ${cat.label.toLowerCase()}?`}
                  value={categoryText[cat.key]}
                  onChange={e => setCategoryText(prev => ({ ...prev, [cat.key]: e.target.value }))}
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-white/40 transition-colors resize-none"
                  rows={3} />
              </div>
            ))}
          </div>

          {/* Overall review */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Overall Review</h3>
            <textarea placeholder="Write your overall thoughts about the game" value={summary}
              onChange={e => setSummary(e.target.value)} rows={6}
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-white/40 transition-colors resize-none" />
            <label className="flex items-center gap-3 mt-3 cursor-pointer">
              <input type="checkbox" checked={spoilers} onChange={e => setSpoilers(e.target.checked)} className="w-4 h-4 accent-white" />
              <span className="text-white/50 text-sm">Contains spoilers</span>
            </label>
          </div>

          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>}

          <div className="flex gap-4">
            <button onClick={() => navigate(`/game/${gameId}`)}
              className="flex-1 px-6 py-4 bg-white/5 border border-white/15 text-white/70 font-bold text-lg rounded-lg hover:border-white/30 transition-all">
              Cancel
            </button>
            <button onClick={handlePost} disabled={posting}
              className="flex-1 px-6 py-4 bg-white text-zinc-900 font-bold text-lg rounded-lg hover:shadow-lg hover:shadow-white/10 transition-all disabled:opacity-60">
              {posting ? "Posting" : "Post Review"}
            </button>
          </div>
        </div>

        {/* Sticky star diagram */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Your Rating</h3>
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-white">{totalScore.toFixed(1)}</div>
              <div className="text-white/50">Overall Score</div>
            </div>
            <div className="flex justify-center mb-6">
              <div className="w-full max-w-[min(400px,100%)] aspect-square">
                <InteractiveStarDiagram scores={scores} onScoreChange={handleScoreChange} size={400} />
              </div>
            </div>
            <div className="text-sm text-white/50 text-center bg-white/5 rounded-lg p-3 border border-white/10">
              <span className="block mb-1">Interactive Controls</span>
              <span className="text-xs">Drag star points, use sliders, or type a score (1–10)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}