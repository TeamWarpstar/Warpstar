import { useState, useEffect } from "react";
import { User, Upload, Check, Sun, Moon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

interface LocalSettings {
  email: string;
  accentColor: string;
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

  // Display name is sourced from the auth user directly
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [displayNameDirty, setDisplayNameDirty] = useState(false);

  // Secondary settings stored separately (email, accent, privacy, etc.)
  const [local, setLocal] = useState<LocalSettings>({
    email: user?.email ?? "",
    accentColor: "pink",
    showProfile: true,
    showReviews: true,
    emailNotifications: false,
    profilePicture: user?.profilePicture,
  });

  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Hydrate local settings from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_SETTINGS_KEY);
      if (stored) {
        setLocal(prev => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch {}
  }, []);

  // Keep displayName in sync if auth user changes (e.g. after save)
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
    // Persist display name to auth user
    if (displayNameDirty && displayName.trim()) {
      updateProfile({ displayName: displayName.trim() });
    }
    // Persist local settings
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
            // Also update auth profile picture immediately
            updateProfile({ profilePicture: result });
          } else {
            handleLocalChange("bannerImage", result);
            // Also update auth banner immediately
            updateProfile({ bannerImage: result });
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const accentColors = [
    { name: "pink", class: "from-pink-500 to-purple-600" },
    { name: "blue", class: "from-blue-500 to-cyan-600" },
    { name: "green", class: "from-green-500 to-teal-600" },
    { name: "orange", class: "from-orange-500 to-red-600" },
    { name: "purple", class: "from-purple-500 to-indigo-600" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
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
        <section className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Profile Customization</h2>

          <div className="space-y-6">
            {/* Profile picture */}
            <div>
              <label className="block text-purple-200 mb-2 font-semibold">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center overflow-hidden ring-2 ring-purple-500/30">
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
                  className="px-4 py-2 bg-purple-900/50 border border-purple-500/30 rounded-lg text-purple-200 hover:border-pink-500/50 transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload New Picture
                </button>
              </div>
            </div>

            {/* Banner */}
            <div>
              <label className="block text-purple-200 mb-2 font-semibold">Profile Banner</label>
              <div
                className="relative h-32 rounded-lg overflow-hidden bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900 mb-3 cursor-pointer group"
                onClick={() => handleFileUpload("banner")}
              >
                {local.bannerImage ? (
                  <img src={local.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-white/50 group-hover:text-white/80 transition-colors" />
                  </div>
                )}
              </div>
              <button
                onClick={() => handleFileUpload("banner")}
                className="px-4 py-2 bg-purple-900/50 border border-purple-500/30 rounded-lg text-purple-200 hover:border-pink-500/50 transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload New Banner
              </button>
            </div>

            {/* Display name */}
            <div>
              <label htmlFor="displayName" className="block text-purple-200 mb-2 font-semibold">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => handleDisplayNameChange(e.target.value)}
                className="w-full bg-purple-950/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500/50 transition-colors"
              />
              <p className="mt-1.5 text-xs text-purple-400/70">
                This updates your name across the whole platform immediately on save.
              </p>
            </div>
          </div>
        </section>

        {/* ── Appearance ───────────────────────────────── */}
        <section className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Appearance</h2>

          <div className="space-y-6">
            {/* Dark / light mode toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-900/50 flex items-center justify-center">
                  {isDark ? (
                    <Moon className="w-5 h-5 text-purple-300" />
                  ) : (
                    <Sun className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
                <div>
                  <div className="text-purple-200 font-semibold">
                    {isDark ? "Dark Mode" : "Light Mode"}
                  </div>
                  <div className="text-sm text-purple-400">
                    {isDark
                      ? "Deep space purple — the default Warpstar look"
                      : "Bright lavender — easier on the eyes in daylight"}
                  </div>
                </div>
              </div>

              {/* Animated toggle pill */}
              <button
                onClick={toggleTheme}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                  isDark
                    ? "bg-gradient-to-r from-pink-500 to-purple-600"
                    : "bg-gradient-to-r from-yellow-400 to-orange-400"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${
                    isDark ? "translate-x-6" : "translate-x-0"
                  }`}
                >
                  {isDark ? (
                    <Moon className="w-3 h-3 text-purple-600" />
                  ) : (
                    <Sun className="w-3 h-3 text-yellow-500" />
                  )}
                </div>
              </button>
            </div>

            {/* Accent color */}
            <div>
              <label className="block text-purple-200 mb-3 font-semibold">Accent Color</label>
              <div className="grid grid-cols-5 gap-3">
                {accentColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleLocalChange("accentColor", color.name)}
                    className={`aspect-square rounded-lg bg-gradient-to-br ${color.class} transition-all ${
                      local.accentColor === color.name
                        ? "ring-4 ring-white ring-offset-2 ring-offset-purple-950 scale-110"
                        : "hover:scale-105"
                    }`}
                    aria-label={`Select ${color.name} accent color`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Account ──────────────────────────────────── */}
        <section className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Account</h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-purple-200 mb-2 font-semibold">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={local.email}
                onChange={(e) => handleLocalChange("email", e.target.value)}
                className="w-full bg-purple-950/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500/50 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-purple-200 mb-2 font-semibold">
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
                className="w-full bg-purple-950/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500/50 transition-colors"
              />
            </div>

            <div className="pt-4 border-t border-purple-500/20">
              <div className="text-purple-200 font-semibold mb-3">Privacy Settings</div>
              <div className="space-y-3">
                {[
                  { key: "showProfile" as const, label: "Show my profile to other users" },
                  { key: "showReviews" as const, label: "Allow others to see my reviews" },
                  { key: "emailNotifications" as const, label: "Send me email notifications" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 text-purple-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={local[key] as boolean}
                      onChange={(e) => handleLocalChange(key, e.target.checked)}
                      className="w-5 h-5 rounded bg-purple-950/50 border-purple-500/30 text-pink-500 focus:ring-pink-500"
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
            className="px-6 py-3 bg-purple-900/50 border border-purple-500/30 rounded-lg text-purple-200 hover:border-pink-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-pink-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}