import { Suspense } from "react";
import { GameGrid } from "@/components/game-grid";
import { GameGridSkeleton } from "@/components/game-grid-skeleton";
import { PagerLinks } from "@/components/pager-links";
import { Skeleton } from "@/components/ui/skeleton";
import { dedupeById, type Game, type GenreSummary, type ResponseSchema } from "@/lib/game-types";
import { rawgFetchServer } from "@/lib/rawg-server";
import { parsePageParam } from "@/lib/utils";

const PAGE_SIZE = 20;

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ page?: string }>;

async function GenreGames({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const page = parsePageParam(resolvedSearchParams.page);
  const [genreList, data] = await Promise.all([
    rawgFetchServer<ResponseSchema<GenreSummary>>("genres"),
    rawgFetchServer<ResponseSchema<Game>>(
      `games?discover=true&page-size=${PAGE_SIZE}&ordering=popularity&page=${page}&genres=${slug}`
    ),
  ]);
  const genre = genreList.results.find((candidate) => candidate.slug === slug);
  const games = dedupeById(data.results);

  return (
    <>
      <h1 className="font-bold text-3xl">{genre?.name ?? "Genre"}</h1>
      {games.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No games found.</p>
      ) : (
        <>
          <GameGrid games={games} />
          <PagerLinks
            basePath={`/genres/${slug}`}
            page={page}
            hasMore={games.length >= PAGE_SIZE}
          />
        </>
      )}
    </>
  );
}

export default function GenrePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-4 px-2 py-4">
      <Suspense
        fallback={
          <>
            <Skeleton className="h-9 w-48" />
            <GameGridSkeleton count={PAGE_SIZE} />
          </>
        }
      >
        <GenreGames params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
