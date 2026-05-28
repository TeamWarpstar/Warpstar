import { createBrowserRouter, Outlet } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { HomePage } from "./components/HomePage";
import { GamePage } from "./components/GamePage";
import { ProfilePage } from "./components/ProfilePage";
import { SettingsPage } from "./components/SettingsPage";
import { GenrePage } from "./components/GenrePage";
import { CreateReviewPage } from "./components/CreateReviewPage";
import { DiscoverPage } from "./components/DiscoverPage";
import { SearchPage } from "./components/SearchPage";
import { SplashPage } from "./components/SplashPage";
import { OnboardingPage } from "./components/OnboardingPage";
import { FollowingFeedPage } from "./components/FollowingFeedPage";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Root wrapper — puts both providers inside the React Router tree so every
// route component can call useAuth() and useTheme() without Provider errors.
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
        path: "/login",
        Component: SplashPage,
      },
      {
        path: "/onboarding",
        Component: OnboardingPage,
      },
      {
        path: "/",
        Component: RootLayout,
        children: [
          { index: true, Component: HomePage },
          { path: "game/:gameId", Component: GamePage },
          { path: "game/:gameId/review", Component: CreateReviewPage },
          { path: "profile/:username", Component: ProfilePage },
          { path: "settings", Component: SettingsPage },
          { path: "following", Component: FollowingFeedPage },
          { path: "genre/:genreName", Component: GenrePage },
          //{ path: "discover", Component: DiscoverPage },
          { path: "search", Component: SearchPage },
        ],
      },
    ],
  },
]);