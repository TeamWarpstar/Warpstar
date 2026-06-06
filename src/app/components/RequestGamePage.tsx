import { useState } from "react";
import { Link } from "react-router";
import { PlusCircle, ExternalLink, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { requestGameByIgdbId } from "../../api/games";
import type { Game } from "../../api/games";

function isDeveloper(role?: string) {
  return role === "developer" || role === "admin";
}

export function RequestGamePage() {
  const { user } = useAuth();
  const [igdbId, setIgdbId]     = useState("");
  const [status, setStatus]     = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult]     = useState<Game | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <PlusCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Sign in required</h2>
        <Link to="/login"
          className="inline-block mt-2 px-6 py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:shadow-lg hover:shadow-white/10 transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  if (!isDeveloper(user.role)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Developer access required</h2>
        <p className="text-white/50 text-sm">This page is only available to developers and admins.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(igdbId.trim(), 10);
    if (isNaN(id) || id <= 0) {
      setStatus("error");
      setErrorMsg("Please enter a valid positive IGDB ID.");
      return;
    }

    setStatus("loading");
    setResult(null);
    setErrorMsg("");

    try {
      const game = await requestGameByIgdbId(id);
      setResult(game);
      setStatus("success");
      setIgdbId("");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong. Check the IGDB ID and try again."
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Request a Game</h1>
        <p className="text-white/50 text-sm sm:text-base">
          Add a game to Warpstar by its IGDB ID. The game must be a base release (not an
          edition/variant) and must not be cancelled or rumored.
        </p>
      </div>

      {/* IGDB ID form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="igdb-id" className="block text-sm font-medium text-white/70 mb-1.5">
            IGDB Game ID
          </label>
          <div className="flex gap-3">
            <input
              id="igdb-id"
              type="number"
              min="1"
              value={igdbId}
              onChange={e => { setIgdbId(e.target.value); setStatus("idle"); }}
              placeholder="e.g. 1942"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5
                         text-white placeholder:text-white/30 focus:outline-none
                         focus:border-white/30 focus:ring-1 focus:ring-white/20 transition"
            />
            <button
              type="submit"
              disabled={status === "loading" || !igdbId.trim()}
              className="px-5 py-2.5 bg-white text-zinc-900 font-semibold rounded-lg
                         hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all flex items-center gap-2"
            >
              {status === "loading"
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</>
                : <><PlusCircle className="w-4 h-4" /> Add Game</>}
            </button>
          </div>
          <p className="mt-2 text-xs text-white/30">
            Find the ID on{" "}
            <a
              href="https://www.igdb.com"
              target="_blank"
              rel="noreferrer"
              className="text-white/50 hover:text-white/80 underline transition-colors inline-flex items-center gap-0.5"
            >
              igdb.com <ExternalLink className="w-3 h-3" />
            </a>{" "}
            — it's the number in the game's URL, e.g. /games/<strong>1942</strong>-the-pacific-air-war
          </p>
        </div>
      </form>

      {/* Success */}
      {status === "success" && result && (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 flex gap-4 items-start">
          {result.coverUrl && (
            <img
              src={result.coverUrl}
              alt={result.name}
              className="w-16 h-20 object-cover rounded-lg shrink-0"
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              <span className="text-green-400 text-sm font-medium">Game added successfully</span>
            </div>
            <Link
              to={`/game/${result.id}`}
              className="text-white font-semibold hover:underline text-lg leading-tight"
            >
              {result.name}
            </Link>
            {result.releaseDate && (
              <p className="text-white/40 text-sm mt-0.5">
                {new Date(result.releaseDate).getFullYear()}
                {result.developers?.[0] ? ` · ${result.developers[0]}` : ""}
              </p>
            )}
            {result.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {result.genres.slice(0, 4).map(g => (
                  <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">{g}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 flex gap-3 items-start">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{errorMsg}</p>
        </div>
      )}

      {/* Info box */}
      <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Rules</h2>
        <ul className="space-y-1.5 text-sm text-white/50 list-disc list-inside">
          <li>Must be a base release — not a Digital Deluxe, Collector's Edition, etc.</li>
          <li>Status cannot be Cancelled or Rumored.</li>
          <li>Must not be a version/edition of another game (version_parent must be null).</li>
          <li>Game of the Year, Definitive, Remastered, and similar content-rich editions are allowed.</li>
        </ul>
      </div>
    </div>
  );
}
