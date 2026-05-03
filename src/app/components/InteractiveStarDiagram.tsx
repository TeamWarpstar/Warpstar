import { useState, useRef, useEffect } from "react";

interface InteractiveStarDiagramProps {
  scores: {
    gameplay: number;
    content: number;
    narrative: number;
    aesthetics: number;
    polish: number;
  };
  onScoreChange: (category: keyof InteractiveStarDiagramProps['scores'], value: number) => void;
  size?: number;
}

export function InteractiveStarDiagram({ scores, onScoreChange, size = 400 }: InteractiveStarDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoveringIndex, setHoveringIndex] = useState<number | null>(null);

  const factors = [
    { key: 'gameplay', label: 'Gameplay', angle: -90 },
    { key: 'aesthetics', label: 'Aesthetics', angle: -18 },
    { key: 'content', label: 'Content', angle: 54 },
    { key: 'polish', label: 'Polish', angle: 126 },
    { key: 'narrative', label: 'Narrative', angle: 198 },
  ];

  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = (size / 2) - 60;

  const totalScore = (
    scores.gameplay +
    scores.content +
    scores.narrative +
    scores.aesthetics +
    scores.polish
  ) / 5;

  const getPoint = (angle: number, value: number) => {
    const radius = (value / 10) * maxRadius;
    const rad = (angle * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(rad),
      y: centerY + radius * Math.sin(rad),
    };
  };

  const getValueFromPoint = (x: number, y: number, angle: number) => {
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const value = Math.min(10, Math.max(0, (distance / maxRadius) * 10));
    return Math.round(value * 10) / 10;
  };

  const createStarPath = (pointsArray: { x: number; y: number }[]) => {
    if (pointsArray.length === 0) return '';

    let path = `M ${pointsArray[0].x},${pointsArray[0].y}`;

    for (let i = 0; i < pointsArray.length; i++) {
      const current = pointsArray[i];
      const next = pointsArray[(i + 1) % pointsArray.length];

      const controlDist = 0.3;
      const dx = next.x - current.x;
      const dy = next.y - current.y;

      const cx1 = current.x + dx * controlDist;
      const cy1 = current.y + dy * controlDist;
      const cx2 = next.x - dx * controlDist;
      const cy2 = next.y - dy * controlDist;

      path += ` C ${cx1},${cy1} ${cx2},${cy2} ${next.x},${next.y}`;
    }

    return path;
  };

  const handleMouseDown = (index: number) => {
    setDraggingIndex(index);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (draggingIndex === null || !svgRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const scaleX = size / rect.width;
    const scaleY = size / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const factor = factors[draggingIndex];
    const newValue = getValueFromPoint(x, y, factor.angle);

    onScoreChange(factor.key as keyof typeof scores, newValue);
  };

  const handleMouseUp = () => {
    setDraggingIndex(null);
  };

  const handleTouchStart = (index: number) => {
    setDraggingIndex(index);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (draggingIndex === null || !svgRef.current) return;

    e.preventDefault();
    const touch = e.touches[0];
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const scaleX = size / rect.width;
    const scaleY = size / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    const factor = factors[draggingIndex];
    const newValue = getValueFromPoint(x, y, factor.angle);

    onScoreChange(factor.key as keyof typeof scores, newValue);
  };

  const handleTouchEnd = () => {
    setDraggingIndex(null);
  };

  useEffect(() => {
    if (draggingIndex !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [draggingIndex, scores]);

  const points = factors.map(f => {
    const score = scores[f.key as keyof typeof scores];
    return getPoint(f.angle, score);
  });

  const pathData = createStarPath(points);

  const gridLevels = [2, 4, 6, 8, 10];

  return (
    <div className="relative flex items-center justify-center select-none w-full h-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 cursor-pointer w-full h-full"
      >
        <defs>
          <linearGradient id="star-gradient-interactive" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
          </linearGradient>
          <filter id="glow-interactive">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {gridLevels.map(level => {
          const gridPoints = factors.map(f => getPoint(f.angle, level));
          const gridPath = createStarPath(gridPoints);
          return (
            <path
              key={`grid-${level}`}
              d={gridPath}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="1"
              opacity={0.2}
              pointerEvents="none"
            />
          );
        })}

        {factors.map(f => {
          const end = getPoint(f.angle, 10);
          return (
            <line
              key={`line-${f.key}`}
              x1={centerX}
              y1={centerY}
              x2={end.x}
              y2={end.y}
              stroke="#8b5cf6"
              strokeWidth="1"
              opacity={0.3}
              pointerEvents="none"
            />
          );
        })}

        <path
          d={pathData}
          fill="url(#star-gradient-interactive)"
          stroke="#ec4899"
          strokeWidth="2"
          filter="url(#glow-interactive)"
          pointerEvents="none"
        />

        {points.map((point, i) => {
          const isActive = draggingIndex === i || hoveringIndex === i;
          return (
            <g key={`point-${i}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={draggingIndex === i ? 12 : isActive ? 10 : 8}
                fill="#fbbf24"
                stroke="#fff"
                strokeWidth="3"
                className={`transition-all ${draggingIndex === i ? 'cursor-grabbing' : 'cursor-grab hover:scale-110'}`}
                onMouseDown={() => handleMouseDown(i)}
                onTouchStart={() => handleTouchStart(i)}
                onMouseEnter={() => setHoveringIndex(i)}
                onMouseLeave={() => setHoveringIndex(null)}
                style={{ cursor: draggingIndex === i ? 'grabbing' : 'grab' }}
              />
              {(draggingIndex === i || hoveringIndex === i) && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={16}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  opacity={0.5}
                  pointerEvents="none"
                  className="animate-pulse"
                />
              )}
            </g>
          );
        })}
      </svg>

      {factors.map(f => {
        const labelPoint = getPoint(f.angle, 11.5);
        const score = scores[f.key as keyof typeof scores];
        return (
          <div
            key={`label-${f.key}`}
            className="absolute text-xs text-purple-200 whitespace-nowrap pointer-events-none"
            style={{
              left: labelPoint.x,
              top: labelPoint.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="text-center">
              <div className="font-semibold">{f.label}</div>
              <div className="text-pink-400 font-bold">{score.toFixed(1)}</div>
            </div>
          </div>
        );
      })}

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-5xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            {totalScore.toFixed(1)}
          </div>
          <div className="text-xs text-purple-300">Total</div>
        </div>
      </div>
    </div>
  );
}
