import { useState, useEffect } from "react";
import { User, Upload, Check, Sun, Moon, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { updateMe } from "../../api/users";
import { RecommendationWeightsPanel } from "./RecommendationWeightsPanel";
import { ImageRepositioner } from "./ImageRepositioner";
import { getGenres, Genre } from "../../api/games";
import { PLATFORM_PRESETS, PLATFORM_GROUPS } from "./OnboardingPage";

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [displayName,      setDisplayName]      = useState(user?.displayName ?? "");
  const [newUsername,      setNewUsername]      = useState(user?.username ?? "");
  const [usernameError,    setUsernameError]    = useState("");
  const [savingUsername,   setSavingUsername]   = useState(false);
  const [savedUsername,    setSavedUsername]    = useState(false);
  const [displayNameDirty, setDisplayNameDirty] = useState(false);
  const [profilePicture,   setProfilePicture]   = useState(user?.profilePicture ?? "");
  const [bannerImage,      setBannerImage]       = useState(user?.bannerImage ?? "");
  const [showProfile,      setShowProfile]       = useState(true);
  const [showReviews,      setShowReviews]       = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const [saving,     setSaving]     = useState(false);

  // Genre + platform prefs
  const [genres,           setGenres]           = useState<Genre[]>([]);
  const [selectedGenres,   setSelectedGenres]   = useState<string[]>((user?.preferences?.topGenres as string[]) ?? []);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>((user?.preferences?.platforms as string[]) ?? []);
  const [savingPrefs,      setSavingPrefs]      = useState(false);
  const [savedPrefs,       setSavedPrefs]       = useState(false);

  useEffect(() => {
    getGenres().then(all => {
      const priority = ["Action","RPG","Strategy","Indie","Adventure","Horror","Puzzle","Sports","Simulation","Fighting","Platformer","Racing"];
      const ordered = priority.map(n => all.find(g => g.name === n)).filter(Boolean) as Genre[];
      const names = new Set(ordered.map(g => g.name));
      setGenres([...ordered, ...all.filter(g => !names.has(g.name))].slice(0, 24));
    });
  }, []);
  const [saved,      setSaved]      = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error,      setError]      = useState("");
  const [imageToReposition, setImageToReposition] = useState<{ image: string; type: "profile" | "banner" } | null>(null);

  useEffect(() => {
    if (!displayNameDirty) setDisplayName(user?.displayName ?? "");
  }, [user?.displayName, displayNameDirty]);

  const markDirty = () => { setHasChanges(true); setSaved(false); };

  // Username cooldown
  const usernameChangedAt = (user as any)?.usernameChangedAt;
  const cooldownEnd       = usernameChangedAt ? new Date(new Date(usernameChangedAt).getTime() + 30 * 24 * 60 * 60 * 1000) : null;
  const onCooldown        = cooldownEnd ? cooldownEnd > new Date() : false;
  const daysLeft          = cooldownEnd ? Math.ceil((cooldownEnd.getTime() - Date.now()) / 86400000) : 0;

  const validateUsername = (val: string) => {
    if (!val)            return "Username is required.";
    if (val.length < 3)  return "At least 3 characters.";
    if (val.length > 20) return "At most 20 characters.";
    if (!/^[a-z0-9_]+$/.test(val)) return "Lowercase letters, numbers and underscores only.";
    return "";
  };

  const handleSaveUsername = async () => {
    const err = validateUsername(newUsername);
    if (err) { setUsernameError(err); return; }
    if (newUsername === user?.username) return;
    setSavingUsername(true);
    setUsernameError("");
    try {
      await updateMe({ username: newUsername.trim() });
      await refreshUser();
      setSavedUsername(true);
      setTimeout(() => setSavedUsername(false), 3000);
    } catch (e: any) {
      setUsernameError(e?.message ?? "Failed to update username.");
    } finally {
      setSavingUsername(false);
    }
  };

  const handleFileUpload = (type: "profile" | "banner") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setImageToReposition({ image: result, type });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleRepositionConfirm = (croppedImage: string) => {
    if (imageToReposition?.type === "profile") {
      setProfilePicture(croppedImage);
    } else {
      setBannerImage(croppedImage);
    }
    markDirty();
    setImageToReposition(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await updateMe({
        preferences: {
          ...user?.preferences,
          displayName:    displayName.trim(),
          profilePicture,
          bannerImage,
          showProfile,
          showReviews,
          emailNotifications,
        },
      });
      await refreshUser();
      setSaved(true);
      setHasChanges(false);
      setDisplayNameDirty(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(user?.displayName ?? "");
    setProfilePicture(user?.profilePicture ?? "");
    setBannerImage(user?.bannerImage ?? "");
    setDisplayNameDirty(false);
    setHasChanges(false);
    setSaved(false);
    setError("");
  };

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    try {
      await updateMe({ preferences: { ...user?.preferences, topGenres: selectedGenres, platforms: selectedPlatforms } });
      await refreshUser();
      setSavedPrefs(true);
      setTimeout(() => setSavedPrefs(false), 2000);
    } finally { setSavingPrefs(false); }
  };

  const toggleGenre = (name: string) => {
    setSelectedGenres(prev => prev.includes(name)
      ? prev.filter(g => g !== name)
      : prev.length < 3 ? [...prev, name] : prev
    );
  };

  const togglePlatform = (name: string) => {
    setSelectedPlatforms(prev => prev.includes(name)
      ? prev.filter(p => p !== name)
      : [...prev, name]
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <h1 className="text-4xl font-bold text-white">Settings</h1>
        {saved && (
          <div className="flex items-center gap-2 text-green-400 bg-green-500/20 px-4 py-2 rounded-lg border border-green-500/30">
            <Check className="w-5 h-5" /><span>Settings saved!</span>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Profile */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Profile Customization</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-white/70 mb-2 font-semibold">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden ring-2 ring-white/15">
                  {profilePicture
                    ? <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    : <User className="w-10 h-10 text-white" />
                  }
                </div>
                <button onClick={() => handleFileUpload("profile")}
                  className="px-4 py-2 bg-white/8 border border-white/15 rounded-lg text-white/70 hover:border-white/30 transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload New Picture
                </button>
              </div>
            </div>

            <div>
              <label className="block text-white/70 mb-2 font-semibold">Profile Banner</label>
              <div className="relative h-32 rounded-lg overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 mb-3 cursor-pointer group" onClick={() => handleFileUpload("banner")}>
                {bannerImage
                  ? <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />
                  : <div className="absolute inset-0 flex items-center justify-center"><Upload className="w-8 h-8 text-white/30 group-hover:text-white/60 transition-colors" /></div>
                }
              </div>
              <button onClick={() => handleFileUpload("banner")}
                className="px-4 py-2 bg-white/8 border border-white/15 rounded-lg text-white/70 hover:border-white/30 transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload New Banner
              </button>
            </div>

            <div>
              <label className="block text-white/70 mb-2 font-semibold">Display Name</label>
              <input type="text" value={displayName}
                onChange={e => { setDisplayName(e.target.value); setDisplayNameDirty(true); markDirty(); }}
                className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors" />
              <p className="mt-1.5 text-xs text-white/35">This updates your name across the whole platform on save.</p>
            </div>

            <div>
              <label className="block text-white/70 mb-2 font-semibold">Username</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35">@</span>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={e => {
                      setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                      setUsernameError("");
                    }}
                    disabled={onCooldown}
                    className={`w-full bg-white/5 border rounded-lg pl-7 pr-4 py-3 text-white focus:outline-none transition-colors ${
                      onCooldown ? "border-white/10 text-white/40 cursor-not-allowed" :
                      usernameError ? "border-red-500/60 focus:border-red-500/80" :
                      "border-white/15 focus:border-white/40"
                    }`}
                  />
                </div>
                <button
                  onClick={handleSaveUsername}
                  disabled={onCooldown || savingUsername || newUsername === user?.username}
                  className="px-4 py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                >
                  {savingUsername ? "Saving…" : savedUsername ? "Saved!" : "Change"}
                </button>
              </div>
              {usernameError && <p className="mt-1.5 text-xs text-red-400">{usernameError}</p>}
              {onCooldown
                ? <p className="mt-1.5 text-xs text-white/40">You can change your username again in <span className="text-white/70 font-semibold">{daysLeft} day{daysLeft !== 1 ? "s" : ""}</span>.</p>
                : <p className="mt-1.5 text-xs text-white/35">3–20 chars, lowercase, numbers and underscores only. 30-day cooldown after each change.</p>
              }
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Appearance</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
                {isDark ? <Moon className="w-5 h-5 text-white/60" /> : <Sun className="w-5 h-5 text-yellow-400" />}
              </div>
              <div>
                <div className="text-white/80 font-semibold">{isDark ? "Dark Mode" : "Light Mode"}</div>
            </div>
          </div>
            <button onClick={toggleTheme} aria-label="Toggle theme"
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${isDark ? "bg-zinc-600" : "bg-gradient-to-r from-yellow-400 to-orange-400"}`}>
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${isDark ? "translate-x-6" : "translate-x-0"}`}>
                {isDark ? <Moon className="w-3 h-3 text-zinc-600" /> : <Sun className="w-3 h-3 text-yellow-500" />}
              </div>
            </button>
          </div>
        </section>

        {/* Privacy */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Privacy</h2>
          <div className="space-y-3">
            {[
              { key: "showProfile",         label: "Show my profile to other users",  value: showProfile,         set: setShowProfile },
              { key: "showReviews",          label: "Allow others to see my reviews",  value: showReviews,          set: setShowReviews },
              { key: "emailNotifications",   label: "Send me email notifications",     value: emailNotifications,   set: setEmailNotifications },
            ].map(({ key, label, value, set }) => (
              <label key={key} className="flex items-center gap-3 text-white/70 cursor-pointer">
                <input type="checkbox" checked={value} onChange={e => { set(e.target.checked); markDirty(); }}
                  className="w-5 h-5 rounded bg-white/5 border-white/20 text-white focus:ring-white/30" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Game Preferences */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-white">Game Preferences</h2>
            {savedPrefs && <span className="text-green-400 text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Saved!</span>}
          </div>
          <p className="text-white/40 text-sm mb-6">These affect your recommendations and genre browsing.</p>

          {/* Genres */}
          <div className="mb-6">
            <label className="block text-white/70 font-semibold mb-1">Favourite Genres <span className="text-white/30 font-normal text-xs">(up to 3)</span></label>
            <p className="text-xs text-white/35 mb-3">{selectedGenres.length}/3 selected</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {genres.map(genre => {
                const selected = selectedGenres.includes(genre.name);
                const maxed    = selectedGenres.length >= 3 && !selected;
                return (
                  <button key={genre.id} onClick={() => toggleGenre(genre.name)} disabled={maxed}
                    className={`relative flex items-center justify-center px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      selected ? "bg-white/15 border-white/50 text-white" :
                      maxed    ? "bg-white/3 border-white/8 text-white/25 cursor-not-allowed" :
                                 "bg-white/5 border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"
                    }`}>
                    {genre.name}
                    {selected && <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-white flex items-center justify-center"><Check className="w-2 h-2 text-zinc-900" /></span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Platforms */}
          <div className="mb-6">
            <label className="block text-white/70 font-semibold mb-3">Your Platforms</label>

            {/* Selected chips with delete */}
            {selectedPlatforms.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto">
                {selectedPlatforms.map(p => (
                  <span key={p} className="flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-sm text-white">
                    {p}
                    <button onClick={() => togglePlatform(p)} className="text-white/40 hover:text-white transition-colors ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
              {PLATFORM_GROUPS.map(group => {
                const platforms = PLATFORM_PRESETS.filter(p => p.group === group);
                return (
                  <div key={group}>
                    <p className="text-xs font-semibold text-white/35 uppercase tracking-wider mb-2">{group}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {platforms.map(platform => {
                        const selected = selectedPlatforms.includes(platform.name);
                        return (
                          <button key={platform.name} onClick={() => togglePlatform(platform.name)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                              selected ? "bg-white/10 border-white/40 text-white" : "bg-white/5 border-white/10 text-white/50 hover:border-white/25 hover:text-white/70"
                            }`}>
                            <span className="text-base">{platform.icon}</span>
                            <span className="font-medium truncate">{platform.label}</span>
                            {selected && <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={handleSavePrefs} disabled={savingPrefs}
            className="px-5 py-2.5 bg-white text-zinc-900 font-semibold rounded-lg hover:shadow-lg hover:shadow-white/10 transition-all disabled:opacity-50 text-sm">
            {savingPrefs ? "Saving…" : "Save Preferences"}
          </button>
        </section>

        {/* Recommendation Weights */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Recommendation Preferences</h2>
          <p className="text-white/60 text-sm mb-6">Adjust how games are recommended to you by setting weights for different factors and signals.</p>
          <RecommendationWeightsPanel />
        </section>

        {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>}

        <div className="flex justify-end gap-4">
          <button onClick={handleCancel} disabled={!hasChanges}
            className="px-6 py-3 bg-white/5 border border-white/15 rounded-lg text-white/70 hover:border-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!hasChanges || saving}
            className="px-6 py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:shadow-lg hover:shadow-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Image Repositioner Modal */}
      {imageToReposition && (
        <ImageRepositioner
          initialImage={imageToReposition.image}
          onConfirm={handleRepositionConfirm}
          onCancel={() => setImageToReposition(null)}
          aspectRatio={imageToReposition.type === "profile" ? 1 : 16 / 9}
          frameSize={imageToReposition.type === "profile" ? { width: 300, height: 300 } : { width: 400, height: 225 }}
          title={imageToReposition.type === "profile" ? "Reposition Profile Picture" : "Reposition Banner"}
        />
      )}
    </div>
  );
}