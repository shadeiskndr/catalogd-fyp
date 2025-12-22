"use client";

import { CircleMinus, CirclePlus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type GameList, useGameListEntry } from "@/hooks/use-game-list-entry";

type AddButtonProps = {
  list: GameList;
  gameId: number;
  gameName: string;
};

export function AddButton({ list, gameId, gameName }: AddButtonProps) {
  const { inList, isPending, toggle, label } = useGameListEntry(list, gameId, gameName);

  const Icon = list === "library" ? (inList ? CircleMinus : CirclePlus) : Heart;
  const tone =
    list === "library"
      ? inList
        ? "text-red-500 hover:text-red-600"
        : "text-green-500 hover:text-green-600"
      : inList
        ? "text-red-500 hover:text-red-600"
        : "text-muted-foreground hover:text-red-500";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={toggle}
          disabled={isPending}
          aria-label={label}
          className={tone}
        >
          <Icon className="size-5" fill={list === "wishlist" && inList ? "currentColor" : "none"} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
