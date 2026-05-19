import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { updateMe } from "../../api/users";
import { Check, ChevronRight, ChevronLeft, User, Image, Gamepad2, Upload } from "lucide-react";
import warpstarWhiteLogo from "../../imports/warpstarwhite.png";

const GENRES = [
  { name: "Action",   color: "from-white/10 to-white/5", border: "border-white/20" },
  { name: "RPG",  color: "from-white/10 to-white/5", border: "border-white/20" },
  { name: "Strategy",   color: "from-white/10 to-white/5", border: "border-white/20" },
  { name: "Indie",      color: "from-white/10 to-white/5", border: "border-white/20" },
  { name: "Adventure",  color: "from-white/10 to-white/5", border: "border-white/20" },
  { name: "Horror",     color: "from-white/10 to-white/5", border: "border-white/20" },
  { name: "Puzzle",     color: "from-white/10 to-white/5", border: "border-white/20" },
  { name: "Sports",     color: "from-white/10 to-white/5", border: "border-white/20" },
  { name: "Simulation", color: "from-white/10 to-white/5", border: "border-white/20" },
  { name: "Fighting",   color: "from-white/10 to-white/5", border: "border-white/20" },
  { name: "Platformer", color: "from-white/10 to-white/5", border: "border-white/20" },
  { name: "Racing",     color: "from-white/10 to-white/5", border: "border-white/20" },
];

// Pixel avatar presets (kept exactly as designer made them)
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

const STEPS = [
  { id: 1, label: "Identity", icon: User },
  { id: 2, label: "Avatar",   icon: Image },
  { id: 3, label: "Genres",   icon: Gamepad2 },
];

