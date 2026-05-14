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
  showLabels?: boolean;
}

const FACTOR_COLORS: Record<string, string> = {
  gameplay:   '#818cf8',
  content:    '#a78bfa',
  narrative:  '#f472b6',
  aesthetics: '#fb923c',
  polish:     '#34d399',
};

export function StarPolarDiagram({ scores, size = 200, showTotal = true, showLabels = true }: StarPolarDiagramProps) {
  const factors = [
    { key: 'gameplay',   label: 'Gameplay',   angle: -90  },
    { key: 'aesthetics', label: 'Aesthetics', angle: -18  },
    { key: 'content',    label: 'Content',    angle: 54   },
    { key: 'polish',     label: 'Polish',     angle: 126  },
    { key: 'narrative',  label: 'Narrative',  angle: 198  },
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
      path += ` C ${current.x + dx * controlDist},${current.y + dy * controlDist} ${next.x - dx * controlDist},${next.y - dy * controlDist} ${next.x},${next.y}`;
    }
    return path;
  };

  const points = factors.map(f => {
    const score = scores[f.key as keyof typeof scores];
    return getPoint(f.angle, score);
  });

  const pathData = createStarPath(points);
  const gridLevels = [2, 4, 6, 8, 10];

  // Each segment: center → point[i] → point[i+1] (straight triangle)
  const segments = factors.map((f, i) => {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    return {
      color: FACTOR_COLORS[f.key],
      path: `M ${centerX},${centerY} L ${p1.x},${p1.y} L ${p2.x},${p2.y} Z`,
    };
  });

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size, overflow: 'visible' }}>
      <svg width={size} height={size} className="absolute inset-0">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid pentagons */}
        {gridLevels.map(level => {
          const gridPoints = factors.map(f => getPoint(f.angle, level));
          const gridPath = createStarPath(gridPoints);
          return (
            <path
              key={`grid-${level}`}
              d={gridPath}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis lines per color */}
        {factors.map(f => {
          const end = getPoint(f.angle, 10);
          return (
            <line
              key={`line-${f.key}`}
              x1={centerX}
              y1={centerY}
              x2={end.x}
              y2={end.y}
              stroke={FACTOR_COLORS[f.key]}
              strokeWidth="1"
              opacity={0.35}
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
          filter="url(#glow)"
        />

        {/* Per-factor colored dots */}
        {points.map((point, i) => (
          <circle
            key={`point-${i}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={FACTOR_COLORS[factors[i].key]}
            stroke="#fff"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      {/* Labels — anchored outward based on angle so they never overlap the diagram */}
      {showLabels && factors.map(f => {
        const labelPoint = getPoint(f.angle, 12);
        const score = scores[f.key as keyof typeof scores];
        const color = FACTOR_COLORS[f.key];

        const rad = (f.angle * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        // Horizontal anchor: left of point when facing right, right of point when facing left
        const tx = cos > 0.25 ? '5%' : cos < -0.25 ? '-105%' : '-50%';
        // Vertical anchor: above point when facing up, below when facing down
        const ty = sin < -0.25 ? '-95%' : sin > 0.25 ? '-5%' : '-50%';
        const textAlign = cos > 0.25 ? 'left' : cos < -0.25 ? 'right' : 'center';

        return (
          <div
            key={`label-${f.key}`}
            className="absolute text-xs whitespace-nowrap pointer-events-none"
            style={{
              left: labelPoint.x,
              top: labelPoint.y,
              transform: `translate(${tx}, ${ty})`,
              color: 'rgba(255,255,255,0.75)',
              textAlign,
            }}
          >
            <div className="font-semibold">{f.label}</div>
            <div style={{ color }}>{score.toFixed(1)}</div>
          </div>
        );
      })}

      {/* Central total score */}
      {showTotal && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div
              className="font-bold"
              style={{
                fontSize: size * 0.18,
                color: '#ffffff',
                textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,1)',
                lineHeight: 1.1,
              }}
            >
              {totalScore.toFixed(1)}
            </div>
            <div style={{
              fontSize: size * 0.055,
              color: 'rgba(255,255,255,0.8)',
              textShadow: '0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.9)',
              marginTop: 1,
            }}>
              Total
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
