import { useState, useEffect } from "react";
import { User, Upload, Check, Sun, Moon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { updateMe } from "../../api/users";
import { RecommendationWeightsPanel } from "./RecommendationWeightsPanel";

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [displayName,      setDisplayName]      = useState(user?.displayName ?? "");
  const [displayNameDirty, setDisplayNameDirty] = useState(false);
  const [profilePicture,   setProfilePicture]   = useState(user?.profilePicture ?? "");
  const [bannerImage,      setBannerImage]       = useState(user?.bannerImage ?? "");
  const [showProfile,      setShowProfile]       = useState(true);
  const [showReviews,      setShowReviews]       = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    if (!displayNameDirty) setDisplayName(user?.displayName ?? "");
  }, [user?.displayName, displayNameDirty]);

  const markDirty = () => { setHasChanges(true); setSaved(false); };

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
        if (type === "profile") setProfilePicture(result);
        else setBannerImage(result);
        markDirty();
      };
      reader.readAsDataURL(file);
    };
    input.click();
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
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
              <input type="text" value={user?.username ?? ""} disabled
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white/40 cursor-not-allowed" />
              <p className="mt-1.5 text-xs text-white/35">Username cannot be changed.</p>
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
    </div>
  );
}