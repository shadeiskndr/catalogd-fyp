"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";

export type GameList = "library" | "wishlist";

const LIST_LABEL: Record<GameList, string> = {
  library: "Library",
  wishlist: "Wishlist",
};

export function useGameListEntry(list: GameList, gameId: number, gameName: string) {
  const inList = useQuery(api.lists.status, { list, gameId }) ?? false;
  const addToList = useMutation(api.lists.add);
  const removeFromList = useMutation(api.lists.remove);
  const [isPending, setIsPending] = useState(false);

  const toggle = useCallback(async () => {
    setIsPending(true);
    try {
      if (inList) {
        await removeFromList({ list, gameId });
        toast.success(`Removed from ${LIST_LABEL[list]}!`);
      } else {
        await addToList({ list, gameId, gameName });
        toast.success(`Added to ${LIST_LABEL[list]}!`);
      }
    } catch (error) {
      console.error(error);
      toast.error(inList ? "Failed to remove game" : "Failed to add game");
    } finally {
      setIsPending(false);
    }
  }, [inList, list, gameId, gameName, addToList, removeFromList]);

  const label = `${inList ? "Remove from" : "Add to"} ${LIST_LABEL[list]}`;

  return { inList, isPending, toggle, label };
}
