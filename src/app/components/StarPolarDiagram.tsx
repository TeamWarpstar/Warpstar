interface StarPolarDiagramProps {
  scores: {
    gameplay:   number;
    content:    number;
    narrative:  number;
    aesthetics: number;
    polish:     number;
  };
  size?:       number;
  showTotal?:  boolean;
  showLabels?: boolean;
}

const FACTORS = [
  { key: "gameplay"   as const, label: "Gameplay",   color: "#6373ff" },
  { key: "aesthetics" as const, label: "Aesthetics", color: "#ff9a48" },
  { key: "content"    as const, label: "Content",    color: "#a95eff" },
  { key: "polish"     as const, label: "Polish",     color: "#61bb74" },
  { key: "narrative"  as const, label: "Narrative",  color: "#f55f5f" },
];

const N = 5;

function rad(deg: number) { return (deg * Math.PI) / 180; }
function outerAngle(i: number) { return rad(-90 + i * 72); }
function innerAngle(i: number) { return rad(-90 + 36 + i * 72); }

function outerPt(i: number, score: number, rMin: number, rMax: number): [number, number] {
  const r = rMin + (score / 10) * (rMax - rMin);
  const a = outerAngle(i);
  return [r * Math.cos(a), r * Math.sin(a)];
}
function innerPt(i: number, rMin: number): [number, number] {
  const a = innerAngle(i);
  return [rMin * Math.cos(a), rMin * Math.sin(a)];
}

function smoothStarPath(scoreMap: Record<string, number>, rMin: number, rMax: number): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    pts.push(outerPt(i, scoreMap[FACTORS[i].key], rMin, rMax));
    pts.push(innerPt(i, rMin));
  }
  const len = pts.length;
  const T_O = 0.12, T_I = 0.05;
  let d = `M ${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < len; i++) {
    const prev = pts[(i - 1 + len) % len];
    const cur  = pts[i];
    const nxt  = pts[(i + 1) % len];
    const nn   = pts[(i + 2) % len];
    const t    = i % 2 === 0 ? T_O : T_I;
    d += ` C ${(cur[0]+(nxt[0]-prev[0])*t).toFixed(2)},${(cur[1]+(nxt[1]-prev[1])*t).toFixed(2)} ${(nxt[0]-(nn[0]-cur[0])*t).toFixed(2)},${(nxt[1]-(nn[1]-cur[1])*t).toFixed(2)} ${nxt[0].toFixed(2)},${nxt[1].toFixed(2)}`;
  }
  return d + " Z";
}

function wedgePath(i: number, rMax: number): string {
  const R     = rMax * 1.5;
  const aFrom = outerAngle(i) - rad(36);
  const aTo   = outerAngle(i) + rad(36);
  const steps = 8;
  const pts: string[] = [`0,0`];
  for (let s = 0; s <= steps; s++) {
    const a = aFrom + (aTo - aFrom) * (s / steps);
    pts.push(`${(R * Math.cos(a)).toFixed(2)},${(R * Math.sin(a)).toFixed(2)}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

