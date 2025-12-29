import { ArrowLeft, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { GameGrid } from "@/components/game-grid";
import { GameGridSkeleton } from "@/components/game-grid-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { PagerLinks } from "@/components/pager-links";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount } from "@/lib/format";
import { dedupeById, type Game, type GenreSummary, type ResponseSchema } from "@/lib/game-types";
import { rawgFetchServer } from "@/lib/rawg-server";
import { parsePageParam } from "@/lib/utils";

const PAGE_SIZE = 12;

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ page?: string }>;

function BackToGenres() {
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="mt-4 -ml-2 gap-1.5 self-start text-muted-foreground"
    >
      <Link href="/genres" prefetch>
        <ArrowLeft className="size-4" />
        <span>All genres</span>
      </Link>
    </Button>
  );
}

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
      <BackToGenres />
      <PageHeader
        title={genre?.name ?? "Genre"}
        description="The most popular console games in this genre."
        {...(genre === undefined
          ? {}
          : {
              actions: (
                <span className="rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground text-xs tabular-nums">
                  {formatCount(genre.games_count)} games
                </span>
              ),
            })}
        className="pt-2"
      />
      {games.length === 0 ? (
        <Empty className="flex-none border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Gamepad2 />
            </EmptyMedia>
            <EmptyTitle>No games on this page</EmptyTitle>
            <EmptyDescription>Try an earlier page for this genre.</EmptyDescription>
          </EmptyHeader>
        </Empty>
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
    <Suspense
      fallback={
        <>
          <BackToGenres />
          <div className="space-y-2 pt-2 pb-5">
            <Skeleton className="h-8 w-48 rounded-full" />
            <Skeleton className="h-4 w-72 rounded-full" />
          </div>
          <GameGridSkeleton count={PAGE_SIZE} />
        </>
      }
    >
      <GenreGames params={params} searchParams={searchParams} />
    </Suspense>
  );
}
