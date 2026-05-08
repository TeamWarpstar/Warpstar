import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { InteractiveStarDiagram } from "./InteractiveStarDiagram";
import { createReview } from "../../api/reviews";

const DIMENSIONS = ["gameplay","content","narrative","aesthetics","polish"] as const;
type Dim = typeof DIMENSIONS[number];

export function CreateReviewPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [scores, setScores] = useState<Record<Dim,number>>({ gameplay:5, content:5, narrative:5, aesthetics:5, polish:5 });
  const [title,  setTitle]  = useState("");
  const [body,   setBody]   = useState("");
  const [spoilers, setSpoilers] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  if (!user) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-purple-300 text-lg">Please sign in to write a review.</p>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameId) return;
    if (!title.trim()) { setError("Please add a title for your review."); return; }
    setError(""); setLoading(true);
    try {
      await createReview(gameId, { ...scores, title: title.trim(), body, containsSpoilers: spoilers });
      navigate(`/game/${gameId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-8">Write a Review</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-8 flex flex-col items-center gap-6">
          <InteractiveStarDiagram scores={scores} onChange={(dim, val) => setScores(s => ({...s, [dim]: val}))} size={300}/>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full">
            {DIMENSIONS.map(dim => (
              <div key={dim} className="text-center">
                <div className="text-xs text-purple-300 capitalize mb-1">{dim}</div>
                <div className="text-2xl font-bold text-pink-400">{scores[dim].toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">Review Title *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Summarise your experience in one line..." maxLength={200} required
            className="w-full bg-purple-950/60 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder:text-purple-400/40 focus:outline-none focus:border-pink-500/60 transition-colors"/>
        </div>

        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2">Your Review</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Share your thoughts on the game..." rows={6}
            className="w-full bg-purple-950/60 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder:text-purple-400/40 focus:outline-none focus:border-pink-500/60 transition-colors resize-none"/>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setSpoilers(p=>!p)}
            className={`w-10 h-6 rounded-full transition-colors ${spoilers ? "bg-pink-500" : "bg-purple-700/50"} relative`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${spoilers ? "translate-x-5" : "translate-x-1"}`}/>
          </div>
          <span className="text-purple-200 text-sm">Contains spoilers</span>
        </label>

        {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>}

        <div className="flex gap-4">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 py-3 bg-purple-950/50 border border-purple-500/30 text-purple-300 font-semibold rounded-xl hover:border-pink-500/50 transition-all">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all disabled:opacity-60">
            {loading ? "Submitting…" : "Publish Review"}
          </button>
        </div>
      </form>
    </div>
  );
}