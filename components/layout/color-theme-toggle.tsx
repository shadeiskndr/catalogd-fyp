"use client";

import { Check, Palette } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { COLOR_THEMES, type ColorTheme, useColorTheme } from "@/lib/color-context";

function ColorThemeItem({
  value,
  label,
  isActive,
  onSelect,
}: {
  value: ColorTheme;
  label: string;
  isActive: boolean;
  onSelect: (value: ColorTheme) => void;
}) {
  const handleSelect = useCallback(() => {
    onSelect(value);
  }, [onSelect, value]);

  return (
    <DropdownMenuItem onClick={handleSelect}>
      {label}
      <span className="ml-auto flex items-center">
        {isActive ? <Check className="size-4" /> : null}
      </span>
    </DropdownMenuItem>
  );
}

export function ColorThemeToggle() {
  const { colorTheme, setColorThemeWithTransition } = useColorTheme();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Change color theme">
              <Palette className="size-5" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Change Color Theme</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        {COLOR_THEMES.map((theme) => (
          <ColorThemeItem
            key={theme.value}
            value={theme.value}
            label={theme.label}
            isActive={colorTheme === theme.value}
            onSelect={setColorThemeWithTransition}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
