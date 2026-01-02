"use client";

import { useQuery as useCachedQuery } from "@tanstack/react-query";
import { useConvexAuth, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { convexClient } from "@/lib/convex-client";
import type { CatalogGame } from "@/lib/game-types";
import type { RagResult, RecommendResult } from "@/lib/rag-types";

const MINUTE = 60 * 1000;
const LIST_PAGE_SIZE = 25;
const MIN_QUERY_LENGTH = 3;
const MIN_LOCAL_RESULTS = 3;
const SIMILAR_LIMIT = 8;
const RECOMMENDED_LIMIT = 6;

export const gameKeys = {
  all: ["games"] as const,
  ensureDetail: (slug: string) => [...gameKeys.all, "ensure-detail", slug] as const,
  ensureSearch: (query: string) => [...gameKeys.all, "ensure-search", query] as const,
  ensureList: (list: string, rawgIds: number[]) =>
    [...gameKeys.all, "ensure-list", list, rawgIds] as const,
  similar: (rawgId: number) => [...gameKeys.all, "similar", rawgId] as const,
  tasteRecs: () => [...gameKeys.all, "taste-recs"] as const,
};

export function useSimilarGames(rawgId: number) {
  const { isAuthenticated } = useConvexAuth();
  const similar = useCachedQuery({
    queryKey: gameKeys.similar(rawgId),
    queryFn: (): Promise<RagResult[]> =>
      convexClient.action(api.rag.similarToRawgId, { rawgId, limit: SIMILAR_LIMIT }),
    enabled: isAuthenticated && rawgId > 0,
    staleTime: 30 * MINUTE,
  });

  return {
    games: similar.data ?? [],
    isLoading: similar.isLoading || (!isAuthenticated && similar.data === undefined),
    error: similar.error,
  };
}

export function useRecommendedGames() {
  const { isAuthenticated } = useConvexAuth();
  const recommended = useCachedQuery({
    queryKey: gameKeys.tasteRecs(),
    queryFn: (): Promise<RecommendResult> =>
      convexClient.action(api.rag.recommendForMe, { limit: RECOMMENDED_LIMIT }),
    enabled: isAuthenticated,
    staleTime: 10 * MINUTE,
  });

  return {
    games: recommended.data?.games ?? [],
    source: recommended.data?.source ?? null,
    isLoading: recommended.isLoading || (!isAuthenticated && recommended.data === undefined),
    error: recommended.error,
  };
}

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
