import { createBrowserRouter, Outlet } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { HomePage } from "./components/HomePage";
import { GamePage } from "./components/GamePage";
import { ProfilePage } from "./components/ProfilePage";
import { SettingsPage } from "./components/SettingsPage";
import { GenrePage } from "./components/GenrePage";
import { DiscoverPage } from "./components/DiscoverPage";
import { CreateReviewPage } from "./components/CreateReviewPage";
import { SplashPage } from "./components/SplashPage";
import { OnboardingPage } from "./components/OnboardingPage";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Root wrapper — puts both providers inside the React Router tree so every
// route component (RootLayout, SplashPage, OnboardingPage, …) can call
// useAuth() and useTheme() without "must be used within Provider" errors.
function ProvidersWrapper() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </ThemeProvider>
  );
}

export const router = createBrowserRouter([
  {
    Component: ProvidersWrapper,
    children: [
      {
        path: "/",
        Component: SplashPage,
      },
      {
        path: "/onboarding",
        Component: OnboardingPage,
      },
      {
        path: "/home",
        Component: RootLayout,
        children: [
          { index: true, Component: HomePage },
          { path: "game/:gameId", Component: GamePage },
          { path: "game/:gameId/review", Component: CreateReviewPage },
          { path: "profile/:username", Component: ProfilePage },
          { path: "settings", Component: SettingsPage },
          { path: "discover", Component: DiscoverPage },
          { path: "genre/:genreName", Component: GenrePage },
        ],
      },
    ],
  },
]);