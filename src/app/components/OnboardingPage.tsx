import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Check, ChevronRight, ChevronLeft, User, Image, Gamepad2 } from "lucide-react";

const GENRES = [
  { name: "Action", emoji: "⚔️", color: "from-red-500/30 to-orange-500/30", border: "border-red-500/40" },
  { name: "RPG", emoji: "🎭", color: "from-purple-500/30 to-pink-500/30", border: "border-purple-500/40" },
  { name: "Strategy", emoji: "🎯", color: "from-blue-500/30 to-cyan-500/30", border: "border-blue-500/40" },
  { name: "Indie", emoji: "🎨", color: "from-green-500/30 to-teal-500/30", border: "border-green-500/40" },
  { name: "Adventure", emoji: "🗺️", color: "from-yellow-500/30 to-orange-500/30", border: "border-yellow-500/40" },
  { name: "Horror", emoji: "👻", color: "from-gray-600/30 to-purple-900/30", border: "border-gray-500/40" },
  { name: "Puzzle", emoji: "🧩", color: "from-teal-500/30 to-blue-500/30", border: "border-teal-500/40" },
  { name: "Sports", emoji: "🏆", color: "from-orange-500/30 to-yellow-500/30", border: "border-orange-500/40" },
  { name: "Simulation", emoji: "🌍", color: "from-emerald-500/30 to-cyan-500/30", border: "border-emerald-500/40" },
  { name: "Fighting", emoji: "🥊", color: "from-red-600/30 to-pink-600/30", border: "border-red-600/40" },
  { name: "Platformer", emoji: "🎮", color: "from-pink-500/30 to-purple-600/30", border: "border-pink-500/40" },
  { name: "Racing", emoji: "🏎️", color: "from-cyan-500/30 to-blue-600/30", border: "border-cyan-500/40" },
];

