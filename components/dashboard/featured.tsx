import { connection } from "next/server";
import { CardGridSkeleton } from "@/components/dashboard/card-grid-skeleton";
import { GameCard } from "@/components/game-card";
import { getGameList } from "@/lib/catalog-server";

const FEATURED_COUNT = 3;
const GRID_CLASSES = "grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3";

export function FeaturedSkeleton() {
  return <CardGridSkeleton count={FEATURED_COUNT} prefix="featured" className={GRID_CLASSES} />;
}

export async function Featured() {
  await connection();
  const pageNumber = Math.floor(Math.random() * 3) + 1;
  const { games } = await getGameList(`featured:${pageNumber}`);
  const candidates = games.filter((game) => game.metacritic > 40);
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
        <GameCard key={game.rawgId} game={game} priority />
      ))}
    </div>
  );
}
