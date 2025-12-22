"use client";

import { useQuery } from "@tanstack/react-query";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Game } from "@/lib/game-types";
import { type ResponseSchema, rawgFetch, type Screenshot } from "@/lib/rawg-client";

const RAWG_LIST = {
  popular: "lists/popular?discover=true",
  main: "lists/main?",
} as const;

const MINUTE = 60 * 1000;
const LIST_PAGE_SIZE = 25;

export const gameKeys = {
  all: ["games"] as const,
  featured: () => [...gameKeys.all, "featured"] as const,
  upcoming: () => [...gameKeys.all, "upcoming"] as const,
  newReleases: (page: number) => [...gameKeys.all, "new", page] as const,
  popular: (page: number) => [...gameKeys.all, "popular", page] as const,
  detail: (slug: string) => [...gameKeys.all, "detail", slug] as const,
  screenshots: (slug: string) => [...gameKeys.all, "screenshots", slug] as const,
  search: (query: string) => [...gameKeys.all, "search", query] as const,
  slugByName: (name: string) => [...gameKeys.all, "slug-by-name", name] as const,
  userList: (list: string, gameIds: number[]) => [...gameKeys.all, list, gameIds] as const,
};

function dedupeById(games: Game[]) {
  return Array.from(new Map(games.map((game) => [game.id, game])).values());
}

export function useFeaturedGames() {
  return useQuery({
    queryKey: gameKeys.featured(),
    queryFn: async () => {
      const pageNo = Math.floor(Math.random() * 3) + 1;
      const data = await rawgFetch<ResponseSchema<Game>>(
        `games/${RAWG_LIST.popular}&page-size=30&page=${pageNo}`
      );
      const candidates = data.results.filter((game) => game.metacritic > 40);
      const pickedIds = new Set<number>();
      const picked: Game[] = [];
      while (picked.length < 3 && picked.length < candidates.length) {
        const game = candidates[Math.floor(Math.random() * candidates.length)];
        if (game !== undefined && !pickedIds.has(game.id)) {
          pickedIds.add(game.id);
          picked.push(game);
        }
      }
      return picked;
    },
    staleTime: 5 * MINUTE,
  });
}

export function useUpcomingGames() {
  return useQuery({
    queryKey: gameKeys.upcoming(),
    queryFn: async () => {
      const data = await rawgFetch<ResponseSchema<Game>>(
        `games/${RAWG_LIST.main}&page-size=8&ordering=-released&page=1`
      );
      return dedupeById(data.results);
    },
    staleTime: 5 * MINUTE,
  });
}

export function useNewReleases(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: gameKeys.newReleases(page),
    queryFn: async () => {
      const data = await rawgFetch<ResponseSchema<Game>>(
        `games/${RAWG_LIST.main}&page=${page}&ordering=-released&page-size=${pageSize}`
      );
      const games = dedupeById(data.results);
      return { games, hasMore: games.length >= pageSize };
    },
    staleTime: 5 * MINUTE,
    placeholderData: (previousData) => previousData,
  });
}

export function usePopularGames(page = 1, pageSize = 40) {
  return useQuery({
    queryKey: gameKeys.popular(page),
    queryFn: async () => {
      const data = await rawgFetch<ResponseSchema<Game>>(
        `games/${RAWG_LIST.popular}&page=${page}&page-size=${pageSize}&ordering=popularity`
      );
      const games = dedupeById(data.results);
      return { games, hasMore: games.length >= pageSize };
    },
    staleTime: 5 * MINUTE,
    placeholderData: (previousData) => previousData,
  });
}

export function useGameDetails(slug: string) {
  return useQuery({
    queryKey: gameKeys.detail(slug),
    queryFn: () => rawgFetch<Game>(`games/${slug}`),
    enabled: slug.length > 0,
    staleTime: 10 * MINUTE,
  });
}

export function useGameScreenshots(slug: string) {
  return useQuery({
    queryKey: gameKeys.screenshots(slug),
    queryFn: () => rawgFetch<Screenshot>(`games/${slug}/screenshots`),
    enabled: slug.length > 0,
    staleTime: 15 * MINUTE,
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
    queryFn: () => Promise.all(gameIds.map((gameId) => rawgFetch<Game>(`games/${gameId}`))),
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
