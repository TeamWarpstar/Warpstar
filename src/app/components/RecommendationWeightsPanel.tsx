import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { RecommendationWeights, DEFAULT_WEIGHTS } from "../../api/recommendations";

interface WeightSliderProps {
  label:       string;
  description: string;
  value:       number;
  color:       string;
  onChange:    (v: number) => void;
}

function WeightSlider({ label, description, value, color, onChange }: WeightSliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <span className="text-sm font-semibold text-white">{label}</span>
          <span className="hidden sm:inline text-xs text-white/35 ml-2">{description}</span>
        </div>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {value.toFixed(1)}
        </span>
      </div>
      <div className="relative flex items-center gap-2">
        <span className="text-xs text-white/25 w-4 text-right">0</span>
        <input
          type="range"
          min={0} max={10} step={0.5}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="weight-slider flex-1 h-1.5 rounded-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${color} ${value * 10}%, rgba(255,255,255,0.1) ${value * 10}%)`,
          }}
        />
        <span className="text-xs text-white/25 w-4">10</span>
      </div>
    </div>
  );
}

const WEIGHT_CONFIG: {
  key:         keyof RecommendationWeights;
  label:       string;
  description: string;
  color:       string;
  group:       "factors" | "signals";
}[] = [
  { key: "gameplay",      label: "Gameplay",       description: "How fun and engaging the gameplay is",          color: "#6373ff", group: "factors" },
  { key: "aesthetics",    label: "Aesthetics",      description: "Visuals, sound design, and artistic direction", color: "#ff9a48", group: "factors" },
  { key: "content",       label: "Content",         description: "Amount and quality of content",                 color: "#a95eff", group: "factors" },
  { key: "polish",        label: "Polish",           description: "Technical quality and stability",               color: "#61bb74", group: "factors" },
  { key: "narrative",     label: "Narrative",        description: "Story, writing, and characters",                color: "#f55f5f", group: "factors" },
  { key: "genreMatch",    label: "Genre Match",      description: "Prioritise games in genres you like",           color: "#e879f9", group: "signals" },
  { key: "platformMatch", label: "Platform Match",   description: "Prioritise games on platforms you own",         color: "#38bdf8", group: "signals" },
  { key: "recency",       label: "Recency",          description: "Prefer newer releases over older games",         color: "#fbbf24", group: "signals" },
];

interface RecommendationWeightsPanelProps {
  initialWeights?: Partial<RecommendationWeights>;
  onChange:        (weights: RecommendationWeights) => void;
}

export function RecommendationWeightsPanel({
  initialWeights,
  onChange,
}: RecommendationWeightsPanelProps) {
  const [weights, setWeights] = useState<RecommendationWeights>({
    ...DEFAULT_WEIGHTS,
    ...initialWeights,
  });

  const set = (key: keyof RecommendationWeights) => (v: number) => {
    const updated = { ...weights, [key]: v };
    setWeights(updated);
    onChange(updated);
  };

  const handleReset = () => {
    setWeights(DEFAULT_WEIGHTS);
    onChange(DEFAULT_WEIGHTS);
  };

  const factors = WEIGHT_CONFIG.filter(w => w.group === "factors");
  const signals = WEIGHT_CONFIG.filter(w => w.group === "signals");

  return (
    <div className="space-y-6">
      {/* Score factor weights */}
      <div>
        <h4 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
          Score Factors
        </h4>
        <div className="space-y-5">
          {factors.map(w => (
            <WeightSlider
              key={w.key}
              label={w.label}
              description={w.description}
              value={weights[w.key]}
              color={w.color}
              onChange={set(w.key)}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-white/8" />

      {/* Signal weights */}
      <div>
        <h4 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
          Recommendation Signals
        </h4>
        <div className="space-y-5">
          {signals.map(w => (
            <WeightSlider
              key={w.key}
              label={w.label}
              description={w.description}
              value={weights[w.key]}
              color={w.color}
              onChange={set(w.key)}
            />
          ))}
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white/60 font-semibold rounded-lg hover:bg-white/10 transition-all text-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}