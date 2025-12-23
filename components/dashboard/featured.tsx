import { connection } from "next/server";
import { CarouselCard } from "@/components/dashboard/carousel-card";
import { Skeleton } from "@/components/ui/skeleton";
import { dedupeById, type Game, type ResponseSchema } from "@/lib/game-types";
import { rawgFetchServer } from "@/lib/rawg-server";

const FEATURED_COUNT = 3;
const GRID_CLASSES = "grid auto-rows-max grid-cols-1 gap-4 py-8 md:grid-cols-2 lg:grid-cols-3";
const CARD_SIZES = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";

export function FeaturedSkeleton() {
  const placeholders = Array.from({ length: FEATURED_COUNT }, (_, index) => `featured-${index}`);

  return (
    <div className={GRID_CLASSES}>
      {placeholders.map((placeholder) => (
        <Skeleton key={placeholder} className="h-72 w-full rounded-xl" />
      ))}
    </div>
  );
}

export async function Featured() {
  await connection();
  const pageNumber = Math.floor(Math.random() * 3) + 1;
  const data = await rawgFetchServer<ResponseSchema<Game>>(
    `games/lists/popular?discover=true&page-size=30&page=${pageNumber}`
  );
  const candidates = dedupeById(data.results.filter((game) => game.metacritic > 40));
  const picked = candidates
    .map((game) => ({ game, order: Math.random() }))
    .sort((first, second) => first.order - second.order)
    .slice(0, FEATURED_COUNT)
    .map((entry) => entry.game);

  if (picked.length === 0) {
    return <p>No games found.</p>;
  }

  return (
    <div className={GRID_CLASSES}>
      {picked.map((game) => (
        <CarouselCard key={game.id} game={game} sizes={CARD_SIZES} priority />
      ))}
    </div>
  );
}
