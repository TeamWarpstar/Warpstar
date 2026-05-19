import { useState, useRef, useEffect } from "react";

interface Scores {
  gameplay: number;
  content: number;
  narrative: number;
  aesthetics: number;
  polish: number;
}

interface InteractiveStarDiagramProps {
  scores: Scores;
  onScoreChange: (category: keyof Scores, value: number) => void;
  size?: number;
}

const FACTOR_COLORS: Record<string, string> = {
  gameplay:   '#818cf8',
  content:    '#a78bfa',
  narrative:  '#f472b6',
  aesthetics: '#fb923c',
  polish:     '#34d399',
};

export function InteractiveStarDiagram({ scores, onScoreChange, size = 400 }: InteractiveStarDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoveringIndex, setHoveringIndex] = useState<number | null>(null);

  const factors = [
    { key: 'gameplay',   label: 'Gameplay',   angle: -90  },
    { key: 'aesthetics', label: 'Aesthetics', angle: -18  },
    { key: 'content',    label: 'Content',    angle:  54  },
    { key: 'polish',     label: 'Polish',     angle:  126 },
    { key: 'narrative',  label: 'Narrative',  angle:  198 },
  ] as const;

  const centerX   = size / 2;
  const centerY   = size / 2;
  const maxRadius = (size / 2) - 62;

  const totalScore = (
    scores.gameplay + scores.content + scores.narrative +
    scores.aesthetics + scores.polish
  ) / 5;

  const getPoint = (angle: number, value: number) => {
    const radius = (value / 10) * maxRadius;
    const rad = (angle * Math.PI) / 180;
    return { x: centerX + radius * Math.cos(rad), y: centerY + radius * Math.sin(rad) };
  };

  // Snap to nearest integer (0–10) – no decimals
  const getValueFromPoint = (x: number, y: number) => {
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const raw = (distance / maxRadius) * 10;
    return Math.min(10, Math.max(0, Math.round(raw)));
  };

  const createStarPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let path = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length; i++) {
      const cur  = pts[i];
      const next = pts[(i + 1) % pts.length];
      const d = 0.3;
      const dx = next.x - cur.x;
      const dy = next.y - cur.y;
      path += ` C ${cur.x + dx * d},${cur.y + dy * d} ${next.x - dx * d},${next.y - dy * d} ${next.x},${next.y}`;
    }
    return path;
  };

  const handleDragStart = (index: number) => setDraggingIndex(index);
  const handleDragEnd   = () => setDraggingIndex(null);

  const computeFromEvent = (clientX: number, clientY: number) => {
    if (draggingIndex === null || !svgRef.current) return;
    const rect   = svgRef.current.getBoundingClientRect();
    const scaleX = size / rect.width;
    const scaleY = size / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top)  * scaleY;
    const newValue = getValueFromPoint(x, y);
    onScoreChange(factors[draggingIndex].key, newValue);
  };

  const handleMouseMove = (e: MouseEvent) => computeFromEvent(e.clientX, e.clientY);
  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    computeFromEvent(e.touches[0].clientX, e.touches[0].clientY);
  };

  useEffect(() => {
    if (draggingIndex !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup',   handleDragEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend',  handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup',   handleDragEnd);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend',  handleDragEnd);
      };
    }
  }, [draggingIndex, scores]);

  const points    = factors.map(f => getPoint(f.angle, scores[f.key]));
  const pathData  = createStarPath(points);
  const gridLevels = [2, 4, 6, 8, 10];

  // Per-factor colored segments
  const segments = factors.map((f, i) => {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    return {
      color: FACTOR_COLORS[f.key],
      path: `M ${centerX},${centerY} L ${p1.x},${p1.y} L ${p2.x},${p2.y} Z`,
    };
  });

  return (
    // Fills whatever square container is given; no internal aspect-ratio imposed.
    <div className="relative w-full h-full select-none">
      {/* Single SVG â€” everything (grid, shape, circles, labels) lives here,
          so all coordinates are in the same space and scale uniformly. */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        className="block w-full h-full cursor-pointer"
      >
        <defs>
          <filter id="glow-iv">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid rings */}
        {gridLevels.map(lv => (
          <path
            key={`grid-${lv}`}
            d={createStarPath(factors.map(f => getPoint(f.angle, lv)))}
            fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" opacity={0.8}
            pointerEvents="none"
          />
        ))}

        {/* Axis lines per color */}
        {factors.map(f => {
          const end = getPoint(f.angle, 10);
          return (
            <line
              key={`spoke-${f.key}`}
              x1={centerX} y1={centerY} x2={end.x} y2={end.y}
              stroke={FACTOR_COLORS[f.key]} strokeWidth="1" opacity={0.35}
              pointerEvents="none"
            />
          );
        })}

        {/* Per-factor colored segments */}
        {segments.map((seg, i) => (
          <path
            key={`seg-${i}`}
            d={seg.path}
            fill={seg.color}
            fillOpacity={0.25}
            stroke="none"
          />
        ))}

        {/* Star outline */}
        <path
          d={pathData}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
          pointerEvents="none"
        />

        {/* Drag-handle circles â€” positioned entirely in SVG space */}
        {points.map((pt, i) => {
          const active = draggingIndex === i || hoveringIndex === i;
          return (
            <g key={`handle-${i}`}>
              <circle
                cx={pt.x} cy={pt.y}
                r={draggingIndex === i ? 12 : active ? 10 : 8}
                fill={FACTOR_COLORS[factors[i].key]} stroke="#fff" strokeWidth="3" filter="url(#glow-iv)"
                style={{ cursor: draggingIndex === i ? 'grabbing' : 'grab' }}
                onMouseDown={() => handleDragStart(i)}
                onTouchStart={() => handleDragStart(i)}
                onMouseEnter={() => setHoveringIndex(i)}
                onMouseLeave={() => setHoveringIndex(null)}
              />
              {active && (
                <circle
                  cx={pt.x} cy={pt.y} r={18}
                  fill="none" stroke={FACTOR_COLORS[factors[i].key]} strokeWidth="2" opacity={0.4}
                  pointerEvents="none"
                />
              )}
            </g>
          );
        })}

        {/* Factor labels â€” SVG text ensures they scale with the diagram */}
        {factors.map(f => {
          const lp    = getPoint(f.angle, 12);
          const score = scores[f.key];
          return (
            <g key={`lbl-${f.key}`} pointerEvents="none">
              <text
                x={lp.x} y={lp.y - 10}
                textAnchor="middle" dominantBaseline="middle"
                fill="rgba(255,255,255,0.8)" fontSize={Math.round(size * 0.034)}
                fontWeight="600" fontFamily="inherit"
              >
                {f.label}
              </text>
              <text
                x={lp.x} y={lp.y + 11}
                textAnchor="middle" dominantBaseline="middle"
                fill={FACTOR_COLORS[f.key]} fontSize={Math.round(size * 0.036)}
                fontWeight="bold" fontFamily="inherit"
              >
                {score}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Total score overlay â€” centred over the SVG via absolute flex */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="font-bold text-white"
               style={{ fontSize: Math.round(size * 0.12) }}>
            {totalScore.toFixed(1)}
          </div>
          <div className="text-white/50" style={{ fontSize: Math.round(size * 0.032) }}>Total</div>
        </div>
      </div>
    </div>
  );
}
