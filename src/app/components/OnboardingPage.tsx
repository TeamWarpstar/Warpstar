import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { updateMe } from "../../api/users";
import { getGenres, getPlatforms, Genre } from "../../api/games";
import { Check, ChevronRight, ChevronLeft, User, Image, Gamepad2, Monitor, Upload, Loader2, SlidersHorizontal } from "lucide-react";
import { RecommendationWeightsPanel } from "./RecommendationWeightsPanel";
import { ImageRepositioner } from "./ImageRepositioner";
import { RecommendationWeights, DEFAULT_WEIGHTS, saveWeights } from "../../api/recommendations";
import warpstarWhiteLogo from "../../imports/warpstarwhite.png";

// ---------------------------------------------------------------------------
// Platform presets — curated list of major platforms shown in onboarding.
// Names must match exactly what's stored in the platforms collection.
// ---------------------------------------------------------------------------

export const PLATFORM_PRESETS = [
  // PC
  { name: "PC (Microsoft Windows)", label: "PC / Windows", icon: "", group: "PC" },
  { name: "Mac",                    label: "Mac",           icon: "", group: "PC" },
  { name: "Linux",                  label: "Linux",         icon: "", group: "PC" },
  // Current gen consoles
  { name: "PlayStation 5",          label: "PS5",           icon: "", group: "PlayStation" },
  { name: "PlayStation 4",          label: "PS4",           icon: "", group: "PlayStation" },
  { name: "Xbox Series X|S",        label: "Xbox Series",   icon: "", group: "Xbox" },
  { name: "Xbox One",               label: "Xbox One",      icon: "", group: "Xbox" },
  { name: "Nintendo Switch",        label: "Switch",        icon: "", group: "Nintendo" },
  // Handheld
  { name: "Nintendo Switch 2",      label: "Switch 2",      icon: "", group: "Nintendo" },
  { name: "PlayStation Portable",   label: "PSP",           icon: "", group: "PlayStation" },
  { name: "Nintendo 3DS",           label: "3DS",           icon: "", group: "Nintendo" },
  // Mobile
  { name: "Android",                label: "Android",       icon: "", group: "Mobile" },
  { name: "iOS",                    label: "iOS",            icon: "", group: "Mobile" },
  // Prev gen
  { name: "PlayStation 3",          label: "PS3",           icon: "", group: "PlayStation" },
  { name: "Xbox 360",               label: "Xbox 360",      icon: "", group: "Xbox" },
  { name: "Wii U",                  label: "Wii U",         icon: "", group: "Nintendo" },
];

export const PLATFORM_GROUPS = ["PC", "PlayStation", "Xbox", "Nintendo", "Mobile"];

// ---------------------------------------------------------------------------
// Pixel avatars (unchanged from designer)
// ---------------------------------------------------------------------------

const PAL: Record<string, string> = {
  k:"#0f172a",w:"#f8fafc",u:"#fcd9b7",e:"#0f172a",b:"#3b82f6",B:"#1d4ed8",
  v:"#93c5fd",p:"#a855f7",G:"#6b7280",g:"#9ca3af",n:"#4ade80",N:"#16a34a",
  r:"#f87171",R:"#b91c1c",y:"#fbbf24",m:"#f472b6",M:"#9d174d",t:"#2dd4bf",T:"#0f766e",
};
const CELL = 4;

