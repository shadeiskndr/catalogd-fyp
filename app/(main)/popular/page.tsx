import { Suspense } from "react";
import { GameGrid } from "@/components/game-grid";
import { GameGridSkeleton } from "@/components/game-grid-skeleton";
import { PagerLinks } from "@/components/pager-links";
import { dedupeById, type Game, type ResponseSchema } from "@/lib/game-types";
import { rawgFetchServer } from "@/lib/rawg-server";
import { parsePageParam } from "@/lib/utils";

const PAGE_SIZE = 10;

type SearchParams = Promise<{ page?: string }>;

async function PopularGames({ searchParams }: { searchParams: SearchParams }) {
  const page = parsePageParam((await searchParams).page);
  const data = await rawgFetchServer<ResponseSchema<Game>>(
    `games/lists/popular?discover=true&page=${page}&page-size=${PAGE_SIZE}&ordering=popularity`
  );
  const games = dedupeById(data.results);

  if (games.length === 0) {
    return <p className="mt-10 text-muted-foreground">No games found.</p>;
  }

  return (
    <>
      <GameGrid games={games} />
      <PagerLinks basePath="/popular" page={page} hasMore={games.length >= PAGE_SIZE} />
    </>
  );
}

export default function PopularPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="space-y-4 px-2 py-4">
      <h1 className="font-bold text-3xl">Most Popular</h1>
      <Suspense fallback={<GameGridSkeleton count={PAGE_SIZE} />}>
        <PopularGames searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