const AVATAR_PRESETS = [
  { id: "preset_1", url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face", label: "Alex" },
  { id: "preset_2", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face", label: "Sarah" },
  { id: "preset_3", url: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&h=120&fit=crop&crop=face", label: "Mike" },
  { id: "preset_4", url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face", label: "Zoe" },
  { id: "preset_5", url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face", label: "Tom" },
  { id: "preset_6", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop&crop=face", label: "Lily" },
];

const STEPS = [
  { id: 1, label: "Identity", icon: User },
  { id: 2, label: "Avatar", icon: Image },
  { id: 3, label: "Genres", icon: Gamepad2 },
];

export function OnboardingPage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState(user?.googleName ?? "");
  const [usernameError, setUsernameError] = useState("");

  // Step 2
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const [useCustomUrl, setUseCustomUrl] = useState(false);

  // Step 3
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const profilePicture = useCustomUrl && customUrl
    ? customUrl
    : AVATAR_PRESETS.find(a => a.id === selectedAvatarId)?.url ?? user?.googleAvatar ?? "";

  /* ---- Validation ---- */
  const validateUsername = (val: string) => {
    if (!val) return "Username is required.";
    if (val.length < 3) return "At least 3 characters.";
    if (val.length > 20) return "At most 20 characters.";
    if (!/^[a-z0-9_]+$/.test(val)) return "Lowercase letters, numbers and underscores only.";
    return "";
  };

  const step1Valid = !validateUsername(username) && displayName.trim().length >= 2;
  const step2Valid = !!profilePicture;
  const step3Valid = selectedGenres.length >= 1 && selectedGenres.length <= 3;

  /* ---- Handlers ---- */
  const handleNext = () => {
    if (step === 1) {
      const err = validateUsername(username);
      if (err) { setUsernameError(err); return; }
    }
    if (step < 3) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const toggleGenre = (name: string) => {
    setSelectedGenres(prev => {
      if (prev.includes(name)) return prev.filter(g => g !== name);
      if (prev.length >= 3) return prev;
      return [...prev, name];
    });
  };

  const handleFinish = () => {
    updateProfile({
      username,
      displayName: displayName.trim(),
      profilePicture,
      topGenres: selectedGenres,
      profileComplete: true,
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0b2e] to-[#0a0118] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
          <span className="text-lg">⭐</span>
        </div>
        <span className="text-xl font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
          Warpstar
        </span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isComplete = step > s.id;
          const isCurrent = step === s.id;
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isComplete
                      ? "bg-gradient-to-br from-pink-500 to-purple-600 border-transparent"
                      : isCurrent
                      ? "bg-purple-950 border-pink-500"
                      : "bg-purple-950/50 border-purple-700/40"
                  }`}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Icon className={`w-4 h-4 ${isCurrent ? "text-pink-400" : "text-purple-500"}`} />
                  )}
                </div>
                <span className={`text-xs font-medium ${isCurrent ? "text-pink-400" : isComplete ? "text-purple-300" : "text-purple-600"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 mb-5 rounded transition-all duration-300 ${step > s.id ? "bg-gradient-to-r from-pink-500 to-purple-500" : "bg-purple-800/40"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-purple-950/40 border border-purple-500/20 rounded-3xl p-8 shadow-2xl shadow-purple-900/40 backdrop-blur-sm">

        {/* ---- STEP 1: Identity ---- */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Create your identity</h2>
            <p className="text-purple-300/70 text-sm mb-8">How should the Warpstar community know you?</p>

            {/* Display name */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-purple-200 mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Nova"
                className="w-full bg-purple-950/60 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder:text-purple-400/40 focus:outline-none focus:border-pink-500/60 transition-colors"
              />
              <p className="mt-1.5 text-xs text-purple-400/60">Your public name — can include spaces and capitals.</p>
            </div>

            {/* Username */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-purple-200 mb-2">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400/60">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => {
                    const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                    setUsername(v);
                    setUsernameError("");
                  }}
                  placeholder="your_handle"
                  maxLength={20}
                  className={`w-full bg-purple-950/60 border rounded-xl pl-8 pr-4 py-3 text-white placeholder:text-purple-400/40 focus:outline-none transition-colors ${
                    usernameError ? "border-red-500/60" : "border-purple-500/30 focus:border-pink-500/60"
                  }`}
                />
              </div>
              {usernameError ? (
                <p className="mt-1.5 text-xs text-red-400">{usernameError}</p>
              ) : (
                <p className="mt-1.5 text-xs text-purple-400/60">3–20 chars, lowercase, numbers and underscores only.</p>
              )}
            </div>
          </div>
        )}

        {/* ---- STEP 2: Avatar ---- */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Pick your avatar</h2>
            <p className="text-purple-300/70 text-sm mb-8">Choose a preset or use your own image URL.</p>

            {/* Preview */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <img
                  src={profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face"}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-purple-500/40 shadow-lg shadow-purple-900/50"
                />
                <div className="absolute inset-0 rounded-full ring-4 ring-pink-500/30 animate-pulse" />
              </div>
            </div>

            {/* Preset grid */}
            <div className="grid grid-cols-6 gap-3 mb-6">
              {AVATAR_PRESETS.map(avatar => (
                <button
                  key={avatar.id}
                  onClick={() => { setSelectedAvatarId(avatar.id); setUseCustomUrl(false); }}
                  className={`relative rounded-full overflow-hidden aspect-square border-2 transition-all duration-200 hover:scale-110 ${
                    selectedAvatarId === avatar.id && !useCustomUrl
                      ? "border-pink-500 shadow-lg shadow-pink-500/30"
                      : "border-purple-700/40 hover:border-purple-500/60"
                  }`}
                >
                  <img src={avatar.url} alt={avatar.label} className="w-full h-full object-cover" />
                  {selectedAvatarId === avatar.id && !useCustomUrl && (
                    <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom URL */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">Or enter an image URL</label>
              <input
                type="url"
                value={customUrl}
                onChange={e => { setCustomUrl(e.target.value); setUseCustomUrl(true); setSelectedAvatarId(null); }}
                placeholder="https://example.com/your-photo.jpg"
                className="w-full bg-purple-950/60 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder:text-purple-400/40 focus:outline-none focus:border-pink-500/60 transition-colors text-sm"
              />
            </div>
          </div>
        )}

        {/* ---- STEP 3: Genres ---- */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">What do you love playing?</h2>
            <p className="text-purple-300/70 text-sm mb-2">Pick 1–3 genres that best describe your taste.</p>
            <p className="text-xs text-purple-400/50 mb-7">
              {selectedGenres.length}/3 selected
            </p>

            <div className="grid grid-cols-3 gap-3 mb-2">
              {GENRES.map(genre => {
                const selected = selectedGenres.includes(genre.name);
                const maxed = selectedGenres.length >= 3 && !selected;
                return (
                  <button
                    key={genre.name}
                    onClick={() => toggleGenre(genre.name)}
                    disabled={maxed}
                    className={`relative group flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 ${
                      selected
                        ? `bg-gradient-to-br ${genre.color} ${genre.border} scale-105 shadow-lg`
                        : maxed
                        ? "bg-purple-950/20 border-purple-800/20 opacity-40 cursor-not-allowed"
                        : `bg-purple-950/30 border-purple-700/30 hover:${genre.border} hover:bg-gradient-to-br hover:${genre.color} hover:scale-105`
                    }`}
                  >
                    <span className="text-2xl">{genre.emoji}</span>
                    <span className={`text-xs font-semibold ${selected ? "text-white" : "text-purple-200"}`}>
                      {genre.name}
                    </span>
                    {selected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-purple-500/20">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-5 py-2.5 text-purple-300 border border-purple-600/40 rounded-xl hover:border-purple-400/60 hover:text-white transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={step === 1 ? !step1Valid : !step2Valid}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-pink-500/30 hover:scale-105 active:scale-100 transition-all duration-200"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!step3Valid}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-pink-500/30 hover:scale-105 active:scale-100 transition-all duration-200"
            >
              <Check className="w-4 h-4" />
              Launch Warpstar
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-purple-500/50 text-center">
        You can update all of this any time in your profile settings.
      </p>
    </div>
  );
}
