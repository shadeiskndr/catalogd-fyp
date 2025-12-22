"use client";

import { GameBrowse } from "@/components/game-browse";
import { useUserGameList } from "@/hooks/use-games";

export default function LibraryPage() {
  const { games, isLoading, isLoadingMore, hasMore, loadMore, error } = useUserGameList("library");

  return (
    <GameBrowse
      title="My Library"
      games={games}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      hasMore={hasMore}
      error={error}
      onLoadMore={loadMore}
    />
  );
}
