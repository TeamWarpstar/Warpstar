import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle, User, Pin, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { StarPolarDiagram } from "./StarPolarDiagram";
import { scoreStyle } from "./scoreStyle";

const FACTOR_COLORS: Record<string, string> = {
  gameplay:   '#818cf8',
  content:    '#a78bfa',
  narrative:  '#f472b6',
  aesthetics: '#fb923c',
  polish:     '#34d399',
};

const CATEGORY_LABELS: Record<string, string> = {
  gameplay:   'Gameplay',
  content:    'Content',
  narrative:  'Narrative',
  aesthetics: 'Aesthetics',
  polish:     'Polish',
};

interface ReviewCardProps {
  id?: string;
  reviewer: {
    username: string;
    avatar?: string;
  };
  scores: {
    gameplay: number;
    content: number;
    narrative: number;
    aesthetics: number;
    polish: number;
  };
  categoryText?: {
    gameplay?: string;
    content?: string;
    narrative?: string;
    aesthetics?: string;
    polish?: string;
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
  id,
  reviewer,
  scores,
  categoryText,
  title,
  review,
  likes,
  dislikes,
  comments,
  isPinned = false,
  isOwnReview = false,
  onDelete,
}: ReviewCardProps) {
  const [liked,    setLiked]    = useState(false);
  const [disliked, setDisliked] = useState(false);

  const totalScore = (
    scores.gameplay + scores.content + scores.narrative + scores.aesthetics + scores.polish
  ) / 5;

  const { bg: totalBg, text: totalText } = scoreStyle(totalScore);

  return (
    <div className={`bg-white/5 border rounded-xl overflow-hidden ${isPinned ? 'border-white/25 shadow-lg shadow-white/5' : 'border-white/10'}`}>
      {isPinned && (
        <div className="px-5 py-2 border-b border-white/10 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <Pin className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} />
          <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Pinned Review</span>
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
            <div className={`px-3 py-1 rounded-lg text-sm font-bold flex-shrink-0 ${totalBg} ${totalText}`}>
              {totalScore.toFixed(1)}
            </div>
            {/* Delete button — only shown to the review author */}
            {isOwnReview && id && onDelete && (
              <button
                onClick={() => onDelete(id)}
                title="Delete your review"
                className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Review title */}
        {title && (
          <h4 className="text-white font-bold text-base mb-3">{title}</h4>
        )}

        {/* Score breakdown + diagram */}
        <div className="flex flex-col sm:flex-row gap-5 mb-5">
          <div className="flex-1 space-y-2.5">
            {Object.entries(scores).map(([key, value]) => {
              const { bg } = scoreStyle(value as number);
              const color  = FACTOR_COLORS[key];
              const blurb  = categoryText?.[key as keyof typeof categoryText];
              return (
                <div key={key}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-xs capitalize flex-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {CATEGORY_LABELS[key]}
                    </span>
                    <div className={`px-2 py-0.5 rounded text-xs font-bold ${bg}`} style={{ color: '#ffffff' }}>
                      {(value as number).toFixed(1)}
                    </div>
                  </div>
                  {blurb && (
                    <p className="ml-4.5 mt-0.5 text-xs leading-relaxed pl-2.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {blurb}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex-shrink-0 flex items-center justify-center">
            <StarPolarDiagram scores={scores} size={160} showTotal={false} showLabels={true} />
          </div>
        </div>

        {/* Overall review text */}
        {review && (
          <div className="mb-4">
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {review}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-1 pt-4 border-t border-white/8">
          <button
            onClick={() => { setLiked(l => !l); if (disliked) setDisliked(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${liked ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{liked ? likes + 1 : likes}</span>
          </button>
          <button
            onClick={() => { setDisliked(d => !d); if (liked) setLiked(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${disliked ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
          >
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