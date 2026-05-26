import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { login as apiLogin, register as apiRegister, logout as apiLogout, googleLogin as apiGoogleLogin } from "../../api/auth";
import { getMe, BackendUser } from "../../api/users";
import { clearTokens } from "../../api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WarpstarUser {
  id:                 string;
  email?:             string;
  username:           string;
  displayName?:       string;
  googleName?:        string;
  googleAvatar?:      string;
  profilePicture?:    string;
  bannerImage?:       string;
  topGenres?:         string[];
  platforms?:         string[];
  profileComplete:    boolean;
  onboardingComplete: boolean;
  favoriteGames:      string[];
  followers:          string[];
  following:          string[];
  preferences:        Record<string, unknown>;
}

interface AuthContextType {
  user:             WarpstarUser | null;
  isLoading:        boolean;
  login:            (email: string, password: string) => Promise<void>;
  register:         (username: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: (googleCredential: string) => Promise<{ is_new_user: boolean }>;
  signOut:          () => void;
  updateProfile:    (data: Partial<WarpstarUser>) => void;
  refreshUser:      () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | null>(null);

function mapBackendUser(u: BackendUser): WarpstarUser {
  const profilePictureValue = u.preferences?.profilePicture as string | undefined;
  const googleAvatarValue   = u.preferences?.googleAvatar   as string | undefined;
  // Use custom picture if set, otherwise fall back to Google avatar
  const profilePicture = profilePictureValue ?? googleAvatarValue;
  
  // Check if onboarding is complete
  const onboardingCompleteFlag = u.preferences?.onboardingComplete as boolean | undefined;
  const displayNameSet = !!(u.preferences?.displayName as string | undefined);
  const topGenresSet = !!(u.preferences?.topGenres as string[] | undefined)?.length;
  
  // New user if: explicit flag is false, or no display name and no top genres
  const onboardingComplete = onboardingCompleteFlag ?? (displayNameSet && topGenresSet);
  
  console.log("[mapBackendUser] Onboarding detection:", {
    explicit: onboardingCompleteFlag,
    displayName: u.preferences?.displayName,
    topGenres: u.preferences?.topGenres,
    calculated: onboardingComplete,
  });

  return {
    id:                 u.id,
    username:           u.username,
    favoriteGames:      u.favoriteGames ?? [],
    followers:          u.followers     ?? [],
    following:          u.following     ?? [],
    preferences:        u.preferences   ?? {},
    profileComplete:    !!u.username,
    onboardingComplete: onboardingComplete,
    displayName:        (u.preferences?.displayName as string) ?? u.username,
    profilePicture,
    bannerImage:        u.preferences?.bannerImage as string | undefined,
    topGenres:          u.preferences?.topGenres   as string[] | undefined,
    platforms:          u.preferences?.platforms   as string[] | undefined,
    googleName:         u.preferences?.googleName  as string | undefined,
    googleAvatar:       googleAvatarValue,
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<WarpstarUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("ws_access_token");
    if (!token) { setIsLoading(false); return; }

    const timeout = setTimeout(() => {
      clearTokens();
      setIsLoading(false);
    }, 5000);

    getMe()
      .then(u => setUser(mapBackendUser(u)))
      .catch(() => clearTokens())
      .finally(() => { clearTimeout(timeout); setIsLoading(false); });
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

  const signInWithGoogle = async (googleCredential: string): Promise<{ is_new_user: boolean }> => {
    const resp = await apiGoogleLogin(googleCredential);
    console.log("[AuthContext] googleLogin response:", resp);
    console.log("[AuthContext] resp.is_new_user:", resp.is_new_user);
    
    const u    = await getMe();
    const mappedUser = mapBackendUser(u);
    setUser(mappedUser);
    
    // Determine if new user: from response or from profile incompleteness
    let is_new_user = (resp.is_new_user) ?? false;
    
    // Fallback: If backend didn't specify, check if profile is incomplete
    if (!is_new_user && !mappedUser.onboardingComplete) {
      console.log("[AuthContext] Backend didn't specify is_new_user, checking profile completion");
      is_new_user = true;
    }
    
    console.log("[AuthContext] Final is_new_user:", is_new_user, "| onboardingComplete:", mappedUser.onboardingComplete);
    
    return { is_new_user };
  };

  const signOut = () => {
    apiLogout();
    setUser(null);
  };

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