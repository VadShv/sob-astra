"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { ConfigProvider } from "antd";
import ruRU from "antd/locale/ru_RU";
import { baseTheme, darkTheme } from "@/lib/theme";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ mode: "light", toggle: () => {} });

export function useThemeMode() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme-mode") as ThemeMode | null;
    if (saved) setMode(saved);
    else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) setMode("dark");
  }, []);

  useEffect(() => {
    localStorage.setItem("theme-mode", mode);
  }, [mode]);

  const toggle = () => setMode((m) => (m === "light" ? "dark" : "light"));
  const currentTheme = mode === "dark" ? darkTheme : baseTheme;

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      <ConfigProvider theme={currentTheme} locale={ruRU}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  );
}
