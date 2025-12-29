"use client";

import { Check, Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { type GameList, useGameListEntry } from "@/hooks/use-game-list-entry";

type AddButtonFullProps = {
  list: GameList;
  gameId: number;
  gameName: string;
};

export function AddButtonFull({ list, gameId, gameName }: AddButtonFullProps) {
  const { inList, isPending, toggle, label } = useGameListEntry(list, gameId, gameName);

  const isWishlist = list === "wishlist";
  const Icon = isWishlist ? Heart : inList ? Check : Plus;

  return (
    <Button
      variant={inList ? "secondary" : isWishlist ? "outline" : "default"}
      onClick={toggle}
      disabled={isPending}
      aria-pressed={inList}
      className="gap-2 transition-transform duration-150 ease-out active:scale-[0.97]"
    >
      {isPending ? (
        <Spinner className="size-4" />
      ) : (
        <Icon className="size-4" fill={isWishlist && inList ? "currentColor" : "none"} />
      )}
      <span>{label}</span>
    </Button>
  );
}
