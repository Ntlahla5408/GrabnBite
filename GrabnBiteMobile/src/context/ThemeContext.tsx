import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

export type ThemeMode = "light" | "dark";
type ThemePreferenceContextValue = {
  theme: ThemeMode;
  isDark: boolean;
  isLoaded: boolean;
  setTheme: (theme: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
};
const STORAGE_KEY = "grabnbite-theme-preference";
const ThemePreferenceContext = createContext<ThemePreferenceContextValue | undefined>(undefined);

async function readSavedTheme(): Promise<ThemeMode | null> {
  try {
    const saved = Platform.OS === "web"
      ? (typeof localStorage === "undefined" ? null : localStorage.getItem(STORAGE_KEY))
      : await SecureStore.getItemAsync(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch (error) {
    console.warn("Could not read saved theme preference.", error);
    return null;
  }
}

async function saveTheme(theme: ThemeMode): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, theme);
      return;
    }
    await SecureStore.setItemAsync(STORAGE_KEY, theme);
  } catch (error) {
    console.warn("Could not persist theme preference.", error);
  }
}

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    void readSavedTheme().then((savedTheme) => {
      if (!isMounted) return;
      if (savedTheme) setThemeState(savedTheme);
      setIsLoaded(true);
    });
    return () => { isMounted = false; };
  }, []);

  const setTheme = useCallback(async (nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    await saveTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(async () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setThemeState(nextTheme);
    await saveTheme(nextTheme);
  }, [theme]);

  const value = useMemo(() => ({
    theme, isDark: theme === "dark", isLoaded, setTheme, toggleTheme,
  }), [theme, isLoaded, setTheme, toggleTheme]);

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) throw new Error("useThemePreference must be used inside ThemePreferenceProvider.");
  return context;
}

export const AppThemeColors = {
  light: {
    background: "#FFFFFF", surface: "#F8FAFC", surfaceElevated: "#FFFFFF",
    text: "#172033", textSecondary: "#64748B", border: "#E2E8F0",
    header: "#FFFFFF", headerText: "#172033",
  },
  dark: {
    background: "#071B2C", surface: "#0D2638", surfaceElevated: "#123247",
    text: "#FFFFFF", textSecondary: "#CBD5E1", border: "#24465B",
    header: "#071B2C", headerText: "#FFFFFF",
  },
} as const;
