import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { ImageWithFallback } from "./ImageWithFallback";
import { Loader2 } from "lucide-react";
import { getGame, getGameReviews, Game } from "../../api/games";
import { createReview, updateReview } from "../../api/reviews";
import { useAuth } from "../context/AuthContext";
import { useId } from "react";

interface ReviewScores {
  gameplay: number; content: number; narrative: number;
  aesthetics: number; polish: number;
}
interface CategoryText {
  gameplay: string; content: string; narrative: string;
  aesthetics: string; polish: string;
}

const SCORE_FACTORS = [
  { key: "gameplay"   as const, label: "Gameplay",   color: "#6373ff",
    description: "How well do the mechanics, controls, and core gameplay loop serve the overall experience?" },
  { key: "aesthetics" as const, label: "Aesthetics", color: "#ff9a48",
    description: "How appealing is this game's graphical and audio design?" },
  { key: "content"    as const, label: "Content",    color: "#a95eff",
    description: "How much content is there, and how engaging is it?" },
  { key: "polish"     as const, label: "Polish",     color: "#61bb74",
    description: "How refined is the overall presentation and execution?" },
  { key: "narrative"  as const, label: "Narrative",  color: "#f55f5f",
    description: "How good is this game at telling a story?" },
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
    pts.push(outerPt(i, scoreMap[SCORE_FACTORS[i].key], rMin, rMax));
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
  const R = rMax * 1.5;
  const aFrom = outerAngle(i) - rad(36);
  const aTo   = outerAngle(i) + rad(36);
  const pts: string[] = ["0,0"];
  for (let s = 0; s <= 8; s++) {
    const a = aFrom + (aTo - aFrom) * (s / 8);
    pts.push(`${(R * Math.cos(a)).toFixed(2)},${(R * Math.sin(a)).toFixed(2)}`);
  }
  return `M ${pts.join(" L ")} Z`;
}
function wedgeHalfPath(i: number, rMax: number, side: "left" | "right"): string {
  const R = rMax * 1.5;
  const mid = outerAngle(i);
  const from = side === "left" ? mid - rad(36) : mid;
  const to   = side === "left" ? mid            : mid + rad(36);
  const pts: string[] = ["0,0"];
  for (let s = 0; s <= 4; s++) {
    const a = from + (to - from) * (s / 4);
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

// ---------------------------------------------------------------------------
// Interactive star diagram
// ---------------------------------------------------------------------------

function InteractiveStar({
  scores,
  onScoreChange,
  size = 320,
}: {
  scores: ReviewScores;
  onScoreChange: (key: keyof ReviewScores, value: number) => void;
  size?: number;
}) {
  const uid     = useId().replace(/:/g, "");
  const svgRef  = useRef<SVGSVGElement>(null);
  const dragging = useRef<number | null>(null);

  const cx   = size / 2;
  const cy   = size / 2;
  const totalScore = (scores.gameplay + scores.content + scores.narrative + scores.aesthetics + scores.polish) / 5;
  const baseRMax   = size / 2 - size * 0.20;
  const rMax       = baseRMax;
  const rMin       = rMax * 0.5;
  const scoreMap   = scores as unknown as Record<string, number>;
  const starPath   = smoothStarPath(scoreMap, rMin, rMax);
  const ghostPath  = smoothStarPath({ gameplay:10, aesthetics:10, content:10, polish:10, narrative:10 }, baseRMax*0.5, baseRMax);

  const clipId   = `ic-clip-${uid}`;
  const shadowId = `ic-shadow-${uid}`;
  const lightId  = (i: number) => `ic-light-${uid}-${i}`;
  const darkId   = (i: number) => `ic-dark-${uid}-${i}`;

  const pointerToScore = useCallback((e: PointerEvent | React.PointerEvent, armIdx: number): number => {
    if (!svgRef.current) return 5;
    const rect = svgRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left - cx;
    const py = e.clientY - rect.top  - cy;
    const a   = outerAngle(armIdx);
    const dot = px * Math.cos(a) + py * Math.sin(a);
    const raw = ((dot - baseRMax * 0.5) / (baseRMax - baseRMax * 0.5)) * 10;
    return Math.min(10, Math.max(0, Math.round(raw * 2) / 2));
  }, [cx, cy, baseRMax]);

  const onPointerDown = (i: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = i;
    (e.target as Element).setPointerCapture(e.pointerId);
    const score = pointerToScore(e, i);
    onScoreChange(SCORE_FACTORS[i].key, score);
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (dragging.current === null) return;
      const score = pointerToScore(e, dragging.current);
      onScoreChange(SCORE_FACTORS[dragging.current].key, score);
    };
    const onUp = () => { dragging.current = null; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [pointerToScore, onScoreChange]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size, overflow: "visible" }}>
      <svg ref={svgRef} width={size} height={size}
        viewBox={`${-cx} ${-cy} ${size} ${size}`}
        overflow="visible" className="absolute inset-0" style={{ touchAction: "none" }}>
        <defs>
          <clipPath id={clipId}><path d={starPath} /></clipPath>
          <radialGradient id={shadowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(0,0,0,0.7)" />
            <stop offset="40%"  stopColor="rgba(0,0,0,0.25)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          {SCORE_FACTORS.map((_, i) => (
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

        <path d={ghostPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

        {[2,4,6,8,10].map(lvl => (
          <path key={lvl} d={gridStarPath(lvl, rMin, rMax)}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        ))}

        <g clipPath={`url(#${clipId})`}>
          {SCORE_FACTORS.map((f, i) => (
            <path key={f.key} d={wedgePath(i, rMax)} fill={f.color} fillOpacity="0.95" stroke="none" />
          ))}
          {SCORE_FACTORS.map((_, i) => (
            <path key={`d${i}`} d={wedgeHalfPath(i, rMax, "left")}  fill={`url(#${darkId(i)})`}  stroke="none" />
          ))}
          {SCORE_FACTORS.map((_, i) => (
            <path key={`l${i}`} d={wedgeHalfPath(i, rMax, "right")} fill={`url(#${lightId(i)})`} stroke="none" />
          ))}
          <circle cx="0" cy="0" r={rMax * 1.5} fill={`url(#${shadowId})`} />
        </g>

        {SCORE_FACTORS.map((_, i) => {
          const [ix, iy] = innerPt(i, rMin);
          return <line key={`s${i}`} x1="0" y1="0" x2={ix.toFixed(2)} y2={iy.toFixed(2)}
            stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />;
        })}

        <path d={starPath} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="3" />
        <path d={starPath} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

        {SCORE_FACTORS.map((f, i) => {
          const [px, py] = outerPt(i, scoreMap[f.key], rMin, rMax);
          return (
            <circle key={f.key}
              cx={px.toFixed(2)} cy={py.toFixed(2)} r={8}
              fill={f.color} stroke="rgba(255,255,255,0.8)" strokeWidth="2"
              style={{ cursor: "grab" }}
              onPointerDown={onPointerDown(i)}
            />
          );
        })}

        {SCORE_FACTORS.map((f, i) => {
          const a      = outerAngle(i);
          const r      = baseRMax + size * 0.10;
          const lx     = r * Math.cos(a);
          const ly     = r * Math.sin(a);
          const cos    = Math.cos(a);
          const sin    = Math.sin(a);
          const anchor = cos > 0.25 ? "start" : cos < -0.25 ? "end" : "middle";
          const fs     = Math.max(9, size * 0.044);
          const both   = true;
          const nameY  = both ? (sin < -0.1 ? ly - fs * 0.7 : ly + fs * 0.7) : ly;
          const scoreY = both ? (sin < -0.1 ? ly + fs * 0.7 : nameY + fs * 1.3) : ly;
          return (
            <g key={f.key}>
              <text x={lx.toFixed(1)} y={nameY.toFixed(1)}
                textAnchor={anchor} dominantBaseline="middle"
                fill="rgba(255,255,255,0.85)" fontSize={fs} fontWeight="600" fontFamily="sans-serif">
                {f.label}
              </text>
              <text x={lx.toFixed(1)} y={scoreY.toFixed(1)}
                textAnchor={anchor} dominantBaseline="middle"
                fill={f.color} fontSize={fs} fontWeight="700" fontFamily="sans-serif">
                {scoreMap[f.key].toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div style={{
          fontSize: size * 0.12, fontWeight: 700, color: "#ffffff", lineHeight: 1.1,
          textShadow: "0 0 6px rgba(0,0,0,1), 0 0 12px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,1)",
        }}>
          {totalScore.toFixed(1)}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function CreateReviewPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [game,       setGame]       = useState<Game | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [posting,    setPosting]    = useState(false);
  const [error,      setError]      = useState("");

  const [scores, setScores] = useState<ReviewScores>({
    gameplay: 5, content: 5, narrative: 5, aesthetics: 5, polish: 5,
  });
  const [categoryText, setCategoryText] = useState<CategoryText>({
    gameplay: "", content: "", narrative: "", aesthetics: "", polish: "",
  });
  const [title,    setTitle]    = useState("");
  const [summary,  setSummary]  = useState("");
  const [spoilers, setSpoilers] = useState(false);

  const isEditing = !!existingId;

  useEffect(() => {
    if (!gameId || !user) return;
    Promise.all([
      getGame(gameId),
      getGameReviews(gameId) as Promise<any>,
    ]).then(([g, r]) => {
      setGame(g);
      const existing = (r.results ?? []).find((rev: any) => rev.username === user.username);
      if (existing) {
        setExistingId(existing.id);
        setTitle(existing.title ?? "");
        setSummary(existing.body ?? "");
        setSpoilers(existing.containsSpoilers ?? false);
        setScores({
          gameplay:   existing.gameplay   ?? 5,
          content:    existing.content    ?? 5,
          narrative:  existing.narrative  ?? 5,
          aesthetics: existing.aesthetics ?? 5,
          polish:     existing.polish     ?? 5,
        });
        setCategoryText({
          gameplay:   existing.gp_body  ?? "",
          content:    existing.con_body ?? "",
          narrative:  existing.ntv_body ?? "",
          aesthetics: existing.aes_body ?? "",
          polish:     existing.pol_body ?? "",
        });
      }
    }).finally(() => setLoading(false));
  }, [gameId, user]);

  if (!user) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-white/50 text-lg">Please sign in to write a review.</p>
    </div>
  );

  const handleScoreChange = (key: keyof ReviewScores, value: number) => {
    setScores(prev => ({ ...prev, [key]: Math.min(10, Math.max(0, Math.round(value * 2) / 2)) }));
  };

  const handlePost = async () => {
    if (!gameId) return;
    if (!title.trim())   { setError("Please add a title for your review."); return; }
    if (!summary.trim()) { setError("Please write an overall review before posting."); return; }
    setError("");
    setPosting(true);
    const payload = {
      ...scores,
      title:            title.trim(),
      body:             summary,
      gp_body:          categoryText.gameplay,
      con_body:         categoryText.content,
      ntv_body:         categoryText.narrative,
      aes_body:         categoryText.aesthetics,
      pol_body:         categoryText.polish,
      containsSpoilers: spoilers,
    };
    try {
      if (isEditing) await updateReview(existingId!, payload);
      else           await createReview(gameId, payload);
      navigate(`/game/${gameId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save review.");
      setPosting(false);
    }
  };

  const totalScore = (scores.gameplay + scores.content + scores.narrative + scores.aesthetics + scores.polish) / 5;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          {isEditing ? "Edit Your Review" : "Write a Review"}
        </h1>
        {game && (
          <div className="flex items-center gap-4">
            <div className="w-16 h-24 rounded-lg overflow-hidden border border-white/15 flex-shrink-0">
              <ImageWithFallback src={game.coverUrl ?? ""} alt={game.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">{game.name}</h2>
              <p className="text-white/50">
                {isEditing ? "Update your review" : "Share your thoughts with the community"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-4 sm:space-y-6">

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Review Title</h3>
              <span className="text-xs text-white/50">{title.length} / 100</span>
            </div>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Summarise your experience in one line" maxLength={100}
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-white/40 transition-colors" />
          </div>

          {/* ── Mobile-only interactive star diagram ── */}
          <div className="lg:hidden bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6">
            <h3 className="text-xl font-bold text-white mb-1">Your Rating</h3>
            <p className="text-white/35 text-xs mb-4">Drag the star points to adjust scores</p>
            <div className="flex justify-center">
              <InteractiveStar scores={scores} onScoreChange={handleScoreChange} size={300} />
            </div>
            <div className="space-y-2 mt-4">
              {SCORE_FACTORS.map(f => (
                <div key={f.key} className="flex items-center justify-between text-sm">
                  <span style={{ color: f.color, fontWeight: 600 }}>{f.label}</span>
                  <span style={{ color: f.color, fontWeight: 700 }}>{scores[f.key].toFixed(1)}</span>
                </div>
              ))}
              <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                <span className="text-white/50 font-semibold text-sm">Average</span>
                <span className="text-white font-bold text-base">{totalScore.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6">
            <h3 className="text-xl font-bold text-white mb-6">Rate the Game</h3>
            <div className="space-y-8">
              {SCORE_FACTORS.map(cat => {
                const val = scores[cat.key];
                const pct = (val / 10) * 100;
                return (
                  <div key={cat.key}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <label className="font-semibold" style={{ color: cat.color }}>{cat.label}</label>
                        <p className="text-xs text-white/35 mt-0.5">{cat.description}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button type="button" onClick={() => handleScoreChange(cat.key, val - 0.5)}
                          className="w-8 h-8 rounded-lg bg-white/8 border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-colors flex items-center justify-center text-lg select-none">−</button>
                        <input type="number" min={0} max={10} step={0.5} value={val}
                          onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleScoreChange(cat.key, v); }}
                          className="w-14 h-8 text-center bg-white/5 border border-white/15 rounded-lg font-bold focus:outline-none focus:border-white/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          style={{ color: cat.color }} />
                        <button type="button" onClick={() => handleScoreChange(cat.key, val + 0.5)}
                          className="w-8 h-8 rounded-lg bg-white/8 border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-colors flex items-center justify-center text-lg select-none">+</button>
                      </div>
                    </div>
                    {/* Bar with ticks */}
                    <div style={{ position: "relative", height: 6, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 10 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: cat.color, opacity: 0.85, transition: "width 0.1s ease" }} />
                      {Array.from({ length: 9 }).map((_, t) => {
                        const tp = (t + 1) * 10;
                        return <div key={t} style={{ position: "absolute", top: 0, bottom: 0, left: `${tp}%`, width: 1.5,
                          background: tp <= pct ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.5)", transform: "translateX(-50%)" }} />;
                      })}
                    </div>
                    {/* Auto-expanding textarea */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span></span>
                        <span className="text-xs text-white/50">{categoryText[cat.key].length} / 2500</span>
                      </div>
                      <textarea
                        placeholder={`What did you think about the ${cat.label.toLowerCase()}?`}
                        value={categoryText[cat.key]}
                        onChange={e => {
                          e.target.style.height = "auto";
                          e.target.style.height = e.target.scrollHeight + "px";
                          setCategoryText(prev => ({ ...prev, [cat.key]: e.target.value.slice(0, 2500) }));
                        }}
                        maxLength={2500}
                        className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-white/40 transition-colors resize-y text-sm"
                        rows={4}
                        style={{ minHeight: "120px" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6">
            <h3 className="text-xl font-bold text-white mb-4">Overall Review</h3>
            <textarea
              placeholder="Write your overall thoughts about the game"
              value={summary}
              onChange={e => {
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
                setSummary(e.target.value);
              }}
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-white/40 transition-colors resize-none"
              style={{ minHeight: "220px" }}
            />
            <label className="flex items-center gap-3 mt-3 cursor-pointer">
              <input type="checkbox" checked={spoilers} onChange={e => setSpoilers(e.target.checked)} className="w-4 h-4 accent-white" />
              <span className="text-white/50 text-sm">Contains spoilers</span>
            </label>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>
          )}

          <div className="flex gap-3 sm:gap-4">
            <button onClick={() => navigate(`/game/${gameId}`)}
              className="flex-1 px-3 sm:px-6 py-3 sm:py-4 bg-white/5 border border-white/15 text-white/70 font-bold text-base sm:text-lg rounded-lg hover:border-white/30 transition-all">
              Cancel
            </button>
            <button onClick={handlePost} disabled={posting}
              className="flex-1 px-3 sm:px-6 py-3 sm:py-4 bg-white text-zinc-900 font-bold text-base sm:text-lg rounded-lg hover:shadow-lg hover:shadow-white/10 transition-all disabled:opacity-60">
              {posting ? "Saving…" : isEditing ? "Save Changes" : "Post Review"}
            </button>
          </div>
        </div>

        {/* Right column — interactive star (desktop only) */}
        <div className="hidden lg:block lg:sticky lg:top-24 h-fit">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6">
            <h3 className="text-xl font-bold text-white mb-1">Your Rating</h3>
            <p className="text-white/35 text-xs mb-6">Drag the star points or use the sliders to adjust scores</p>
            <div className="flex justify-center">
              <InteractiveStar scores={scores} onScoreChange={handleScoreChange} size={408} />
            </div>
            <div className="space-y-2 mt-6">
              {SCORE_FACTORS.map(f => (
                <div key={f.key} className="flex items-center justify-between text-sm">
                  <span style={{ color: f.color, fontWeight: 600 }}>{f.label}</span>
                  <span style={{ color: f.color, fontWeight: 700 }}>{scores[f.key].toFixed(1)}</span>
                </div>
              ))}
              <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                <span className="text-white/50 font-semibold text-sm">Average</span>
                <span className="text-white font-bold text-base">{totalScore.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}