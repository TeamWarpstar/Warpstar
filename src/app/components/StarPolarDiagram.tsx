interface StarPolarDiagramProps {
  scores: {
    gameplay: number;
    content: number;
    narrative: number;
    aesthetics: number;
    polish: number;
  };
  size?: number;
  showTotal?: boolean;
}

export function StarPolarDiagram({ scores, size = 200, showTotal = true }: StarPolarDiagramProps) {
  const factors = [
    { key: 'gameplay', label: 'Gameplay', angle: -90 },
    { key: 'aesthetics', label: 'Aesthetics', angle: -18 },
    { key: 'content', label: 'Content', angle: 54 },
    { key: 'polish', label: 'Polish', angle: 126 },
    { key: 'narrative', label: 'Narrative', angle: 198 },
  ];

  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = (size / 2) - 40;

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

  const points = factors.map(f => {
    const score = scores[f.key as keyof typeof scores];
    return getPoint(f.angle, score);
  });

  const pathData = createStarPath(points);

  const gridLevels = [2, 4, 6, 8, 10];

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size, overflow: 'visible' }}>
      <svg width={size} height={size} className="absolute inset-0">
        <defs>
          <linearGradient id="star-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
          </linearGradient>
          <filter id="glow">
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
            />
          );
        })}

        <path
          d={pathData}
          fill="url(#star-gradient)"
          stroke="#ec4899"
          strokeWidth="2"
          filter="url(#glow)"
        />

        {points.map((point, i) => (
          <circle
            key={`point-${i}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#fbbf24"
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
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
              <div className="text-pink-400">{score.toFixed(1)}</div>
            </div>
          </div>
        );
      })}

      {showTotal && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              {totalScore.toFixed(1)}
            </div>
            <div className="text-xs text-purple-300">Total</div>
          </div>
        </div>
      )}
    </div>
  );
}