export function OnboardingPage() {
  const { user, updateProfile, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [username,      setUsername]      = useState("");
  const [displayName,   setDisplayName]   = useState(user?.googleName ?? "");
  const [usernameError, setUsernameError] = useState("");

  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [uploadedImage,    setUploadedImage]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const profilePicture =
    uploadedImage ??
    PIXEL_AVATAR_PRESETS.find(a => a.id === selectedAvatarId)?.url ??
    "";

  const validateUsername = (val: string) => {
    if (!val)            return "Username is required.";
    if (val.length < 3)  return "At least 3 characters.";
    if (val.length > 20) return "At most 20 characters.";
    if (!/^[a-z0-9_]+$/.test(val)) return "Lowercase letters, numbers and underscores only.";
    return "";
  };

  const step1Valid = !validateUsername(username) && displayName.trim().length >= 2;
  const step2Valid = !!profilePicture;
  const step3Valid = selectedGenres.length >= 1 && selectedGenres.length <= 3;

  const handleNext = () => {
    if (step === 1) {
      const err = validateUsername(username);
      if (err) { setUsernameError(err); return; }
    }
    if (step < 3) setStep(s => s + 1);
  };

  const handleBack = () => { if (step > 1) setStep(s => s - 1); };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
      setSelectedAvatarId(null);
    };
    reader.readAsDataURL(file);
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
      // Save to backend — username is saved as a top-level field
      await updateMe({
        username: username.trim(),
        preferences: {
          ...user?.preferences,
          displayName:    displayName.trim(),
          profilePicture,
          topGenres:      selectedGenres,
          googleName:     user?.googleName,
          googleAvatar:   user?.googleAvatar,
        },
      });
      await refreshUser();
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">
      <div className="flex items-center gap-2 mb-6 -mt-4">
        <img src={warpstarWhiteLogo} alt="Warpstar" className="h-20 w-auto" />
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isComplete = step > s.id;
          const isCurrent  = step === s.id;
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isComplete ? "bg-white border-white" : isCurrent ? "bg-zinc-900 border-white" : "bg-zinc-900/50 border-white/20"
                }`}>
                  {isComplete
                    ? <Check className="w-4 h-4 text-zinc-900" />
                    : <Icon className={`w-4 h-4 ${isCurrent ? "text-white" : "text-white/30"}`} />
                  }
                </div>
                <span className={`text-xs font-medium ${isCurrent ? "text-white" : isComplete ? "text-white/60" : "text-white/30"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 mb-5 rounded transition-all duration-300 ${step > s.id ? "bg-white" : "bg-white/15"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">

        {/* Step 1 - Identity */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Create your identity</h2>
            <p className="text-white/45 text-sm mb-8">How should the Warpstar community know you?</p>
            <div className="mb-5">
              <label className="block text-sm font-medium text-white/70 mb-2">Display Name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Example Username"
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-white/40 transition-colors" />
              <p className="mt-1.5 text-xs text-white/35">Your public name can include spaces and capitals.</p>
            </div>
            <div className="mb-8">
              <label className="block text-sm font-medium text-white/70 mb-2">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35">@</span>
                <input type="text" value={username}
                  onChange={e => { const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""); setUsername(v); setUsernameError(""); }}
                  placeholder="your_handle" maxLength={20}
                  className={`w-full bg-white/5 border rounded-xl pl-8 pr-4 py-3 text-white placeholder:text-white/25 focus:outline-none transition-colors ${usernameError ? "border-red-500/60" : "border-white/15 focus:border-white/40"}`} />
              </div>
              {usernameError
                ? <p className="mt-1.5 text-xs text-red-400">{usernameError}</p>
                : <p className="mt-1.5 text-xs text-white/35">3-20 characters, lowercase, numbers and underscores only.</p>
              }
            </div>
          </div>
        )}

        {/* Step 2 - Avatar */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Pick your avatar</h2>
            <p className="text-white/45 text-sm mb-6">Choose a preset profile picture or upload your own image.</p>
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
                <button key={avatar.id} onClick={() => { setSelectedAvatarId(avatar.id); setUploadedImage(null); }} title={avatar.label}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all hover:scale-110 ${selectedAvatarId===avatar.id && !uploadedImage ? "border-white shadow-lg" : "border-white/15 hover:border-white/40"}`}
                  style={{ imageRendering: "pixelated" }}>
                  <img src={avatar.url} alt={avatar.label} className="w-full h-full" style={{ imageRendering: "pixelated" }} />
                  {selectedAvatarId===avatar.id && !uploadedImage && (
                    <div className="absolute inset-0 bg-white/10 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white drop-shadow" /></div>
                  )}
                </button>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-white/70 mb-2">Or upload your own image</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${uploadedImage ? "bg-white/10 border-white/40 text-white/80" : "bg-white/5 border-white/15 text-white/50 hover:border-white/30 hover:text-white/70"}`}>
                <Upload className="w-4 h-4" />
                {uploadedImage ? "Image uploaded” click to change" : "Choose a file"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 - Genres */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">What do you love playing?</h2>
            <p className="text-white/45 text-sm mb-2">Pick 1-3 genres that best describe your taste.</p>
            <p className="text-xs text-white/30 mb-7">{selectedGenres.length}/3 selected</p>
            <div className="grid grid-cols-3 gap-3 mb-2">
              {GENRES.map(genre => {
                const selected = selectedGenres.includes(genre.name);
                const maxed    = selectedGenres.length >= 3 && !selected;
                return (
                  <button key={genre.name} onClick={() => toggleGenre(genre.name)} disabled={maxed}
                    className={`relative group flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                      selected ? `bg-gradient-to-br ${genre.color} ${genre.border} scale-105 shadow-lg`
                      : maxed ? "bg-white/3 border-white/8 opacity-40 cursor-not-allowed"
                      : "bg-white/5 border-white/15 hover:border-white/30 hover:bg-white/8 hover:scale-105"}`}>
                    <span className={`text-xs font-semibold ${selected ? "text-white" : "text-white/60"}`}>{genre.name}</span>
                    {selected && <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white flex items-center justify-center"><Check className="w-2.5 h-2.5 text-zinc-900" /></div>}
                  </button>
                );
              })}
            </div>
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
          {step < 3
            ? <button onClick={handleNext} disabled={step===1 ? !step1Valid : !step2Valid}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-white rounded-xl text-zinc-900 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 active:scale-100 transition-all">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            : <button onClick={handleFinish} disabled={!step3Valid || saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-white rounded-xl text-zinc-900 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 active:scale-100 transition-all">
                {saving ? "Saving..." : <><Check className="w-4 h-4" /> Launch Warpstar</>}
              </button>
          }
        </div>
      </div>

      <p className="mt-6 text-xs text-white/25 text-center">You can update all of this any time in your profile settings.</p>
    </div>
  );
}