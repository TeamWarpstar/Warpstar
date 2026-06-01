import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { Header } from "./Header";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "./LoadingScreen";

// Minimum time (ms) to show the loading screen so the bar finish animation plays
const LOADING_EXIT_DELAY = 900;

export function RootLayout() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    // Auth resolved — let the bar animate to 100%, then unmount
    const t = setTimeout(() => setShowLoader(false), LOADING_EXIT_DELAY);
    return () => clearTimeout(t);
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;
    // Only redirect to onboarding if logged in but profile not complete
    // Guests (user === null) are allowed through
    if (user && !user.profileComplete) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (showLoader) {
    return <LoadingScreen isFinishing={!isLoading} />;
  }

  return (
    <div className="warpstar-page min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
}