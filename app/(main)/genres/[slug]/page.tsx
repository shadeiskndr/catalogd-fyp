"use client";

import { useParams } from "next/navigation";
import { GameBrowse } from "@/components/game-browse";
import { useGenreGames, useGenreList } from "@/hooks/use-genres";
import { usePageNumber } from "@/hooks/use-page-number";

export default function GenrePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { page, nextPage, previousPage } = usePageNumber();

  const { data: genreList } = useGenreList();
  const genre = genreList?.results.find((candidate) => candidate.slug === slug);

  const { data, isLoading, isFetching, error } = useGenreGames(slug, page, 20, "popularity");

  return (
    <GameBrowse
      title={genre?.name ?? "Genre"}
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
