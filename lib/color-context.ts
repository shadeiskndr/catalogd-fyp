"use client";

import { createContext, useContext } from "react";

export type ColorTheme = "default" | "claude" | "rose";

export const COLOR_THEMES: readonly { value: ColorTheme; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "claude", label: "Claude" },
  { value: "rose", label: "Rose" },
];

export type ColorThemeProviderState = {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  setColorThemeWithTransition: (theme: ColorTheme) => void;
};

export const ColorThemeProviderContext = createContext<ColorThemeProviderState | null>(null);

export function useColorTheme() {
  const context = useContext(ColorThemeProviderContext);
  if (context === null) {
    throw new Error("useColorTheme must be used within a ColorThemeProvider");
  }
  return context;
}
