"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/lib/theme-context";

export function ThemeToggle() {
  const { resolvedTheme, setThemeWithTransition } = useTheme();
  const isDark = resolvedTheme === "dark";

  const toggle = useCallback(() => {
    setThemeWithTransition(isDark ? "light" : "dark");
  }, [isDark, setThemeWithTransition]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
          {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Switch to {isDark ? "light" : "dark"} mode</p>
      </TooltipContent>
    </Tooltip>
  );
}
