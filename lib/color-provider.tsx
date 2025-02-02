"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTimeout } from "@/hooks/use-timeout";

type ColorTheme = "default" | "claude" | "rose";

type ColorThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: ColorTheme;
  storageKey?: string;
};

type ColorThemeProviderState = {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  setColorThemeWithTransition: (theme: ColorTheme) => void;
};

const initialState: ColorThemeProviderState = {
  colorTheme: "default",
  setColorTheme: () => null,
  setColorThemeWithTransition: () => null,
};

const ColorThemeProviderContext = createContext<ColorThemeProviderState>(initialState);

export function ColorThemeProvider({
  children,
  defaultTheme = "default",
  storageKey = "vite-ui-color-theme",
  ...props
}: ColorThemeProviderProps) {
  const [colorTheme, setColorTheme] = useLocalStorage<ColorTheme>(storageKey, defaultTheme);
  const [styleId, setStyleId] = useState<string | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;

    // Set the data-theme attribute
    root.setAttribute("data-theme", colorTheme);
  }, [colorTheme]);

  // Clean up animation styles after transition
  useTimeout(
    () => {
      if (styleId) {
        const styleEl = document.getElementById(styleId);
        if (styleEl) {
          styleEl.remove();
        }
        setStyleId(null);
      }
    },
    styleId ? 3000 : null
  );

  const setColorThemeWithTransition = (newTheme: ColorTheme) => {
    // Inject polygon wipe animation styles
    const newStyleId = `color-theme-transition-${Date.now()}`;
    const style = document.createElement("style");
    style.id = newStyleId;

    const css = `
      @supports (view-transition-name: root) {
        ::view-transition-old(root) {
          animation: none;
        }
        ::view-transition-new(root) {
          animation: wipe-in 0.4s ease-out;
        }
        @keyframes wipe-in {
          from {
            clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
          }
          to {
            clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          }
        }
      }
    `;

    style.textContent = css;
    document.head.appendChild(style);
    setStyleId(newStyleId);

    // Use View Transitions API if supported
    if ("startViewTransition" in document) {
      document.startViewTransition(() => {
        setColorTheme(newTheme);
      });
    } else {
      setColorTheme(newTheme);
    }
  };

  const value = {
    colorTheme,
    setColorTheme,
    setColorThemeWithTransition,
  };

  return (
    <ColorThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ColorThemeProviderContext.Provider>
  );
}

export const useColorTheme = () => {
  const context = useContext(ColorThemeProviderContext);

  if (context === undefined)
    throw new Error("useColorTheme must be used within a ColorThemeProvider");

  return context;
};