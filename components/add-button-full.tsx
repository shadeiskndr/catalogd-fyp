"use client";

import { CircleMinus, CirclePlus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type GameList, useGameListEntry } from "@/hooks/use-game-list-entry";

type AddButtonFullProps = {
  list: GameList;
  gameId: number;
  gameName: string;
};

export function AddButtonFull({ list, gameId, gameName }: AddButtonFullProps) {
  const { inList, isPending, toggle, label } = useGameListEntry(list, gameId, gameName);

  const Icon = list === "library" ? (inList ? CircleMinus : CirclePlus) : Heart;
  const fill = list === "wishlist" && inList ? "currentColor" : "none";
  const text = isPending ? "Loading..." : label;

  return (
    <Button variant={inList ? "destructive" : "default"} onClick={toggle} disabled={isPending}>
      <Icon className="size-4" fill={fill} />
      <span>{text}</span>
    </Button>
  );
}
