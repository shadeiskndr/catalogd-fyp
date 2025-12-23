"use client";

import { useQuery } from "@tanstack/react-query";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Game, ResponseSchema } from "@/lib/game-types";
import { rawgFetch, rawgFetchMany } from "@/lib/rawg-client";

const MINUTE = 60 * 1000;
const LIST_PAGE_SIZE = 25;

export const gameKeys = {
  all: ["games"] as const,
  detail: (slug: string) => [...gameKeys.all, "detail", slug] as const,
  search: (query: string) => [...gameKeys.all, "search", query] as const,
  slugByName: (name: string) => [...gameKeys.all, "slug-by-name", name] as const,
  userList: (list: string, gameIds: number[]) => [...gameKeys.all, list, gameIds] as const,
};

export function useGameDetails(slug: string) {
  return useQuery({
    queryKey: gameKeys.detail(slug),
    queryFn: () => rawgFetch<Game>(`games/${slug}`),
    enabled: slug.length > 0,
    staleTime: 10 * MINUTE,
  });
}

export function useGameSearch(query: string) {
  return useQuery({
    queryKey: gameKeys.search(query),
    queryFn: () =>
      rawgFetch<ResponseSchema<Game>>(
        `games?search=${encodeURIComponent(query)}&ordering=-added&search_exact=true`
      ),
    enabled: query.length > 2,
    staleTime: 2 * MINUTE,
  });
}

export function useGameSlugByName(gameName: string) {
  return useQuery({
    queryKey: gameKeys.slugByName(gameName),
    queryFn: async () => {
      const data = await rawgFetch<ResponseSchema<Game>>(
        `games?search=${encodeURIComponent(gameName)}&search_exact=true`
      );
      return data.results[0]?.slug ?? null;
    },
    enabled: gameName.length > 0,
    staleTime: 30 * MINUTE,
  });
}

export function useUserGameList(list: "library" | "wishlist") {
  const {
    results: entries,
    status,
    loadMore,
  } = usePaginatedQuery(api.lists.page, { list }, { initialNumItems: LIST_PAGE_SIZE });

  const gameIds = Array.from(new Set(entries.map((entry) => entry.gameId)));

  const detailsQuery = useQuery({
    queryKey: gameKeys.userList(list, gameIds),
    queryFn: () => rawgFetchMany<Game>(gameIds.map((gameId) => `games/${gameId}`)),
    enabled: gameIds.length > 0,
    placeholderData: (previousData) => previousData,
  });

  return {
    games: gameIds.length > 0 ? (detailsQuery.data ?? []) : [],
    isLoading: status === "LoadingFirstPage" || (gameIds.length > 0 && detailsQuery.isLoading),
    isLoadingMore: status === "LoadingMore" || detailsQuery.isFetching,
    hasMore: status === "CanLoadMore",
    loadMore: () => loadMore(LIST_PAGE_SIZE),
    error: detailsQuery.error,
  };
}
