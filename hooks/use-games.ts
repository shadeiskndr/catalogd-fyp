import { type UseQueryOptions, useQuery } from "@tanstack/react-query"
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
      const response = await rawgFetch(query)
      return response.json() as Promise<ResponseSchema<Game>>
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
      const response = await rawgFetch(query)
      const data = (await response.json()) as ResponseSchema<Game>

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
      const response = await rawgFetch(query)
      const data = (await response.json()) as ResponseSchema<Game>
      return data.results
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
      const response = await rawgFetch(query)
      const data = (await response.json()) as ResponseSchema<Game>
      return data.results
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
      const response = await rawgFetch(query)
      const data = (await response.json()) as ResponseSchema<Game>
      return data.results
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  })
}

// Hook for fetching user's library from Appwrite
export function useUserLibrary(
  page: number,
  {
    databaseId,
    mylibCol,
    userID,
  }: { databaseId: string; mylibCol: string; userID: string },
) {
  const { Query } = require("appwrite")
  const { database } = require("@/utils/appwrite")

  return useQuery({
    queryKey: ["userLibrary", page],
    queryFn: async () => {
      const PAGE_SIZE = 25
      const response = await database.listDocuments(
        `${databaseId}`,
        `${mylibCol}`,
        [
          Query.equal("user_id", userID),
          Query.limit(PAGE_SIZE),
          Query.offset((page - 1) * PAGE_SIZE),
        ],
      )

      const gameIds = response.documents.map((game: { game_id: number }) => game.game_id)
      const uniqueGameIds = Array.from(new Set(gameIds)) as number[]
      const gameDetailsPromises = uniqueGameIds.map((gameId: number) =>
        rawgFetch(`games/${gameId}`).then((res) => res.json() as Promise<Game>),
      )

      const games = await Promise.all(gameDetailsPromises)
      return {
        games,
        hasMore: response.documents.length === PAGE_SIZE,
      }
    },
  })
}

// Hook for fetching user's wishlist from Appwrite
export function useUserWishlist(
  page: number,
  {
    databaseId,
    wishlistCol,
    userID,
  }: { databaseId: string; wishlistCol: string; userID: string },
) {
  const { Query } = require("appwrite")
  const { database } = require("@/utils/appwrite")

  return useQuery({
    queryKey: ["userWishlist", page],
    queryFn: async () => {
      const PAGE_SIZE = 25
      const response = await database.listDocuments(
        `${databaseId}`,
        `${wishlistCol}`,
        [
          Query.equal("user_id", userID),
          Query.limit(PAGE_SIZE),
          Query.offset((page - 1) * PAGE_SIZE),
        ],
      )

      const gameIds = response.documents.map((game: { game_id: number }) => game.game_id)
      const uniqueGameIds = Array.from(new Set(gameIds)) as number[]
      const gameDetailsPromises = uniqueGameIds.map((gameId: number) =>
        rawgFetch(`games/${gameId}`).then((res) => res.json() as Promise<Game>),
      )

      const games = await Promise.all(gameDetailsPromises)
      return {
        games,
        hasMore: response.documents.length === PAGE_SIZE,
      }
    },
  })
}
