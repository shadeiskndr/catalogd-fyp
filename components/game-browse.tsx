"use client";

import { GameGrid } from "@/components/game-grid";
import { LoadMore } from "@/components/load-more";
import { Spinner } from "@/components/ui/spinner";
import type { Game } from "@/lib/game-types";

type GameBrowseProps = {
  title: string;
  games: Game[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasMore: boolean;
  error?: Error | null;
  page?: number;
  onLoadMore: () => void;
  onLoadPrevious?: () => void;
};

export function GameBrowse({
  title,
  games,
  isLoading,
  isLoadingMore = false,
  hasMore,
  error = null,
  page = 0,
  onLoadMore,
  onLoadPrevious,
}: GameBrowseProps) {
  return (
    <div className="space-y-4 px-2 py-4">
      <h1 className="font-bold text-3xl">{title}</h1>
      {games.length > 0 && (
        <>
          <GameGrid games={games} />
          <LoadMore
            page={page}
            hasMore={hasMore}
            isLoading={isLoading || isLoadingMore}
            onLoadMore={onLoadMore}
            {...(onLoadPrevious === undefined ? {} : { onLoadPrevious })}
          />
        </>
      )}
      {isLoading || isLoadingMore ? (
        <div className="flex items-center justify-center py-8">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : null}
      {!(isLoading || isLoadingMore) && games.length === 0 && error === null ? (
        <p className="mt-10 text-muted-foreground">No games found.</p>
      ) : null}
      {error !== null ? (
        <p className="mt-10 text-destructive">Error loading games. Please try again.</p>
      ) : null}
    </div>
  );
}
