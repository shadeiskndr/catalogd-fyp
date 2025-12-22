"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTimeout } from "@/hooks/use-timeout";
import { type ColorTheme, ColorThemeProviderContext } from "@/lib/color-context";

const TRANSITION_CLEANUP_MS = 3000;

type ColorThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: ColorTheme;
  storageKey?: string;
};

export function ColorThemeProvider({
  children,
  defaultTheme = "default",
  storageKey = "app-color-theme",
}: ColorThemeProviderProps) {
  const [colorTheme, setColorTheme] = useLocalStorage<ColorTheme>(storageKey, defaultTheme);
  const [styleId, setStyleId] = useState<string | null>(null);

  useEffect(() => {
    window.document.documentElement.setAttribute("data-theme", colorTheme);
  }, [colorTheme]);

  useTimeout(
    () => {
      if (styleId === null) return;
      document.getElementById(styleId)?.remove();
      setStyleId(null);
    },
    styleId === null ? null : TRANSITION_CLEANUP_MS
  );

  const setColorThemeWithTransition = useCallback(
    (newTheme: ColorTheme) => {
      const newStyleId = `color-theme-transition-${Date.now()}`;
      const style = document.createElement("style");
      style.id = newStyleId;
      style.textContent = `
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
      document.head.appendChild(style);
      setStyleId(newStyleId);

      if ("startViewTransition" in document) {
        document.startViewTransition(() => {
          setColorTheme(newTheme);
        });
      } else {
        setColorTheme(newTheme);
      }
    },
    [setColorTheme]
  );

  const value = useMemo(
    () => ({ colorTheme, setColorTheme, setColorThemeWithTransition }),
    [colorTheme, setColorTheme, setColorThemeWithTransition]
  );

  return <ColorThemeProviderContext value={value}>{children}</ColorThemeProviderContext>;
}
