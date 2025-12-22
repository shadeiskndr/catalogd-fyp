"use client";

import { CarouselCard } from "@/components/dashboard/carousel-card";
import { Spinner } from "@/components/ui/spinner";
import { useFeaturedGames } from "@/hooks/use-games";

export function Featured() {
  const { data: games, isLoading, error } = useFeaturedGames();

  return (
    <section>
      <h2 className="font-bold text-xl md:text-3xl">Featured</h2>
      {error !== null && <p className="text-destructive">Error loading games: {error.message}</p>}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : null}
      {games !== undefined && games.length > 0 && (
        <div className="grid auto-rows-max grid-cols-1 gap-4 py-8 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <CarouselCard key={game.id} game={game} />
          ))}
        </div>
      )}
      {!isLoading && error === null && games?.length === 0 ? <p>No games found.</p> : null}
    </section>
  );
}
