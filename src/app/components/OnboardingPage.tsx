import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { updateMe } from "../../api/users";
import { Check, ChevronRight, ChevronLeft, User, Image, Gamepad2 } from "lucide-react";

const GENRES = [
  { name:"Action",emoji:"⚔️",color:"from-red-500/30 to-orange-500/30",border:"border-red-500/40" },
  { name:"RPG",emoji:"🎭",color:"from-purple-500/30 to-pink-500/30",border:"border-purple-500/40" },
  { name:"Strategy",emoji:"🎯",color:"from-blue-500/30 to-cyan-500/30",border:"border-blue-500/40" },
  { name:"Indie",emoji:"🎨",color:"from-green-500/30 to-teal-500/30",border:"border-green-500/40" },
  { name:"Adventure",emoji:"🗺️",color:"from-yellow-500/30 to-orange-500/30",border:"border-yellow-500/40" },
  { name:"Horror",emoji:"👻",color:"from-gray-600/30 to-purple-900/30",border:"border-gray-500/40" },
  { name:"Puzzle",emoji:"🧩",color:"from-teal-500/30 to-blue-500/30",border:"border-teal-500/40" },
  { name:"Sports",emoji:"🏆",color:"from-orange-500/30 to-yellow-500/30",border:"border-orange-500/40" },
  { name:"Simulation",emoji:"🌍",color:"from-emerald-500/30 to-cyan-500/30",border:"border-emerald-500/40" },
  { name:"Fighting",emoji:"🥊",color:"from-red-600/30 to-pink-600/30",border:"border-red-600/40" },
  { name:"Platformer",emoji:"🎮",color:"from-pink-500/30 to-purple-600/30",border:"border-pink-500/40" },
  { name:"Racing",emoji:"🏎️",color:"from-cyan-500/30 to-blue-600/30",border:"border-cyan-500/40" },
];
const AVATAR_PRESETS = [
  { id:"p1",url:"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face",label:"Alex" },
  { id:"p2",url:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face",label:"Sarah" },
  { id:"p3",url:"https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&h=120&fit=crop&crop=face",label:"Mike" },
  { id:"p4",url:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face",label:"Zoe" },
  { id:"p5",url:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face",label:"Tom" },
  { id:"p6",url:"https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop&crop=face",label:"Lily" },
];
const STEPS = [{id:1,label:"Identity",icon:User},{id:2,label:"Avatar",icon:Image},{id:3,label:"Genres",icon:Gamepad2}];

export function OnboardingPage() {
  const { user, updateProfile, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(user?.username ?? "");
  const [selectedAvatarId, setSelectedAvatarId] = useState<string|null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const [useCustomUrl, setUseCustomUrl] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const profilePicture = useCustomUrl && customUrl
    ? customUrl
    : AVATAR_PRESETS.find(a => a.id === selectedAvatarId)?.url ?? "";

  const step1Valid = displayName.trim().length >= 2;
  const step3Valid = selectedGenres.length >= 1 && selectedGenres.length <= 3;

  const toggleGenre = (name: string) => {
    setSelectedGenres(prev => prev.includes(name) ? prev.filter(g=>g!==name) : prev.length>=3 ? prev : [...prev,name]);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await updateMe({ preferences: { displayName: displayName.trim(), profilePicture, topGenres: selectedGenres } });
      await refreshUser();
      navigate("/");
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0b2e] to-[#0a0118] flex flex-col items-center justify-center px-4 py-12">
      <div className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30"><span className="text-lg">⭐</span></div>
        <span className="text-xl font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Warpstar</span>
      </div>

      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((s,i) => { const Icon=s.icon; const isComplete=step>s.id; const isCurrent=step===s.id; return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isComplete?"bg-gradient-to-br from-pink-500 to-purple-600 border-transparent":isCurrent?"bg-purple-950 border-pink-500":"bg-purple-950/50 border-purple-700/40"}`}>
                {isComplete ? <Check className="w-4 h-4 text-white"/> : <Icon className={`w-4 h-4 ${isCurrent?"text-pink-400":"text-purple-500"}`}/>}
              </div>
              <span className={`text-xs font-medium ${isCurrent?"text-pink-400":isComplete?"text-purple-300":"text-purple-600"}`}>{s.label}</span>
            </div>
            {i<STEPS.length-1 && <div className={`w-16 h-0.5 mx-2 mb-5 rounded transition-all duration-300 ${step>s.id?"bg-gradient-to-r from-pink-500 to-purple-500":"bg-purple-800/40"}`}/>}
          </div>
        ); })}
      </div>

      <div className="w-full max-w-lg bg-purple-950/40 border border-purple-500/20 rounded-3xl p-8 shadow-2xl shadow-purple-900/40 backdrop-blur-sm">
        {step===1 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Set your display name</h2>
            <p className="text-purple-300/70 text-sm mb-8">How should the Warpstar community know you?</p>
            <label className="block text-sm font-medium text-purple-200 mb-2">Display Name</label>
            <input type="text" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="e.g. Alex Nova"
              className="w-full bg-purple-950/60 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder:text-purple-400/40 focus:outline-none focus:border-pink-500/60 transition-colors"/>
          </div>
        )}

        {step===2 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Pick your avatar</h2>
            <p className="text-purple-300/70 text-sm mb-6">Choose a preset or paste an image URL.</p>
            <div className="flex justify-center mb-6">
              <img src={profilePicture || AVATAR_PRESETS[0].url} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-purple-500/40 shadow-lg shadow-purple-900/50"/>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {AVATAR_PRESETS.map(a => (
                <button key={a.id} type="button" onClick={() => { setSelectedAvatarId(a.id); setUseCustomUrl(false); }}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all ${selectedAvatarId===a.id && !useCustomUrl?"border-pink-500 scale-105":"border-purple-500/20 hover:border-purple-400/40"}`}>
                  <img src={a.url} alt={a.label} className="w-full aspect-square object-cover"/>
                </button>
              ))}
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-purple-300 mb-2 cursor-pointer">
                <input type="checkbox" checked={useCustomUrl} onChange={e=>setUseCustomUrl(e.target.checked)} className="accent-pink-500"/> Use custom URL
              </label>
              {useCustomUrl && (
                <input type="url" value={customUrl} onChange={e=>setCustomUrl(e.target.value)} placeholder="https://..."
                  className="w-full bg-purple-950/60 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder:text-purple-400/40 focus:outline-none focus:border-pink-500/60 transition-colors"/>
              )}
            </div>
          </div>
        )}

        {step===3 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">What do you play?</h2>
            <p className="text-purple-300/70 text-sm mb-6">Pick up to 3 genres to personalise your feed.</p>
            <div className="grid grid-cols-3 gap-3">
              {GENRES.map(g => {
                const sel = selectedGenres.includes(g.name);
                return (
                  <button key={g.name} type="button" onClick={() => toggleGenre(g.name)}
                    className={`relative overflow-hidden rounded-xl p-3 flex flex-col items-center gap-1.5 border-2 transition-all ${sel?"border-pink-500 scale-105":`${g.border} hover:scale-102`}`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${g.color} ${sel?"opacity-60":"opacity-40"}`}/>
                    <span className="text-2xl relative z-10">{g.emoji}</span>
                    <span className="text-xs font-semibold text-white relative z-10">{g.name}</span>
                    {sel && <Check className="absolute top-1 right-1 w-3 h-3 text-pink-300 z-10"/>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step>1 && (
            <button type="button" onClick={() => setStep(s=>s-1)}
              className="flex items-center gap-1 px-5 py-2.5 bg-purple-950/50 border border-purple-500/30 text-purple-300 rounded-xl hover:border-pink-500/50 transition-all">
              <ChevronLeft className="w-4 h-4"/> Back
            </button>
          )}
          {step<3 ? (
            <button type="button" onClick={() => setStep(s=>s+1)} disabled={(step===1&&!step1Valid)}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all disabled:opacity-50">
              Next <ChevronRight className="w-4 h-4"/>
            </button>
          ) : (
            <button type="button" onClick={handleFinish} disabled={!step3Valid||saving}
              className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all disabled:opacity-50">
              {saving ? "Saving…" : "Get Started ✨"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}