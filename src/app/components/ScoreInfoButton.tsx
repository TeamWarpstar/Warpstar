import { useState, useRef, useEffect } from "react";
import { Info, X } from "lucide-react";

/**
 * Info affordance for the "My Scores" toggle. Opens on click (rather than
 * hover) so it works on touch devices, and stays open until dismissed via the
 * X or an outside click.
 */
export function ScoreInfoButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="p-1 -m-0.5 text-white/40 hover:text-white/70 transition-colors"
        aria-label="About My Scores"
        aria-expanded={open}
      >
        <Info className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-zinc-900 border border-white/15 rounded-lg p-3 pr-8 text-xs text-white/65 leading-relaxed shadow-xl z-[100]">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute top-1.5 right-1.5 p-1 text-white/40 hover:text-white/80 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          Scores are re-weighted using your factor preferences from Settings. Games that excel in what you care about score higher than their community average.
        </div>
      )}
    </div>
  );
}
