import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle, User, Pin, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { StarPolarDiagram } from "./StarPolarDiagram";

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
}

export function ReviewCard({
  id, reviewer, scores, categoryText, title, review,
  likes, dislikes, comments,
  isPinned = false, isOwnReview = false, onDelete,
}: ReviewCardProps) {
  const [liked,    setLiked]    = useState(false);
  const [disliked, setDisliked] = useState(false);

  const totalScore = (
    scores.gameplay + scores.content + scores.narrative +
    scores.aesthetics + scores.polish
  ) / 5;

  // Score badge colour based on value
  const badgeBg =
    totalScore >= 8 ? "#16a34a" :
    totalScore >= 6 ? "#2563eb" :
    totalScore >= 4 ? "#d97706" : "#dc2626";

  return (
    <div className={`bg-white/5 border rounded-xl overflow-hidden ${isPinned ? "border-white/25 shadow-lg shadow-white/5" : "border-white/10"}`}>
      {isPinned && (
        <div className="px-5 py-2 border-b border-white/10 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.04)" }}>
          <Pin className="w-3.5 h-3.5 text-white/50" />
          <span className="text-sm font-semibold text-white/50">Pinned Review</span>
        </div>
      )}

      <div className="p-5 sm:p-6">

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
            <div className="px-3 py-1 rounded-lg text-base font-bold text-white flex-shrink-0"
              style={{ background: badgeBg }}>
              {totalScore.toFixed(1)}
            </div>
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
              const val  = scores[f.key];
              const pct  = (val / 10) * 100;
              const blurb = categoryText?.[f.key];
              return (
                <div key={f.key}>
                  {/* Label + score on same line, score right-aligned but close */}
                  <div className="flex items-baseline gap-2 mb-1">
                    <span style={{ fontSize: 13, fontWeight: 700, color: f.color }}>
                      {f.label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: f.color, opacity: 0.9 }}>
                      {val.toFixed(1)}
                    </span>
                    <div className="flex-1 h-px" style={{ background: f.color, opacity: 0.15, marginBottom: 2 }} />
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: blurb ? 6 : 0 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: f.color, borderRadius: 99, opacity: 0.85 }} />
                  </div>
                  {/* Category blurb */}
                  {blurb && (
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.55 }}>
                      {blurb}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Star diagram — compact, labels hidden, shown beside the rows */}
          <div className="flex-shrink-0 flex items-start justify-center pt-1">
            <StarPolarDiagram scores={scores} size={180} showTotal={true} showLabels={false} />
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
            onClick={() => { setLiked(l => !l); if (disliked) setDisliked(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${liked ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}>
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{liked ? likes + 1 : likes}</span>
          </button>
          <button
            onClick={() => { setDisliked(d => !d); if (liked) setLiked(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${disliked ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}>
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>{disliked ? dislikes + 1 : dislikes}</span>
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