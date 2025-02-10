// Additional game-related hooks for other pages

import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { Game } from "@/gameTypes"
import {
  type GameDataType,
  type ResponseSchema,
  rawgFetch,
  type Screenshot,
} from "@/lib/rawg-client"

// Extend the query keys factory
export const queryKeys = {
  games: {
    all: ["games"] as const,
    lists: () => [...queryKeys.games.all, "list"] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.games.lists(), params] as const,
    featured: () => [...queryKeys.games.all, "featured"] as const,
    upcoming: () => [...queryKeys.games.all, "upcoming"] as const,
    details: () => [...queryKeys.games.all, "detail"] as const,
    detail: (slug: string) => [...queryKeys.games.details(), slug] as const,
    screenshots: (slug: string) =>
      [...queryKeys.games.all, "screenshots", slug] as const,
    search: (query: string) =>
      [...queryKeys.games.all, "search", query] as const,
  },
  genres: {
    all: ["genres"] as const,
    lists: () => [...queryKeys.genres.all, "list"] as const,
    detail: (id: number) => [...queryKeys.genres.all, id] as const,
    games: (genreSlug: string, page: number) =>
      [...queryKeys.genres.all, "games", genreSlug, page] as const,
  },
}

// Hook for getting game slug by name
export function useGameByName(gameName: string) {
  return useQuery({
    queryKey: queryKeys.games.search(gameName),
    queryFn: async () => {
      const response = await rawgFetch(
        `games?search=${gameName}&search_exact=true`,
      )
      const data = (await response.json()) as ResponseSchema<Game>
      return data.results[0]?.slug || null
    },
    enabled: gameName.length > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Hook for game details page
export function useGameDetails(slug: string) {
  return useQuery({
    queryKey: queryKeys.games.detail(slug),
    queryFn: async () => {
      const response = await rawgFetch(`games/${slug}`)
      return response.json() as Promise<Game>
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes - game details don't change often
  })
}

// Hook for game screenshots
export function useGameScreenshots(slug: string) {
  return useQuery({
    queryKey: queryKeys.games.screenshots(slug),
    queryFn: async () => {
      const response = await rawgFetch(`games/${slug}/screenshots`)
      return response.json() as Promise<Screenshot>
    },
    enabled: !!slug,
    staleTime: 15 * 60 * 1000, // 15 minutes - screenshots are very static
  })
}

// Hook for search
export function useGameSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.games.search(query),
    queryFn: async () => {
      const response = await rawgFetch(
        `games?search=${query}&ordering=-added&search_exact=true`,
      )
      return response.json() as Promise<ResponseSchema<Game>>
    },
    enabled: query.length > 2, // Only search if query is > 2 chars
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Hook for genre list
export function useGenreList() {
  return useQuery({
    queryKey: queryKeys.genres.lists(),
    queryFn: async () => {
      const response = await rawgFetch("genres")
      return response.json() as Promise<ResponseSchema<GameDataType>>
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - genres rarely change
  })
}

// Hook for games in a genre
export function useGenreGames(
  genreSlug: string,
  page: number = 1,
  pageSize: number = 20,
  ordering: string = "-added",
) {
  return useQuery({
    queryKey: queryKeys.genres.games(genreSlug, page),
    queryFn: async () => {
      const response = await rawgFetch(
        `games?discover=true&page-size=${pageSize}&ordering=${ordering}&page=${page}&genres=${genreSlug}`,
      )
      return response.json() as Promise<ResponseSchema<Game>>
    },
    enabled: !!genreSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous page data while loading next page
  })
}

// Example: Prefetch hook for better UX
export function usePrefetchGame() {
  const queryClient = useQueryClient()

  return (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.games.detail(slug),
      queryFn: async () => {
        const response = await rawgFetch(`games/${slug}`)
        return response.json() as Promise<Game>
      },
      staleTime: 10 * 60 * 1000,
    })
  }
}
