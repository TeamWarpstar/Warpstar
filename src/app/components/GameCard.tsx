import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { StarPolarDiagram } from "./StarPolarDiagram";
import { ImageWithFallback } from "./ImageWithFallback";
import { scoreStyle } from "./scoreStyle";
import { createPortal } from "react-dom";

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
}

export function GameCard({ id, title, coverArt, platforms, developer, year, genres, scores, igdbRating }: GameCardProps) {
  const [hovered,      setHovered]      = useState(false);
  const [showDiagram,  setShowDiagram]  = useState(false);
  const cardRef        = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const DIAGRAM_SIZE  = 240;
  const POPOVER_WIDTH = 320;

  useEffect(() => {
    if (!showDiagram || !cardRef.current) return;

    const rect           = cardRef.current.getBoundingClientRect();
    const viewportWidth  = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popoverHeight  = DIAGRAM_SIZE + 140;

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
          className="relative overflow-hidden rounded-xl bg-purple-950/30 border border-purple-500/20 transition-all duration-300 hover:border-pink-500/50 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20"
        >
          <div className="aspect-[3/4] relative">
            <ImageWithFallback src={coverArt} alt={title} className="w-full h-full object-cover" />

            {/* Dark gradient — always shown, stronger on hover to show score clearly */}
            <div className={`absolute inset-0 transition-opacity duration-200 bg-gradient-to-t from-black/80 via-black/20 to-transparent ${hovered ? "opacity-60" : "opacity-100"}`} />

            {/* Score badge — fades out on hover like the title */}
            <div className={`absolute top-3 right-3 px-3 py-1 ${scoreColor.bg} rounded-full text-white font-bold text-sm shadow-lg transition-opacity duration-200 ${hovered ? "opacity-0" : "opacity-100"}`}>
              {displayScore.toFixed(1)}
            </div>

            {/* Title + platforms — hidden on hover, info moves to popover */}
            <div className={`absolute bottom-3 left-3 right-3 transition-opacity duration-200 ${hovered ? "opacity-0" : "opacity-100"}`}>
              <h3 className="text-white font-bold text-base leading-tight line-clamp-2 drop-shadow">{title}</h3>
            </div>
          </div>
        </div>
      </Link>

      {/* Popover — portal so it escapes any overflow/backdrop-filter clipping */}
      {showDiagram && createPortal(
        <div className="fixed z-[9999] pointer-events-none animate-in fade-in duration-150" style={popoverStyle}>
          <div className="w-full bg-[#0d0a1a]/95 backdrop-blur-sm border border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-900/60 overflow-hidden">

            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-purple-500/20">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-white font-bold text-lg leading-tight">{title}</h3>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <div className={`px-3 py-1 ${scoreColor.bg} rounded-full text-white font-bold text-sm shadow-lg`}>
                    {displayScore.toFixed(1)}
                  </div>
                  <span className="text-xs text-white/35">{ratingLabel}</span>
                </div>
              </div>

              {/* Meta row */}
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-purple-300">
                {developer && <span>{developer}</span>}
                {developer && year > 0 && <span className="text-purple-600">·</span>}
                {year > 0 && <span>{year}</span>}
                {genres?.length > 0 && (
                  <>
                    <span className="text-purple-600">·</span>
                    <span className="text-pink-400">{genres.slice(0, 2).join(", ")}</span>
                  </>
                )}
              </div>

              {/* Platforms */}
              {platforms.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {platforms.slice(0, 4).map(platform => (
                    <span key={platform} className="px-2 py-0.5 bg-purple-900/60 text-purple-200 text-xs rounded border border-purple-500/30">
                      {platform}
                    </span>
                  ))}
                  {platforms.length > 4 && (
                    <span className="px-2 py-0.5 text-purple-400/60 text-xs">+{platforms.length - 4} more</span>
                  )}
                </div>
              )}
            </div>

            {/* Star diagram */}
            <div className="flex items-center justify-center py-4">
              <StarPolarDiagram scores={scores} size={DIAGRAM_SIZE*1.2} showTotal={true} showLabels={true} />
            </div>

            {/* IGDB fallback notice */}
            {!hasWarpstarReviews && igdbRating > 0 && (
              <div className="px-5 pb-4 text-center text-xs text-white/30">
                No Warpstar reviews yet — showing IGDB rating
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}