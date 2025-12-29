"use client";

import { Gift } from "lucide-react";
import { GameBrowse } from "@/components/game-browse";
import { useUserGameList } from "@/hooks/use-games";

export default function WishlistPage() {
  const { games, isLoading, isLoadingMore, hasMore, loadMore, error } = useUserGameList("wishlist");

  return (
    <GameBrowse
      title="Wishlist"
      description="Games you are saving for later, ready when you are."
      icon={Gift}
      emptyTitle="Nothing on your wishlist"
      emptyDescription="Tap the heart on any game to save it for later."
      games={games}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      hasMore={hasMore}
      error={error}
      onLoadMore={loadMore}
    />
  );
}
