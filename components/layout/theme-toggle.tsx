"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTheme } from "@/lib/theme-provider"

export function ThemeToggle() {
  const { resolvedTheme, setThemeWithTransition } = useTheme()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() =>
            setThemeWithTransition(resolvedTheme === "dark" ? "light" : "dark")
          }
        >
          {resolvedTheme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Switch to {resolvedTheme === "dark" ? "light" : "dark"} mode</p>
      </TooltipContent>
    </Tooltip>
  )
}
