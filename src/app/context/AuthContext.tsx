import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { login as apiLogin, register as apiRegister, logout as apiLogout, googleLogin as apiGoogleLogin } from "../../api/auth";
import { getMe, BackendUser } from "../../api/users";
import { clearTokens } from "../../api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WarpstarUser {
  id:              string;
  email?:          string;
  username:        string;
  displayName?:    string;
  // Google-specific fields from the designer's version
  googleName?:     string;
  googleAvatar?:   string;
  // Profile fields
  profilePicture?: string;
  bannerImage?:    string;
  topGenres?:      string[];
  profileComplete: boolean;
  // Raw backend fields
  favoriteGames:   string[];
  followers:       string[];
  following:       string[];
  preferences:     Record<string, unknown>;
}

interface AuthContextType {
  user:             WarpstarUser | null;
  isLoading:        boolean;
  login:            (email: string, password: string) => Promise<void>;
  register:         (username: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: (googleCredential: string) => Promise<void>;
  signOut:          () => void;
  updateProfile:    (data: Partial<WarpstarUser>) => void;
  refreshUser:      () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | null>(null);

function mapBackendUser(u: BackendUser): WarpstarUser {
  return {
    id:              u.id,
    username:        u.username,
    favoriteGames:   u.favoriteGames ?? [],
    followers:       u.followers ?? [],
    following:       u.following ?? [],
    preferences:     u.preferences ?? {},
    profileComplete: !!u.username,
    displayName:     (u.preferences?.displayName as string) ?? u.username,
    profilePicture:  u.preferences?.profilePicture as string | undefined,
    bannerImage:     u.preferences?.bannerImage as string | undefined,
    topGenres:       u.preferences?.topGenres as string[] | undefined,
    googleName:      u.preferences?.googleName as string | undefined,
    googleAvatar:    u.preferences?.googleAvatar as string | undefined,
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<WarpstarUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount â€” restore session from stored JWT if present
  // Uses a 5s timeout so a dead backend never leaves users stuck loading
  useEffect(() => {
    const token = localStorage.getItem("ws_access_token");

    if (!token) {
      setIsLoading(false);
      return;
    }

    const timeout = setTimeout(() => {
      clearTokens();
      setIsLoading(false);
    }, 5000);

    getMe()
      .then(u => setUser(mapBackendUser(u)))
      .catch(() => clearTokens())
      .finally(() => {
        clearTimeout(timeout);
        setIsLoading(false);
      });
  }, []);

  // ---------------------------------------------------------------------------
  // Auth actions
  // ---------------------------------------------------------------------------

  const refreshUser = async () => {
    const u = await getMe();
    setUser(mapBackendUser(u));
  };

  const login = async (email: string, password: string) => {
    await apiLogin(email, password);
    const u = await getMe();
    setUser(mapBackendUser(u));
  };

  const register = async (username: string, email: string, password: string) => {
    await apiRegister(username, email, password);
    const u = await getMe();
    setUser(mapBackendUser(u));
  };

  const signInWithGoogle = async (googleCredential: string) => {
    await apiGoogleLogin(googleCredential);
    const u = await getMe();
    setUser(mapBackendUser(u));
  };

  const signOut = () => {
    apiLogout();
    setUser(null);
  };

  // Local-only update â€” for optimistic UI before saving to backend
  const updateProfile = (data: Partial<WarpstarUser>) => {
    if (!user) return;
    setUser({ ...user, ...data });
  };

  return (
    <AuthContext.Provider value={{
      user, isLoading,
      login, register,
      signInWithGoogle, signOut,
      updateProfile, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}