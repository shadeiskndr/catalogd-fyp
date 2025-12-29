import { Sparkles } from "lucide-react";
import { Suspense } from "react";
import { GameGrid } from "@/components/game-grid";
import { GameGridSkeleton } from "@/components/game-grid-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { PagerLinks } from "@/components/pager-links";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { dedupeById, type Game, type ResponseSchema } from "@/lib/game-types";
import { rawgFetchServer } from "@/lib/rawg-server";
import { parsePageParam } from "@/lib/utils";

const PAGE_SIZE = 12;

type SearchParams = Promise<{ page?: string }>;

async function NewReleaseGames({ searchParams }: { searchParams: SearchParams }) {
  const page = parsePageParam((await searchParams).page);
  const data = await rawgFetchServer<ResponseSchema<Game>>(
    `games/lists/main?&page=${page}&ordering=-released&page-size=${PAGE_SIZE}`
  );
  const games = dedupeById(data.results);

  if (games.length === 0) {
    return (
      <Empty className="flex-none border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Sparkles />
          </EmptyMedia>
          <EmptyTitle>Nothing on this page</EmptyTitle>
          <EmptyDescription>Try an earlier page of the release calendar.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
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
    <>
      <PageHeader
        title="New and Upcoming"
        description="Fresh console releases and what is landing next, newest first."
      />
      <Suspense fallback={<GameGridSkeleton count={PAGE_SIZE} />}>
        <NewReleaseGames searchParams={searchParams} />
      </Suspense>
    </>
  );
}
