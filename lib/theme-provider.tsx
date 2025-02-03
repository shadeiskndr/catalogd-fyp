"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useTimeout } from "@/hooks/use-timeout"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  resolvedTheme: string
  setTheme: (theme: Theme) => void
  setThemeWithTransition: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => null,
  setThemeWithTransition: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function Providers({
  children,
  defaultTheme = "system",
  storageKey = "app-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useLocalStorage<Theme>(storageKey, defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<string>("light")
  const [styleId, setStyleId] = useState<string | null>(null)

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      setResolvedTheme(systemTheme)
      return
    }

    root.classList.add(theme)
    setResolvedTheme(theme)
  }, [theme])

  // Clean up animation styles after transition
  useTimeout(
    () => {
      if (styleId) {
        const styleEl = document.getElementById(styleId)
        if (styleEl) {
          styleEl.remove()
        }
        setStyleId(null)
      }
    },
    styleId ? 3000 : null,
  )

  const setThemeWithTransition = (newTheme: Theme) => {
    // Inject circle-blur animation styles
    const newStyleId = `theme-transition-${Date.now()}`
    const style = document.createElement("style")
    style.id = newStyleId

    const isMobile = window.innerWidth < 768
    const origin = isMobile ? "bottom right" : "top right"
    const position = isMobile ? "100% 100%" : "70% 0%"

    const css = `
      @supports (view-transition-name: root) {
        ::view-transition-old(root) {
          animation: none;
        }
        ::view-transition-new(root) {
          animation: circle-blur-expand 0.5s ease-out;
          transform-origin: ${origin};
          filter: blur(0);
        }
        @keyframes circle-blur-expand {
          from {
            clip-path: circle(0% at ${position});
            filter: blur(4px);
          }
          to {
            clip-path: circle(150% at ${position});
            filter: blur(0);
          }
        }
      }
    `

    style.textContent = css
    document.head.appendChild(style)
    setStyleId(newStyleId)

    // Use View Transitions API if supported
    if ("startViewTransition" in document) {
      document.startViewTransition(() => {
        setTheme(newTheme)
      })
    } else {
      setTheme(newTheme)
    }
  }

  const value = {
    theme,
    resolvedTheme,
    setTheme,
    setThemeWithTransition,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
