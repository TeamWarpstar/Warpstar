import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
  updateProfile: (data: Partial<WarpstarUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "warpstar_user";

// Mock Google accounts to cycle through for demo purposes
const MOCK_GOOGLE_USERS = [
  {
    id: "google_uid_001",
    email: "alex.nova@gmail.com",
    googleName: "Alex Nova",
    googleAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face",
  },
];

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

  const signInWithGoogle = async () => {
    // Simulate a short OAuth round-trip
    await new Promise(r => setTimeout(r, 1200));
    const mock = MOCK_GOOGLE_USERS[0];
    const newUser: WarpstarUser = {
      ...mock,
      profileComplete: false,
    };
    persist(newUser);
  };

  const signOut = () => {
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