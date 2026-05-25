import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = "warpstar_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) return stored === "dark";
    } catch {}
    return true; // dark by default
  });

  // Sync class on <html> whenever isDark changes
  useEffect(() => {
    const html = document.documentElement;
    // Keep both class-based systems in sync:
    // - add/remove `dark` for Tailwind/custom theming
    // - add/remove `light-mode` for our legacy light overrides
    if (isDark) {
      html.classList.add("dark");
      html.classList.remove("light-mode");
    } else {
      html.classList.remove("dark");
      html.classList.add("light-mode");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
      } catch {}
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
