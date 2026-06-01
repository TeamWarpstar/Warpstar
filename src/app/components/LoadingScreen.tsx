import { useEffect, useRef, useState } from "react";
import warpstarWhiteLogo from "../../imports/warpstarwhite.png";

// Loading status messages that cycle during the wait
const STATUS_MESSAGES = [
  "Waking up the servers...",
  "Loading your profile...",
  "Fetching game data...",
  "Syncing your library...",
  "Almost there...",
  "Preparing your feed...",
  "Loading recommendations...",
  "Connecting to Warpstar...",
];

interface FallingStar {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  opacity: number;
  clicked: boolean;
  points: number;
}

interface PopText {
  id: number;
  x: number;
  y: number;
  text: string;
}

interface Props {
  isFinishing: boolean; // true when auth resolved — triggers bar to 100%
}

const SLOW_FILL_DURATION = 60; // seconds to fill to ~80%
const SLOW_TARGET = 80; // percent the slow animation stops at

export function LoadingScreen({ isFinishing }: Props) {
  const [progress, setProgress] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [stars, setStars] = useState<FallingStar[]>([]);
  const [score, setScore] = useState(0);
  const [popTexts, setPopTexts] = useState<PopText[]>([]);
  const nextId = useRef(0);
  const popId = useRef(0);
  const startTime = useRef(Date.now());
  const rafRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Slow progress bar: fills to SLOW_TARGET over SLOW_FILL_DURATION seconds
  useEffect(() => {
    startTime.current = Date.now();

    function tick() {
      const elapsed = (Date.now() - startTime.current) / 1000;
      const pct = Math.min((elapsed / SLOW_FILL_DURATION) * SLOW_TARGET, SLOW_TARGET);
      setProgress(pct);
      if (pct < SLOW_TARGET) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // When auth finishes, jump smoothly to 100%
  useEffect(() => {
    if (isFinishing && !finishing) {
      setFinishing(true);
      cancelAnimationFrame(rafRef.current);
      setProgress(100);
    }
  }, [isFinishing, finishing]);

  // Cycle status messages every 4 seconds
  useEffect(() => {
    const iv = setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  // Spawn falling stars periodically
  useEffect(() => {
    function spawnStar() {
      const containerW = containerRef.current?.offsetWidth ?? 800;
      const size = 18 + Math.random() * 22;
      const star: FallingStar = {
        id: nextId.current++,
        x: Math.random() * (containerW - size),
        y: -size,
        size,
        speed: 60 + Math.random() * 80,   // px/sec
        drift: (Math.random() - 0.5) * 30, // horizontal drift px/sec
        opacity: 0.6 + Math.random() * 0.4,
        clicked: false,
        points: size < 28 ? 3 : size < 36 ? 2 : 1,
      };
      setStars((prev) => [...prev, star]);
    }

    const iv = setInterval(spawnStar, 900);
    spawnStar();
    return () => clearInterval(iv);
  }, []);

  // Animate stars falling
  useEffect(() => {
    let last = performance.now();

    function frame(now: number) {
      const dt = (now - last) / 1000;
      last = now;

      setStars((prev) => {
        const containerH = containerRef.current?.offsetHeight ?? 600;
        return prev
          .filter((s) => !s.clicked && s.y < containerH + s.size)
          .map((s) => ({
            ...s,
            y: s.y + s.speed * dt,
            x: s.x + s.drift * dt,
          }));
      });

      animRef.current = requestAnimationFrame(frame);
    }

    const animRef = { current: requestAnimationFrame(frame) };
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  function clickStar(id: number, cx: number, cy: number, pts: number) {
    setStars((prev) =>
      prev.map((s) => (s.id === id ? { ...s, clicked: true } : s))
    );
    setScore((s) => s + pts);

    const pid = popId.current++;
    setPopTexts((prev) => [...prev, { id: pid, x: cx, y: cy, text: `+${pts}` }]);
    setTimeout(() => {
      setPopTexts((prev) => prev.filter((p) => p.id !== pid));
    }, 800);
  }

  const barW = finishing ? 100 : progress;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center select-none overflow-hidden z-50"
    >
      {/* Falling stars (minigame) */}
      {stars.map((star) => (
        <button
          key={star.id}
          onClick={(e) => {
            e.stopPropagation();
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            clickStar(
              star.id,
              rect.left + rect.width / 2,
              rect.top - 10,
              star.points
            );
          }}
          className="absolute cursor-pointer transition-transform hover:scale-125 active:scale-90 focus:outline-none"
          style={{
            left: star.x,
            top: star.y,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            background: "none",
            border: "none",
            padding: 0,
          }}
          aria-label="catch star"
        >
          <StarSVG size={star.size} />
        </button>
      ))}

      {/* Pop-up score texts */}
      {popTexts.map((p) => (
        <div
          key={p.id}
          className="fixed pointer-events-none font-bold text-yellow-400 text-lg animate-bounce"
          style={{ left: p.x - 16, top: p.y, zIndex: 100 }}
        >
          {p.text}
        </div>
      ))}

      {/* Center UI */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 w-full max-w-sm">
        {/* Logo */}
        <img src={warpstarWhiteLogo} alt="Warpstar" className="h-10 w-auto" />

        {/* Score */}
        <div className="text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Catch the stars!</p>
          <p className="text-2xl font-bold text-white tabular-nums">{score} pts</p>
        </div>

        {/* Progress bar */}
        <div className="w-full flex flex-col gap-2">
          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              style={{
                width: `${barW}%`,
                transition: finishing
                  ? "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                  : "width 0.4s linear",
              }}
            />
          </div>
          {/* Status text */}
          <p className="text-xs text-neutral-500 text-center transition-opacity duration-500">
            {STATUS_MESSAGES[statusIdx]}
          </p>
        </div>
      </div>
    </div>
  );
}

function StarSVG({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
