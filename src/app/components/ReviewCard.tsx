import { ThumbsUp, ThumbsDown, MessageCircle, User } from "lucide-react";
import { Link } from "react-router";

interface ReviewCardProps {
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
  review: string;
  likes: number;
  dislikes: number;
  comments: number;
  isPinned?: boolean;
}

export function ReviewCard({
  reviewer,
  scores,
  review,
  likes,
  dislikes,
  comments,
  isPinned = false,
}: ReviewCardProps) {
  const totalScore = (
    scores.gameplay +
    scores.content +
    scores.narrative +
    scores.aesthetics +
    scores.polish
  ) / 5;

  return (
    <div className={`bg-purple-950/30 border rounded-xl p-6 ${isPinned ? 'border-pink-500/50 shadow-lg shadow-pink-500/10' : 'border-purple-500/20'}`}>
      {isPinned && (
        <div className="mb-3 text-pink-400 text-sm font-semibold flex items-center gap-2">
          📌 Pinned Review
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <Link to={`/profile/${reviewer.username}`} className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            {reviewer.avatar ? (
              <img src={reviewer.avatar} alt={reviewer.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
        </Link>

        <div className="flex-1">
          <Link to={`/profile/${reviewer.username}`} className="font-semibold text-white hover:text-pink-400 transition-colors">
            @{reviewer.username}
          </Link>

          <div className="mt-3 grid grid-cols-5 gap-3">
            {Object.entries(scores).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-xs text-purple-300 capitalize mb-1">{key}</div>
                <div className="text-lg font-bold text-pink-400">{value.toFixed(1)}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg inline-block">
            <span className="text-white font-bold">Total: {totalScore.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <p className="text-purple-100 leading-relaxed mb-4">{review}</p>

      <div className="flex items-center gap-6">
        <button className="flex items-center gap-2 text-purple-300 hover:text-pink-400 transition-colors">
          <ThumbsUp className="w-4 h-4" />
          <span>{likes}</span>
        </button>
        <button className="flex items-center gap-2 text-purple-300 hover:text-pink-400 transition-colors">
          <ThumbsDown className="w-4 h-4" />
          <span>{dislikes}</span>
        </button>
        <button className="flex items-center gap-2 text-purple-300 hover:text-pink-400 transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span>{comments}</span>
        </button>
      </div>
    </div>
  );
}
