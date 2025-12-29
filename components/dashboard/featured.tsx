import { connection } from "next/server";
import { GameCard } from "@/components/game-card";
import { Skeleton } from "@/components/ui/skeleton";
import { dedupeById, type Game, type ResponseSchema } from "@/lib/game-types";
import { rawgFetchServer } from "@/lib/rawg-server";

const FEATURED_COUNT = 3;
const GRID_CLASSES = "grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3";

export function FeaturedSkeleton() {
  const placeholders = Array.from({ length: FEATURED_COUNT }, (_, index) => `featured-${index}`);

  return (
    <div className={GRID_CLASSES}>
      {placeholders.map((placeholder) => (
        <div key={placeholder} className="overflow-hidden rounded-xl border bg-card">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="space-y-3 p-4 pt-3">
            <Skeleton className="h-4 w-4/5 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
        </div>
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
    return <p className="text-muted-foreground">No games found.</p>;
  }

  return (
    <div className={GRID_CLASSES}>
      {picked.map((game) => (
        <GameCard key={game.id} game={game} priority />
      ))}
    </div>
  );
}
