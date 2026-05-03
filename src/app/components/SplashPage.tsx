import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Gamepad2, Star, Users, Sparkles, ChevronRight } from "lucide-react";

const spaceBackground =
  "https://images.unsplash.com/photo-1772672869101-7abc3637fb7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwc3BhY2UlMjBnYWxheHklMjBzdGFycyUyMG5lYnVsYXxlbnwxfHx8fDE3Nzc4NDY3NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080";

const features = [
  {
    icon: Star,
    title: "5-Dimension Ratings",
    description:
      "Score games across Gameplay, Content, Narrative, Aesthetics & Polish — visualised as a beautiful star diagram.",
    color: "from-pink-500/20 to-purple-600/20",
    border: "border-pink-500/30",
    iconColor: "text-pink-400",
  },
  {
    icon: Gamepad2,
    title: "Discover Your Next Game",
    description:
      "Browse curated charts, trending titles, and genre deep-dives tailored to what you actually enjoy playing.",
    color: "from-blue-500/20 to-cyan-600/20",
    border: "border-blue-500/30",
    iconColor: "text-blue-400",
  },
  {
    icon: Users,
    title: "A Community of Gamers",
    description:
      "Follow critics, share reviews, and see what your friends are playing right now across every platform.",
    color: "from-yellow-500/20 to-orange-500/20",
    border: "border-yellow-500/30",
    iconColor: "text-yellow-400",
  },
];

export function SplashPage() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      // signInWithGoogle sets profileComplete: false → go to onboarding
      navigate("/onboarding");
    } catch {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#07030f] overflow-x-hidden">
      {/* Background image + overlays */}
      <div className="absolute inset-0">
        <img
          src={spaceBackground}
          alt=""
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07030f]/60 via-[#07030f]/40 to-[#07030f]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07030f]/80 via-transparent to-[#07030f]/80" />
      </div>

      {/* Floating star particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1 + "px",
              height: Math.random() * 2 + 1 + "px",
              top: Math.random() * 70 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.6 + 0.2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top nav bar */}
        <header className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
              <span className="text-xl">⭐</span>
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Warpstar
            </span>
          </div>
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="px-5 py-2.5 text-sm text-purple-200 border border-purple-500/40 rounded-full hover:border-pink-500/60 hover:text-white transition-all duration-200 disabled:opacity-50"
          >
            Sign in
          </button>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-4xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900/40 border border-purple-500/30 rounded-full text-purple-300 text-sm mb-8">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>The universe's finest game reviews</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-white mb-6 leading-none tracking-tight">
            Rate. Discover.{" "}
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Connect.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-purple-200/80 mb-12 max-w-2xl leading-relaxed">
            Warpstar gives every game the review it deserves — scored across five
            dimensions and visualised as a living star. Join thousands of gamers
            who take their opinions seriously.
          </p>

          {/* CTA */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="group relative flex items-center gap-3 px-8 py-4 bg-white rounded-2xl text-gray-900 font-bold text-lg shadow-2xl hover:scale-105 active:scale-100 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mb-4"
          >
            {isSigningIn ? (
              <>
                <svg className="w-5 h-5 animate-spin text-gray-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Connecting…</span>
              </>
            ) : (
              <>
                {/* Google G logo */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          <p className="text-purple-400/60 text-sm">
            Free to join · No credit card required
          </p>
        </main>

        {/* Feature cards */}
        <section className="relative z-10 max-w-6xl mx-auto w-full px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`relative rounded-2xl border ${f.border} bg-gradient-to-br ${f.color} backdrop-blur-sm p-6`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${f.iconColor}`} />
                  </div>
                  <h3 className="text-white font-bold mb-2">{f.title}</h3>
                  <p className="text-purple-300/70 text-sm leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
