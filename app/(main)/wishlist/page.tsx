"use client";

import { GameBrowse } from "@/components/game-browse";
import { useUserGameList } from "@/hooks/use-games";

export default function WishlistPage() {
  const { games, isLoading, isLoadingMore, hasMore, loadMore, error } = useUserGameList("wishlist");

  return (
    <GameBrowse
      title="Wishlist"
      games={games}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      hasMore={hasMore}
      error={error}
      onLoadMore={loadMore}
    />
  );
}
