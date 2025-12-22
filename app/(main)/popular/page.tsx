"use client";

import { GameBrowse } from "@/components/game-browse";
import { usePopularGames } from "@/hooks/use-games";
import { usePageNumber } from "@/hooks/use-page-number";

export default function PopularPage() {
  const { page, nextPage, previousPage } = usePageNumber();
  const { data, isLoading, isFetching, error } = usePopularGames(page, 10);

  return (
    <GameBrowse
      title="Most Popular"
      games={data?.games ?? []}
      isLoading={isLoading || isFetching}
      hasMore={data?.hasMore ?? false}
      error={error}
      page={page}
      onLoadMore={nextPage}
      onLoadPrevious={previousPage}
    />
  );
}
