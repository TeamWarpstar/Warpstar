import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { Header } from "./Header";
import { useAuth } from "../context/AuthContext";
import warpstarWhiteLogo from "../../imports/warpstarwhite.png";

export function RootLayout() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    // Only redirect to onboarding if logged in but profile not complete
    // Guests (user === null) are allowed through
    if (user && !user.profileComplete) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Show spinner only while restoring session from token
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src={warpstarWhiteLogo} alt="Warpstar" className="h-12 w-auto animate-pulse" />
        </div>
      </div>
    );
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