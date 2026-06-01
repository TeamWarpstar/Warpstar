import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { DEFAULT_WEIGHTS } from "../../api/recommendations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FactorScores = {
  gameplay:   number;
  content:    number;
  narrative:  number;
  aesthetics: number;
  polish:     number;
};

interface ScoringContextType {
  /** Whether personalized scoring is currently active. */
  personalizedScoring:       boolean;
  togglePersonalizedScoring: () => void;
  /**
   * Returns a 0–10 score for the given factor breakdown.
   * When personalizedScoring is on and the user has custom weights,
   * returns a weighted average that reflects their preferences.
   * Otherwise returns the plain unweighted average.
   */
  computeScore: (scores: FactorScores) => number;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ScoringContext = createContext<ScoringContextType | null>(null);

const STORAGE_KEY = "warpstar_personalized_scoring";

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ScoringProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [personalizedScoring, setPersonalizedScoring] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "true"; }
    catch { return false; }
  });

  const togglePersonalizedScoring = useCallback(() => {
    setPersonalizedScoring(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const computeScore = useCallback((scores: FactorScores): number => {
    const simple =
      (scores.gameplay + scores.content + scores.narrative +
       scores.aesthetics + scores.polish) / 5;

    // Fall back to simple average when the feature is off or there's no user
    if (!personalizedScoring || !user) return simple;

    // Read factor weights from user preferences (fall back to defaults)
    const saved = (user.preferences?.weights ?? {}) as Record<string, number>;
    const w = {
      gameplay:   saved.gameplay   ?? DEFAULT_WEIGHTS.gameplay,
      content:    saved.content    ?? DEFAULT_WEIGHTS.content,
      narrative:  saved.narrative  ?? DEFAULT_WEIGHTS.narrative,
      aesthetics: saved.aesthetics ?? DEFAULT_WEIGHTS.aesthetics,
      polish:     saved.polish     ?? DEFAULT_WEIGHTS.polish,
    };

    const totalWeight = w.gameplay + w.content + w.narrative + w.aesthetics + w.polish;
    if (totalWeight === 0) return simple;

    return (
      w.gameplay   * scores.gameplay   +
      w.content    * scores.content    +
      w.narrative  * scores.narrative  +
      w.aesthetics * scores.aesthetics +
      w.polish     * scores.polish
    ) / totalWeight;
  }, [personalizedScoring, user]);

  return (
    <ScoringContext.Provider value={{ personalizedScoring, togglePersonalizedScoring, computeScore }}>
      {children}
    </ScoringContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useScoring() {
  const ctx = useContext(ScoringContext);
  if (!ctx) throw new Error("useScoring must be used within a ScoringProvider");
  return ctx;
}
