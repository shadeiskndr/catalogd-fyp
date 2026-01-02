"use client";

import { GameGrid } from "@/components/game-grid";
import { GameGridSkeleton } from "@/components/game-grid-skeleton";
import { SectionHeader } from "@/components/layout/section-header";
import { useSimilarGames } from "@/hooks/use-games";

const SIMILAR_COUNT = 8;

export function MoreLikeThis({ rawgId }: { rawgId: number }) {
  const { games, isLoading, error } = useSimilarGames(rawgId);

  if (error !== null || (!isLoading && games.length === 0)) {
    return null;
  }

  return (
    <section className="space-y-4 pt-8" aria-labelledby="more-like-this">
      <SectionHeader
        title="More like this"
        description="The closest games by meaning, not by genre tag. Ranked from Catalogd's vector index."
      />
      {isLoading ? (
        <GameGridSkeleton count={SIMILAR_COUNT} />
      ) : (
        <GameGrid games={games} priorityCount={0} />
      )}
    </section>
  );
}
