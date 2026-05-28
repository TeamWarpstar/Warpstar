import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
  ThumbsUp, ThumbsDown, Sparkles, X,
  Heart, History, Tag, Monitor, Award, Clock, Users,
} from "lucide-react";
import { StarPolarDiagram } from "./StarPolarDiagram";
import { ImageWithFallback } from "./ImageWithFallback";
import { scoreStyle } from "./scoreStyle";
import { createPortal } from "react-dom";
import { FeedbackType, RecommendationReason, RecommendationReasonType } from "../../api/recommendations";

interface GameCardProps {
  id: string;
  title: string;
  coverArt: string;
  platforms: string[];
  developer: string;
  year: number;
  genres: string[];
  scores: {
    gameplay: number;
    content: number;
    narrative: number;
    aesthetics: number;
    polish: number;
  };
  igdbRating: number;
  // Thumbs feedback — only rendered when onFeedback is provided
  feedback?:   FeedbackType | null;
  onFeedback?: (type: FeedbackType | null) => void;
  // Reasons the algorithm picked this game — only rendered when present
  reasons?: RecommendationReason[];
}

const REASON_STYLES: Record<RecommendationReasonType, { icon: typeof Heart; color: string; bg: string; label: string }> = {
  feedback:   { icon: Heart,   color: "text-pink-300",   bg: "bg-pink-500/15 border-pink-400/30",     label: "Your feedback" },
  history:    { icon: History, color: "text-purple-300", bg: "bg-purple-500/15 border-purple-400/30", label: "Your history"  },
  genre:      { icon: Tag,     color: "text-sky-300",    bg: "bg-sky-500/15 border-sky-400/30",       label: "Your genres"   },
  platform:   { icon: Monitor, color: "text-cyan-300",   bg: "bg-cyan-500/15 border-cyan-400/30",     label: "Your platforms"},
  quality:    { icon: Award,   color: "text-amber-300",  bg: "bg-amber-500/15 border-amber-400/30",   label: "Reception"     },
  recency:    { icon: Clock,   color: "text-emerald-300",bg: "bg-emerald-500/15 border-emerald-400/30",label: "Recency"      },
  popularity: { icon: Users,   color: "text-orange-300", bg: "bg-orange-500/15 border-orange-400/30", label: "Popularity"    },
};

