import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { Header } from "./Header";
import { useAuth } from "../context/AuthContext";

export function RootLayout() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
    } else if (!user.profileComplete) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user || !user.profileComplete) {
    return (
      <div className="min-h-screen bg-[#0a0118] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center animate-pulse">
            <span className="text-2xl">⭐</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="warpstar-page min-h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0b2e] to-[#0a0118]">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
}