"use client"
import Grid from "@/components/Grid"
import { Game } from "@/gameTypes"
import { gameDetails } from "@/rawg"
import { GameAddedContext } from "@/utils/GameAddedContext"
import { database, databaseId, userID, wishlistCol } from "@/utils/appwrite"
import { Query } from "appwrite"
import React, { useContext, useEffect, useState } from "react"
import { BeatLoader } from "react-spinners"

const Wish = () => {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const { gameAdded } = useContext(GameAddedContext)

  const PAGE_SIZE = 25

  // Function to load games
  useEffect(() => {
    const getGameIds = async (page: number) => {
      try {
        const response = await database.listDocuments(
          `${databaseId}`,
          `${wishlistCol}`,
          [
            Query.equal("user_id", userID),
            Query.limit(PAGE_SIZE),
            Query.offset((page - 1) * PAGE_SIZE),
          ],
        )

        const gameIds = response.documents.map((game) => game.game_id)
        const uniqueGameIds = Array.from(new Set(gameIds)) // Ensure unique game IDs
        const gameDetailsPromises = uniqueGameIds.map((gameId) =>
          gameDetails({ id: gameId }),
        )

        const newGames = await Promise.all(gameDetailsPromises)
        setGames(newGames) // Replace existing games with new ones
        setHasMore(response.documents.length === PAGE_SIZE)
        setLoading(false)
      } catch (error) {
        console.error("Error loading games:", error)
        setLoading(false)
      }
    }

    setLoading(true)
    getGameIds(page)
  }, [page, gameAdded])

  const loadMoreGames = () => {
    setPage((prevPage) => prevPage + 1)
  }

  const loadPreviousGames = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 1))
  }

  return (
    <div className="space-y-4">
      <h1 className="text-gray-300 font-extrabold text-3xl">Wishlist</h1>
      {games.length ? (
        <>
          <Grid games={games} />
          <div className="flex justify-center mt-4 space-x-4">
            {page > 1 && (
              <button
                onClick={loadPreviousGames}
                className="bg-red-600 p-2 px-4 rounded hover:scale-105 transition-transform
                    duration-300 ease-in-out font-semibold text-gray-100"
                disabled={loading}
              >
                {loading ? "Loading..." : "Previous Page"}
              </button>
            )}
            {hasMore && (
              <button
                onClick={loadMoreGames}
                className="bg-red-600 p-2 px-4 rounded hover:scale-105 transition-transform
                    duration-300 ease-in-out font-semibold text-gray-100"
                disabled={loading}
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="text-white mt-10">No games found.</div>
      )}
      {loading && (
        <div className="flex justify-center items-center">
          <BeatLoader color="#ffa600" size={20} loading={true} />
        </div>
      )}
    </div>
  )
}

export default Wish
