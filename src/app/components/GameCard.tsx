import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { StarPolarDiagram } from "./StarPolarDiagram";
import { ImageWithFallback } from "./ImageWithFallback";
import { createPortal } from "react-dom";
import { scoreStyle } from "./scoreStyle";

interface GameCardProps {
  id: string;
  title: string;
  coverArt: string;
  platforms: string[];
  developer: string;
  year: number;
  genre: string;
  scores: {
    gameplay: number;
    content: number;
    narrative: number;
    aesthetics: number;
    polish: number;
  };
}

export function GameCard({ id, title, coverArt, platforms, developer, year, genre, scores }: GameCardProps) {
  const [showDiagram, setShowDiagram] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const DIAGRAM_SIZE = 240;
  const POPOVER_WIDTH = 320;

  useEffect(() => {
    if (!showDiagram || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popoverHeight = DIAGRAM_SIZE + 120;
    const GAP = 10;
    const MARGIN = 8;

    // Cap popover width to viewport
    const width = Math.min(POPOVER_WIDTH, viewportWidth - MARGIN * 2);

    // Prefer right, fall back to left
    let left = rect.right + GAP;
    if (left + width > viewportWidth - MARGIN) {
      left = rect.left - width - GAP;
    }
    // Clamp so it never overflows either edge
    left = Math.min(Math.max(MARGIN, left), viewportWidth - width - MARGIN);

    // Vertically center on the card, clamp to viewport
    // rect.top is already viewport-relative; fixed positioning needs no scrollY offset
    let top = rect.top + rect.height / 2 - popoverHeight / 2;
    top = Math.max(MARGIN, Math.min(viewportHeight - popoverHeight - MARGIN, top));

    setPopoverStyle({ left, top, width });
  }, [showDiagram]);

  const totalScore = (
    scores.gameplay +
    scores.content +
    scores.narrative +
    scores.aesthetics +
    scores.polish
  ) / 5;

  const { bg: scoreBg, text: scoreText } = scoreStyle(totalScore);

  return (
    <>
      <Link
        to={`/game/${id}`}
        className="group relative block"
        onMouseEnter={() => setShowDiagram(true)}
        onMouseLeave={() => setShowDiagram(false)}
      >
        <div ref={cardRef} className="game-card relative overflow-hidden rounded-xl bg-purple-950/30 border border-purple-500/20 transition-all duration-300 hover:border-pink-500/50 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20">
          <div className="aspect-[3/4] relative">
            <ImageWithFallback
              src={coverArt}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className={`absolute top-3 right-3 px-3 py-1 ${scoreBg} rounded-full ${scoreText} font-bold text-sm shadow-lg`}>
              {totalScore.toFixed(1)}
            </div>

            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="text-[#ffffff] font-bold text-lg mb-2 line-clamp-2">{title}</h3>
              <div className="flex flex-wrap gap-1">
                {platforms.map(platform => (
                  <span
                    key={platform}
                    className="px-2 py-1 bg-purple-900/80 text-purple-200 text-xs rounded-md border border-purple-500/30"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Link>

      {showDiagram && createPortal(
        <div
          className="fixed z-50 pointer-events-none animate-in fade-in duration-150"
          style={popoverStyle}
        >
          <div className="game-card-popover w-full bg-[#0d0a1a]/95 backdrop-blur-sm border border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-900/60 overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-purple-500/20">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[#ffffff] font-bold text-lg leading-tight">{title}</h3>
                <div className={`shrink-0 px-3 py-1 ${scoreBg} rounded-full ${scoreText} font-bold text-sm shadow-lg`}>
                  {totalScore.toFixed(1)}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-purple-300">
                <span>{developer}</span>
                <span className="text-purple-600">·</span>
                <span>{year}</span>
                <span className="text-purple-600">·</span>
                <span className="text-pink-400">{genre}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {platforms.map(platform => (
                  <span
                    key={platform}
                    className="px-2 py-0.5 bg-purple-900/60 text-purple-200 text-xs rounded border border-purple-500/30"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>

            {/* Diagram */}
            <div className="flex items-center justify-center py-3">
              <StarPolarDiagram scores={scores} size={DIAGRAM_SIZE} showTotal={false} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
