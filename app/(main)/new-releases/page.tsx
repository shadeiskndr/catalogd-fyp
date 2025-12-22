"use client";

import { GameBrowse } from "@/components/game-browse";
import { useNewReleases } from "@/hooks/use-games";
import { usePageNumber } from "@/hooks/use-page-number";

export default function NewReleasesPage() {
  const { page, nextPage, previousPage } = usePageNumber();
  const { data, isLoading, isFetching, error } = useNewReleases(page, 10);

  return (
    <GameBrowse
      title="New and Upcoming"
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
