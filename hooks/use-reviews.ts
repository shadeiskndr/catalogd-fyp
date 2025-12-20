import { usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

const PAGE_SIZE = 20

export function useReviews(gameName?: string) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.reviews.list,
    gameName === undefined ? {} : { gameName },
    { initialNumItems: PAGE_SIZE },
  )

  return {
    reviews: results,
    isLoading: status === "LoadingFirstPage",
    isLoadingMore: status === "LoadingMore",
    hasMore: status === "CanLoadMore",
    loadMore: () => loadMore(PAGE_SIZE),
  }
}

// Reviews for a single game; waits until the game name is known.
export function useGameReviews(gameName: string | undefined) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.reviews.list,
    gameName === undefined ? "skip" : { gameName },
    { initialNumItems: PAGE_SIZE },
  )

  return {
    reviews: results,
    isLoading: gameName === undefined || status === "LoadingFirstPage",
    isLoadingMore: status === "LoadingMore",
    hasMore: status === "CanLoadMore",
    loadMore: () => loadMore(PAGE_SIZE),
  }
}
