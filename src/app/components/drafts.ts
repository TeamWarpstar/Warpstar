// ---------------------------------------------------------------------------
// Review draft persistence (localStorage)
// ---------------------------------------------------------------------------

interface ReviewScores {
  gameplay: number; content: number; narrative: number;
  aesthetics: number; polish: number;
}
interface CategoryText {
  gameplay: string; content: string; narrative: string;
  aesthetics: string; polish: string;
}

export interface DraftData {
  title:        string;
  summary:      string;
  scores:       ReviewScores;
  categoryText: CategoryText;
  spoilers:     boolean;
  savedAt:      string; // ISO timestamp
  gameName?:    string;
  coverUrl?:    string;
}

const PREFIX = "warpstar_review_draft_";

export function draftKey(gameId: string) { return `${PREFIX}${gameId}`; }

export function saveDraft(gameId: string, data: DraftData) {
  try { localStorage.setItem(draftKey(gameId), JSON.stringify(data)); } catch {}
}

export function loadDraft(gameId: string): DraftData | null {
  try {
    const raw = localStorage.getItem(draftKey(gameId));
    return raw ? (JSON.parse(raw) as DraftData) : null;
  } catch { return null; }
}

export function clearDraft(gameId: string) {
  try { localStorage.removeItem(draftKey(gameId)); } catch {}
}

// Returns all stored drafts with their gameId, newest first.
export function listDrafts(): (DraftData & { gameId: string })[] {
  const out: (DraftData & { gameId: string })[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const data = JSON.parse(raw) as DraftData;
        out.push({ ...data, gameId: key.slice(PREFIX.length) });
      } catch {}
    }
  } catch {}
  return out.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

export function timeAgoShort(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
