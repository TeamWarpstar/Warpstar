import { useId } from "react";

interface StarPolarDiagramProps {
  scores: {
    gameplay:   number;
    content:    number;
    narrative:  number;
    aesthetics: number;
    polish:     number;
  };
  size?:          number;
  showTotal?:     boolean;
  showLabels?:    boolean;
  showNumbers?:   boolean;
  /** Override the computed total — used by personalized scoring to resize the
   *  star and update the centre number without changing individual tip lengths. */
  overrideTotal?:   number;
  /** When true, renders the centre score in italic to signal it's personalized. */
  isPersonalized?:  boolean;
  /** Number of Warpstar reviews backing these scores. Gold status requires a
   *  minimum number of reviews, so callers showing an aggregate game score
   *  should pass this. Individual reviews omit it (never gold). */
  reviewCount?:     number;
}

// A star turns gold only for exceptional, well-reviewed games.
const GOLD_MIN_SCORE   = 9.5;
const GOLD_MIN_REVIEWS = 3;

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
  size          = 280,
  showTotal     = true,
  showLabels    = true,
  showNumbers   = true,
  overrideTotal,
  isPersonalized = false,
  reviewCount,
}: StarPolarDiagramProps) {
  const cx   = size / 2;
  const cy   = size / 2;

  const rawTotal = (
    scores.gameplay + scores.content + scores.narrative +
    scores.aesthetics + scores.polish
  ) / 5;

  // Use overrideTotal when provided (personalized scoring) — affects star size
  // and the centre number, but individual tip lengths stay based on raw scores.
  const totalScore = overrideTotal !== undefined ? overrideTotal : rawTotal;

  const isGold = totalScore >= GOLD_MIN_SCORE && (reviewCount ?? 0) >= GOLD_MIN_REVIEWS;
  const GOLD   = "#f5c542";

  // rMax is the fixed outer boundary — used for grid, labels, and the ghost outline
  // rMaxScaled is the actual star size, which shrinks with lower scores
  const rMax       = size / 2 - ((showLabels || showNumbers) ? size * 0.16 : size * 0.04);
  const scoreScale = 0.4 + (totalScore / 10) * 0.6;
  const rMaxScaled = rMax * scoreScale;
  const rMin       = rMaxScaled * 0.5;

  const instanceId = useId().replace(/:/g, "");
  const scoreMap = scores as unknown as Record<string, number>;
  const starPath     = smoothStarPath(scoreMap, rMin, rMaxScaled);
  const ghostStarPath = smoothStarPath(
    { gameplay: 10, aesthetics: 10, content: 10, polish: 10, narrative: 10 },
    rMax * 0.5, rMax
  );

  const clipId      = `star-clip-sc${Math.round(scoreScale*100)}-${size}-${
    [scores.gameplay, scores.aesthetics, scores.content, scores.polish, scores.narrative]
      .map(v => Math.round(v * 10)).join("-")
  }`;
  const shadowId    = `center-shadow-${instanceId}`;
  const lightId     = (i: number) => `wedge-light-${instanceId}-${i}`;
  const darkId      = (i: number) => `wedge-dark-${instanceId}-${i}`;

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

          {/* Shimmer highlight for gold star — bright near top tip */}
          {isGold && (
            <radialGradient id={`gold-shimmer-${instanceId}`} cx="50%" cy="20%" r="60%">
              <stop offset="0%"   stopColor="rgba(255,255,220,0.55)" />
              <stop offset="50%"  stopColor="rgba(255,210,60,0.15)" />
              <stop offset="100%" stopColor="rgba(255,180,0,0)" />
            </radialGradient>
          )}

          {/* Center radial shadow — dark at center, fades out */}
          <radialGradient id={shadowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(0,0,0,0.42)" />
            <stop offset="40%"  stopColor="rgba(0,0,0,0.15)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          {/* Per-wedge: light highlight (tip side) and dark shadow (base side) */}
          {FACTORS.map((_, i) => (
            <g key={i}>
              <linearGradient id={lightId(i)}
                x1={Math.cos(outerAngle(i)).toFixed(3)} y1={Math.sin(outerAngle(i)).toFixed(3)}
                x2="0" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor={isGold ? "rgba(255,250,180,0.5)" : "rgba(255,255,255,0.18)"} />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
              <linearGradient id={darkId(i)}
                x1={Math.cos(outerAngle(i) + rad(36)).toFixed(3)}
                y1={Math.sin(outerAngle(i) + rad(36)).toFixed(3)}
                x2={Math.cos(outerAngle(i)).toFixed(3)}
                y2={Math.sin(outerAngle(i)).toFixed(3)}
                gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor={isGold ? "rgba(160,90,0,0.45)" : "rgba(0,0,0,0.30)"} />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </linearGradient>
            </g>
          ))}
        </defs>

        {/* Ghost star — full size outline at max, always visible */}
        <path d={ghostStarPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

        {/* Grid rings */}
        {[2, 4, 6, 8, 10].map(lvl => (
          <path key={lvl} d={gridStarPath(lvl, rMin, rMax)}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        ))}

        {/* Base colored wedges */}
        <g clipPath={`url(#${clipId})`}>
          {FACTORS.map((f, i) => (
            <path key={f.key} d={wedgePath(i, rMaxScaled)}
              fill={isGold ? GOLD : f.color} fillOpacity="0.95" stroke="none" />
          ))}

          {/* Left-half darkening on each wedge (shadow side) */}
          {FACTORS.map((_, i) => (
            <path key={`dark-${i}`} d={wedgeHalfPath(i, rMaxScaled, "left")}
              fill={`url(#${darkId(i)})`} stroke="none" />
          ))}

          {/* Right-half brightening on each wedge (highlight side) */}
          {FACTORS.map((_, i) => (
            <path key={`light-${i}`} d={wedgeHalfPath(i, rMaxScaled, "right")}
              fill={`url(#${lightId(i)})`} stroke="none" />
          ))}

          {/* Radial shadow from center — creates depth at the hub */}
          <circle cx="0" cy="0" r={rMaxScaled * 1.5}
            fill={`url(#${shadowId})`} />

          {/* Gold shimmer overlay */}
          {isGold && (
            <circle cx="0" cy="0" r={rMaxScaled * 1.5}
              fill={`url(#gold-shimmer-${instanceId})`} />
          )}
        </g>

        {/* Seam lines between wedges — hidden for gold stars */}
        {!isGold && FACTORS.map((_, i) => {
          const [ix, iy] = innerPt(i, rMin);
          return (
            <line key={`seam-${i}`}
              x1="0" y1="0" x2={ix.toFixed(2)} y2={iy.toFixed(2)}
              stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
          );
        })}

        {/* Outer seam strokes — dark base, then gold glow for gold stars */}
        <path d={starPath} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={isGold ? 2 : 3} />
        <path d={starPath} fill="none"
          stroke={isGold ? "rgba(245,197,66,0.55)" : "rgba(255,255,255,0.18)"}
          strokeWidth={isGold ? 1.5 : 1} />
        {isGold && (
          <path d={starPath} fill="none"
            stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
        )}

        {/* Labels — name and/or score next to each tip */}
        {(showLabels || showNumbers) && FACTORS.map((f, i) => {
          const score  = scoreMap[f.key];
          const a      = outerAngle(i);
          // Fixed anchor at max radius so labels don't move with score
          const r      = rMax + size * 0.07;
          const lx     = r * Math.cos(a);
          const ly     = r * Math.sin(a);
          const cos    = Math.cos(a);
          const sin    = Math.sin(a);
          const anchor = cos > 0.25 ? "start" : cos < -0.25 ? "end" : "middle";
          const fs     = Math.max(9, size * 0.044);
          const both   = showLabels && showNumbers;
          const nameY  = both ? (sin < -0.1 ? ly - fs * 0.7 : ly + fs * 0.7) : ly;
          const scoreY = both ? (sin < -0.1 ? ly + fs * 0.7 : nameY + fs * 1.3) : ly;
          return (
            <g key={f.key}>
              {showLabels && (
                <text x={lx.toFixed(1)} y={nameY.toFixed(1)}
                  textAnchor={anchor} dominantBaseline="middle"
                  fill="rgba(255,255,255,0.85)" fontSize={fs} fontWeight="600" fontFamily="sans-serif">
                  {f.label}
                </text>
              )}
              {showNumbers && (
                <text
                  x={lx.toFixed(1)}
                  y={scoreY.toFixed(1)}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fill={f.color}
                  fontSize={fs}
                  fontWeight="700"
                  fontFamily="sans-serif"
                >
                  {Number.isInteger(score) ? score : score.toFixed(1)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Center total */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div
            className="star-total"
            style={{
              fontSize: isPersonalized ? size * 0.20 : size * 0.20,
              fontWeight: 700,
              fontStyle: isPersonalized ? "italic" : "normal",
              transform: isPersonalized ? "translateX(-4%)" : undefined,
              color: "#ffffff",
              lineHeight: 1.1,
              textShadow:
                "0 0 5px rgba(0,0,0,0.6), 0 0 11px rgba(0,0,0,0.4)",
            }}
          >
            {Number.isInteger(totalScore)
              ? totalScore
              : totalScore.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}