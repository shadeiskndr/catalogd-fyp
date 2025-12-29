"use client";

import { Folder } from "lucide-react";
import { GameBrowse } from "@/components/game-browse";
import { useUserGameList } from "@/hooks/use-games";

export default function LibraryPage() {
  const { games, isLoading, isLoadingMore, hasMore, loadMore, error } = useUserGameList("library");

  return (
    <GameBrowse
      title="My Library"
      description="Every game you own or have played, kept in one place."
      icon={Folder}
      emptyTitle="Your library is empty"
      emptyDescription="Add games you own or have finished and they will show up here."
      games={games}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      hasMore={hasMore}
      error={error}
      onLoadMore={loadMore}
    />
  );
}
