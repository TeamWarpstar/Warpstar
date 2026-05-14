import { useState, useEffect } from "react";
import { User, Upload, Check, Sun, Moon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

interface LocalSettings {
  email: string;
  showProfile: boolean;
  showReviews: boolean;
  emailNotifications: boolean;
  profilePicture?: string;
  bannerImage?: string;
}

const LOCAL_SETTINGS_KEY = "warpstar-settings";

export function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [displayNameDirty, setDisplayNameDirty] = useState(false);

  const [local, setLocal] = useState<LocalSettings>({
    email: user?.email ?? "",
    showProfile: true,
    showReviews: true,
    emailNotifications: false,
    profilePicture: user?.profilePicture,
  });

  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_SETTINGS_KEY);
      if (stored) {
        setLocal(prev => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!displayNameDirty) {
      setDisplayName(user?.displayName ?? "");
    }
  }, [user?.displayName, displayNameDirty]);

  const handleLocalChange = <K extends keyof LocalSettings>(key: K, value: LocalSettings[K]) => {
    setLocal(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleDisplayNameChange = (val: string) => {
    setDisplayName(val);
    setDisplayNameDirty(true);
    setHasChanges(true);
    setSaved(false);
  };

  const handleSave = () => {
    if (displayNameDirty && displayName.trim()) {
      updateProfile({ displayName: displayName.trim() });
    }
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(local));
    setSaved(true);
    setHasChanges(false);
    setDisplayNameDirty(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setDisplayName(user?.displayName ?? "");
    setDisplayNameDirty(false);
    try {
      const stored = localStorage.getItem(LOCAL_SETTINGS_KEY);
      if (stored) setLocal(prev => ({ ...prev, ...JSON.parse(stored) }));
    } catch {}
    setHasChanges(false);
    setPassword("");
    setSaved(false);
  };

  const handleFileUpload = (type: "profile" | "banner") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (type === "profile") {
            handleLocalChange("profilePicture", result);
            updateProfile({ profilePicture: result });
          } else {
            handleLocalChange("bannerImage", result);
            updateProfile({ bannerImage: result });
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-white">
          Settings
        </h1>
        {saved && (
          <div className="flex items-center gap-2 text-green-400 bg-green-500/20 px-4 py-2 rounded-lg border border-green-500/30">
            <Check className="w-5 h-5" />
            <span>Settings saved!</span>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* ── Profile Customisation ─────────────────────── */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Profile Customization</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-white/70 mb-2 font-semibold">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden ring-2 ring-white/15">
                  {(local.profilePicture || user?.profilePicture) ? (
                    <img
                      src={local.profilePicture ?? user?.profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>
                <button
                  onClick={() => handleFileUpload("profile")}
                  className="px-4 py-2 bg-white/8 border border-white/15 rounded-lg text-white/70 hover:border-white/30 transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload New Picture
                </button>
              </div>
            </div>

            <div>
              <label className="block text-white/70 mb-2 font-semibold">Profile Banner</label>
              <div
                className="relative h-32 rounded-lg overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 mb-3 cursor-pointer group"
                onClick={() => handleFileUpload("banner")}
              >
                {local.bannerImage ? (
                  <img src={local.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-white/30 group-hover:text-white/60 transition-colors" />
                  </div>
                )}
              </div>
              <button
                onClick={() => handleFileUpload("banner")}
                className="px-4 py-2 bg-white/8 border border-white/15 rounded-lg text-white/70 hover:border-white/30 transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload New Banner
              </button>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-white/70 mb-2 font-semibold">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => handleDisplayNameChange(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors"
              />
              <p className="mt-1.5 text-xs text-white/35">
                This updates your name across the whole platform immediately on save.
              </p>
            </div>
          </div>
        </section>

        {/* ── Appearance ───────────────────────────────── */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Appearance</h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
                  {isDark ? (
                    <Moon className="w-5 h-5 text-white/60" />
                  ) : (
                    <Sun className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
                <div>
                  <div className="text-white/80 font-semibold">
                    {isDark ? "Dark Mode" : "Light Mode"}
                  </div>
                  <div className="text-sm text-white/40">
                    {isDark
                      ? "Near-black monochrome — the default Warpstar look"
                      : "Bright light — easier on the eyes in daylight"}
                  </div>
                </div>
              </div>

              <button
                onClick={toggleTheme}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                  isDark
                    ? "bg-zinc-600"
                    : "bg-gradient-to-r from-yellow-400 to-orange-400"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${
                    isDark ? "translate-x-6" : "translate-x-0"
                  }`}
                >
                  {isDark ? (
                    <Moon className="w-3 h-3 text-zinc-600" />
                  ) : (
                    <Sun className="w-3 h-3 text-yellow-500" />
                  )}
                </div>
              </button>
            </div>

          </div>
        </section>

        {/* ── Account ──────────────────────────────────── */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Account</h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-white/70 mb-2 font-semibold">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={local.email}
                onChange={(e) => handleLocalChange("email", e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-white/70 mb-2 font-semibold">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setHasChanges(true);
                }}
                className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 transition-colors"
              />
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="text-white/70 font-semibold mb-3">Privacy Settings</div>
              <div className="space-y-3">
                {[
                  { key: "showProfile" as const, label: "Show my profile to other users" },
                  { key: "showReviews" as const, label: "Allow others to see my reviews" },
                  { key: "emailNotifications" as const, label: "Send me email notifications" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 text-white/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={local[key] as boolean}
                      onChange={(e) => handleLocalChange(key, e.target.checked)}
                      className="w-5 h-5 rounded bg-white/5 border-white/20 text-white focus:ring-white/30"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Save / Cancel ─────────────────────────────── */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleCancel}
            disabled={!hasChanges}
            className="px-6 py-3 bg-white/5 border border-white/15 rounded-lg text-white/70 hover:border-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-6 py-3 bg-white text-zinc-900 font-semibold rounded-lg hover:shadow-lg hover:shadow-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
