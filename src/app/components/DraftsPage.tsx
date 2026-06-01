import { useState } from "react";
import { Link } from "react-router";
import { FileText, Trash2 } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { useAuth } from "../context/AuthContext";
import { listDrafts, clearDraft, timeAgoShort, DraftData } from "./drafts";

const PLACEHOLDER = "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=600&fit=crop";

export function DraftsPage() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<(DraftData & { gameId: string })[]>(() => listDrafts());

  const handleDelete = (gameId: string) => {
    clearDraft(gameId);
    setDrafts(ds => ds.filter(d => d.gameId !== gameId));
  };

  if (!user) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Sign in to see your drafts</h2>
      <Link to="/login"
        className="inline-block mt-2 px-6 py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:shadow-lg hover:shadow-white/10 transition-all">
        Sign In
      </Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Drafts</h1>
        <p className="text-white/50 text-sm sm:text-base">
          Unfinished reviews saved on this device. Pick up where you left off.
        </p>
      </div>

      {drafts.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">No drafts yet</h2>
          <p className="text-white/40 max-w-sm mx-auto">
            When you start a review and leave before posting, it'll be saved here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map(d => (
            <div key={d.gameId}
              className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 hover:border-white/25 transition-colors">
              <Link to={`/game/${d.gameId}/review`}
                className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-16 sm:w-14 sm:h-20 rounded-lg overflow-hidden border border-white/15 flex-shrink-0">
                  <ImageWithFallback src={d.coverUrl ?? PLACEHOLDER} alt={d.gameName ?? "Game"} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{d.gameName ?? "Untitled game"}</h3>
                  <p className="text-white/60 text-sm truncate">
                    {d.title.trim() || d.summary.trim() || "No title yet"}
                  </p>
                  <p className="text-white/35 text-xs mt-1">Saved {timeAgoShort(d.savedAt)}</p>
                </div>
              </Link>
              <button
                onClick={() => handleDelete(d.gameId)}
                aria-label="Delete draft"
                className="flex-shrink-0 p-2 text-white/30 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
