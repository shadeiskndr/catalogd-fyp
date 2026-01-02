"use client";

import { useQuery } from "convex/react";
import { Search } from "lucide-react";
import Link from "next/link";
import { GameCard } from "@/components/game-card";
import { GameGridSkeleton } from "@/components/game-grid-skeleton";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { api } from "@/convex/_generated/api";

const GRID_CLASSES = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export function ToolGamesGrid({ rawgIds, eager }: { rawgIds: number[]; eager: boolean }) {
  const games = useQuery(api.catalog.gamesByRawgIds, rawgIds.length === 0 ? "skip" : { rawgIds });

  if (rawgIds.length === 0) {
    return (
      <Empty className="flex-none border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Search />
          </EmptyMedia>
          <EmptyTitle>No games matched</EmptyTitle>
          <EmptyDescription>
            Try describing the game differently or loosening a filter.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline" className="active:scale-[0.98]">
            <Link href="/popular" prefetch>
              Browse popular games
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (games === undefined) {
    return <GameGridSkeleton count={Math.min(rawgIds.length, 8)} />;
  }

  const byId = new Map(games.map((game) => [game.rawgId, game]));
  const ordered = rawgIds.flatMap((rawgId) => {
    const game = byId.get(rawgId);
    return game === undefined ? [] : [game];
  });

  return (
    <div className={GRID_CLASSES}>
      {ordered.map((game) => (
        <GameCard key={game.rawgId} game={game} priority={eager} />
      ))}
    </div>
  );
}
