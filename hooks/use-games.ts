"use client";

import { useQuery as useCachedQuery } from "@tanstack/react-query";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { convexClient } from "@/lib/convex-client";
import type { CatalogGame } from "@/lib/game-types";

const MINUTE = 60 * 1000;
const LIST_PAGE_SIZE = 25;
const MIN_QUERY_LENGTH = 3;
const MIN_LOCAL_RESULTS = 3;

export const gameKeys = {
  all: ["games"] as const,
  ensureDetail: (slug: string) => [...gameKeys.all, "ensure-detail", slug] as const,
  ensureSearch: (query: string) => [...gameKeys.all, "ensure-search", query] as const,
  ensureList: (list: string, rawgIds: number[]) =>
    [...gameKeys.all, "ensure-list", list, rawgIds] as const,
};

export function useGameDetails(slug: string) {
  const game = useQuery(api.catalog.gameBySlug, slug.length > 0 ? { slug } : "skip");

  const ensured = useCachedQuery({
    queryKey: gameKeys.ensureDetail(slug),
    queryFn: () => convexClient.action(api.catalog.ensureGame, { slug }),
    enabled: slug.length > 0 && game === null,
    staleTime: 10 * MINUTE,
  });

  return {
    game: game ?? ensured.data ?? null,
    isLoading: slug.length > 0 && game === undefined,
  };
}

export function useGameSearch(query: string) {
  const trimmed = query.trim();
  const isEnabled = trimmed.length >= MIN_QUERY_LENGTH;
  const local = useQuery(api.catalog.search, isEnabled ? { query: trimmed } : "skip");

  const ingested = useCachedQuery({
    queryKey: gameKeys.ensureSearch(trimmed),
    queryFn: () => convexClient.action(api.catalog.searchRemote, { query: trimmed }),
    enabled: isEnabled && local !== undefined && local.length < MIN_LOCAL_RESULTS,
    staleTime: 5 * MINUTE,
  });

  return {
    games: local ?? [],
    isLoading: isEnabled && (local === undefined || (local.length === 0 && ingested.isFetching)),
  };
}

export function useUserGameList(list: "library" | "wishlist") {
  const {
    results: entries,
    status,
    loadMore,
  } = usePaginatedQuery(api.lists.page, { list }, { initialNumItems: LIST_PAGE_SIZE });

  const missingIds = entries.filter((entry) => entry.game === null).map((entry) => entry.gameId);

  const ensured = useCachedQuery({
    queryKey: gameKeys.ensureList(list, missingIds),
    queryFn: () => convexClient.action(api.catalog.ensureGames, { rawgIds: missingIds }),
    enabled: missingIds.length > 0,
    staleTime: 5 * MINUTE,
  });

  const games: CatalogGame[] = [];
  for (const entry of entries) {
    if (entry.game !== null) {
      games.push(entry.game);
    }
  }

  return {
    games,
    isLoading: status === "LoadingFirstPage",
    isLoadingMore: status === "LoadingMore" || ensured.isFetching,
    hasMore: status === "CanLoadMore",
    loadMore: () => loadMore(LIST_PAGE_SIZE),
    error: ensured.error,
  };
}
