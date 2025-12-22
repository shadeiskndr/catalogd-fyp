"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTimeout } from "@/hooks/use-timeout";
import { type ResolvedTheme, type Theme, ThemeProviderContext } from "@/lib/theme-context";

const TRANSITION_CLEANUP_MS = 3000;

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "app-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useLocalStorage<Theme>(storageKey, defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [styleId, setStyleId] = useState<string | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    const next: ResolvedTheme =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    root.classList.add(next);
    setResolvedTheme(next);
  }, [theme]);

  useTimeout(
    () => {
      if (styleId === null) return;
      document.getElementById(styleId)?.remove();
      setStyleId(null);
    },
    styleId === null ? null : TRANSITION_CLEANUP_MS
  );

  const setThemeWithTransition = useCallback(
    (newTheme: Theme) => {
      const newStyleId = `theme-transition-${Date.now()}`;
      const style = document.createElement("style");
      style.id = newStyleId;
      style.textContent = `
      @supports (view-transition-name: root) {
        ::view-transition-old(root) {
          animation: none;
        }
        ::view-transition-new(root) {
          animation: circle-blur-expand 0.5s ease-out;
          transform-origin: top right;
          filter: blur(0);
        }
        @keyframes circle-blur-expand {
          from {
            clip-path: circle(0% at 100% 0%);
            filter: blur(4px);
          }
          to {
            clip-path: circle(150% at 100% 0%);
            filter: blur(0);
          }
        }
      }
    `;
      document.head.appendChild(style);
      setStyleId(newStyleId);

      if ("startViewTransition" in document) {
        document.startViewTransition(() => {
          setTheme(newTheme);
        });
      } else {
        setTheme(newTheme);
      }
    },
    [setTheme]
  );

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, setThemeWithTransition }),
    [theme, resolvedTheme, setTheme, setThemeWithTransition]
  );

  return <ThemeProviderContext value={value}>{children}</ThemeProviderContext>;
}
