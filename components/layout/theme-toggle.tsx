"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/lib/theme-provider"

export function ThemeToggle() {
  const { resolvedTheme, setThemeWithTransition } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() =>
        setThemeWithTransition(resolvedTheme === "dark" ? "light" : "dark")
      }
      title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </Button>
  )
}
