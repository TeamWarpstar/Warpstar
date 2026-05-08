import { useState } from "react";
import { Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { updateMe } from "../../api/users";
import { useTheme } from "../context/ThemeContext";

export function SettingsPage() {
  const { user, updateProfile, refreshUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture ?? "");
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);
  const [error,  setError]    = useState("");

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      await updateMe({ preferences: {
        ...user?.preferences,
        displayName:    displayName.trim(),
        profilePicture: profilePicture.trim(),
      }});
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Profile section */}
        <section className="bg-purple-950/30 border border-purple-500/20 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Username</label>
              <input type="text" value={user?.username ?? ""} disabled
                className="w-full bg-purple-950/20 border border-purple-500/20 rounded-xl px-4 py-3 text-purple-400 cursor-not-allowed"/>
              <p className="text-xs text-purple-500 mt-1">Username cannot be changed.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Display Name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={50}
                className="w-full bg-purple-950/60 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder:text-purple-400/40 focus:outline-none focus:border-pink-500/60 transition-colors"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Profile Picture URL</label>
              <input type="url" value={profilePicture} onChange={e => setProfilePicture(e.target.value)} placeholder="https://..."
                className="w-full bg-purple-950/60 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder:text-purple-400/40 focus:outline-none focus:border-pink-500/60 transition-colors"/>
              {profilePicture && (
                <img src={profilePicture} alt="Preview" className="mt-3 w-16 h-16 rounded-full object-cover border-2 border-purple-500/30"
                  onError={e => (e.currentTarget.style.display="none")}/>
              )}
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="bg-purple-950/30 border border-purple-500/20 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 font-medium">Dark Mode</p>
              <p className="text-sm text-purple-400">Currently {isDark ? "dark" : "light"}</p>
            </div>
            <button onClick={toggleTheme}
              className={`w-12 h-6 rounded-full transition-colors relative ${isDark ? "bg-pink-500" : "bg-purple-700/50"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isDark ? "translate-x-7" : "translate-x-1"}`}/>
            </button>
          </div>
        </section>

        {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>}

        <div className="flex gap-4">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all disabled:opacity-60">
            {saved ? <><Check className="w-4 h-4"/> Saved</> : saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}