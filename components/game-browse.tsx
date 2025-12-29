"use client";

import { AlertTriangle, type LucideIcon, Search } from "lucide-react";
import Link from "next/link";
import { GameGrid } from "@/components/game-grid";
import { GameGridSkeleton } from "@/components/game-grid-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { LoadMore } from "@/components/load-more";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { formatCount } from "@/lib/format";
import type { Game } from "@/lib/game-types";

type GameBrowseProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  games: Game[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasMore: boolean;
  error?: Error | null;
  onLoadMore: () => void;
};

export function GameBrowse({
  title,
  description,
  icon: Icon,
  emptyTitle,
  emptyDescription,
  games,
  isLoading,
  isLoadingMore = false,
  hasMore,
  error = null,
  onLoadMore,
}: GameBrowseProps) {
  const isEmpty = !isLoading && games.length === 0 && error === null;

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        {...(games.length === 0
          ? {}
          : {
              actions: (
                <span className="rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground text-xs tabular-nums">
                  {formatCount(games.length)} {games.length === 1 ? "game" : "games"}
                </span>
              ),
            })}
      />

      {isLoading ? <GameGridSkeleton count={8} /> : null}

      {error === null ? null : (
        <Empty className="flex-none border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertTriangle className="text-destructive" />
            </EmptyMedia>
            <EmptyTitle>Could not load your games</EmptyTitle>
            <EmptyDescription>
              The game database did not respond. Check your connection and try again.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {isEmpty ? (
        <Empty className="flex-none border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon />
            </EmptyMedia>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild className="active:scale-[0.98]">
              <Link href="/popular" prefetch>
                <Search className="size-4" />
                <span>Browse popular games</span>
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}

      {games.length > 0 ? (
        <>
          <GameGrid games={games} />
          <LoadMore hasMore={hasMore} isLoading={isLoadingMore} onLoadMore={onLoadMore} />
        </>
      ) : null}
    </>
  );
}
