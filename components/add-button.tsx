"use client";

import { Check, Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type GameList, useGameListEntry } from "@/hooks/use-game-list-entry";
import { cn } from "@/lib/utils";

type AddButtonProps = {
  list: GameList;
  gameId: number;
  gameName: string;
};

export function AddButton({ list, gameId, gameName }: AddButtonProps) {
  const { inList, isPending, toggle, label } = useGameListEntry(list, gameId, gameName);

  const isWishlist = list === "wishlist";
  const Icon = isWishlist ? Heart : inList ? Check : Plus;
  const activeTone = isWishlist ? "text-red-500 hover:text-red-600" : "text-primary";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={toggle}
          disabled={isPending}
          aria-label={label}
          aria-pressed={inList}
          className={cn(
            "transition-[color,transform,background-color] duration-150 ease-out active:scale-90",
            inList ? activeTone : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="size-[1.125rem]" fill={isWishlist && inList ? "currentColor" : "none"} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
