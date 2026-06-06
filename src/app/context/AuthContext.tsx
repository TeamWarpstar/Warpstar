import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { login as apiLogin, register as apiRegister, logout as apiLogout, googleLogin as apiGoogleLogin } from "../../api/auth";
import { getMe, BackendUser } from "../../api/users";
import { clearTokens, apiFetch, ApiError } from "../../api/client";

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
  role?:              string;
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

// localStorage key for the last-known user. We restore from this immediately
// on boot so the UI lights up without waiting for a network round-trip.
const CACHED_USER_KEY = "ws_cached_user";

function cacheUser(u: WarpstarUser | null) {
  try {
    if (u) localStorage.setItem(CACHED_USER_KEY, JSON.stringify(u));
    else   localStorage.removeItem(CACHED_USER_KEY);
  } catch {
    // Storage full, private mode, etc — non-fatal
  }
}

function readCachedUser(): WarpstarUser | null {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    return raw ? (JSON.parse(raw) as WarpstarUser) : null;
  } catch {
    return null;
  }
}

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
    role:               u.role,
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  // Start with the cached user if we have one — the UI doesn't have to wait
  // for the network round-trip on a returning visit.
  const [user,      setUser]      = useState<WarpstarUser | null>(() => readCachedUser());
  const [isLoading, setIsLoading] = useState(true);

  const setAndCacheUser = (next: WarpstarUser | null) => {
    setUser(next);
    cacheUser(next);
  };

  useEffect(() => {
    // Fire a tiny /health ping immediately so a sleeping backend starts
    // waking up while React boots, instead of paying the full cold-start
    // cost on the user's first real request.
    void apiFetch("/health", { skipAuth: true }).catch(() => {});

    const token = localStorage.getItem("ws_access_token");
    if (!token) {
      // No session — make sure stale cache doesn't linger.
      cacheUser(null);
      setIsLoading(false);
      return;
    }

    // If we already restored a user from cache, unblock the UI immediately.
    // The getMe() below still runs and replaces the user with the fresh
    // server copy when it resolves — but the user already sees the app.
    const restoredFromCache = user !== null;
    if (restoredFromCache) setIsLoading(false);

    // Fallback timeout for sessions without a cache hit — unblocks the UI
    // after 15s even if getMe is still pending. Don't clear tokens here.
    const unblockTimeout = restoredFromCache
      ? null
      : setTimeout(() => setIsLoading(false), 15000);

    getMe()
      .then(u => setAndCacheUser(mapBackendUser(u)))
      .catch((err: unknown) => {
        // ONLY wipe the session on genuine auth failures. Transient backend
        // issues (cold-start 502/503, Mongo blips, network errors) used to
        // wipe tokens here too, which caused the "logged out after a slow
        // load" bug — refreshing then showed an instant guest UI because
        // tokens were already gone. Now we keep the session intact and let
        // the next request retry; the cached user keeps the UI alive.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          clearTokens();
          cacheUser(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (unblockTimeout) clearTimeout(unblockTimeout);
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Auth actions
  // ---------------------------------------------------------------------------

  const refreshUser = async () => {
    const u = await getMe();
    setAndCacheUser(mapBackendUser(u));
  };

  const login = async (email: string, password: string) => {
    await apiLogin(email, password);
    const u = await getMe();
    setAndCacheUser(mapBackendUser(u));
  };

  const register = async (username: string, email: string, password: string) => {
    await apiRegister(username, email, password);
    const u = await getMe();
    setAndCacheUser(mapBackendUser(u));
  };

  const signInWithGoogle = async (googleCredential: string): Promise<{ is_new_user: boolean }> => {
    const resp       = await apiGoogleLogin(googleCredential);
    const u          = await getMe();
    const mappedUser = mapBackendUser(u);
    setAndCacheUser(mappedUser);

    // Determine if new user: prefer the backend signal, otherwise fall back
    // to profile incompleteness so a partial signup still routes through onboarding.
    let is_new_user = resp.is_new_user ?? false;
    if (!is_new_user && !mappedUser.onboardingComplete) {
      is_new_user = true;
    }
    return { is_new_user };
  };

  const signOut = () => {
    apiLogout();
    setAndCacheUser(null);
  };

  const updateProfile = (data: Partial<WarpstarUser>) => {
    if (!user) return;
    setAndCacheUser({ ...user, ...data });
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