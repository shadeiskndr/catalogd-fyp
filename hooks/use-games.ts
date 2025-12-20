import { type UseQueryOptions, useQuery } from "@tanstack/react-query"
import { usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Game } from "@/gameTypes"
import { type ResponseSchema, rawgFetch } from "@/lib/rawg-client"

interface GameListParams {
  pageSize?: number
  page?: number
  dates?: string
  ordering?: string
  pageIndex: number
}

const gameListEndpoints = [
  { name: "most popular", path: "lists/popular?discover=true" },
  { name: "new releases", path: "lists/main?" },
]

// Query key factory for better organization
export const gameKeys = {
  all: ["games"] as const,
  lists: () => [...gameKeys.all, "list"] as const,
  list: (params: GameListParams) => [...gameKeys.lists(), params] as const,
  featured: () => [...gameKeys.all, "featured"] as const,
  upcoming: () => [...gameKeys.all, "upcoming"] as const,
  newReleases: (page: number) => [...gameKeys.all, "new", page] as const,
  popular: (page: number) => [...gameKeys.all, "popular", page] as const,
}

// Hook for fetching game lists
export function useGameList(
  params: GameListParams,
  options?: Omit<
    UseQueryOptions<ResponseSchema<Game>, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: gameKeys.list(params),
    queryFn: async () => {
      const endpoint = gameListEndpoints[params.pageIndex].path
      const query = `games/${endpoint}&page-size=${params.pageSize}&ordering=${params.ordering}&page=${params.page}`
      return await rawgFetch<ResponseSchema<Game>>(query)
    },
    ...options,
  })
}

// Hook specifically for featured games
export function useFeaturedGames() {
  const pageNo = Math.floor(Math.random() * 3) + 1

  return useQuery({
    queryKey: gameKeys.featured(),
    queryFn: async () => {
      const endpoint = gameListEndpoints[0].path
      const query = `games/${endpoint}&page-size=30&page=${pageNo}`
      const data = await rawgFetch<ResponseSchema<Game>>(query)

      const filteredResults = data.results.filter(
        (game) => game.metacritic > 40,
      )

      // Get 3 random games from filtered results
      const randomGames: Game[] = []
      while (randomGames.length < 3 && filteredResults.length > 0) {
        const index = Math.floor(Math.random() * filteredResults.length)
        const game = filteredResults[index]
        if (!randomGames.includes(game)) {
          randomGames.push(game)
        }
      }

      return randomGames
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook specifically for upcoming games
export function useUpcomingGames() {
  return useQuery({
    queryKey: gameKeys.upcoming(),
    queryFn: async () => {
      const endpoint = gameListEndpoints[1].path
      const query = `games/${endpoint}&page-size=8&ordering=-released&page=1`
      const data = await rawgFetch<ResponseSchema<Game>>(query)
      // Deduplicate games by id
      const uniqueGames = Array.from(
        new Map(data.results.map((game) => [game.id, game])).values(),
      )
      return uniqueGames
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for new releases page with pagination
export function useNewReleases(page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: gameKeys.newReleases(page),
    queryFn: async () => {
      const endpoint = gameListEndpoints[1].path
      const query = `games/${endpoint}&page=${page}&ordering=-released&page-size=${pageSize}`
      const data = await rawgFetch<ResponseSchema<Game>>(query)
      // Deduplicate games by id
      const uniqueGames = Array.from(
        new Map(data.results.map((game) => [game.id, game])).values(),
      )
      return {
        games: uniqueGames,
        hasMore: uniqueGames.length >= pageSize,
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  })
}

// Hook for popular games page with pagination
export function usePopularGames(page: number = 1, pageSize: number = 40) {
  return useQuery({
    queryKey: gameKeys.popular(page),
    queryFn: async () => {
      const endpoint = gameListEndpoints[0].path
      const query = `games/${endpoint}&page=${page}&page-size=${pageSize}&ordering=popularity`
      const data = await rawgFetch<ResponseSchema<Game>>(query)
      // Deduplicate games by id
      const uniqueGames = Array.from(
        new Map(data.results.map((game) => [game.id, game])).values(),
      )
      return {
        games: uniqueGames,
        hasMore: uniqueGames.length >= pageSize,
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  })
}

// Hook for fetching the user's library or wishlist: game IDs come from
// Convex (reactive, paginated), game details are hydrated from RAWG.
export function useUserGameList(list: "library" | "wishlist") {
  const PAGE_SIZE = 25
  const {
    results: entries,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.gameLists.page,
    { list },
    { initialNumItems: PAGE_SIZE },
  )

  const gameIds = Array.from(new Set(entries.map((entry) => entry.gameId)))

  const detailsQuery = useQuery({
    queryKey: [list, "games", gameIds],
    queryFn: async () => {
      const gameDetailsPromises = gameIds.map((gameId) =>
        rawgFetch<Game>(`games/${gameId}`),
      )
      return Promise.all(gameDetailsPromises)
    },
    enabled: gameIds.length > 0,
    placeholderData: (previousData) => previousData,
  })

  return {
    games: gameIds.length > 0 ? (detailsQuery.data ?? []) : [],
    isLoading:
      status === "LoadingFirstPage" ||
      (gameIds.length > 0 && detailsQuery.isLoading),
    isLoadingMore: status === "LoadingMore" || detailsQuery.isFetching,
    hasMore: status === "CanLoadMore",
    loadMore: () => loadMore(PAGE_SIZE),
    error: detailsQuery.error,
  }
}
