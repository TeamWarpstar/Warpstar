import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import { Gamepad2, Star, Users, Sparkles, ChevronRight, Eye, EyeOff } from "lucide-react";

const spaceBackground =
  "https://images.unsplash.com/photo-1772672869101-7abc3637fb7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwc3BhY2UlMjBnYWxheHklMjBzdGFycyUyMG5lYnVsYXxlbnwxfHx8fDE3Nzc4NDY3NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080";

const features = [
  { icon: Star,    title: "5-Dimension Ratings",    description: "Score games across Gameplay, Content, Narrative, Aesthetics & Polish.", color: "from-pink-500/20 to-purple-600/20", border: "border-pink-500/30",   iconColor: "text-pink-400" },
  { icon: Gamepad2,title: "Discover Your Next Game", description: "Browse curated charts, trending titles, and genre deep-dives.",         color: "from-blue-500/20 to-cyan-600/20",  border: "border-blue-500/30",   iconColor: "text-blue-400" },
  { icon: Users,   title: "A Community of Gamers",  description: "Follow critics, share reviews, and see what your friends are playing.",  color: "from-yellow-500/20 to-orange-500/20", border: "border-yellow-500/30", iconColor: "text-yellow-400" },
];

type Mode = "login" | "register";

export function SplashPage() {
  const { login, googleLogin, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode]           = useState<Mode>("login");
  const [username, setUsername]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState("");

  // useGoogleLogin uses the popup flow and returns an access token
  // which we send to our backend for verification
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError("");
      try {
        // Fetch user info from Google using the access token
        const res = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await res.json();

        // Send to our backend — it creates or finds the user and returns a JWT
        await googleLogin(tokenResponse.access_token);
        navigate("/");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Google sign-in failed.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError("Google sign-in was cancelled or failed."),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        navigate("/");
      } else {
        await register(username, email, password);
        navigate("/onboarding");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#07030f] overflow-x-hidden">
      <div className="absolute inset-0">
        <img src={spaceBackground} alt="" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07030f]/60 via-[#07030f]/40 to-[#07030f]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07030f]/80 via-transparent to-[#07030f]/80" />
      </div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white" style={{ width: Math.random()*2+1+"px", height: Math.random()*2+1+"px", top: Math.random()*70+"%", left: Math.random()*100+"%", opacity: Math.random()*0.6+0.2 }} />
        ))}
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="px-6 py-5 flex items-center max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30"><span className="text-xl">⭐</span></div>
            <span className="text-2xl font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">Warpstar</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-6 py-12 max-w-6xl mx-auto w-full">
          <div className="text-center lg:text-left max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900/40 border border-purple-500/30 rounded-full text-purple-300 text-sm mb-8">
              <Sparkles className="w-4 h-4 text-pink-400" /><span>The universe's finest game reviews</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-none tracking-tight">
              Rate. Discover.{" "}<span className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">Connect.</span>
            </h1>
            <p className="text-lg text-purple-200/80 leading-relaxed">Warpstar gives every game the review it deserves — scored across five dimensions and visualised as a living star.</p>
          </div>

          <div className="w-full max-w-md bg-purple-950/60 border border-purple-500/20 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
            {/* Tabs */}
            <div className="flex rounded-xl overflow-hidden border border-purple-500/20 mb-6">
              {(["login","register"] as Mode[]).map(m => (
                <button key={m} onClick={() => { setMode(m); setError(""); }}
                  className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-all ${mode===m ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" : "text-purple-400 hover:text-white"}`}>
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            {/* Google button */}
            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 bg-white text-gray-800 font-semibold rounded-xl hover:bg-gray-100 transition-all disabled:opacity-60 mb-5 shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {mode === "login" ? "Sign in with Google" : "Sign up with Google"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-purple-500/20"/>
              <span className="text-purple-500 text-xs">or continue with email</span>
              <div className="flex-1 h-px bg-purple-500/20"/>
            </div>

            {/* Email/password form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-1.5">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400/60">@</span>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""))} placeholder="your_handle" maxLength={32} required
                      className="w-full bg-purple-950/60 border border-purple-500/30 rounded-xl pl-8 pr-4 py-3 text-white placeholder:text-purple-400/40 focus:outline-none focus:border-pink-500/60 transition-colors" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                  className="w-full bg-purple-950/60 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder:text-purple-400/40 focus:outline-none focus:border-pink-500/60 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={8} required
                    className="w-full bg-purple-950/60 border border-purple-500/30 rounded-xl px-4 pr-12 py-3 text-white placeholder:text-purple-400/40 focus:outline-none focus:border-pink-500/60 transition-colors" />
                  <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400/60 hover:text-purple-200">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</p>}
              <button type="submit" disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {isLoading
                  ? <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  : <><span>{mode === "login" ? "Sign In" : "Create Account"}</span><ChevronRight className="w-4 h-4"/></>
                }
              </button>
            </form>

            {/* Guest access */}
            <div className="mt-4 text-center">
              <button type="button" onClick={() => navigate("/")}
                className="text-purple-400 hover:text-purple-200 text-sm underline underline-offset-4 transition-colors">
                Browse as Guest
              </button>
            </div>
          </div>
        </main>

        <section className="relative z-10 max-w-6xl mx-auto w-full px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(f => { const Icon = f.icon; return (
              <div key={f.title} className={`relative rounded-2xl border ${f.border} bg-gradient-to-br ${f.color} backdrop-blur-sm p-6`}>
                <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center mb-4"><Icon className={`w-5 h-5 ${f.iconColor}`}/></div>
                <h3 className="text-white font-bold mb-2">{f.title}</h3>
                <p className="text-purple-300/70 text-sm leading-relaxed">{f.description}</p>
              </div>
            ); })}
          </div>
        </section>
      </div>
    </div>
  );
}