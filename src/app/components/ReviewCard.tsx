import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle, User, Pin, Trash2, Send, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router";
import { StarPolarDiagram } from "./StarPolarDiagram";
import { ImageWithFallback } from "./ImageWithFallback";
import { getComments, postComment, deleteComment, Comment } from "../../api/reviews";
import { useAuth } from "../context/AuthContext";

const FACTORS = [
  { key: "gameplay"   as const, label: "Gameplay",   color: "#6373ff" },
  { key: "aesthetics" as const, label: "Aesthetics", color: "#ff9a48" },
  { key: "content"    as const, label: "Content",    color: "#a95eff" },
  { key: "polish"     as const, label: "Polish",     color: "#61bb74" },
  { key: "narrative"  as const, label: "Narrative",  color: "#f55f5f" },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return "just now";
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 30)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

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
  createdAt?: string;
  isPinned?: boolean;
  isOwnReview?: boolean;
  onDelete?: (id: string) => void;
  showGame?: boolean;
  gameId?: string;
  gameName?: string;
  gameCoverUrl?: string;
}

export function ReviewCard({
  id, reviewer, scores, categoryText, title, review,
  likes, dislikes, comments: commentCount,
  createdAt,
  isPinned = false, isOwnReview = false, onDelete,
  showGame = false, gameId, gameName, gameCoverUrl,
}: ReviewCardProps) {
  const { user } = useAuth();
  const [liked,           setLiked]           = useState(false);
  const [disliked,        setDisliked]         = useState(false);
  const [showComments,    setShowComments]     = useState(false);
  const [commentList,     setCommentList]      = useState<Comment[]>([]);
  const [commentsLoaded,  setCommentsLoaded]   = useState(false);
  const [newComment,      setNewComment]       = useState("");
  const [submitting,      setSubmitting]       = useState(false);
  const [localCount,      setLocalCount]       = useState(commentCount);

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

  const handleToggleComments = async () => {
    if (!showComments && !commentsLoaded && id) {
      try {
        const res = await getComments(id);
        setCommentList(res.results);
        setCommentsLoaded(true);
      } catch { /* ignore */ }
    }
    setShowComments(s => !s);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !id || submitting) return;
    setSubmitting(true);
    try {
      const created = await postComment(id, newComment.trim());
      setCommentList(prev => [...prev, created]);
      setLocalCount(c => c + 1);
      setNewComment("");
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id) return;
    try {
      await deleteComment(id, commentId);
      setCommentList(prev => prev.filter(c => c.id !== commentId));
      setLocalCount(c => Math.max(0, c - 1));
    } catch { /* ignore */ }
  };

  return (
    <div className={`bg-white/5 border rounded-xl overflow-hidden ${isPinned ? "border-white/25 shadow-lg shadow-white/5" : "border-white/10"}`}>
      {isPinned && (
        <div className="px-5 py-2 border-b border-white/10 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.04)" }}>
          <Pin className="w-3.5 h-3.5 text-white/50" />
          <span className="text-sm font-semibold text-white/50">Pinned Review</span>
        </div>
      )}

      <div className="p-5 sm:p-6">

        {/* Game context banner */}
        {showGame && gameId && gameName && (
          <Link to={`/game/${gameId}`} className="flex items-center gap-3 mb-4 pb-4 border-b border-white/8 group">
            {gameCoverUrl && (
              <div className="w-10 h-14 rounded-md overflow-hidden border border-white/10 flex-shrink-0">
                <ImageWithFallback src={gameCoverUrl} alt={gameName} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs text-white/35 mb-0.5">Review for</p>
              <p className="text-white font-semibold text-sm truncate group-hover:text-white/70 transition-colors">{gameName}</p>
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
            <div>
              <span className="font-semibold text-white group-hover:opacity-70 transition-opacity block">
                @{reviewer.username}
              </span>
              {createdAt && (
                <span className="text-xs text-white/30">{timeAgo(createdAt)}</span>
              )}
            </div>
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

        {title && <h4 className="text-white font-bold text-base mb-4">{title}</h4>}

        {/* Score breakdown + star */}
        <div className="flex flex-col sm:flex-row gap-6 mb-5">
          <div className="flex-1 space-y-3">
            {FACTORS.map(f => {
              const val   = scores[f.key];
              const pct   = (val / 10) * 100;
              const blurb = categoryText?.[f.key];
              return (
                <div key={f.key}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span style={{ fontSize: 13, fontWeight: 700, color: f.color }}>{f.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: f.color, opacity: 0.9 }}>{val.toFixed(1)}</span>
                    <div className="flex-1 h-px" style={{ background: f.color, opacity: 0.15, marginBottom: 2 }} />
                  </div>
                  <div style={{ position: "relative", height: 5, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: blurb ? 6 : 0 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: f.color, opacity: 0.85 }} />
                    {Array.from({ length: 9 }).map((_, t) => {
                      const tickPct = (t + 1) * 10;
                      return (
                        <div key={t} style={{
                          position: "absolute", top: 0, bottom: 0,
                          left: `${tickPct}%`, width: 1.5,
                          background: tickPct <= pct ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.5)",
                          transform: "translateX(-50%)",
                        }} />
                      );
                    })}
                  </div>
                  {blurb && <p className="text-white/45" style={{ fontSize: 13, lineHeight: 1.55 }}>{blurb}</p>}
                </div>
              );
            })}
          </div>
          <div className="flex-shrink-0 flex items-start justify-center pt-1">
            <StarPolarDiagram scores={scores} size={290} showTotal={true} showLabels={false} showNumbers={false} />
          </div>
        </div>

        {review && (
          <p className="mb-4 text-sm leading-relaxed text-white/75">{review}</p>
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
          <button
            onClick={handleToggleComments}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${showComments ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}>
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{localCount}</span>
            {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-white/8 space-y-3">
            {commentList.length === 0 && commentsLoaded && (
              <p className="text-white/30 text-sm text-center py-2">No comments yet. Be the first!</p>
            )}
            {commentList.map(c => (
              <div key={c.id} className="flex gap-3 group">
                <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0 mt-0.5">
                  {c.avatar
                    ? <img src={c.avatar} alt={c.username} className="w-full h-full object-cover" />
                    : <User className="w-3.5 h-3.5 text-white" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <Link to={`/profile/${c.username}`} className="text-xs font-semibold text-white/70 hover:text-white transition-colors">
                      @{c.username}
                    </Link>
                    <span className="text-xs text-white/25">{timeAgo(c.createdAt)}</span>
                    {user?.username === c.username && (
                      <button onClick={() => handleDeleteComment(c.id)}
                        className="ml-auto opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))}

            {/* Comment input */}
            {user && (
              <div className="flex gap-2 pt-1">
                <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0 mt-1">
                  {user.profilePicture
                    ? <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover" />
                    : <User className="w-3.5 h-3.5 text-white" />
                  }
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSubmitComment()}
                    placeholder="Write a comment…"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors"
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submitting}
                    className="p-2 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/15 transition-colors disabled:opacity-30">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}