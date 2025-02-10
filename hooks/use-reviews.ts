import { useInfiniteQuery } from "@tanstack/react-query"
import { Query } from "appwrite"
import { database, databaseId, reviewCol } from "@/utils/appwrite"

interface Review {
  user_id: string
  user_name: string
  game_name: string
  rating: number
  review: string
}

const PAGE_SIZE = 20

export const reviewKeys = {
  all: ["reviews"] as const,
  list: () => [...reviewKeys.all, "list"] as const,
  infinite: () => [...reviewKeys.list(), "infinite"] as const,
}

export function useReviews(gameName?: string) {
  return useInfiniteQuery({
    queryKey: [...reviewKeys.infinite(), gameName],
    queryFn: async ({ pageParam = 1 }) => {
      const filters = [
        Query.orderDesc("$createdAt"),
        Query.limit(PAGE_SIZE),
        Query.offset((pageParam - 1) * PAGE_SIZE),
      ]

      if (gameName) {
        filters.push(Query.equal("game_name", gameName))
      }

      const response = await database.listDocuments(databaseId, reviewCol, filters)

      const reviews = response.documents.map((doc) => ({
        user_id: doc.user_id,
        user_name: doc.user_name,
        game_name: doc.game_name,
        rating: doc.rating,
        review: doc.review,
      })) as Review[]

      return {
        reviews,
        nextPage: reviews.length === PAGE_SIZE ? pageParam + 1 : undefined,
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })
}
