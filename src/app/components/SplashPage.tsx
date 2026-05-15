import { useState } from "react";
import { useNavigate } from "react-router";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { Gamepad2, Star, Users, ChevronRight } from "lucide-react";
import warpstarWhiteLogo from "../../imports/warpstarwhite.png";

const spaceBackground =
  "https://images.unsplash.com/photo-1772672869101-7abc3637fb7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwc3BhY2UlMjBnYWxheHklMjBzdGFycyUyMG5lYnVsYXxlbnwxfHx8fDE3Nzc4NDY3NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080";

const features = [
  {
    icon: Star,
    title: "Write Detailed Reviews",
    description:
      "Construct reviews with detailed but digestable context, scoring based on five different factors.",
    color: "from-white/10 to-white/5",
    border: "border-white/15",
    iconColor: "text-yellow-300",
  },
  {
    icon: Gamepad2,
    title: "Discover New Games",
    description:
      "Get recommendations just for you, based on the genres and factors you enjoy.",
    color: "from-white/10 to-white/5",
    border: "border-white/15",
    iconColor: "text-yellow-300",
  },
  {
    icon: Users,
    title: "A Community of Gamers",
    description:
      "Follow other users, share reviews, and see what your friends are playing right now across every platform.",
    color: "from-white/10 to-white/5",
    border: "border-white/15",
    iconColor: "text-yellow-300",
  },
];

export function SplashPage() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsSigningIn(true);
    console.log("[SplashPage] Google login successful, credential received");
    try {
      console.log("[SplashPage] Starting sign-in with Google credential...");
      await signInWithGoogle(credentialResponse.credential);
      console.log("[SplashPage] Sign-in successful, navigating to onboarding");
      navigate("/onboarding");
    } catch (error) {
      console.error("[SplashPage] Sign-in error:", error);
      console.error("[SplashPage] Error type:", error instanceof Error ? error.message : String(error));
      setIsSigningIn(false);
    }
  };

  const handleGoogleError = () => {
    console.error("[SplashPage] Google OAuth error occurred");
    console.error("[SplashPage] Login Failed");
    setIsSigningIn(false);
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      {/* Background image + overlays */}
      <div className="absolute inset-0">
        <img
          src={spaceBackground}
          alt=""
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-[#0a0a0a]/40 to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]/80" />
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
        <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center">
            <img src={warpstarWhiteLogo} alt="Warpstar" className="h-24 w-auto" />
          </div>
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="signin_with"
              size="large"
            />
          </GoogleOAuthProvider>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-6 max-w-4xl mx-auto w-full">
          <h1 className="text-6xl md:text-8xl font-black text-yellow-400 mb-6 leading-none tracking-tight">
            Rate. Discover.{" "}
            <span className="text-yellow-450">
              Connect.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 mb-12 max-w-2xl leading-relaxed">
            Warpstar is a review site built for gamers, by gamers.
          </p>

          {/* CTA */}
          <button
            onClick={handleGoogleSuccess}
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
          <p className="text-white/35 text-sm">
            Free to join
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
                  className={`relative rounded-2xl border ${f.border} bg-gradient-to-br ${f.color} backdrop-blur-sm p-6 overflow-hidden`}
                >
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
