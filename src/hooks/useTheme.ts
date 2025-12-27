import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ThemeMode = "dark" | "light";
export type ColorPalette = "cyan" | "violet" | "emerald" | "rose" | "amber" | "blue";

interface ThemeConfig {
  mode: ThemeMode;
  palette: ColorPalette;
}

const LOCAL_THEME_KEY = "stockly-theme";
const USER_THEME_KEY = "stockly-user-theme";

const defaultTheme: ThemeConfig = {
  mode: "dark",
  palette: "cyan",
};

// Apply theme to document
const applyThemeToDocument = (theme: ThemeConfig) => {
  const root = document.documentElement;
  
  // Remove all theme and palette classes
  root.classList.remove("dark", "light", "palette-cyan", "palette-violet", "palette-emerald", "palette-rose", "palette-amber", "palette-blue");
  
  // Add theme mode class
  root.classList.add(theme.mode);
  
  // Add palette class (cyan is default, no class needed)
  if (theme.palette !== "cyan") {
    root.classList.add(`palette-${theme.palette}`);
  }
};

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeConfig>(() => {
    if (typeof window === "undefined") return defaultTheme;
    // Check if there's a logged-in user's theme, otherwise use default
    const userTheme = localStorage.getItem(USER_THEME_KEY);
    if (userTheme) {
      try {
        return JSON.parse(userTheme);
      } catch {
        return defaultTheme;
      }
    }
    return defaultTheme;
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Apply theme immediately on mount
  useEffect(() => {
    applyThemeToDocument(theme);
  }, []);

  // Handle auth state changes
  useEffect(() => {
    const handleAuthChange = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUserId(session.user.id);
        // User logged in - load their theme from database
        loadUserThemeFromDB(session.user.id);
      } else {
        setUserId(null);
        // User logged out - reset to default theme
        localStorage.removeItem(USER_THEME_KEY);
        setThemeState(defaultTheme);
        applyThemeToDocument(defaultTheme);
        setIsInitialized(true);
      }
    };

    handleAuthChange();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserId(session.user.id);
        loadUserThemeFromDB(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        // Reset to default theme when user logs out
        localStorage.removeItem(USER_THEME_KEY);
        setThemeState(defaultTheme);
        applyThemeToDocument(defaultTheme);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load theme from database for a specific user
  const loadUserThemeFromDB = async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('ui_theme')
      .eq('user_id', uid)
      .maybeSingle();

    if (!error && data?.ui_theme) {
      try {
        const userTheme = JSON.parse(data.ui_theme) as ThemeConfig;
        setThemeState(userTheme);
        localStorage.setItem(USER_THEME_KEY, JSON.stringify(userTheme));
        applyThemeToDocument(userTheme);
      } catch (e) {
        // Invalid JSON, use default
        setThemeState(defaultTheme);
        applyThemeToDocument(defaultTheme);
      }
    } else {
      // No saved theme, use default
      setThemeState(defaultTheme);
      applyThemeToDocument(defaultTheme);
    }
    setIsInitialized(true);
  };

  // Apply theme changes
  useEffect(() => {
    if (!isInitialized) return;
    
    applyThemeToDocument(theme);

    // Only save to localStorage if user is logged in
    if (userId) {
      localStorage.setItem(USER_THEME_KEY, JSON.stringify(theme));
    }
  }, [theme, isInitialized, userId]);

  const setMode = useCallback((mode: ThemeMode) => {
    const newTheme = { ...theme, mode };
    setThemeState(newTheme);
    applyThemeToDocument(newTheme);
    
    // Save to database if user is logged in
    if (userId) {
      localStorage.setItem(USER_THEME_KEY, JSON.stringify(newTheme));
      supabase
        .from('profiles')
        .update({ ui_theme: JSON.stringify(newTheme) })
        .eq('user_id', userId)
        .then(({ error }) => {
          if (error) {
            console.error('Error saving theme:', error);
          }
        });
    }
  }, [theme, userId]);

  const setPalette = useCallback((palette: ColorPalette) => {
    const newTheme = { ...theme, palette };
    setThemeState(newTheme);
    applyThemeToDocument(newTheme);
    
    // Save to database if user is logged in
    if (userId) {
      localStorage.setItem(USER_THEME_KEY, JSON.stringify(newTheme));
      supabase
        .from('profiles')
        .update({ ui_theme: JSON.stringify(newTheme) })
        .eq('user_id', userId)
        .then(({ error }) => {
          if (error) {
            console.error('Error saving theme:', error);
          }
        });
    }
  }, [theme, userId]);

  return {
    theme,
    setMode,
    setPalette,
    isDark: theme.mode === "dark",
  };
}
