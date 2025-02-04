"use client"
import { Query } from "appwrite"
import { useContext, useEffect, useState } from "react"
import { BeatLoader } from "react-spinners"
import Grid from "@/components/Grid"
import { Button } from "@/components/ui/button"
import type { Game } from "@/gameTypes"
import { gameDetails } from "@/rawg"
import { database, databaseId, mylibCol, userID } from "@/utils/appwrite"
import { GameAddedContext } from "@/utils/GameAddedContext"

const MyLib = () => {
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
          `${mylibCol}`,
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
    setLoading(true)
    setPage((prevPage) => prevPage + 1)
  }

  const loadPreviousGames = () => {
    setLoading(true)
    setPage((prevPage) => Math.max(prevPage - 1, 1))
  }

  return (
    <div className="space-y-4">
      <h1 className="font-extrabold text-3xl">My Library</h1>
      {games.length ? (
        <>
          <Grid games={games} />
          {!loading && (
            <div className="flex justify-center mt-4 space-x-4">
              {page > 1 && (
                <Button onClick={loadPreviousGames}>Previous Page</Button>
              )}
              {hasMore && <Button onClick={loadMoreGames}>Load More</Button>}
            </div>
          )}
        </>
      ) : (
        <div className="mt-10">No games found.</div>
      )}
      {loading && (
        <div className="flex justify-center items-center">
          <BeatLoader color="#ffa600" size={20} loading={true} />
        </div>
      )}
    </div>
  )
}

export default MyLib
