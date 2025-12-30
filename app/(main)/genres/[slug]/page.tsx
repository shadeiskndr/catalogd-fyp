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
import { getGameList, getGenres } from "@/lib/catalog-server";
import { formatCount } from "@/lib/format";
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
  const [genreList, { games, count }] = await Promise.all([
    getGenres(),
    getGameList(`genre:${slug}:${page}`),
  ]);
  const genre = genreList.find((candidate) => candidate.slug === slug);

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
                  {formatCount(genre.gamesCount)} games
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
          <PagerLinks basePath={`/genres/${slug}`} page={page} hasMore={page * PAGE_SIZE < count} />
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
