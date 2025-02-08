"use client"

import { useEffect, useState } from "react"
import { BeatLoader } from "react-spinners"
import Grid from "@/components/Grid"
import { useUserWishlist } from "@/hooks/use-games"
import { useGameStore } from "@/lib/stores/game-store"
import { databaseId, userID, wishlistCol } from "@/utils/appwrite"

const Wish = () => {
  const [page, setPage] = useState<number>(1)
  const { gameAdded } = useGameStore()
  const { data, isLoading, error } = useUserWishlist(page, {
    databaseId,
    wishlistCol,
    userID,
  })

  const games = data?.games ?? []
  const hasMore = data?.hasMore ?? false

  useEffect(() => {
    setPage(1)
  }, [gameAdded])

  const loadMoreGames = () => {
    setPage((prevPage) => prevPage + 1)
  }

  const loadPreviousGames = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 1))
  }

  return (
    <div className="space-y-4">
      <h1 className="font-extrabold text-3xl">Wishlist</h1>
      {games.length ? (
        <>
          <Grid games={games} />
          <div className="flex justify-center mt-4 space-x-4">
            {page > 1 && (
              <button
                onClick={loadPreviousGames}
                className="bg-red-600 p-2 px-4 rounded hover:scale-105 transition-transform
                    duration-300 ease-in-out font-semibold text-gray-100"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Previous Page"}
              </button>
            )}
            {hasMore && (
              <button
                onClick={loadMoreGames}
                className="bg-red-600 p-2 px-4 rounded hover:scale-105 transition-transform
                    duration-300 ease-in-out font-semibold text-gray-100"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        </>
      ) : !isLoading ? (
        <div className="text-white mt-10">No games found.</div>
      ) : null}
      {isLoading && (
        <div className="flex justify-center items-center">
          <BeatLoader color="#ffa600" size={20} loading={true} />
        </div>
      )}
      {error && (
        <div className="mt-10 text-red-500">
          Error loading games. Please try again.
        </div>
      )}
    </div>
  )
}

export default Wish
