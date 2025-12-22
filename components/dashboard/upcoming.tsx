"use client";

import { CarouselCard } from "@/components/dashboard/carousel-card";
import { Marquee } from "@/components/ui/magicui/marquee";
import { Spinner } from "@/components/ui/spinner";
import { useUpcomingGames } from "@/hooks/use-games";

export function Upcoming() {
  const { data: games, isLoading, error } = useUpcomingGames();

  return (
    <section>
      <h2 className="font-bold text-xl md:text-3xl">New and Upcoming</h2>
      {error !== null && <p className="text-destructive">Error loading games: {error.message}</p>}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : null}
      {games !== undefined && games.length > 0 && (
        <div className="-mx-[calc((100vw-100%)/2)] w-screen overflow-hidden">
          <Marquee className="py-8" pauseOnHover repeat={2}>
            {games.map((game) => (
              <div key={game.id} className="w-72 shrink-0">
                <CarouselCard game={game} />
              </div>
            ))}
          </Marquee>
        </div>
      )}
      {!isLoading && error === null && games?.length === 0 ? <p>No games found.</p> : null}
    </section>
  );
}
