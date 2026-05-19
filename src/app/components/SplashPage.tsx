import { useState } from "react";
import { useNavigate } from "react-router";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { Gamepad2, Star, Users } from "lucide-react";
import warpstarWhiteLogo from "../../imports/warpstarwhite.png";

const spaceBackground =
  "https://images.unsplash.com/photo-1772672869101-7abc3637fb7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwc3BhY2UlMjBnYWxheHklMjBzdGFycyUyMG5lYnVsYXxlbnwxfHx8fDE3Nzc4NDY3NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080";

const features = [
  {
    icon: Star,
    title: "Write Detailed Reviews",
    description: "Construct reviews with detailed but digestible context, scoring based on five different factors.",
    color: "from-white/10 to-white/5",
    border: "border-white/15",
    iconColor: "text-yellow-300",
  },
  {
    icon: Gamepad2,
    title: "Discover New Games",
    description: "Get recommendations just for you, based on the genres and factors you enjoy.",
    color: "from-white/10 to-white/5",
    border: "border-white/15",
    iconColor: "text-yellow-300",
  },
  {
    icon: Users,
    title: "A Community of Gamers",
    description: "Follow other users, share reviews, and see what your friends are playing right now across every platform.",
    color: "from-white/10 to-white/5",
    border: "border-white/15",
    iconColor: "text-yellow-300",
  },
];

export function SplashPage() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsSigningIn(true);
    setError("");
    try {
      const { isNewUser } = await signInWithGoogle(credentialResponse.credential);
      // New users go through onboarding, returning users go straight to the app
      navigate(isNewUser ? "/onboarding" : "/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
      setIsSigningIn(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in was cancelled or failed.");
    setIsSigningIn(false);
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={spaceBackground} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-[#0a0a0a]/40 to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]/80" />
      </div>

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width: Math.random()*2+1+"px", height: Math.random()*2+1+"px",
              top: Math.random()*70+"%", left: Math.random()*100+"%", opacity: Math.random()*0.6+0.2 }} />
        ))}
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="px-6 py-4 flex items-center justify-center max-w-7xl mx-auto w-full">
          <img src={warpstarWhiteLogo} alt="Warpstar" className="h-24 w-auto" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-6 max-w-4xl mx-auto w-full">
          <h1 className="text-6xl md:text-8xl font-black text-yellow-400 mb-6 leading-none tracking-tight">
            Rate. Discover. Connect.
          </h1>
          <p className="text-lg md:text-xl text-white/60 mb-6 max-w-2xl leading-relaxed">
            Warpstar is a review site built for gamers, by gamers.
          </p>

          {/* Google sign-in */}
          <div className="flex flex-col items-center gap-4">
            {isSigningIn ? (
              <div className="flex items-center gap-3 text-white/60">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Signing in…
              </div>
            ) : (
              <div className="scale-125 origin-top">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text="signin_with"
                  size="large"
                />
              </div>
            )}
            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                {error}
              </p>
            )}
            <button
              onClick={() => navigate("/")}
              className="text-white/35 text-sm hover:text-white/60 transition-colors underline underline-offset-4"
            >
              Browse as guest
            </button>
          </div>
        </main>

        {/* Feature cards */}
        <section className="relative z-10 max-w-6xl mx-auto w-full px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className={`relative rounded-2xl border ${f.border} bg-gradient-to-br ${f.color} backdrop-blur-sm p-6 overflow-hidden`}>
                  <Icon className={`absolute -bottom-3 -right-3 w-28 h-28 ${f.iconColor} opacity-10`} />
                  <h3 className="text-white font-bold mb-2 relative z-10">{f.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed relative z-10">{f.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}