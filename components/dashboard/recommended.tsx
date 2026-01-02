"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { CardGridSkeleton } from "@/components/dashboard/card-grid-skeleton";
import { GameCard } from "@/components/game-card";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useRecommendedGames } from "@/hooks/use-games";

const RECOMMENDED_COUNT = 6;
const EAGER_COUNT = 3;
const GRID_CLASSES = "grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3";

const DESCRIPTIONS = {
  taste: "Picked from the games closest in meaning to your library, wishlist and ratings.",
  popular: "Add games to your library or wishlist and this row will learn your taste.",
  loading: "Reading your library, wishlist and ratings.",
} as const;

function RecommendedSkeleton() {
  return (
    <CardGridSkeleton count={RECOMMENDED_COUNT} prefix="recommended" className={GRID_CLASSES} />
  );
}

export function Recommended() {
  const { games, source, isLoading, error } = useRecommendedGames();
  const description = isLoading || source === null ? DESCRIPTIONS.loading : DESCRIPTIONS[source];

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Recommended for you"
        description={description}
        href="/ai-rec"
        linkLabel="Ask the recommender"
      />
      {isLoading ? <RecommendedSkeleton /> : null}
      {!isLoading && (error !== null || games.length === 0) ? (
        <Empty className="flex-none border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Sparkles />
            </EmptyMedia>
            <EmptyTitle>Nothing to recommend yet</EmptyTitle>
            <EmptyDescription>
              Save a few games to your library or wishlist and the recommender will have something
              to work from.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild className="active:scale-[0.98]">
              <Link href="/popular" prefetch>
                Browse popular games
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}
      {!isLoading && games.length > 0 ? (
        <div className={GRID_CLASSES}>
          {games.map((game, index) => (
            <GameCard key={game.rawgId} game={game} priority={index < EAGER_COUNT} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