// Left half of a wedge — darker shading side
function wedgeHalfPath(i: number, rMax: number, side: "left" | "right"): string {
  const R    = rMax * 1.5;
  const mid  = outerAngle(i);
  const from = side === "left" ? mid - rad(36) : mid;
  const to   = side === "left" ? mid            : mid + rad(36);
  const steps = 4;
  const pts: string[] = [`0,0`];
  for (let s = 0; s <= steps; s++) {
    const a = from + (to - from) * (s / steps);
    pts.push(`${(R * Math.cos(a)).toFixed(2)},${(R * Math.sin(a)).toFixed(2)}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

function gridStarPath(level: number, rMin: number, rMax: number): string {
  const pts: string[] = [];
  for (let i = 0; i < N; i++) {
    const r = rMin + (level / 10) * (rMax - rMin);
    pts.push(`${(r * Math.cos(outerAngle(i))).toFixed(1)},${(r * Math.sin(outerAngle(i))).toFixed(1)}`);
    pts.push(`${(rMin * Math.cos(innerAngle(i))).toFixed(1)},${(rMin * Math.sin(innerAngle(i))).toFixed(1)}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

export function StarPolarDiagram({
  scores,
  size       = 280,
  showTotal  = true,
  showLabels = true,
}: StarPolarDiagramProps) {
  const cx   = size / 2;
  const cy   = size / 2;
  const rMax = size / 2 - (showLabels ? size * 0.22 : size * 0.06);
  const rMin = rMax * 0.5;

  const totalScore = (
    scores.gameplay + scores.content + scores.narrative +
    scores.aesthetics + scores.polish
  ) / 5;

  const scoreMap = scores as unknown as Record<string, number>;
  const starPath = smoothStarPath(scoreMap, rMin, rMax);

  const clipId      = `star-clip-${size}-${
    [scores.gameplay, scores.aesthetics, scores.content, scores.polish, scores.narrative]
      .map(v => Math.round(v * 10)).join("-")
  }`;
  const shadowId    = `center-shadow-${size}`;
  const lightId     = (i: number) => `wedge-light-${size}-${i}`;
  const darkId      = (i: number) => `wedge-dark-${size}-${i}`;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size, overflow: "visible" }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`${-cx} ${-cy} ${size} ${size}`}
        overflow="visible"
        className="absolute inset-0"
      >
        <defs>
          {/* Star clip */}
          <clipPath id={clipId}>
            <path d={starPath} />
          </clipPath>

          {/* Center radial shadow — dark at center, fades out */}
          <radialGradient id={shadowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(0,0,0,0.7)" />
            <stop offset="40%"  stopColor="rgba(0,0,0,0.25)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          {/* Per-wedge: light highlight (tip side) and dark shadow (base side) */}
          {FACTORS.map((_, i) => (
            <g key={i}>
              <linearGradient id={lightId(i)}
                x1={Math.cos(outerAngle(i)).toFixed(3)} y1={Math.sin(outerAngle(i)).toFixed(3)}
                x2="0" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="rgba(255,255,255,0.18)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
              <linearGradient id={darkId(i)}
                x1={Math.cos(outerAngle(i) + rad(36)).toFixed(3)}
                y1={Math.sin(outerAngle(i) + rad(36)).toFixed(3)}
                x2={Math.cos(outerAngle(i)).toFixed(3)}
                y2={Math.sin(outerAngle(i)).toFixed(3)}
                gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="rgba(0,0,0,0.30)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </linearGradient>
            </g>
          ))}
        </defs>

        {/* Grid rings */}
        {[2, 4, 6, 8, 10].map(lvl => (
          <path key={lvl} d={gridStarPath(lvl, rMin, rMax)}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        ))}

        {/* Base colored wedges */}
        <g clipPath={`url(#${clipId})`}>
          {FACTORS.map((f, i) => (
            <path key={f.key} d={wedgePath(i, rMax)}
              fill={f.color} fillOpacity="0.95" stroke="none" />
          ))}

          {/* Left-half darkening on each wedge (shadow side) */}
          {FACTORS.map((_, i) => (
            <path key={`dark-${i}`} d={wedgeHalfPath(i, rMax, "left")}
              fill={`url(#${darkId(i)})`} stroke="none" />
          ))}

          {/* Right-half brightening on each wedge (highlight side) */}
          {FACTORS.map((_, i) => (
            <path key={`light-${i}`} d={wedgeHalfPath(i, rMax, "right")}
              fill={`url(#${lightId(i)})`} stroke="none" />
          ))}

          {/* Radial shadow from center — creates depth at the hub */}
          <circle cx="0" cy="0" r={rMax * 1.5}
            fill={`url(#${shadowId})`} />
        </g>

        {/* Seam lines between wedges */}
        {FACTORS.map((_, i) => {
          const [ix, iy] = innerPt(i, rMin);
          const [ox, oy] = outerPt(i, scoreMap[FACTORS[i].key], rMin, rMax);
          return (
            <line key={`seam-${i}`}
              x1="0" y1="0" x2={ix.toFixed(2)} y2={iy.toFixed(2)}
              stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
          );
        })}

        {/* Outer seam strokes — dark then subtle white */}
        <path d={starPath} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="3" />
        <path d={starPath} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

        {/* Score labels */}
        {showLabels && FACTORS.map((f, i) => {
          const score  = scoreMap[f.key];
          const a      = outerAngle(i);
          const r      = rMin + (score / 10) * (rMax - rMin) + size * 0.055;
          const lx     = r * Math.cos(a);
          const ly     = r * Math.sin(a);
          const cos    = Math.cos(a);
          const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
          const fs     = Math.max(10, size * 0.048);
          return (
            <text key={f.key} x={lx.toFixed(1)} y={ly.toFixed(1)}
              textAnchor={anchor} dominantBaseline="middle"
              fill={f.color} fontSize={fs} fontWeight="600" fontFamily="sans-serif">
              {score.toFixed(1)}
            </text>
          );
        })}
      </svg>

      {/* Center total */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div style={{
            fontSize:   size * 0.12,
            fontWeight: 700,
            color:      "#ffffff",
            lineHeight: 1.1,
            textShadow: "0 0 6px rgba(0,0,0,1), 0 0 12px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,1)",
          }}>
            {totalScore.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}