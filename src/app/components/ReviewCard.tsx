import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle, User, Pin, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { StarPolarDiagram } from "./StarPolarDiagram";
import { toggleLike, toggleDislike } from "../../api/reviews";
import { useAuth } from "../context/AuthContext";
import { ImageWithFallback } from "./ImageWithFallback";

// Clockwise from top — matches star arm order
const FACTORS = [
  { key: "gameplay"   as const, label: "Gameplay",   color: "#6373ff" },
  { key: "aesthetics" as const, label: "Aesthetics", color: "#ff9a48" },
  { key: "content"    as const, label: "Content",    color: "#a95eff" },
  { key: "polish"     as const, label: "Polish",     color: "#61bb74" },
  { key: "narrative"  as const, label: "Narrative",  color: "#f55f5f" },
];

interface ReviewCardProps {
  id?: string;
  reviewer: { username: string; avatar?: string };
  scores: {
    gameplay: number; content: number; narrative: number;
    aesthetics: number; polish: number;
  };
  categoryText?: {
    gameplay?: string; content?: string; narrative?: string;
    aesthetics?: string; polish?: string;
  };
  title?: string;
  review: string;
  likes: number;
  dislikes: number;
  comments: number;
  isPinned?: boolean;
  isOwnReview?: boolean;
  onDelete?: (id: string) => void;
  hasLiked?: boolean;
  hasDisliked?: boolean;
  // Game context — shown on profile pages where you can't tell which game it is
  showGame?: boolean;
  gameId?: string;
  gameName?: string;
  gameCoverUrl?: string;
}

export function ReviewCard({
  id, reviewer, scores, categoryText, title, review,
  likes, dislikes, comments,
  isPinned = false, isOwnReview = false, onDelete,
  hasLiked = false, hasDisliked = false,
  showGame = false, gameId, gameName, gameCoverUrl,
}: ReviewCardProps) {
  const { user } = useAuth();
  const [liked,        setLiked]        = useState(hasLiked);
  const [disliked,     setDisliked]     = useState(hasDisliked);
  const [likeCount,    setLikeCount]    = useState(likes);
  const [dislikeCount, setDislikeCount] = useState(dislikes);

  const totalScore = (
    scores.gameplay + scores.content + scores.narrative +
    scores.aesthetics + scores.polish
  ) / 5;

  const badgeBg =
    totalScore >= 9.5 ? "#2563eb" :
    totalScore >= 8.5 ? "#008000" :
    totalScore >= 7   ? "#32cd32" :
    totalScore >= 6   ? "#00ff00" :
    totalScore >= 5   ? "#adff2f" :
    totalScore >= 4   ? "#ffff00" :
    totalScore >= 3   ? "#ff8c00" :
    totalScore >= 1   ? "#dc2626" :
                        "#7f1d1d";

  return (
    <div className={`bg-white/5 border rounded-xl overflow-hidden ${isPinned ? "border-white/25 shadow-lg shadow-white/5" : "border-white/10"}`}>
      {isPinned && (
        <div className="px-5 py-2 border-b border-white/10 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.04)" }}>
          <Pin className="w-3.5 h-3.5 text-white/50" />
          <span className="text-sm font-semibold text-white/50">Pinned Review</span>
        </div>
      )}

      <div className="p-5 sm:p-6">

        {/* Game context banner — shown on profile pages */}
        {showGame && gameId && gameName && (
          <Link
            to={`/game/${gameId}`}
            className="flex items-center gap-3 mb-4 pb-4 border-b border-white/8 group"
          >
            {gameCoverUrl && (
              <div className="w-10 h-14 rounded-md overflow-hidden border border-white/10 flex-shrink-0">
                <ImageWithFallback
                  src={gameCoverUrl}
                  alt={gameName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs text-white/35 mb-0.5">Review for</p>
              <p className="text-white font-semibold text-sm truncate group-hover:text-white/70 transition-colors">
                {gameName}
              </p>
            </div>
          </Link>
        )}

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <Link to={`/profile/${reviewer.username}`} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden ring-2 ring-white/10 flex-shrink-0">
              {reviewer.avatar
                ? <img src={reviewer.avatar} alt={reviewer.username} className="w-full h-full object-cover" />
                : <User className="w-5 h-5 text-white" />
              }
            </div>
            <span className="font-semibold text-white group-hover:opacity-70 transition-opacity">
              @{reviewer.username}
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {isOwnReview && id && onDelete && (
              <button onClick={() => onDelete(id)} title="Delete your review"
                className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Review title */}
        {title && <h4 className="text-white font-bold text-base mb-4">{title}</h4>}

        {/* Score breakdown + star diagram */}
        <div className="flex flex-col sm:flex-row gap-6 mb-5">

          {/* Factor rows */}
          <div className="flex-1 space-y-3">
            {FACTORS.map(f => {
              const val   = scores[f.key];
              const pct   = (val / 10) * 100;
              const blurb = categoryText?.[f.key];
              return (
                <div key={f.key}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span style={{ fontSize: 13, fontWeight: 700, color: f.color }}>
                      {f.label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: f.color, opacity: 0.9 }}>
                      {val.toFixed(1)}
                    </span>
                    <div className="flex-1 h-px" style={{ background: f.color, opacity: 0.15, marginBottom: 2 }} />
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: blurb ? 6 : 0 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: f.color, borderRadius: 99, opacity: 0.85 }} />
                  </div>
                  {blurb && (
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.55 }}>
                      {blurb}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Star diagram */}
          <div className="flex-shrink-0 flex items-start justify-center pt-1">
            <StarPolarDiagram scores={scores} size={290} showTotal={true} showLabels={false} showNumbers={false} />
          </div>
        </div>

        {/* Overall review text */}
        {review && (
          <p className="mb-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
            {review}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-1 pt-4 border-t border-white/8">
          <button
            onClick={async () => {
              if (!user || !id) return;
              const res = await toggleLike(id);
              setLiked(res.liked); setDisliked(res.disliked);
              setLikeCount(c => res.liked ? c + 1 : Math.max(0, c - 1));
              if (!res.disliked && disliked) setDislikeCount(c => Math.max(0, c - 1));
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${liked ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}>
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{likeCount}</span>
          </button>
          <button
            onClick={async () => {
              if (!user || !id) return;
              const res = await toggleDislike(id);
              setDisliked(res.disliked); setLiked(res.liked);
              setDislikeCount(c => res.disliked ? c + 1 : Math.max(0, c - 1));
              if (!res.liked && liked) setLikeCount(c => Math.max(0, c - 1));
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${disliked ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}>
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>{dislikeCount}</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{comments}</span>
          </button>
        </div>
      </div>
    </div>
  );
}