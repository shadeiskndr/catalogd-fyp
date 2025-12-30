import { Flame } from "lucide-react";
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
import { getGameList } from "@/lib/catalog-server";
import { parsePageParam } from "@/lib/utils";

const PAGE_SIZE = 12;

type SearchParams = Promise<{ page?: string }>;

async function PopularGames({ searchParams }: { searchParams: SearchParams }) {
  const page = parsePageParam((await searchParams).page);
  const { games, count } = await getGameList(`popular:${page}`);

  if (games.length === 0) {
    return (
      <Empty className="flex-none border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Flame />
          </EmptyMedia>
          <EmptyTitle>Nothing on this page</EmptyTitle>
          <EmptyDescription>Try an earlier page of the popular chart.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <GameGrid games={games} />
      <PagerLinks basePath="/popular" page={page} hasMore={page * PAGE_SIZE < count} />
    </>
  );
}

export default function PopularPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Most Popular"
        description="The console games players are adding and rating the most right now."
      />
      <Suspense fallback={<GameGridSkeleton count={PAGE_SIZE} />}>
        <PopularGames searchParams={searchParams} />
      </Suspense>
    </>
  );
}