export function GameCard({ id, title, coverArt, platforms, developer, year, genres, scores, igdbRating, feedback, onFeedback, reasons }: GameCardProps) {
  const [hovered,      setHovered]      = useState(false);
  const [showDiagram,  setShowDiagram]  = useState(false);
  const [showWhy,      setShowWhy]      = useState(false);
  const cardRef        = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const hasReasons = !!(reasons && reasons.length > 0);

  const DIAGRAM_SIZE  = 300;
  const POPOVER_WIDTH = 380;

  useEffect(() => {
    if (!showDiagram || !cardRef.current) return;

    const rect           = cardRef.current.getBoundingClientRect();
    const viewportWidth  = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popoverHeight  = DIAGRAM_SIZE + 200;

    let left = rect.right + 10;
    if (left + POPOVER_WIDTH > viewportWidth - 8) left = rect.left - POPOVER_WIDTH - 10;
    left = Math.max(8, Math.min(left, viewportWidth - POPOVER_WIDTH - 8));

    let top = rect.top + rect.height / 2 - popoverHeight / 2;
    top = Math.max(8, Math.min(top, viewportHeight - popoverHeight - 8));

    setPopoverStyle({ left, top, width: POPOVER_WIDTH });
  }, [showDiagram]);

  const totalScore = (
    scores.gameplay + scores.content + scores.narrative +
    scores.aesthetics + scores.polish
  ) / 5;

  const hasWarpstarReviews = totalScore > 0;
  const displayScore       = hasWarpstarReviews ? totalScore : (igdbRating ?? 0);
  const scoreColor         = scoreStyle(displayScore);
  const ratingLabel        = hasWarpstarReviews ? "Warpstar" : "IGDB";

  // Star size for the card thumbnail — small, no labels
  const CARD_STAR_SIZE = 75;

  return (
    <>
      <Link
        to={`/game/${id}`}
        className="group relative block"
        onMouseEnter={() => { setHovered(true);  setShowDiagram(true);  }}
        onMouseLeave={() => { setHovered(false); setShowDiagram(false); }}
      >
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-xl bg-zinc-900 border border-white/10 transition-all duration-300 hover:border-white/30 hover:scale-105 hover:shadow-2xl hover:shadow-black/40"
        >
          <div className="aspect-[3/4] relative">
            <ImageWithFallback src={coverArt} alt={title} className="w-full h-full object-cover" />

            <div className={`absolute inset-0 transition-opacity duration-200 bg-gradient-to-t from-black/80 via-black/20 to-transparent ${hovered ? "opacity-60" : "opacity-100"}`} />

            {/* Normal state: IGDB score badge top-right */}
            {!hasWarpstarReviews && (
              <div className={`absolute top-3 right-3 px-3 py-1 ${scoreColor.bg} rounded-full text-white font-bold text-sm shadow-lg transition-opacity duration-200 ${hovered ? "opacity-0" : "opacity-100"}`}>
                {displayScore.toFixed(1)}
              </div>
            )}

            {/* Hover state: star diagram replaces the score badge */}
            {hasWarpstarReviews && (
              <div className={`absolute top-2 right-2 transition-opacity duration-200 ${hovered ? "opacity-0" : "opacity-100"}`}>
                <StarPolarDiagram
                  scores={scores}
                  size={CARD_STAR_SIZE}
                  showTotal={true}
                  showLabels={false}
                  showNumbers={false}
                />
              </div>
            )}

            {/* Title — hidden on hover */}
            <div className={`absolute bottom-3 left-3 right-3 transition-opacity duration-200 ${hovered ? "opacity-0" : "opacity-100"}`}>
              <h3 className="text-white font-bold text-base leading-tight line-clamp-2 drop-shadow !text-white">{title}</h3>
            </div>

            {/* Thumbs feedback + "Why?" — only rendered for recommendation cards */}
            {(onFeedback || hasReasons) && (
              <div
                className={`absolute top-2 left-2 flex gap-1.5 z-10 transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0 sm:opacity-90"}`}
              >
                {onFeedback && (
                  <>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onFeedback(feedback === "up" ? null : "up");
                      }}
                      aria-label={feedback === "up" ? "Remove like" : "More like this"}
                      className={`p-1.5 rounded-full backdrop-blur-md border transition-all ${
                        feedback === "up"
                          ? "bg-green-500/80 border-green-400/60 text-white shadow-lg"
                          : "bg-black/55 border-white/15 text-white/75 hover:bg-black/75 hover:text-white"
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onFeedback(feedback === "down" ? null : "down");
                      }}
                      aria-label={feedback === "down" ? "Remove dislike" : "Not interested"}
                      className={`p-1.5 rounded-full backdrop-blur-md border transition-all ${
                        feedback === "down"
                          ? "bg-red-500/80 border-red-400/60 text-white shadow-lg"
                          : "bg-black/55 border-white/15 text-white/75 hover:bg-black/75 hover:text-white"
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                {hasReasons && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowWhy(true);
                    }}
                    aria-label="Why this was recommended"
                    className="p-1.5 rounded-full backdrop-blur-md border bg-black/55 border-white/15 text-white/75 hover:bg-violet-500/80 hover:border-violet-400/60 hover:text-white transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Popover */}
      {showDiagram && createPortal(
        <div className="fixed z-[9999] pointer-events-none animate-in fade-in duration-150" style={popoverStyle}>
          <div className="w-full bg-[#0f0f0f]/97 backdrop-blur-sm border border-white/12 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden game-card-popover">

            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-white/8">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-white font-bold text-lg leading-tight">{title}</h3>

                {/* Only show score badge if no Warpstar reviews — star handles it otherwise */}
                {!hasWarpstarReviews && igdbRating > 0 && (
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <div className={`px-3 py-1 ${scoreColor.bg} rounded-full text-white font-bold text-sm shadow-lg`}>
                      {displayScore.toFixed(1)}
                    </div>
                    <span className="text-xs text-white/30">{ratingLabel}</span>
                  </div>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/50">
                {developer && <span>{developer}</span>}
                {developer && year > 0 && <span className="text-white/20">·</span>}
                {year > 0 && <span>{year}</span>}
                {genres?.length > 0 && (
                  <>
                    <span className="text-white/20">·</span>
                    <span className="text-white/60">{genres.slice(0, 2).join(", ")}</span>
                  </>
                )}
              </div>

              {platforms.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {platforms.slice(0, 4).map(platform => (
                    <span key={platform} className="px-2 py-0.5 bg-white/5 text-white/50 text-xs rounded border border-white/10">
                      {platform}
                    </span>
                  ))}
                  {platforms.length > 4 && (
                    <span className="px-2 py-0.5 text-white/30 text-xs">+{platforms.length - 4} more</span>
                  )}
                </div>
              )}
            </div>

            {/* Star diagram — full size with labels and numbers */}
            {hasWarpstarReviews ? (
              <div className="flex items-center justify-center pt-4 pb-2">
                <StarPolarDiagram scores={scores} size={DIAGRAM_SIZE} showTotal={true} showLabels={true} showNumbers={true} />
              </div>
            ) : (
              <div className="px-5 py-6 text-center text-sm text-white/30">
                No Warpstar reviews yet — showing IGDB rating
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* "Why recommended?" modal */}
      {showWhy && hasReasons && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowWhy(false); }}
        >
          <div
            className="relative w-full max-w-md mx-4 bg-zinc-900 border border-white/15 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            {/* Header — cover thumb + title */}
            <div className="flex items-center gap-4 p-5 border-b border-white/8 bg-gradient-to-br from-violet-500/10 via-transparent to-transparent">
              <div className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 ring-1 ring-white/10">
                <ImageWithFallback src={coverArt} alt={title} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-300 uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Why this game?
                </div>
                <h3 className="text-white font-bold text-lg leading-tight truncate">{title}</h3>
                {developer && (
                  <p className="text-white/40 text-xs mt-0.5 truncate">{developer}{year > 0 ? ` · ${year}` : ""}</p>
                )}
              </div>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowWhy(false); }}
                aria-label="Close"
                className="absolute top-3 right-3 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reason list */}
            <div className="p-5 space-y-2.5">
              <p className="text-xs text-white/40 mb-3">Based on your preferences, history, and feedback:</p>
              {reasons!.map((r, i) => {
                const style = REASON_STYLES[r.type];
                const Icon  = style.icon;
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border ${style.bg}`}
                  >
                    <div className={`flex-shrink-0 mt-0.5 ${style.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-[10px] font-semibold uppercase tracking-wider ${style.color}`}>
                        {style.label}
                      </div>
                      <div className="text-sm text-white/85 leading-snug mt-0.5">{r.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="px-5 pb-4 pt-1">
              <p className="text-[11px] text-white/30 text-center">
                Use the thumbs to refine future recommendations.
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}