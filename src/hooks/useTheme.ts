import { useState, useEffect } from "react";

export type ThemeMode = "dark" | "light";
export type ColorPalette = "cyan" | "violet" | "emerald" | "rose" | "amber" | "blue";

interface ThemeConfig {
  mode: ThemeMode;
  palette: ColorPalette;
}

const THEME_STORAGE_KEY = "almoxarifado-theme";

const defaultTheme: ThemeConfig = {
  mode: "dark",
  palette: "cyan",
};

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeConfig>(() => {
    if (typeof window === "undefined") return defaultTheme;
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultTheme;
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    
    // Apply theme to document
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove("dark", "light");
    root.classList.add(theme.mode);
    
    // Apply palette
    root.setAttribute("data-palette", theme.palette);
  }, [theme]);

  const setMode = (mode: ThemeMode) => {
    setThemeState((prev) => ({ ...prev, mode }));
  };

  const setPalette = (palette: ColorPalette) => {
    setThemeState((prev) => ({ ...prev, palette }));
  };

  return {
    theme,
    setMode,
    setPalette,
    isDark: theme.mode === "dark",
  };
}
