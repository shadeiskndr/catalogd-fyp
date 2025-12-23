import { Suspense } from "react";
import { GameGrid } from "@/components/game-grid";
import { GameGridSkeleton } from "@/components/game-grid-skeleton";
import { PagerLinks } from "@/components/pager-links";
import { dedupeById, type Game, type ResponseSchema } from "@/lib/game-types";
import { rawgFetchServer } from "@/lib/rawg-server";
import { parsePageParam } from "@/lib/utils";

const PAGE_SIZE = 10;

type SearchParams = Promise<{ page?: string }>;

async function NewReleaseGames({ searchParams }: { searchParams: SearchParams }) {
  const page = parsePageParam((await searchParams).page);
  const data = await rawgFetchServer<ResponseSchema<Game>>(
    `games/lists/main?&page=${page}&ordering=-released&page-size=${PAGE_SIZE}`
  );
  const games = dedupeById(data.results);

  if (games.length === 0) {
    return <p className="mt-10 text-muted-foreground">No games found.</p>;
  }

  return (
    <>
      <GameGrid games={games} />
      <PagerLinks basePath="/new-releases" page={page} hasMore={games.length >= PAGE_SIZE} />
    </>
  );
}

export default function NewReleasesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="space-y-4 px-2 py-4">
      <h1 className="font-bold text-3xl">New and Upcoming</h1>
      <Suspense fallback={<GameGridSkeleton count={PAGE_SIZE} />}>
        <NewReleaseGames searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