function buildSVG(rows: string[], bg: string): string {
  const rects = rows.flatMap((row, y) =>
    [...row].flatMap((ch, x) => {
      const fill = PAL[ch];
      if (!fill) return [];
      return [`<rect x="${x*CELL}" y="${y*CELL}" width="${CELL}" height="${CELL}" fill="${fill}"/>`];
    })
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges"><rect width="32" height="32" fill="${bg}"/>${rects}</svg>`;
}

const toDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const PIXEL_AVATAR_CONFIGS = [
  { id:"px_astro",  label:"Astro",  bg:"#1e3a8a", rows:["..BBBB..","BBBBBB.",".BvvvvB.",".BveevB.",".BvvvvB.",".BBBBBB.","..byyb..","..bbbb.."] },
  { id:"px_mage",   label:"Mage",   bg:"#3b0764", rows:["...ppp..","..pppp..",".pppppp.",".pppypp.","..uuuu..","..ueeu..","..ummu..","..pppp.."] },
  { id:"px_bot",    label:"Bot",    bg:"#1a1a2e", rows:[".kGGGGk.","kGGGGGGk","kGttttGk","kGtTTtGk","kGGGGGGk","kGkwwkGk","..kGGk..","kGGGGk."] },
  { id:"px_alien",  label:"Zyx",    bg:"#052e16", rows:[".n....n.",".nnnnnn.",".nwwwwn.",".nwNNwn.",".nnnnnn.","..nNNn..","..nnnn..",".nnnnnn."] },
  { id:"px_ember",  label:"Ember",  bg:"#450a0a", rows:[".rrrrrr.","rRRRRRRr","rRuuuuRr","rRueeuRr","rRuuuuRr",".rRRRRr.","rRrrrRrr","RRRrRRRR"] },
  { id:"px_luna",   label:"Luna",   bg:"#500724", rows:[".mmMmmm.","mmMmMmmm",".muuuum.",".mueeum.",".muuuum.","..mymm..","..mMmm..",".mMMMm.."] },
];

const PIXEL_AVATAR_PRESETS = PIXEL_AVATAR_CONFIGS.map(c => ({
  id: c.id, label: c.label, url: toDataUrl(buildSVG(c.rows, c.bg)),
}));

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

const STEPS = [
  { id: 1, label: "Identity",  icon: User     },
  { id: 2, label: "Avatar",    icon: Image    },
  { id: 3, label: "Platforms", icon: Monitor  },
  { id: 4, label: "Genres",    icon: Gamepad2 },
  { id: 5, label: "Weights",   icon: SlidersHorizontal },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  // If user already completed onboarding — send home.
  // Also handles the case where someone types /onboarding directly in the URL.
  useEffect(() => {
    if (user === undefined || user === null) return; // still loading or not logged in
    console.log("[OnboardingPage] user.onboardingComplete:", user.onboardingComplete);
    if (user.onboardingComplete) {
      console.log("[OnboardingPage] User already completed onboarding, redirecting to home");
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const [step,   setStep]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  // Step 1
  const [username,      setUsername]      = useState("");
  const [displayName,   setDisplayName]   = useState(user?.googleName ?? "");
  const [usernameError, setUsernameError] = useState("");

  // Step 2
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [uploadedImage,    setUploadedImage]     = useState<string | null>(null);
  const [bannerImage,      setBannerImage]       = useState<string | null>(null);
  const [imageToReposition, setImageToReposition] = useState<{ image: string; type: "profile" | "banner" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Step 3
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // Step 4
  const [genres,         setGenres]         = useState<Genre[]>([]);
  const [genresLoading,  setGenresLoading]  = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Step 5
  const [weights, setWeights] = useState<RecommendationWeights>(DEFAULT_WEIGHTS);

  const profilePicture =
    uploadedImage ??
    PIXEL_AVATAR_PRESETS.find(a => a.id === selectedAvatarId)?.url ??
    "";

  // Fetch real genres when reaching step 4
  useEffect(() => {
    if (step !== 4 || genres.length > 0) return;
    setGenresLoading(true);
    getGenres()
      .then(all => {
        // Prioritise common genres, then fill with the rest
        const priority = [
          "Action","RPG","Strategy","Indie","Adventure","Horror",
          "Puzzle","Sports","Simulation","Fighting","Platformer","Racing",
          "Shooter","Arcade","Tactical","Point-and-click","Visual Novel",
        ];
        const ordered = priority
          .map(n => all.find(g => g.name === n))
          .filter(Boolean) as Genre[];
        const names   = new Set(ordered.map(g => g.name));
        const rest    = all.filter(g => !names.has(g.name));
        setGenres([...ordered, ...rest].slice(0, 24));
      })
      .finally(() => setGenresLoading(false));
  }, [step]);

  const validateUsername = (val: string) => {
    if (!val)            return "Username is required.";
    if (val.length < 3)  return "At least 3 characters.";
    if (val.length > 20) return "At most 20 characters.";
    if (!/^[a-z0-9_]+$/.test(val)) return "Lowercase letters, numbers and underscores only.";
    return "";
  };

  const step1Valid = !validateUsername(username) && displayName.trim().length >= 2;
  const step2Valid = !!profilePicture;
  const step3Valid = true; // platforms optional — user may not want recommendations filtered
  const step4Valid = selectedGenres.length >= 1 && selectedGenres.length <= 3;

  const handleNext = () => {
    if (step === 1) {
      const err = validateUsername(username);
      if (err) { setUsernameError(err); return; }
    }
    if (step < 5) setStep(s => s + 1);
  };

  const handleBack = () => { if (step > 1) setStep(s => s - 1); };

  const togglePlatform = (name: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const toggleGenre = (name: string) => {
    setSelectedGenres(prev => {
      if (prev.includes(name)) return prev.filter(g => g !== name);
      if (prev.length >= 3)    return prev;
      return [...prev, name];
    });
  };

  const handleFinish = async () => {
    setSaving(true);
    setError("");
    try {
      const newPreferences: Record<string, unknown> = {
        ...user?.preferences,
        displayName:       displayName.trim(),
        topGenres:         selectedGenres,
        platforms:         selectedPlatforms,
        googleName:        user?.googleName,
        googleAvatar:      user?.googleAvatar,
      };
      
      // Only update profilePicture if user explicitly set one during onboarding
      if (uploadedImage || selectedAvatarId) {
        newPreferences.profilePicture = profilePicture;
      }
      
      if (bannerImage) {
        newPreferences.bannerImage = bannerImage;
      }

      await updateMe({
        username: username.trim(),
        preferences: newPreferences,
      });
      await refreshUser();
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImageToReposition({ image: result, type });
    };
    reader.readAsDataURL(file);
  };

  const handleRepositionConfirm = (croppedImage: string) => {
    if (imageToReposition?.type === "profile") {
      setUploadedImage(croppedImage);
      setSelectedAvatarId(null);
    } else {
      setBannerImage(croppedImage);
    }
    setImageToReposition(null);
  };

  const step5Valid = true; // weights always valid
  const isStepValid = [step1Valid, step2Valid, step3Valid, step4Valid, step5Valid][step - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">
      <div className="flex items-center gap-2 mb-6 -mt-4">
        <img src={warpstarWhiteLogo} alt="Warpstar" className="h-20 w-auto" />
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-0 mb-8 w-full max-w-sm px-2 mx-auto">
        {STEPS.map((s, i) => {
          const Icon      = s.icon;
          const isComplete = step > s.id;
          const isCurrent  = step === s.id;
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isComplete ? "bg-white border-white" : isCurrent ? "bg-zinc-900 border-white" : "bg-zinc-900/50 border-white/20"
                }`}>
                  {isComplete
                    ? <Check className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-900" />
                    : <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${isCurrent ? "text-white" : "text-white/30"}`} />
                  }
                </div>
                <span className={`hidden sm:block text-xs font-medium ${isCurrent ? "text-white" : isComplete ? "text-white/60" : "text-white/30"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 sm:w-12 h-0.5 mx-1 sm:mx-2 mb-0 sm:mb-5 rounded transition-all duration-300 ${step > s.id ? "bg-white" : "bg-white/15"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">

        {/* ── Step 1: Identity ── */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Create your identity</h2>
            <p className="text-white/45 text-sm mb-8">How should the Warpstar community know you?</p>
            <div className="mb-5">
              <label className="block text-sm font-medium text-white/70 mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Example Username"
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-white/40 transition-colors"
              />
              <p className="mt-1.5 text-xs text-white/35">Your public name — can include spaces and capitals.</p>
            </div>
            <div className="mb-8">
              <label className="block text-sm font-medium text-white/70 mb-2">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => { const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""); setUsername(v); setUsernameError(""); }}
                  placeholder="your_handle"
                  maxLength={20}
                  className={`w-full bg-white/5 border rounded-xl pl-8 pr-4 py-3 text-white placeholder:text-white/25 focus:outline-none transition-colors ${usernameError ? "border-red-500/60" : "border-white/15 focus:border-white/40"}`}
                />
              </div>
              {usernameError
                ? <p className="mt-1.5 text-xs text-red-400">{usernameError}</p>
                : <p className="mt-1.5 text-xs text-white/35">3–20 chars, lowercase, numbers and underscores only.</p>
              }
            </div>
          </div>
        )}

        {/* ── Step 2: Avatar ── */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Customize your profile</h2>
            <p className="text-white/45 text-sm mb-6">Pick an avatar and optionally add a banner.</p>
            
            {/* Profile Picture */}
            <div className="mb-8">
              <h3 className="text-white font-semibold mb-4">Profile Picture</h3>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {profilePicture
                    ? <img src={profilePicture} alt="Profile preview" className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-lg" style={{ imageRendering: "pixelated" }} />
                    : <div className="w-24 h-24 rounded-full bg-white/8 border-4 border-white/15 flex items-center justify-center"><User className="w-10 h-10 text-white/40" /></div>
                  }
                  <div className="absolute inset-0 rounded-full ring-4 ring-white/15 animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-6 gap-3 mb-6">
                {PIXEL_AVATAR_PRESETS.map(avatar => (
                  <button
                    key={avatar.id}
                    onClick={() => { setSelectedAvatarId(avatar.id); setUploadedImage(null); }}
                    title={avatar.label}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all hover:scale-110 ${selectedAvatarId === avatar.id && !uploadedImage ? "border-white shadow-lg" : "border-white/15 hover:border-white/40"}`}
                    style={{ imageRendering: "pixelated" }}
                  >
                    <img src={avatar.url} alt={avatar.label} className="w-full h-full" style={{ imageRendering: "pixelated" }} />
                    {selectedAvatarId === avatar.id && !uploadedImage && (
                      <div className="absolute inset-0 bg-white/10 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white drop-shadow" /></div>
                    )}
                  </button>
                ))}
              </div>
              <div>
                <p className="text-sm font-medium text-white/70 mb-2">Or upload your own image</p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "profile")} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${uploadedImage ? "bg-white/10 border-white/40 text-white/80" : "bg-white/5 border-white/15 text-white/50 hover:border-white/30 hover:text-white/70"}`}
                >
                  <Upload className="w-4 h-4" />
                  {uploadedImage ? "Image uploaded — click to change" : "Choose a file…"}
                </button>
              </div>
            </div>

            {/* Banner */}
            <div>
              <h3 className="text-white font-semibold mb-3">Profile Banner (Optional)</h3>
              <div className="relative h-24 rounded-lg overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 mb-3 cursor-pointer group" onClick={() => bannerInputRef.current?.click()}>
                {bannerImage
                  ? <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />
                  : <div className="absolute inset-0 flex items-center justify-center"><Upload className="w-6 h-6 text-white/30 group-hover:text-white/60 transition-colors" /></div>
                }
              </div>
              <input ref={bannerInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "banner")} className="hidden" />
              <button onClick={() => bannerInputRef.current?.click()}
                className="w-full px-4 py-2 bg-white/5 border border-white/15 rounded-xl text-white/50 hover:border-white/30 hover:text-white/70 transition-all flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                {bannerImage ? "Change Banner" : "Upload Banner"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Platforms ── */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">What do you play on?</h2>
            <p className="text-white/45 text-sm mb-1">Select all platforms you have access to.</p>
            <p className="text-xs text-white/30 mb-6">This helps us avoid recommending exclusives you can't play. You can skip this and update it later in settings.</p>

            <div className="space-y-5 max-h-80 overflow-y-auto pr-1">
              {PLATFORM_GROUPS.map(group => {
                const platforms = PLATFORM_PRESETS.filter(p => p.group === group);
                return (
                  <div key={group}>
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">{group}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {platforms.map(platform => {
                        const selected = selectedPlatforms.includes(platform.name);
                        return (
                          <button
                            key={platform.name}
                            onClick={() => togglePlatform(platform.name)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                              selected
                                ? "bg-white/10 border-white/40 text-white"
                                : "bg-white/5 border-white/10 text-white/50 hover:border-white/25 hover:text-white/70"
                            }`}
                          >
                            <span className="text-lg leading-none">{platform.icon}</span>
                            <span className="text-sm font-medium truncate">{platform.label}</span>
                            {selected && <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-white" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedPlatforms.length > 0 && (
              <p className="mt-4 text-xs text-white/40 text-center">
                {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        )}

        {/* ── Step 4: Genres ── */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">What do you love playing?</h2>
            <p className="text-white/45 text-sm mb-2">Pick 1–3 genres that best describe your taste.</p>
            <p className="text-xs text-white/30 mb-5">{selectedGenres.length}/3 selected</p>

            {genresLoading
              ? <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-white/40 animate-spin" /></div>
              : <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2 max-h-72 overflow-y-auto pr-1">
                  {genres.map(genre => {
                    const selected = selectedGenres.includes(genre.name);
                    const maxed    = selectedGenres.length >= 3 && !selected;
                    return (
                      <button
                        key={genre.id}
                        onClick={() => toggleGenre(genre.name)}
                        disabled={maxed}
                        className={`relative flex items-center justify-center px-3 py-3 rounded-2xl border text-center transition-all ${
                          selected
                            ? "bg-white/15 border-white/50 text-white scale-105 shadow-lg"
                            : maxed
                            ? "bg-white/3 border-white/8 text-white/25 cursor-not-allowed"
                            : "bg-white/5 border-white/15 text-white/60 hover:border-white/30 hover:bg-white/8 hover:scale-105"
                        }`}
                      >
                        <span className="text-xs font-semibold leading-tight">{genre.name}</span>
                        {selected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-zinc-900" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
            }
          </div>
        )}

        {/* ── Step 5: Weights ── */}
        {step === 5 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Tune your recommendations</h2>
            <p className="text-white/45 text-sm mb-6">Adjust what matters most to you. You can change this anytime in settings.</p>
            <RecommendationWeightsPanel
              initialWeights={weights}
              onSaved={w => setWeights(w)}
              inline
            />
          </div>
        )}

        {error && <p className="mt-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
          {step > 1
            ? <button onClick={handleBack} className="flex items-center gap-1.5 px-5 py-2.5 text-white/50 border border-white/15 rounded-xl hover:border-white/30 hover:text-white/80 transition-all">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            : <div />
          }
          {step < 5
            ? <button
                onClick={handleNext}
                disabled={!isStepValid}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-white rounded-xl text-zinc-900 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 active:scale-100 transition-all"
              >
                {(step === 3 && selectedPlatforms.length === 0) ? "Skip" : "Next"} <ChevronRight className="w-4 h-4" />
              </button>
            : <button
                onClick={handleFinish}
                disabled={!step5Valid || saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-white rounded-xl text-zinc-900 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 active:scale-100 transition-all"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Check className="w-4 h-4" /> Launch Warpstar</>}
              </button>
          }
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

      <p className="mt-6 text-xs text-white/25 text-center">You can update all of this any time in your profile settings.</p>
    </div>
  );
}