import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ThemeMode = "dark" | "light";
export type ColorPalette = "cyan" | "violet" | "emerald" | "rose" | "amber" | "blue";

interface ThemeConfig {
  mode: ThemeMode;
  palette: ColorPalette;
}

const LOCAL_THEME_KEY = "stockly-theme";

const defaultTheme: ThemeConfig = {
  mode: "dark",
  palette: "cyan",
};

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeConfig>(() => {
    if (typeof window === "undefined") return defaultTheme;
    // Load from localStorage first (for immediate display)
    const stored = localStorage.getItem(LOCAL_THEME_KEY);
    return stored ? JSON.parse(stored) : defaultTheme;
  });
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user ID on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load theme from database when user is available
  useEffect(() => {
    if (!userId) return;

    const loadUserTheme = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('ui_theme')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data?.ui_theme) {
        try {
          const userTheme = JSON.parse(data.ui_theme) as ThemeConfig;
          setThemeState(userTheme);
          localStorage.setItem(LOCAL_THEME_KEY, JSON.stringify(userTheme));
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    };

    loadUserTheme();
  }, [userId]);

  // Apply theme to document and persist
  useEffect(() => {
    // Save to localStorage for immediate loading on next visit
    localStorage.setItem(LOCAL_THEME_KEY, JSON.stringify(theme));
    
    // Apply theme to document
    const root = document.documentElement;
    
    // Remove all theme and palette classes
    root.classList.remove("dark", "light", "palette-cyan", "palette-violet", "palette-emerald", "palette-rose", "palette-amber", "palette-blue");
    
    // Add theme mode class
    root.classList.add(theme.mode);
    
    // Add palette class (cyan is default, no class needed)
    if (theme.palette !== "cyan") {
      root.classList.add(`palette-${theme.palette}`);
    }

    // Save to database if user is logged in
    if (userId) {
      supabase
        .from('profiles')
        .update({ ui_theme: JSON.stringify(theme) })
        .eq('user_id', userId)
        .then(({ error }) => {
          if (error) {
            console.error('Error saving theme:', error);
          }
        });
    }
  }, [theme, userId]);

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