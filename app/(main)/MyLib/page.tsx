"use client"

import { useEffect, useState } from "react"
import { BeatLoader } from "react-spinners"
import Grid from "@/components/Grid"
import { Button } from "@/components/ui/button"
import { useUserLibrary } from "@/hooks/use-games"
import { useGameStore } from "@/lib/stores/game-store"
import { databaseId, mylibCol, userID } from "@/utils/appwrite"

const MyLib = () => {
  const [page, setPage] = useState<number>(1)
  const { gameAdded } = useGameStore()
  const { data, isLoading, error } = useUserLibrary(page, {
    databaseId,
    mylibCol,
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
      <h1 className="font-extrabold text-3xl">My Library</h1>
      {games.length ? (
        <>
          <Grid games={games} />
          {!isLoading && (
            <div className="flex justify-center mt-4 space-x-4">
              {page > 1 && (
                <Button onClick={loadPreviousGames}>Previous Page</Button>
              )}
              {hasMore && <Button onClick={loadMoreGames}>Load More</Button>}
            </div>
          )}
        </>
      ) : !isLoading ? (
        <div className="mt-10">No games found.</div>
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

export default MyLib
