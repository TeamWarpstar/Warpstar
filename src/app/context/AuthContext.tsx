import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { googleLogin } from "../api/auth";

export interface WarpstarUser {
  id: string;
  email: string;
  googleName: string;
  googleAvatar: string;
  username?: string;
  displayName?: string;
  profilePicture?: string;
  bannerImage?: string;
  topGenres?: string[];
  profileComplete: boolean;
}

interface AuthContextType {
  user: WarpstarUser | null;
  isLoading: boolean;
  signInWithGoogle: (googleCredential: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (data: Partial<WarpstarUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "warpstar_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WarpstarUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persist = (u: WarpstarUser | null) => {
    if (u) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setUser(u);
  };

  const signInWithGoogle = async (googleCredential: string) => {
    try {
      const response = await googleLogin(googleCredential);
      const newUser: WarpstarUser = {
        id: response.user.id,
        email: response.user.email,
        googleName: response.user.googleName || "",
        googleAvatar: response.user.googleAvatar || "",
        profileComplete: false,
      };
      persist(newUser);
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  };

  const signOut = () => {
    localStorage.removeItem("ws_access_token");
    localStorage.removeItem("ws_refresh_token");
    persist(null);
  };

  const updateProfile = (data: Partial<WarpstarUser>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    persist(updated);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signInWithGoogle, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}